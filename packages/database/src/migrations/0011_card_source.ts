import type { Migration } from './types'

/**
 * Migration 0011 — card source.
 *
 * Tracks how a card was created: an AI provider name ('openai'/'mistral'/'gemini'/'anthropic'/
 * 'local'), a dictionary provider ('google'/'deepl'), or the installed word-guides dictionary
 * ('word_guide'). NULL for cards from before this migration and for paths that don't set it yet
 * (CSV/Anki import, manual entry) — the UI treats NULL as "no source icon", not an error. Powers
 * the small source icon in Search results and the word detail screen.
 */
export const cardSource: Migration = {
  version: 11,
  name: 'card_source',
  up: `ALTER TABLE cards ADD COLUMN source TEXT;`,
  down: `ALTER TABLE cards DROP COLUMN source;`,
}
