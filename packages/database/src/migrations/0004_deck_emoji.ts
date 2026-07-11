import type { Migration } from './types'

/**
 * Migration 0004 — deck display emoji.
 *
 * The deck list UI shows an emoji per deck. Nullable: decks without one
 * render a default icon. DROP COLUMN in down is safe — SQLite has supported
 * it since 3.35, and every runtime here (expo-sqlite, node:sqlite,
 * better-sqlite3) ships newer.
 */
export const deckEmoji: Migration = {
  version: 4,
  name: 'deck_emoji',
  up: `ALTER TABLE decks ADD COLUMN emoji TEXT;`,
  down: `ALTER TABLE decks DROP COLUMN emoji;`,
}
