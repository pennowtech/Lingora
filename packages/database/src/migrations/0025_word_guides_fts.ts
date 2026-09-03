import { WORD_GUIDES_FTS_SETUP_SQL, WORD_GUIDES_FTS_TEARDOWN_SQL } from '../fts'
import type { Migration } from './types'

/**
 * Migration 0025 — word guides full-text search.
 *
 * Adds `fts_word_guides` (indexing `translation` + `intro`) so the installed dictionary can be
 * searched in reverse — a native-language word (e.g. "cannon") finding the target-language
 * headword (e.g. "Kanone") that means it — not just the existing forward exact-headword lookup.
 * Kept as its own migration/FTS index rather than folding into migration 0002's `FTS_TABLES`,
 * since that migration already shipped and must stay reproducible as-is.
 */
export const wordGuidesFts: Migration = {
  version: 25,
  name: 'word_guides_fts',
  up: WORD_GUIDES_FTS_SETUP_SQL,
  down: WORD_GUIDES_FTS_TEARDOWN_SQL,
}
