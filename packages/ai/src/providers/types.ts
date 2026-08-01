import type {
  AIProviderName,
  CefrLevel,
  GeneratedCloze,
  GeneratedExample,
  GeneratedMeaning,
  GeneratedPhrase,
  GeneratedSynonym,
  LanguageCode,
  WordGenerationPayload,
} from '@lingora/types'
import type { PartialWordGeneration } from '../schemas/generation'

/**
 * The two provider slots (strategy pattern).
 *
 * DictionaryProvider covers factual language data — translation and language
 * detection. DeepL, Google Translate or OpenAI can fill it; DeepL is the
 * better translator when the user has a key.
 *
 * AIProvider covers everything that needs a language model: the word package,
 * clusters, examples, synonyms, phrases, cloze. Only an LLM fills this slot.
 * Adding Anthropic or Gemini later means one new class, not an app rewrite.
 */

/** What a single provider call cost. */
export interface ProviderUsage {
  tokensUsed: number
  latencyMs: number
}

export interface AIResult<T> {
  data: T
  usage: ProviderUsage
}

/**
 * CEFR level is required on every generation call, never optional — a B1
 * learner shown a C2 example doesn't learn faster, they lose confidence.
 */
export interface GenerationContext {
  cefrLevel: CefrLevel
  language: LanguageCode
}

/** Pins a generation call to one semantic context so contexts never bleed. */
export interface ClusterRef {
  label: string
  description: string
}

/** Optional targeting for example generation (the grammar controls panel). */
export interface ExampleGenerationOptions {
  /** Grammar structures the examples must exercise, e.g. ['Konjunktiv II', 'passive voice']. */
  grammar?: string[]
}

/** A cluster skeleton without content — what generateClusters returns. */
export interface GeneratedClusterOutline {
  label: string
  description: string
  cefrLevel: CefrLevel
}

/**
 * generateWordPackage can end in a salvaged partial instead of throwing:
 * the UI renders what survived plus a retry button.
 */
export type WordPackageResult =
  | { kind: 'complete'; data: WordGenerationPayload; usage: ProviderUsage }
  | {
      kind: 'partial'
      partial: PartialWordGeneration
      issues: readonly string[]
      usage: ProviderUsage
    }

export interface DictionaryProvider {
  readonly name: string
  translate(text: string, source: LanguageCode, target: LanguageCode): Promise<AIResult<string>>
  detectLanguage(text: string): Promise<AIResult<LanguageCode>>
  /**
   * Optional: alternate translations for an ambiguous word (e.g. "foundation" → Stiftung,
   * Grundlage, Fundament, ...), beyond the single best guess `translate` returns. Additive to
   * the interface on purpose — only providers whose API exposes a dictionary/alternates section
   * (Google Translate's `dt=bd`) implement it; DeepL and the LLM-backed providers simply omit it,
   * and callers must treat it as optional.
   */
  translateAlternatives?(text: string, source: LanguageCode, target: LanguageCode): Promise<AIResult<string[]>>
}

export interface AIProvider {
  readonly name: AIProviderName
  readonly model: string

  /**
   * The pipeline's main call: everything for a new word in one request.
   * @param hint A known-good translation (e.g. from DeepL) the model should
   *             treat as ground truth rather than re-derive.
   */
  generateWordPackage(
    word: string,
    ctx: GenerationContext,
    hint?: { baselineTranslation: string },
  ): Promise<WordPackageResult>

  // Per-section calls, used by the Phase 4 regenerate buttons.
  generateClusters(word: string, ctx: GenerationContext): Promise<AIResult<GeneratedClusterOutline[]>>
  /**
   * @param question A learner-typed follow-up question (max ~100 chars) to address within the
   *                  explanation/usage notes — the word detail/review "More info" sheet's
   *                  follow-up composer. Omitted for the initial (no-question) explanation.
   */
  generateMeaning(word: string, cluster: ClusterRef, ctx: GenerationContext, question?: string): Promise<AIResult<GeneratedMeaning[]>>
  generateExamples(word: string, cluster: ClusterRef, ctx: GenerationContext, opts?: ExampleGenerationOptions): Promise<AIResult<GeneratedExample[]>>
  generateSynonyms(word: string, cluster: ClusterRef, ctx: GenerationContext): Promise<AIResult<GeneratedSynonym[]>>
  generatePhrases(word: string, ctx: GenerationContext): Promise<AIResult<GeneratedPhrase[]>>
  generateCloze(word: string, ctx: GenerationContext): Promise<AIResult<GeneratedCloze[]>>

  translate(text: string, source: LanguageCode, target: LanguageCode): Promise<AIResult<string>>
}
