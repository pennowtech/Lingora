import type { Migration } from './types'

/**
 * Migration 0018 — card chat messages.
 *
 * Backs the "Ask AI" chat window: a free-form, multi-turn conversation about one specific card,
 * separate from stored meanings/examples. Scoped to `card_id` with `ON DELETE CASCADE` so the
 * whole thread disappears automatically the moment its card is deleted — no separate cleanup
 * step needed anywhere a card gets deleted.
 */
export const cardChatMessages: Migration = {
  version: 18,
  name: 'card_chat_messages',
  up: `
CREATE TABLE IF NOT EXISTS card_chat_messages (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS card_chat_messages_card_idx ON card_chat_messages(card_id, created_at);
`,
  down: `
DROP INDEX IF EXISTS card_chat_messages_card_idx;
DROP TABLE IF EXISTS card_chat_messages;
`,
}
