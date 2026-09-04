import {
  ALL_QUESTION_TYPES,
  DEFAULT_ENABLED_QUESTION_TYPES,
  getDeckQuestionTypes,
  isQuestionType,
  pickEligibleTypes,
  QUESTION_TYPE_META,
  shuffleArray,
  toggleQuestionType,
  worstRating,
  type EligibilityCard,
  type QuestionTypeMeta,
} from '@lingora/core'

// Everything about question types (eligibility, shuffling, rating aggregation, display data, and
// the default/validation helpers) is pure and lives in @lingora/core — desktop can use all of it
// unchanged. The only thing that genuinely cannot move here is the two functions below:
// This module keeps the mobile app's existing import path while the pure implementation remains
// shared in @lingora/core for desktop and tests.
export {
  ALL_QUESTION_TYPES,
  DEFAULT_ENABLED_QUESTION_TYPES,
  getDeckQuestionTypes,
  isQuestionType,
  pickEligibleTypes,
  QUESTION_TYPE_META,
  shuffleArray,
  toggleQuestionType,
  worstRating,
  type EligibilityCard,
  type QuestionTypeMeta,
}
