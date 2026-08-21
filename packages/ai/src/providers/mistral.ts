import type {
  GeneratedCloze,
  GeneratedExample,
  GeneratedMeaning,
  GeneratedPhrase,
  GeneratedSynonym,
  LanguageCode,
} from '@lingora/types'
import { z } from 'zod'
import { logger } from '@lingora/observability'
import { AIProviderError } from '../errors'
import { generateValidated, type RawCompletion } from '../generation/structured'
import { languageVars, PROMPTS, renderPrompt } from '../prompts/templates'
import {
  generatedClozeBaseSchema,
  generatedClozeSchema,
  generatedExampleSchema,
  generatedMeaningSchema,
  generatedPhraseSchema,
  generatedSynonymSchema,
  salvagePartial,
  wordGenerationJsonTargetSchema,
  wordGenerationSchemaForLanguage,
} from '../schemas/generation'
import { cefrLevelSchema, languageCodeSchema } from '../schemas/common'
import { bucketTokenCount, startRequestTimeout } from './http'
import { toOpenAIJsonSchema } from './json-schema'
import type {
  AIProvider,
  AIResult,
  ClusterRef,
  DictionaryProvider,
  ExampleGenerationOptions,
  GeneratedClusterOutline,
  GenerationContext,
  WordPackageResult,
} from './types'

export interface MistralProviderConfig {
  /** Injected by the app — key storage (SecureStore / Tauri Store) is not this package's concern. */
  apiKey: string
  model?: string
  baseUrl?: string
  timeoutMs?: number
  /** Injectable for tests. */
  fetchFn?: typeof fetch
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatCompletionResponse {
  choices?: {
    message?: { content?: string | null }
  }[]
  usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number }
}

const clusterOutlinesSchema = z.object({
  clusters: z.array(
    z.object({
      label: z.string().min(1),
      description: z.string().min(1),
      cefrLevel: cefrLevelSchema,
    }),
  ),
})
const meaningsResponseSchema = z.object({ meanings: z.array(generatedMeaningSchema) })
const examplesResponseSchema = z.object({ examples: z.array(generatedExampleSchema) })
const synonymsResponseSchema = z.object({ synonyms: z.array(generatedSynonymSchema) })
const phrasesResponseSchema = z.object({ phrases: z.array(generatedPhraseSchema) })
const clozesResponseSchema = z.object({ clozes: z.array(generatedClozeSchema) })
const clozesJsonTargetSchema = z.object({ clozes: z.array(generatedClozeBaseSchema) })
const translateResponseSchema = z.object({ translation: z.string().min(1) })
const explainWordResponseSchema = z.object({ explanation: z.string().min(1).max(400) })
const detectLanguageResponseSchema = z.object({ language: languageCodeSchema })

const log = logger.child({ feature: 'ai', component: 'MistralProvider' })

/**
 * Mistral implementation of both provider slots.
 *
 * Mistral's Chat Completions API is OpenAI-compatible, including strict
 * `response_format: json_schema` — so this mirrors OpenAIProvider's request
 * shape against `https://api.mistral.ai/v1` instead of duplicating a
 * different transport. Every response still goes through repair → zod
 * validation via generateValidated.
 */
export class MistralProvider implements AIProvider, DictionaryProvider {
  readonly name = 'mistral' as const
  readonly model: string

  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly fetchFn: typeof fetch

  constructor(config: MistralProviderConfig) {
    this.apiKey = config.apiKey
    this.model = config.model ?? 'mistral-small-latest'
    this.baseUrl = (config.baseUrl ?? 'https://api.mistral.ai/v1').replace(/\/$/, '')
    this.timeoutMs = config.timeoutMs ?? 60_000
    this.fetchFn = config.fetchFn ?? fetch
  }

  async generateWordPackage(
    word: string,
    ctx: GenerationContext,
    hint?: { baselineTranslation: string },
  ): Promise<WordPackageResult> {
    const prompt = renderPrompt(PROMPTS.wordPackage.template, {
      word,
      cefrLevel: ctx.cefrLevel,
      ...languageVars(ctx),
      baselineHint: hint
        ? `\nA trusted dictionary translates it as: "${hint.baselineTranslation}". Treat that as ground truth for the primary meaning.\n`
        : '',
    })

    return generateValidated(
      this.makeCall(prompt, 'word_generation', wordGenerationJsonTargetSchema),
      wordGenerationSchemaForLanguage(ctx.language),
      salvagePartial,
    )
  }

  async generateClusters(
    word: string,
    ctx: GenerationContext,
  ): Promise<AIResult<GeneratedClusterOutline[]>> {
    const prompt = renderPrompt(PROMPTS.clusterOutlines.template, {
      word,
      cefrLevel: ctx.cefrLevel,
      ...languageVars(ctx),
    })
    const result = await this.generateStrict(prompt, 'cluster_outlines', clusterOutlinesSchema)
    return { data: result.data.clusters, usage: result.usage }
  }

  async generateMeaning(
    word: string,
    cluster: ClusterRef,
    ctx: GenerationContext,
    question?: string,
  ): Promise<AIResult<GeneratedMeaning[]>> {
    const prompt = renderPrompt(PROMPTS.meanings.template, {
      word,
      cefrLevel: ctx.cefrLevel,
      ...languageVars(ctx),
      clusterLabel: cluster.label,
      clusterDescription: cluster.description,
      followUpSection: question
        ? `\nThe learner also asked: "${question}" — address this directly within the explanation or usage notes.\n`
        : '',
    })
    const result = await this.generateStrict(prompt, 'meanings', meaningsResponseSchema)
    return { data: result.data.meanings, usage: result.usage }
  }

  async generateExamples(
    word: string,
    cluster: ClusterRef,
    ctx: GenerationContext,
    opts?: ExampleGenerationOptions,
  ): Promise<AIResult<GeneratedExample[]>> {
    const grammar = opts?.grammar ?? []
    const prompt = renderPrompt(PROMPTS.examples.template, {
      word,
      cefrLevel: ctx.cefrLevel,
      ...languageVars(ctx),
      clusterLabel: cluster.label,
      clusterDescription: cluster.description,
      grammarInstructions:
        grammar.length > 0
          ? `\nGRAMMAR TARGETING: every example must exercise at least one of these structures, and together the examples must cover all of them: ${grammar.join(', ')}. List the structures each sentence actually uses in its grammarTags.\n`
          : '',
    })
    const result = await this.generateStrict(prompt, 'examples', examplesResponseSchema)
    return { data: result.data.examples, usage: result.usage }
  }

  async generateSynonyms(
    word: string,
    cluster: ClusterRef,
    ctx: GenerationContext,
  ): Promise<AIResult<GeneratedSynonym[]>> {
    const prompt = renderPrompt(PROMPTS.synonyms.template, {
      word,
      cefrLevel: ctx.cefrLevel,
      ...languageVars(ctx),
      clusterLabel: cluster.label,
      clusterDescription: cluster.description,
    })
    const result = await this.generateStrict(prompt, 'synonyms', synonymsResponseSchema)
    return { data: result.data.synonyms, usage: result.usage }
  }

  async generatePhrases(word: string, ctx: GenerationContext): Promise<AIResult<GeneratedPhrase[]>> {
    const prompt = renderPrompt(PROMPTS.phrases.template, { word, cefrLevel: ctx.cefrLevel, ...languageVars(ctx) })
    const result = await this.generateStrict(prompt, 'phrases', phrasesResponseSchema)
    return { data: result.data.phrases, usage: result.usage }
  }

  async generateCloze(word: string, ctx: GenerationContext): Promise<AIResult<GeneratedCloze[]>> {
    const prompt = renderPrompt(PROMPTS.cloze.template, { word, cefrLevel: ctx.cefrLevel, ...languageVars(ctx) })
    const result = await generateValidated(
      this.makeCall(prompt, 'clozes', clozesJsonTargetSchema),
      clozesResponseSchema,
    )
    if (result.kind !== 'complete') {
      throw new AIProviderError('generateCloze returned a partial', this.name, false)
    }
    return { data: result.data.clozes, usage: result.usage }
  }

  async translate(text: string, source: LanguageCode, target: LanguageCode): Promise<AIResult<string>> {
    const prompt = renderPrompt(PROMPTS.translate.template, {
      text,
      sourceLanguage: source,
      targetLanguage: target,
    })
    const result = await this.generateStrict(prompt, 'translation', translateResponseSchema)
    return { data: result.data.translation, usage: result.usage }
  }

  async explainWord(word: string, ctx: GenerationContext): Promise<AIResult<string>> {
    const prompt = renderPrompt(PROMPTS.explainWord.template, {
      word,
      cefrLevel: ctx.cefrLevel,
      ...languageVars(ctx),
    })
    const result = await this.generateStrict(prompt, 'explain_word', explainWordResponseSchema)
    return { data: result.data.explanation, usage: result.usage }
  }

  async detectLanguage(text: string): Promise<AIResult<LanguageCode>> {
    const prompt = renderPrompt(PROMPTS.detectLanguage.template, { text })
    const result = await this.generateStrict(prompt, 'language_detection', detectLanguageResponseSchema)
    return { data: result.data.language, usage: result.usage }
  }

  private async generateStrict<T>(
    prompt: string,
    schemaName: string,
    schema: z.ZodType<T>,
  ): Promise<AIResult<T>> {
    const result = await generateValidated(this.makeCall(prompt, schemaName, schema), schema)
    if (result.kind !== 'complete') {
      throw new AIProviderError('unexpected partial result', this.name, false)
    }
    return { data: result.data, usage: result.usage }
  }

  private makeCall(
    prompt: string,
    schemaName: string,
    jsonTarget: z.ZodType,
  ): (retryInstruction?: string) => Promise<RawCompletion> {
    const jsonSchema = toOpenAIJsonSchema(jsonTarget)
    let lastResponse: string | null = null

    return async (retryInstruction?: string) => {
      const messages: ChatMessage[] = [{ role: 'user', content: prompt }]
      if (retryInstruction !== undefined && lastResponse !== null) {
        messages.push(
          { role: 'assistant', content: lastResponse },
          { role: 'user', content: retryInstruction },
        )
      }
      const completion = await this.chat(messages, schemaName, jsonSchema)
      lastResponse = completion.text
      return completion
    }
  }

  private async chat(
    messages: ChatMessage[],
    schemaName: string,
    jsonSchema: Record<string, unknown>,
  ): Promise<RawCompletion> {
    const startedAt = Date.now()
    const meta = { provider: this.name, modelAlias: this.model, schemaVersion: schemaName }
    log.debug('ai.provider_request_started', { message: 'Mistral chat completion request started', metadata: meta })

    try {
      const completion = await this.performChat(messages, schemaName, jsonSchema, startedAt)
      log.info('ai.provider_request_completed', {
        message: 'Mistral chat completion request succeeded',
        result: 'success',
        durationMs: completion.latencyMs,
        metadata: { ...meta, tokenCountBucket: bucketTokenCount(completion.tokensUsed) },
      })
      return completion
    } catch (error) {
      const providerError = error instanceof AIProviderError ? error : undefined
      log.error('ai.provider_request_failed', error, {
        message: 'Mistral chat completion request failed',
        durationMs: Date.now() - startedAt,
        ...(providerError?.status !== undefined ? { errorCode: String(providerError.status) } : {}),
        metadata: {
          ...meta,
          ...(providerError?.status !== undefined ? { statusCode: providerError.status } : {}),
        },
      })
      throw error
    }
  }

  private async performChat(
    messages: ChatMessage[],
    schemaName: string,
    jsonSchema: Record<string, unknown>,
    startedAt: number,
  ): Promise<RawCompletion> {
    const timeout = startRequestTimeout(this.timeoutMs)
    let response: Response

    try {
      response = await this.fetchFn(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          response_format: {
            type: 'json_schema',
            json_schema: { name: schemaName, strict: true, schema: jsonSchema },
          },
        }),
        signal: timeout.signal,
      })
    } catch (error) {
      throw new AIProviderError(
        timeout.didTimeout()
          ? `Mistral request timed out after ${this.timeoutMs}ms`
          : `Mistral request failed: ${String(error)}`,
        this.name,
        true,
        undefined,
        true,
      )
    } finally {
      timeout.clear()
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new AIProviderError(
        `Mistral returned ${response.status}: ${body.slice(0, 500)}`,
        this.name,
        response.status === 429 || response.status >= 500,
        response.status,
      )
    }

    const payload = (await response.json()) as ChatCompletionResponse
    const content = payload.choices?.[0]?.message?.content

    if (typeof content !== 'string' || content === '') {
      throw new AIProviderError('Mistral response contained no content', this.name, true)
    }

    const usage = payload.usage
    const tokensUsed = usage?.total_tokens ?? (usage?.prompt_tokens ?? 0) + (usage?.completion_tokens ?? 0)

    return {
      text: content,
      tokensUsed,
      latencyMs: Date.now() - startedAt,
    }
  }
}
