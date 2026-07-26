import type { Migration } from './types'

/**
 * Migration 0006 — FSRS reps/learning-steps fields.
 *
 * `packages/srs` wraps `ts-fsrs`, whose scheduling algorithm needs a card's
 * total review count (`reps`) and its progress through the (re)learning step
 * sequence (`learning_steps`) to schedule correctly — without them, every
 * card would be treated as freshly graduating from its first learning step
 * on every review. Both default to 0, so every existing card (and every
 * insert that doesn't mention these columns, e.g. CSV/Anki import) keeps
 * working unchanged.
 */
export const cardStateFsrsFields: Migration = {
  version: 6,
  name: 'card_state_fsrs_fields',
  up: `ALTER TABLE card_states ADD COLUMN reps INTEGER NOT NULL DEFAULT 0;
ALTER TABLE card_states ADD COLUMN learning_steps INTEGER NOT NULL DEFAULT 0;`,
  down: `ALTER TABLE card_states DROP COLUMN learning_steps;
ALTER TABLE card_states DROP COLUMN reps;`,
}
