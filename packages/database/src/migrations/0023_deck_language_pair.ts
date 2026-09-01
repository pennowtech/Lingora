import type { Migration } from './types'

/**
 * Migration 0023 — deck language pairs.
 *
 * Scopes decks to an active language pair (target_language, native_language), e.g. ('de', 'en').
 * Prevents decks created while learning German from cluttering other language configurations
 * (e.g. Spanish or reverse pairs). Existing decks default to target_language='de' and native_language='en'.
 */
export const deckLanguagePair: Migration = {
  version: 23,
  name: 'deck_language_pair',
  up: `
ALTER TABLE decks ADD COLUMN target_language TEXT NOT NULL DEFAULT 'de';
ALTER TABLE decks ADD COLUMN native_language TEXT NOT NULL DEFAULT 'en';
CREATE INDEX IF NOT EXISTS decks_lang_pair_idx ON decks(target_language, native_language);
`,
  down: `
DROP INDEX IF EXISTS decks_lang_pair_idx;
ALTER TABLE decks DROP COLUMN native_language;
ALTER TABLE decks DROP COLUMN target_language;
`,
}
