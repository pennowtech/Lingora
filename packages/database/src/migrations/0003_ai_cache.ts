import type { Migration } from './types'

/**
 * Migration 0003 — AI response cache.
 *
 * Stores validated AI generations keyed by a deterministic cache key
 * (word + CEFR + provider + model + prompt version), so repeating a lookup
 * never triggers a second API call. Rows cascade away with their prompt
 * version: bumping a prompt deprecates the old version, and clearing it
 * removes every response it produced.
 */
export const aiCache: Migration = {
  version: 3,
  name: 'ai_cache',
  up: `
CREATE TABLE IF NOT EXISTS ai_cache (
  cache_key TEXT PRIMARY KEY,
  prompt_version_id TEXT NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  payload TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ai_cache_prompt_version_idx ON ai_cache(prompt_version_id);
`,
  down: `
DROP INDEX IF EXISTS ai_cache_prompt_version_idx;
DROP TABLE IF EXISTS ai_cache;
`,
}
