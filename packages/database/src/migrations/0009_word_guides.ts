import type { Migration } from './types'

/**
 * Migration 0009 — word guides.
 *
 * A standalone, keyless lookup table for bulk-installed reference-dictionary
 * content (see LingoraDocs/6_word_guides_plan.md) — deliberately NOT related
 * to lemmas/cards/decks/FSRS. Installing or uninstalling this data never
 * touches a user's own vocabulary: it's consulted by the explain-flow as a
 * free fallback before a live AI call, not treated as study material itself.
 * `installWordGuideChunk`/`uninstallWordGuideChunk` insert/delete whole
 * chunks; there's nothing else to clean up on uninstall since no other table
 * ever references a row here.
 */
export const wordGuides: Migration = {
  version: 9,
  name: 'word_guides',
  up: `
CREATE TABLE IF NOT EXISTS word_guides (
  id TEXT PRIMARY KEY,
  headword TEXT NOT NULL,
  language TEXT NOT NULL,
  chunk_id INTEGER NOT NULL,
  part_of_speech TEXT,
  gender TEXT,
  usage_note TEXT,
  intro TEXT NOT NULL,
  synonyms TEXT NOT NULL,
  examples TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS word_guides_headword_language_idx ON word_guides(headword, language);
CREATE INDEX IF NOT EXISTS word_guides_chunk_idx ON word_guides(chunk_id, language);
`,
  down: `DROP TABLE IF EXISTS word_guides;`,
}
