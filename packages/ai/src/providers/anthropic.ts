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
import { toAnthropicJsonSchema } from './json-schema'
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

export interface AnthropicProviderConfig {
  /** Injected by the app — key storage (SecureStore / Tauri Store) is not this package's concern. */
  apiKey: string
  model?: string
  baseUrl?: string
  timeoutMs?: number
  maxTokens?: number
  /** Injectable for tests. */
  fetchFn?: typeof fetch
}

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

interface MessagesResponse {
  content?: (
    | { type: 'text'; text: string }
    | { type: 'tool_use'; id: string; name: string; input: unknown }
  )[]
  stop_reason?: string
  usage?: { input_tokens?: number; output_tokens?: number }
  error?: { message?: string }
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
const detectLanguageResponseSchema = z.object({ language: languageCodeSchema })

const log = logger.child({ feature: 'ai', component: 'AnthropicProvider' })

/**
 * Anthropic Claude implementation of both provider slots.
 *
 * Claude has no OpenAI-style strict json_schema response format, so
 * structured output goes through a forced tool call instead: one tool whose
 * input_schema is the target shape, `tool_choice` pinned to it. The tool_use
 * block's `input` is already a parsed object, so it's re-stringified and fed
 * through the same repair → zod validation pipeline every other provider
 * uses — one behavior to reason about, not a Claude-specific fast path.
 */
export class AnthropicProvider implements AIProvider, DictionaryProvider {
  readonly name = 'anthropic' as const
  readonly model: string

  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly maxTokens: number
  private readonly fetchFn: typeof fetch

  constructor(config: AnthropicProviderConfig) {
    this.apiKey = config.apiKey
    this.model = config.model ?? 'claude-haiku-4-5-20251001'
    this.baseUrl = (config.baseUrl ?? 'https://api.anthropic.com/v1').replace(/\/$/, '')
    this.timeoutMs = config.timeoutMs ?? 60_000
    this.maxTokens = config.maxTokens ?? 4096
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
    const jsonSchema = toAnthropicJsonSchema(jsonTarget)
    let lastResponse: string | null = null

    return async (retryInstruction?: string) => {
      const messages: AnthropicMessage[] = [{ role: 'user', content: prompt }]
      if (retryInstruction !== undefined && lastResponse !== null) {
        messages.push(
          { role: 'assistant', content: lastResponse },
          { role: 'user', content: retryInstruction },
        )
      }
      const completion = await this.callTool(messages, schemaName, jsonSchema)
      lastResponse = completion.text
      return completion
    }
  }

  private async callTool(
    messages: AnthropicMessage[],
    schemaName: string,
    jsonSchema: Record<string, unknown>,
  ): Promise<RawCompletion> {
    const startedAt = Date.now()
    const meta = { provider: this.name, modelAlias: this.model, schemaVersion: schemaName }
    log.debug('ai.provider_request_started', { message: 'Claude tool-call request started', metadata: meta })

    try {
      const completion = await this.performCallTool(messages, schemaName, jsonSchema, startedAt)
      log.info('ai.provider_request_completed', {
        message: 'Claude tool-call request succeeded',
        result: 'success',
        durationMs: completion.latencyMs,
        metadata: { ...meta, tokenCountBucket: bucketTokenCount(completion.tokensUsed) },
      })
      return completion
    } catch (error) {
      const providerError = error instanceof AIProviderError ? error : undefined
      log.error('ai.provider_request_failed', error, {
        message: 'Claude tool-call request failed',
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

  private async performCallTool(
    messages: AnthropicMessage[],
    schemaName: string,
    jsonSchema: Record<string, unknown>,
    startedAt: number,
  ): Promise<RawCompletion> {
    const timeout = startRequestTimeout(this.timeoutMs)
    let response: Response

    try {
      response = await this.fetchFn(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          messages,
          tools: [
            {
              name: schemaName,
              description: `Return the result as ${schemaName}.`,
              input_schema: jsonSchema,
            },
          ],
          tool_choice: { type: 'tool', name: schemaName },
        }),
        signal: timeout.signal,
      })
    } catch (error) {
      throw new AIProviderError(
        timeout.didTimeout()
          ? `Claude request timed out after ${this.timeoutMs}ms`
          : `Claude request failed: ${String(error)}`,
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
        `Claude returned ${response.status}: ${body.slice(0, 500)}`,
        this.name,
        response.status === 429 || response.status >= 500,
        response.status,
      )
    }

    const payload = (await response.json()) as MessagesResponse
    const toolUse = payload.content?.find(
      (block): block is { type: 'tool_use'; id: string; name: string; input: unknown } =>
        block.type === 'tool_use',
    )

    if (!toolUse) {
      throw new AIProviderError('Claude response contained no tool call', this.name, true)
    }

    return {
      text: JSON.stringify(toolUse.input),
      tokensUsed: (payload.usage?.input_tokens ?? 0) + (payload.usage?.output_tokens ?? 0),
      latencyMs: Date.now() - startedAt,
    }
  }
}
