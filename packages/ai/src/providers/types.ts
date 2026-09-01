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
 *
 * `language` is the word/content being learned (lemma, examples, synonyms,
 * phrases, cloze sentences); `nativeLanguage` is the learner's own language
 * (translations, explanations, meanings, usage notes). Both required, same
 * reasoning as cefrLevel — a silently-defaulted native language is how this
 * package generated English explanations for non-English-native learners.
 */
export interface GenerationContext {
  cefrLevel: CefrLevel
  language: LanguageCode
  nativeLanguage: LanguageCode
}

/** Pins a generation call to one semantic context so contexts never bleed. */
export interface ClusterRef {
  label: string
  description: string
}

/** One turn of a chatAboutWord conversation, oldest first — mirrors the shape persisted in
 * `@lingora/database`'s `card_chat_messages` (via `@lingora/types`' `ChatMessage`), but kept
 * separate here since the provider layer has no database dependency. */
export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
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

  /**
   * A short (~50-word) plain-language gist of a word — cheap and fast compared to
   * generateWordPackage, for the Search screen's inline preview of a word with no card yet.
   */
  explainWord(word: string, ctx: GenerationContext): Promise<AIResult<string>>

  /**
   * The word detail screen's "More info" sheet content — at most 3 short paragraphs (30 words or
   * fewer each), covering whichever of what/where/why/who/how actually matter for this sense, in
   * a direct, conversational teacher's voice, distinct from generateMeaning's explanation/usage
   * (already shown inline on the card) and never including synonyms. Fetched on demand only, never
   * as part of initial card generation.
   *
   * @param question A learner-typed follow-up question — doubles as the "Ask AI" sheet's answer
   *        mechanism, same voice and the same 3-paragraph/30-word constraints as the unprompted
   *        case (previously a separate generateMeaning-with-question override with no length
   *        constraints at all, which read as an inconsistent wall of text next to this).
   */
  explainWordDetail(
    word: string,
    cluster: ClusterRef,
    ctx: GenerationContext,
    question?: string,
  ): Promise<AIResult<string[]>>

  /**
   * Picks one word/short phrase worth learning today for the "Word of the Day" feature (Home
   * dashboard + daily notification) — useful and appropriate for the learner's level, avoiding
   * `excludeWords` (their existing library, so it never repeats a word they already have), plus a
   * short (~30-word) explanation in the same style as explainWord.
   */
  suggestWordOfTheDay(
    ctx: GenerationContext,
    excludeWords: string[],
  ): Promise<AIResult<{ word: string; explanation: string; exampleSentence?: string; exampleTranslation?: string }>>

  translate(text: string, source: LanguageCode, target: LanguageCode): Promise<AIResult<string>>

  /**
   * The word detail screen's "Ask AI" chat window — a free-form, multi-turn conversation about
   * one specific card/sense, persisted per-card (see `@lingora/database`'s `card_chat_messages`)
   * and deleted with it. Unlike `generateMeaning`'s single-shot `question` override, this replies
   * in a warm, human conversational tone and asks a clarifying question back when the learner's
   * message is ambiguous, given the whole `history` so far (oldest first, ending with the
   * learner's latest message — the reply itself is not included in `history`).
   */
  chatAboutWord(
    word: string,
    cluster: ClusterRef,
    ctx: GenerationContext,
    history: ChatTurn[],
  ): Promise<AIResult<string>>
}
