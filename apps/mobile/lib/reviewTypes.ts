import type { DistractorMeaning } from '@lingora/database'
import type { QuestionType, ReviewRating } from '@lingora/types'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { logger } from '@lingora/observability'
import { STORE_KEYS } from './services'

const log = logger.child({ feature: 'srs', component: 'reviewTypes' })

export const ALL_QUESTION_TYPES: readonly QuestionType[] = ['vocab', 'reverse', 'cloze', 'trueFalse', 'mcq']

/** Label/icon per question type, for the Settings "Practice question types" picker. */
export const QUESTION_TYPE_META: Record<QuestionType, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  vocab: { label: 'Word -> Meaning', icon: 'swap-horizontal-outline' },
  reverse: { label: 'Meaning -> Word', icon: 'return-up-back-outline' },
  cloze: { label: 'Fill in the blank', icon: 'text-outline' },
  trueFalse: { label: 'True or False', icon: 'checkmark-circle-outline' },
  mcq: { label: 'Multiple choice', icon: 'list-outline' },
}

/** Every user starts with plain word->meaning only — the other formats are opt-in via Settings,
 * not sprung on an existing reviewer the first time this ships. */
const DEFAULT_ENABLED_TYPES: QuestionType[] = ['vocab']

function isQuestionType(value: string): value is QuestionType {
  return (ALL_QUESTION_TYPES as readonly string[]).includes(value)
}

/** The user's enabled question types for Mixed practice sessions, SecureStore-backed like every
 * other preference in this app (see services.tsx STORE_KEYS). Falls back to vocab-only on a
 * missing/corrupt value rather than throwing — Mixed practice degrading to plain flip cards is a
 * safe failure mode. */
export async function getEnabledQuestionTypes(): Promise<QuestionType[]> {
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEYS.reviewQuestionTypes)
    if (!raw) return DEFAULT_ENABLED_TYPES
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_ENABLED_TYPES
    const types = parsed.filter((v): v is QuestionType => typeof v === 'string' && isQuestionType(v))
    return types.length > 0 ? types : DEFAULT_ENABLED_TYPES
  } catch (error) {
    log.error('srs.question_types_load_failed', error, { message: 'Failed to load enabled question types' })
    return DEFAULT_ENABLED_TYPES
  }
}

export async function setEnabledQuestionTypes(types: QuestionType[]): Promise<void> {
  await SecureStore.setItemAsync(STORE_KEYS.reviewQuestionTypes, JSON.stringify(types))
}

/** The minimal per-card facts pickEligibleTypes needs — a structural subset of review/[deckId].tsx's
 * own ReviewCard, kept separate so this lib file doesn't import from a screen. */
export interface EligibilityCard {
  cardId: string
  hasClozeVariant: boolean
}

/** A card is eligible for mcq/trueFalse only once enough *other* cards' meanings are available to
 * build wrong answers from — mcq needs 3 distinct distractors, trueFalse needs just 1 (to
 * occasionally swap in a false statement). */
const MIN_DISTRACTORS: Partial<Record<QuestionType, number>> = { mcq: 3, trueFalse: 1 }

function isEligible(card: EligibilityCard, type: QuestionType, distractorPool: DistractorMeaning[]): boolean {
  if (type === 'cloze') return card.hasClozeVariant
  const minNeeded = MIN_DISTRACTORS[type]
  if (minNeeded === undefined) return true // vocab/reverse — always eligible
  const available = distractorPool.filter((d) => d.cardId !== card.cardId).length
  return available >= minNeeded
}

/**
 * Every question type a given card should be tested in for a Mixed practice session — the
 * intersection of what's enabled (Settings) and what's eligible for this specific card, falling
 * back to just 'vocab' (always eligible) if nothing else qualifies. A card with, say, 4 enabled
 * and eligible types appears 4 separate times in the session — once per format, all counting
 * toward that one card's FSRS schedule as a single aggregated rating (see worstRating below).
 * Callers must call this at most once per (card, session) — the queue order is built once and
 * frozen, same as every other part of the review session.
 */
export function pickEligibleTypes(
  card: EligibilityCard,
  enabled: QuestionType[],
  distractorPool: DistractorMeaning[],
): QuestionType[] {
  const eligible = enabled.filter((type) => isEligible(card, type, distractorPool))
  return eligible.length > 0 ? eligible : ['vocab']
}

/** Fisher-Yates — used to interleave a mixed session's (card, format) pairs across the whole
 * session rather than testing one word 2-5 times in a row, which retrieval-practice research
 * generally favors over blocked repetition anyway. */
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

/** The worse of two ratings — a card tested in several formats this session (Mixed practice) gets
 * exactly one FSRS update, using the worst rating across every format it was tested in: getting
 * 'good' on multiple-choice but 'again' on the same word's cloze means the word wasn't actually
 * retained, so the schedule should treat it as 'again', not average the two out. */
export function worstRating(a: ReviewRating, b: ReviewRating): ReviewRating {
  return RATING_RANK[a] <= RATING_RANK[b] ? a : b
}
