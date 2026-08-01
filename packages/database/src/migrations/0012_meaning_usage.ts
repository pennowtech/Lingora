import type { Migration } from './types'

/**
 * Migration 0012 — meaning usage notes.
 *
 * Short notes on how/when a meaning is actually used (register, common contexts, typical
 * collocations) — the same role as a word guide entry's `usage` field, so an AI explanation can
 * render through the same "Understanding..." / "Usage" / "Examples" presentation
 * (components/WordGuideModal.tsx) the installed dictionary already uses. Nullable/optional: most
 * existing meanings (and any AI response that doesn't include it) simply have none.
 */
export const meaningUsage: Migration = {
  version: 12,
  name: 'meaning_usage',
  up: `ALTER TABLE meanings ADD COLUMN usage TEXT;`,
  down: `ALTER TABLE meanings DROP COLUMN usage;`,
}
