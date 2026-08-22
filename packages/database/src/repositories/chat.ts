import type { ChatMessage } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/**
 * Every message in a card's "Ask AI" chat thread, oldest first. Scoped to one card — a different
 * card (even for the same lemma, e.g. a different native language's card) never shares a thread.
 */
export async function getChatMessages(db: DatabaseAdapter, cardId: string): Promise<ChatMessage[]> {
  return db.query<ChatMessage>(
    `SELECT id, card_id AS cardId, role, content, created_at AS createdAt
     FROM card_chat_messages
     WHERE card_id = ?
     ORDER BY created_at ASC`,
    [cardId],
  )
}

/** Appends one message (either side of the conversation) to a card's chat thread. */
export async function createChatMessage(db: DatabaseAdapter, message: ChatMessage): Promise<void> {
  await db.execute(
    `INSERT INTO card_chat_messages (id, card_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)`,
    [message.id, message.cardId, message.role, message.content, message.createdAt],
  )
}
