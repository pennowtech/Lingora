import type { Migration } from './types'

/**
 * Migration 0017 — card native language.
 *
 * A card's meanings/examples/synonyms are generated in a specific native language
 * (the learner's own language, e.g. 'hi' for a Hindi speaker learning German) — but
 * until now nothing recorded which one. Word lookup matched on the shared `lemma` row
 * alone, so switching native language could surface content generated for a
 * different native language entirely. `native_language` scopes a card to the
 * (lemma, native_language) pair it was actually generated for; `lemmas`/inflections
 * stay shared and reusable across native languages. Defaults existing rows to 'en',
 * matching the fallback already used everywhere a native language isn't supplied.
 */
export const cardNativeLanguage: Migration = {
  version: 17,
  name: 'card_native_language',
  up: `
ALTER TABLE cards ADD COLUMN native_language TEXT NOT NULL DEFAULT 'en';
CREATE INDEX IF NOT EXISTS cards_lemma_native_idx ON cards(lemma_id, native_language);
`,
  down: `
DROP INDEX IF EXISTS cards_lemma_native_idx;
ALTER TABLE cards DROP COLUMN native_language;
`,
}
