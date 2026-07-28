import type { Migration } from './types'

/**
 * Migration 0010 — word guide translation.
 *
 * Adds a short English gloss to each word_guides row, the same role as a
 * generated meaning's `translation` field. Needed so a dictionary entry can
 * be added to a deck as a real card (see persistWordGuideAsCard) — the
 * `intro`/`usage` fields are prose, not a short gloss, so `translation` had
 * to be a new column rather than reusing one of them.
 */
export const wordGuideTranslation: Migration = {
  version: 10,
  name: 'word_guide_translation',
  up: `ALTER TABLE word_guides ADD COLUMN translation TEXT NOT NULL DEFAULT '';`,
  down: `ALTER TABLE word_guides DROP COLUMN translation;`,
}
