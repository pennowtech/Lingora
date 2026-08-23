import type { Migration } from './types'

/**
 * Migration 0021 — review event question type.
 *
 * Mixed-format review sessions grade several presentations (word->meaning, reverse,
 * cloze-as-a-question, true/false, multiple-choice) onto the same card_states FSRS
 * schedule via the existing rating scale. review_events is an insert-only log, so
 * without recording which presentation produced a given rating, that provenance is
 * lost forever once mixed sessions start writing rows. Nullable — legacy rows and any
 * caller that doesn't pass one stay NULL rather than guessing.
 */
export const reviewEventQuestionType: Migration = {
  version: 21,
  name: 'review_event_question_type',
  up: `ALTER TABLE review_events ADD COLUMN question_type TEXT;`,
  down: `ALTER TABLE review_events DROP COLUMN question_type;`,
}
