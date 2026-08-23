import {
  ALL_QUESTION_TYPES,
  DEFAULT_ENABLED_QUESTION_TYPES,
  isQuestionType,
  pickEligibleTypes,
  QUESTION_TYPE_META,
  shuffleArray,
  worstRating,
  type EligibilityCard,
  type QuestionTypeMeta,
} from '@lingora/core'
import type { QuestionType } from '@lingora/types'
import * as SecureStore from 'expo-secure-store'
import { logger } from '@lingora/observability'
import { STORE_KEYS } from './services'

const log = logger.child({ feature: 'srs', component: 'reviewTypes' })

// Everything about question types (eligibility, shuffling, rating aggregation, display data, and
// the default/validation helpers) is pure and lives in @lingora/core — desktop can use all of it
// unchanged. The only thing that genuinely cannot move here is the two functions below:
// expo-secure-store does not exist outside Expo at all (there's no browser/Node/Tauri
// implementation to fall back to), so packages/core — which desktop also depends on — can never
// import it without breaking every non-Expo consumer. This file's whole reason to exist is those
// two functions; everything else is re-exported so existing import sites in this app keep working.
export {
  ALL_QUESTION_TYPES,
  isQuestionType,
  pickEligibleTypes,
  QUESTION_TYPE_META,
  shuffleArray,
  worstRating,
  type EligibilityCard,
  type QuestionTypeMeta,
}

/** The user's enabled question types for Mixed practice sessions, SecureStore-backed like every
 * other preference in this app (see services.tsx STORE_KEYS). Falls back to vocab-only on a
 * missing/corrupt value rather than throwing — Mixed practice degrading to plain flip cards is a
 * safe failure mode. */
export async function getEnabledQuestionTypes(): Promise<QuestionType[]> {
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEYS.reviewQuestionTypes)
    if (!raw) return [...DEFAULT_ENABLED_QUESTION_TYPES]
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [...DEFAULT_ENABLED_QUESTION_TYPES]
    const types = parsed.filter((v): v is QuestionType => typeof v === 'string' && isQuestionType(v))
    return types.length > 0 ? types : [...DEFAULT_ENABLED_QUESTION_TYPES]
  } catch (error) {
    log.error('srs.question_types_load_failed', error, { message: 'Failed to load enabled question types' })
    return [...DEFAULT_ENABLED_QUESTION_TYPES]
  }
}

export async function setEnabledQuestionTypes(types: QuestionType[]): Promise<void> {
  await SecureStore.setItemAsync(STORE_KEYS.reviewQuestionTypes, JSON.stringify(types))
}
