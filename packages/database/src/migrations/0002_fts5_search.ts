import { FTS5_SETUP_SQL, FTS5_TEARDOWN_SQL } from '../fts'
import type { Migration } from './types'

/**
 * Migration 0002 — full-text search.
 *
 * Creates the five FTS5 virtual tables (lemmas, meanings, examples, phrases,
 * synonyms) and the triggers that keep them in sync with their content tables.
 * Kept separate from 0001 so search can be rebuilt independently of the data:
 * rolling this migration back and re-applying it drops and recreates the whole
 * search index without touching any user data.
 */
export const fts5Search: Migration = {
  version: 2,
  name: 'fts5_search',
  up: FTS5_SETUP_SQL,
  down: FTS5_TEARDOWN_SQL,
}
