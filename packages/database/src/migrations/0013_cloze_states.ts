import type { Migration } from './types'

/**
 * Migration 0013 — independent FSRS schedule for cloze practice.
 *
 * Until now `card_states` (one row per card, `card_id` as its primary key) was the single FSRS
 * schedule shared by both word-meaning review and cloze practice of the same card — rating a card
 * in either mode marked it not-due for the other too, which read as a bug ("practicing cloze made
 * the word disappear from word-meaning review, and vice versa"). `cloze_states` mirrors
 * `card_states`'s exact shape (see migration 0006 for the reps/learning_steps fields FSRS needs)
 * so `packages/srs`'s scheduler works identically against either table — cloze practice just gets
 * its own row, own due date, own review history, entirely independent of the card's word-meaning
 * schedule.
 */
export const clozeStates: Migration = {
  version: 13,
  name: 'cloze_states',
  up: `
CREATE TABLE IF NOT EXISTS cloze_states (
  card_id TEXT PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'new',
  stability REAL NOT NULL DEFAULT 0,
  difficulty REAL NOT NULL DEFAULT 0,
  retrievability REAL NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at INTEGER,
  next_review_date INTEGER NOT NULL,
  reps INTEGER NOT NULL DEFAULT 0,
  learning_steps INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS cloze_states_state_idx ON cloze_states(state);
CREATE INDEX IF NOT EXISTS cloze_states_next_review_idx ON cloze_states(next_review_date);

-- Every card that already has a cloze variant needs an initial state row too, exactly like a
-- freshly created card gets one in createCardWithState/persistWordGeneration — otherwise it
-- wouldn't exist at all and couldn't satisfy the due query's join. 'new' cards are always due
-- regardless of next_review_date (see getCardsDueForReview's WHERE clause), so 0 is fine here.
INSERT INTO cloze_states (card_id, state, next_review_date)
SELECT DISTINCT card_id, 'new', 0
FROM cloze_cards;
`,
  down: `DROP TABLE IF EXISTS cloze_states;`,
}
