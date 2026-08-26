import type { LanguageCode, PartOfSpeech, QuestionType, ReviewRating } from '@lingora/types'

/**
 * Platform-agnostic application logic shared between apps/mobile and (from Phase 6 on) the Tauri
 * desktop app — no React Native, no Expo, no DOM. Pure functions and data only; anything that
 * touches device storage, native UI primitives, or a specific rendering framework belongs in the
 * app itself (or, once desktop lands and both apps need it, in packages/ui for RN-Web-compatible
 * components). New platform-agnostic logic should land here from the start rather than in an app's
 * own lib/ with reuse retrofitted later.
 *
 * NOTE: logic that needs @lingora/ai's provider classes or error types (AI-provider-key
 * validation, network-error classification, dictionary-language detection) does NOT belong here —
 * @lingora/database already depends on @lingora/core, and @lingora/ai depends on
 * @lingora/database, so a dependency the other way would be circular. That logic lives in
 * packages/ai instead (see packages/ai/src/validation.ts, networkError.ts, languageDetection.ts).
 */

export * from './audio'
export * from './audioPlayback'
export * from './cardSource'
export * from './constants'
export * from './deviceTts'
export * from './deckTree'
export * from './fileStorage'
export * from './format'
export * from './grammarGroups'
export * from './onboarding'
export * from './providerMeta'
export * from './providerUsage'
export * from './stats'
export * from './templates'

// ─── Review question types ─────────────────────────────────────────────────────

export const ALL_QUESTION_TYPES: readonly QuestionType[] = ['vocab', 'reverse', 'cloze', 'trueFalse', 'mcq']

/** Display data for the Settings "Practice question types" picker. `icon` is a Lucide icon name
 * (see packages/core's own doc comment on that convention) — shared with the desktop app, once it
 * builds an equivalent screen. `arrowFrom`/`arrowTo` are set only for the two types that describe a
 * direction (vocab: word->meaning, reverse: meaning->word); the UI renders those as
 * "{arrowFrom} [arrow icon] {arrowTo}" instead of embedding a literal "->" in translatable text.
 * `label` is always present as the plain-text fallback (accessibility labels, any non-arrow
 * rendering context). */
export interface QuestionTypeMeta {
  label: string
  arrowFrom?: string
  arrowTo?: string
  icon: string
}

export const QUESTION_TYPE_META: Record<QuestionType, QuestionTypeMeta> = {
  vocab: { label: 'Word -> Meaning', arrowFrom: 'Word', arrowTo: 'Meaning', icon: 'ArrowLeftRight' },
  reverse: { label: 'Meaning -> Word', arrowFrom: 'Meaning', arrowTo: 'Word', icon: 'CornerUpLeft' },
  cloze: { label: 'Fill in the blank', icon: 'Type' },
  trueFalse: { label: 'True or False', icon: 'CircleCheckBig' },
  mcq: { label: 'Multiple choice', icon: 'List' },
}

export function isQuestionType(value: string): value is QuestionType {
  return (ALL_QUESTION_TYPES as readonly string[]).includes(value)
}

/** Every user starts with plain word->meaning only — the other formats are opt-in via Settings,
 * not sprung on an existing reviewer the first time this ships. */
export const DEFAULT_ENABLED_QUESTION_TYPES: readonly QuestionType[] = ['vocab']

/** How many due cards a single review session pulls in, before expanding into per-format entries
 * (Mixed practice) — applies to every review mode (plain, cloze, reverse, mixed), not just Mixed.
 * A big deck coming due all at once (fresh import, first day back after a break) would otherwise
 * dump its entire due queue into one sitting; capping it and letting the learner start another
 * session immediately once they finish keeps a single sitting a manageable size without making the
 * rest wait until the cards' next natural due date. */
export const SESSION_CARD_LIMIT_OPTIONS: readonly number[] = [10, 20, 30, 50, 100]

/** 0 means "no limit" — pulls every due card into one session, the pre-cap behavior. */
export const NO_SESSION_LIMIT = 0
export const DEFAULT_SESSION_CARD_LIMIT = 20

/** The minimal per-card facts pickEligibleTypes needs — a structural subset of whatever
 * review-card shape the caller has (apps/mobile's ReviewCard, eventually desktop's own), kept
 * separate so this package doesn't depend on any app's screen types. */
export interface EligibilityCard {
  cardId: string
  hasClozeVariant: boolean
}

/** The minimal per-row shape pickEligibleTypes needs from a distractor pool — a structural subset
 * of @lingora/database's DistractorMeaning, kept separate so this package doesn't depend on the
 * database package. */
export interface DistractorPoolEntry {
  cardId: string
}

/** A card is eligible for mcq/trueFalse only once enough *other* cards' meanings are available to
 * build wrong answers from — mcq needs 3 distinct distractors, trueFalse needs just 1 (to
 * occasionally swap in a false statement). */
const MIN_DISTRACTORS: Partial<Record<QuestionType, number>> = { mcq: 3, trueFalse: 1 }

function isEligible(card: EligibilityCard, type: QuestionType, distractorPool: DistractorPoolEntry[]): boolean {
  if (type === 'cloze') return card.hasClozeVariant
  const minNeeded = MIN_DISTRACTORS[type]
  if (minNeeded === undefined) return true // vocab/reverse — always eligible
  const available = distractorPool.filter((d) => d.cardId !== card.cardId).length
  return available >= minNeeded
}

/**
 * Every question type a given card should be tested in for a Mixed practice session — the
 * intersection of what's enabled (a settings preference) and what's eligible for this specific
 * card, falling back to just 'vocab' (always eligible) if nothing else qualifies. A card with,
 * say, 4 enabled and eligible types appears 4 separate times in the session — once per format, all
 * counting toward that one card's FSRS schedule as a single aggregated rating (see worstRating
 * below). Callers must call this at most once per (card, session) — the queue order is built once
 * and frozen, same as every other part of a review session.
 */
export function pickEligibleTypes(
  card: EligibilityCard,
  enabled: QuestionType[],
  distractorPool: DistractorPoolEntry[],
): QuestionType[] {
  const eligible = enabled.filter((type) => isEligible(card, type, distractorPool))
  return eligible.length > 0 ? eligible : ['vocab']
}

/** Fisher-Yates — used to interleave a mixed session's (card, format) pairs across the whole
 * session rather than testing one word 2-5 times in a row, which retrieval-practice research
 * generally favors over blocked repetition anyway. Also used to shuffle multiple-choice options. */
export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = copy[i]
    const b = copy[j]
    if (a === undefined || b === undefined) continue
    copy[i] = b
    copy[j] = a
  }
  return copy
}

const RATING_RANK: Record<ReviewRating, number> = { again: 0, hard: 1, good: 2, easy: 3 }

/** The worse of two ratings — a card tested in several formats in one session (Mixed practice)
 * gets exactly one FSRS update, using the worst rating across every format it was tested in:
 * getting 'good' on multiple-choice but 'again' on the same word's cloze means the word wasn't
 * actually retained, so the schedule should treat it as 'again', not average the two out. */
export function worstRating(a: ReviewRating, b: ReviewRating): ReviewRating {
  return RATING_RANK[a] <= RATING_RANK[b] ? a : b
}

// ─── Part-of-speech casing heuristic ───────────────────────────────────────────

/** Target languages whose orthography capitalizes every common noun, not just proper nouns and
 * sentence-initial words — German is the only one of this app's supported languages that does.
 * A word typed as a standalone dictionary-form search term (not read from mid-sentence, where
 * capitalization could just mean "sentence start") is capitalized in one of these languages
 * essentially only because it's a noun. */
const NOUN_CAPITALIZING_LANGUAGES: readonly LanguageCode[] = ['de']

/**
 * A best-guess `PartOfSpeech` from a standalone word's own casing — for the few call sites that
 * need *some* value before real classification (AI generation, a word-guide's own tag) is
 * available or ever runs: a plain dictionary-translation lookup with no POS data at all, and CSV/
 * Anki import rows with no POS column. Confirmed in the wild: German has real noun/verb minimal
 * pairs distinguished only by capitalization — "Ausreden" (the plural noun "excuses") vs.
 * "ausreden" (the verb "to talk someone out of something"), "Schweigen" (the noun "silence") vs.
 * "schweigen" (the verb "to be silent") — and every one of those call sites used to hardcode
 * `'noun'` unconditionally, mistagging every lowercase-typed verb search as a noun with no way to
 * self-correct until (if ever) a full AI generation overwrote it.
 *
 * Deliberately narrow, matching the exact reliable signal and no further guess beyond it:
 * - Outside `NOUN_CAPITALIZING_LANGUAGES` (i.e. every supported language except German), casing
 *   carries no part-of-speech meaning at all — returns `'unknown'`, same honest default the manual
 *   "Add card" flow already uses, rather than a wrong guess.
 * - Within one of those languages: capitalized -> `'noun'` (the overwhelmingly common case for a
 *   capitalized standalone search term). Lowercase only rules out noun — it's equally consistent
 *   with a verb infinitive, an adjective, an adverb, a preposition, and more, so it can't name a
 *   single part of speech with any real confidence either. `'verb'` is returned anyway as the
 *   fallback guess, since it's both the single most common lowercase dictionary-form word class and
 *   exactly the case this heuristic exists to fix (the two examples above) — still just a starting
 *   guess a later real classification (AI generation, an installed dictionary's own tag) is free to
 *   overwrite, never authoritative.
 */
export function guessPartOfSpeechFromCasing(word: string, language: LanguageCode): PartOfSpeech {
  const trimmed = word.trim()
  if (trimmed === '' || !NOUN_CAPITALIZING_LANGUAGES.includes(language)) return 'unknown'
  const firstChar = trimmed[0]!
  const isCapitalized = firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase()
  return isCapitalized ? 'noun' : 'verb'
}
