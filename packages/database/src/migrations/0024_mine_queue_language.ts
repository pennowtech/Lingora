import type { Migration } from './types'

/**
 * Migration 0024 — mining queue language scoping.
 *
 * Scopes captured passages to the target language they were captured in, mirroring migration
 * 0023's deck scoping. Without this, the Mining Studio list showed every captured passage
 * regardless of the currently active language pair - a passage (and its "Mined" card) captured
 * while learning German kept appearing even after switching to, say, Hindi -> French. Existing
 * passages default to target_language='de', the same historical default migration 0023 used for
 * decks (this app's only target language until multi-language support landed).
 */
export const mineQueueLanguage: Migration = {
  version: 24,
  name: 'mine_queue_language',
  up: `
ALTER TABLE sentence_mining_queue ADD COLUMN target_language TEXT NOT NULL DEFAULT 'de';
CREATE INDEX IF NOT EXISTS mine_queue_target_language_idx ON sentence_mining_queue(target_language);
`,
  down: `
DROP INDEX IF EXISTS mine_queue_target_language_idx;
ALTER TABLE sentence_mining_queue DROP COLUMN target_language;
`,
}
