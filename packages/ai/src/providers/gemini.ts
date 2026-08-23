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
import { formatChatTranscript, languageVars, PROMPTS, renderPrompt } from '../prompts/templates'
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
import { toGeminiJsonSchema } from './json-schema'
import type {
  AIProvider,
  AIResult,
  ChatTurn,
  ClusterRef,
  DictionaryProvider,
  ExampleGenerationOptions,
  GeneratedClusterOutline,
  GenerationContext,
  WordPackageResult,
} from './types'

export interface GeminiProviderConfig {
  /** Injected by the app — key storage (SecureStore / Tauri Store) is not this package's concern. */
  apiKey: string
  model?: string
  baseUrl?: string
  timeoutMs?: number
  /** Injectable for tests. */
  fetchFn?: typeof fetch
}

interface GeminiContent {
  role: 'user' | 'model'
  parts: { text: string }[]
}

interface GenerateContentResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] }
    finishReason?: string
  }[]
  usageMetadata?: { totalTokenCount?: number }
  promptFeedback?: { blockReason?: string }
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
const explainWordResponseSchema = z.object({
  explanation: z.string().min(1).refine((s) => s.trim().split(/\s+/).length <= 30, '30 words or fewer'),
})
const explainWordDetailResponseSchema = z.object({
  paragraphs: z
    .array(z.string().min(1).refine((s) => s.trim().split(/\s+/).length <= 30, '30 words or fewer'))
    .min(1)
    .max(3),
})
const suggestWordOfTheDayResponseSchema = z.object({
  word: z.string().min(1),
  explanation: z.string().min(1).refine((s) => s.trim().split(/\s+/).length <= 30, '30 words or fewer'),
})
const chatAboutWordResponseSchema = z.object({
  reply: z.string().min(1).refine((s) => s.trim().split(/\s+/).length <= 100, '100 words or fewer'),
})
const detectLanguageResponseSchema = z.object({ language: languageCodeSchema })

const log = logger.child({ feature: 'ai', component: 'GeminiProvider' })

/**
 * Google Gemini implementation of both provider slots.
 *
 * Plain fetch against the `generateContent` REST endpoint with
 * `responseMimeType: application/json` + `responseSchema` (Gemini's
 * structured-output equivalent to OpenAI's strict json_schema — an OpenAPI
 * 3.0 subset, see toGeminiJsonSchema). Every response still goes through
 * repair → zod validation via generateValidated; Gemini's schema enforcement
 * is looser than OpenAI's strict mode, so this matters more here, not less.
 */
export class GeminiProvider implements AIProvider, DictionaryProvider {
  readonly name = 'gemini' as const
  readonly model: string

  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly fetchFn: typeof fetch

  constructor(config: GeminiProviderConfig) {
    this.apiKey = config.apiKey
    this.model = config.model ?? 'gemini-2.5-flash'
    this.baseUrl = (config.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '')
    this.timeoutMs = config.timeoutMs ?? 60_000
    // Bound to globalThis — see openai.ts's identical fetchFn assignment for why.
    this.fetchFn = config.fetchFn ?? fetch.bind(globalThis)
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
      this.makeCall(prompt, wordGenerationJsonTargetSchema),
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
    const result = await this.generateStrict(prompt, clusterOutlinesSchema)
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
    const result = await this.generateStrict(prompt, meaningsResponseSchema)
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
          ? `\nCRITICAL GRAMMAR REQUIREMENT: You MUST write EVERY example sentence using the following specified grammar structure(s): ${grammar.join(', ')}. Override any default tense or simplicity restrictions to ensure this grammar structure is explicitly present in the sentence. Include "${grammar.join(', ')}" in the grammarTags array for each sentence.\n`
          : 'Write sentences at or slightly below the learner level.',
    })
    const result = await this.generateStrict(prompt, examplesResponseSchema)
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
    const result = await this.generateStrict(prompt, synonymsResponseSchema)
    return { data: result.data.synonyms, usage: result.usage }
  }

  async generatePhrases(word: string, ctx: GenerationContext): Promise<AIResult<GeneratedPhrase[]>> {
    const prompt = renderPrompt(PROMPTS.phrases.template, { word, cefrLevel: ctx.cefrLevel, ...languageVars(ctx) })
    const result = await this.generateStrict(prompt, phrasesResponseSchema)
    return { data: result.data.phrases, usage: result.usage }
  }

  async generateCloze(word: string, ctx: GenerationContext): Promise<AIResult<GeneratedCloze[]>> {
    const prompt = renderPrompt(PROMPTS.cloze.template, { word, cefrLevel: ctx.cefrLevel, ...languageVars(ctx) })
    const result = await generateValidated(this.makeCall(prompt, clozesJsonTargetSchema), clozesResponseSchema)
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
    const result = await this.generateStrict(prompt, translateResponseSchema)
    return { data: result.data.translation, usage: result.usage }
  }

  async explainWord(word: string, ctx: GenerationContext): Promise<AIResult<string>> {
    const prompt = renderPrompt(PROMPTS.explainWord.template, {
      word,
      cefrLevel: ctx.cefrLevel,
      ...languageVars(ctx),
    })
    const result = await this.generateStrict(prompt, explainWordResponseSchema)
    return { data: result.data.explanation, usage: result.usage }
  }

  async explainWordDetail(
    word: string,
    cluster: ClusterRef,
    ctx: GenerationContext,
    question?: string,
  ): Promise<AIResult<string[]>> {
    const prompt = renderPrompt(PROMPTS.explainWordDetail.template, {
      word,
      cefrLevel: ctx.cefrLevel,
      ...languageVars(ctx),
      clusterLabel: cluster.label,
      clusterDescription: cluster.description,
      followUpSection: question
        ? `\nThe learner also asked: "${question}" — address this directly, in the same short-paragraph format and constraints above.\n`
        : '',
    })
    const result = await this.generateStrict(prompt, explainWordDetailResponseSchema)
    return { data: result.data.paragraphs, usage: result.usage }
  }

  async suggestWordOfTheDay(
    ctx: GenerationContext,
    excludeWords: string[],
  ): Promise<AIResult<{ word: string; explanation: string }>> {
    const prompt = renderPrompt(PROMPTS.suggestWordOfTheDay.template, {
      cefrLevel: ctx.cefrLevel,
      ...languageVars(ctx),
      excludeList: excludeWords.length > 0 ? excludeWords.join(', ') : '(none yet — this is their first word)',
    })
    const result = await this.generateStrict(prompt, suggestWordOfTheDayResponseSchema)
    return { data: result.data, usage: result.usage }
  }

  async chatAboutWord(
    word: string,
    cluster: ClusterRef,
    ctx: GenerationContext,
    history: ChatTurn[],
  ): Promise<AIResult<string>> {
    const prompt = renderPrompt(PROMPTS.chatAboutWord.template, {
      word,
      cefrLevel: ctx.cefrLevel,
      ...languageVars(ctx),
      clusterLabel: cluster.label,
      clusterDescription: cluster.description,
      transcript: formatChatTranscript(history),
    })
    const result = await this.generateStrict(prompt, chatAboutWordResponseSchema)
    return { data: result.data.reply, usage: result.usage }
  }

  async detectLanguage(text: string): Promise<AIResult<LanguageCode>> {
    const prompt = renderPrompt(PROMPTS.detectLanguage.template, { text })
    const result = await this.generateStrict(prompt, detectLanguageResponseSchema)
    return { data: result.data.language, usage: result.usage }
  }

  private async generateStrict<T>(prompt: string, schema: z.ZodType<T>): Promise<AIResult<T>> {
    const result = await generateValidated(this.makeCall(prompt, schema), schema)
    if (result.kind !== 'complete') {
      throw new AIProviderError('unexpected partial result', this.name, false)
    }
    return { data: result.data, usage: result.usage }
  }

  private makeCall(
    prompt: string,
    jsonTarget: z.ZodType,
  ): (retryInstruction?: string) => Promise<RawCompletion> {
    const jsonSchema = toGeminiJsonSchema(jsonTarget)
    let lastResponse: string | null = null

    return async (retryInstruction?: string) => {
      const contents: GeminiContent[] = [{ role: 'user', parts: [{ text: prompt }] }]
      if (retryInstruction !== undefined && lastResponse !== null) {
        contents.push(
          { role: 'model', parts: [{ text: lastResponse }] },
          { role: 'user', parts: [{ text: retryInstruction }] },
        )
      }
      const completion = await this.generateContent(contents, jsonSchema)
      lastResponse = completion.text
      return completion
    }
  }

  private async generateContent(
    contents: GeminiContent[],
    jsonSchema: Record<string, unknown>,
  ): Promise<RawCompletion> {
    const startedAt = Date.now()
    const meta = { provider: this.name, modelAlias: this.model }
    log.debug('ai.provider_request_started', { message: 'Gemini generateContent request started', metadata: meta })

    try {
      const completion = await this.performGenerateContent(contents, jsonSchema, startedAt)
      log.info('ai.provider_request_completed', {
        message: 'Gemini generateContent request succeeded',
        result: 'success',
        durationMs: completion.latencyMs,
        metadata: { ...meta, tokenCountBucket: bucketTokenCount(completion.tokensUsed) },
      })
      return completion
    } catch (error) {
      const providerError = error instanceof AIProviderError ? error : undefined
      log.error('ai.provider_request_failed', error, {
        message: 'Gemini generateContent request failed',
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

  private async performGenerateContent(
    contents: GeminiContent[],
    jsonSchema: Record<string, unknown>,
    startedAt: number,
  ): Promise<RawCompletion> {
    const timeout = startRequestTimeout(this.timeoutMs)
    let response: Response

    try {
      response = await this.fetchFn(`${this.baseUrl}/models/${this.model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: jsonSchema,
          },
        }),
        signal: timeout.signal,
      })
    } catch (error) {
      throw new AIProviderError(
        timeout.didTimeout()
          ? `Gemini request timed out after ${this.timeoutMs}ms`
          : `Gemini request failed: ${String(error)}`,
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
        `Gemini returned ${response.status}: ${body.slice(0, 500)}`,
        this.name,
        response.status === 429 || response.status >= 500,
        response.status,
      )
    }

    const payload = (await response.json()) as GenerateContentResponse

    if (payload.promptFeedback?.blockReason) {
      throw new AIProviderError(`Gemini blocked the request: ${payload.promptFeedback.blockReason}`, this.name, false)
    }

    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('')

    if (typeof text !== 'string' || text === '') {
      throw new AIProviderError('Gemini response contained no content', this.name, true)
    }

    return {
      text,
      tokensUsed: payload.usageMetadata?.totalTokenCount ?? 0,
      latencyMs: Date.now() - startedAt,
    }
  }
}
