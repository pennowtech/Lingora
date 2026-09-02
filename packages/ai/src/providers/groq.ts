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
import { toOpenAIJsonSchema } from './json-schema'
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

export interface GroqProviderConfig {
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
  exampleSentence: z.string().optional(),
  exampleTranslation: z.string().optional(),
})
const chatAboutWordResponseSchema = z.object({
  reply: z.string().min(1).refine((s) => s.trim().split(/\s+/).length <= 100, '100 words or fewer'),
})
const detectLanguageResponseSchema = z.object({ language: languageCodeSchema })

const log = logger.child({ feature: 'ai', component: 'GroqProvider' })

/**
 * Groq implementation of both provider slots.
 *
 * Groq's Chat Completions API is OpenAI-compatible — this mirrors
 * OpenAIProvider's/MistralProvider's request shape against
 * `https://api.groq.com/openai/v1` instead of duplicating a different
 * transport, with one deliberate difference: `performChat` sends
 * `json_object` mode instead of strict `json_schema` — see its own comment
 * for why (Groq's structured-outputs support is model-specific and
 * DeepSeek's identical request shape failed outright on a live key).
 */
export class GroqProvider implements AIProvider, DictionaryProvider {
  readonly name = 'groq' as const
  readonly model: string

  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly fetchFn: typeof fetch

  constructor(config: GroqProviderConfig) {
    this.apiKey = config.apiKey
    this.model = config.model ?? 'openai/gpt-oss-20b'
    this.baseUrl = (config.baseUrl ?? 'https://api.groq.com/openai/v1').replace(/\/$/, '')
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
          ? `\nCRITICAL GRAMMAR REQUIREMENT: You MUST write EVERY example sentence using the following specified grammar structure(s): ${grammar.join(', ')}. Override any default tense or simplicity restrictions to ensure this grammar structure is explicitly present in the sentence. Include "${grammar.join(', ')}" in the grammarTags array for each sentence.\n`
          : 'Write sentences at or slightly below the learner level.',
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
    const result = await this.generateStrict(prompt, 'explain_word_detail', explainWordDetailResponseSchema)
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
    const result = await this.generateStrict(prompt, 'suggest_word_of_the_day', suggestWordOfTheDayResponseSchema)
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
    const result = await this.generateStrict(prompt, 'chat_about_word', chatAboutWordResponseSchema)
    return { data: result.data.reply, usage: result.usage }
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
    log.debug('ai.provider_request_started', { message: 'Groq chat completion request started', metadata: meta })

    try {
      const completion = await this.performChat(messages, schemaName, jsonSchema, startedAt)
      log.info('ai.provider_request_completed', {
        message: 'Groq chat completion request succeeded',
        result: 'success',
        durationMs: completion.latencyMs,
        metadata: { ...meta, tokenCountBucket: bucketTokenCount(completion.tokensUsed) },
      })
      return completion
    } catch (error) {
      const providerError = error instanceof AIProviderError ? error : undefined
      log.error('ai.provider_request_failed', error, {
        message: 'Groq chat completion request failed',
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

    // Groq's "Structured Outputs" (strict response_format: json_schema) is only supported on
    // specific hosted models and changes over time; DeepSeek's OpenAI-compatible endpoint just
    // rejected the identical request shape outright (confirmed against a live key — see
    // deepseek.ts's performChat), so this defaults to the same broadly-supported `json_object`
    // mode preemptively rather than risking the same failure per-model. That's a bigger loss than
    // it first looks: every provider's shared prompt text (prompts/templates.ts) was written
    // assuming strict mode fills in the gaps for enum fields — confirmed live on DeepSeek that
    // patching individual prompt gaps one at a time doesn't scale (16 separate validation issues
    // survived even after fixing the one gap that was found first). So instead, the same
    // jsonSchema the caller already builds (previously unused here) is appended to the prompt as
    // text, giving the model the same structural contract strict mode would have enforced, just
    // delivered a different way. json_object mode also requires the word "json" to appear
    // somewhere in the conversation, satisfied by the same appended text.
    const jsonInstructedMessages: ChatMessage[] =
      messages.length > 0
        ? [
            ...messages.slice(0, -1),
            {
              ...messages[messages.length - 1]!,
              content: `${messages[messages.length - 1]!.content}\n\nRespond with valid JSON only, matching exactly this schema:\n${JSON.stringify(jsonSchema)}`,
            },
          ]
        : messages

    try {
      response = await this.fetchFn(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: jsonInstructedMessages,
          response_format: { type: 'json_object' },
        }),
        signal: timeout.signal,
      })
    } catch (error) {
      throw new AIProviderError(
        timeout.didTimeout()
          ? `Groq request timed out after ${this.timeoutMs}ms`
          : `Groq request failed: ${String(error)}`,
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
      // Groq's own JSON-mode validation ("json_object" mode has no real schema enforcement, just a
      // server-side "did the model even produce parseable JSON" check - see performChat's own doc
      // comment on why this provider uses that mode) rejects a malformed generation with this
      // specific 400 before any content ever comes back - functionally the same situation as "we
      // got a response but it wasn't valid JSON," which generateValidated's own repair-retry
      // pipeline already handles for every other cause of that (a truncated response, invalid
      // syntax, etc.) by retrying once with a corrective instruction. Previously this threw
      // immediately instead, so a single malformed generation was a hard failure with zero chance
      // to self-correct - worth special-casing since the smaller/faster models Groq hosts hit this
      // more often than the strict-json_schema providers' equivalent failure mode.
      let errorCode: string | undefined
      try {
        errorCode = (JSON.parse(body) as { error?: { code?: string } })?.error?.code
      } catch {
        // Not JSON - fall through to the normal throw below.
      }
      if (errorCode === 'json_validate_failed') {
        return { text: '', tokensUsed: 0, latencyMs: Date.now() - startedAt }
      }
      throw new AIProviderError(
        `Groq returned ${response.status}: ${body.slice(0, 500)}`,
        this.name,
        response.status === 429 || response.status >= 500,
        response.status,
      )
    }

    const payload = (await response.json()) as ChatCompletionResponse
    const content = payload.choices?.[0]?.message?.content

    if (typeof content !== 'string' || content === '') {
      throw new AIProviderError('Groq response contained no content', this.name, true)
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
