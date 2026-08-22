import type { QuestionType, ReviewRating } from '@lingora/types'

/**
 * Platform-agnostic application logic shared between apps/mobile and (from Phase 6 on) the Tauri
 * desktop app — no React Native, no Expo, no DOM. Pure functions and data only; anything that
 * touches device storage, native UI primitives, or a specific rendering framework belongs in the
 * app itself (or, once desktop lands and both apps need it, in packages/ui for RN-Web-compatible
 * components). New platform-agnostic logic should land here from the start rather than in an app's
 * own lib/ with reuse retrofitted later.
 */

// ─── Review question types ─────────────────────────────────────────────────────

export const ALL_QUESTION_TYPES: readonly QuestionType[] = ['vocab', 'reverse', 'cloze', 'trueFalse', 'mcq']

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
