import type { Migration } from './types'

/**
 * Migration 0022 — per-deck review formats.
 *
 * Which of the five review formats (vocab/word->meaning, reverse/meaning->word, cloze,
 * trueFalse, mcq — see packages/core's QuestionType/ALL_QUESTION_TYPES) a deck's cards get
 * reviewed with. Nullable, JSON-encoded array of QuestionType strings — a deck created before
 * this shipped (or with no explicit choice) has NULL, and Mixed practice falls back to the
 * learner's global Settings -> Learning preference for it, same fallback both apps already use.
 */
export const deckQuestionTypes: Migration = {
  version: 22,
  name: 'deck_question_types',
  up: `ALTER TABLE decks ADD COLUMN enabled_question_types TEXT;`,
  down: `ALTER TABLE decks DROP COLUMN enabled_question_types;`,
}
