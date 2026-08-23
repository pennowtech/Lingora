import { ALL_QUESTION_TYPES, pickEligibleTypes, shuffleArray, worstRating, type EligibilityCard } from '@lingora/core'
import type { QuestionType } from '@lingora/types'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { logger } from '@lingora/observability'
import { STORE_KEYS } from './services'

const log = logger.child({ feature: 'srs', component: 'reviewTypes' })

// The platform-agnostic parts (eligibility, shuffling, rating aggregation) live in
// @lingora/core so a future desktop app can reuse them without pulling in Expo/SecureStore — see
// that package's own doc comment. Only the mobile-specific pieces (SecureStore-backed persistence,
// Ionicons) belong in this file; re-exported here so every existing import site in this app keeps
// working unchanged.
export { ALL_QUESTION_TYPES, pickEligibleTypes, shuffleArray, worstRating, type EligibilityCard }

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
