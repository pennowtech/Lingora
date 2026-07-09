import type { Tag } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/**
 * Tags: flexible cross-deck labels ('common', 'exam-b1', 'separable-verb').
 */

/**
 * Get all tags, alphabetically.
 */
export async function getAllTags(db: DatabaseAdapter): Promise<Tag[]> {
  return db.query<Tag>(`SELECT id, name FROM tags ORDER BY name ASC`)
}

/**
 * Get the tags applied to a card.
 */
export async function getTagsForCard(db: DatabaseAdapter, cardId: string): Promise<Tag[]> {
  return db.query<Tag>(
    `SELECT t.id, t.name FROM tags t
     JOIN card_tags ct ON ct.tag_id = t.id
     WHERE ct.card_id = ?
     ORDER BY t.name ASC`,
    [cardId],
  )
}

/**
 * Get or create a tag by name. Tag names are unique, so tagging two cards
 * 'common' reuses the same tag row.
 */
export async function getOrCreateTag(db: DatabaseAdapter, name: string): Promise<Tag> {
  const trimmed = name.trim()
  const existing = await db.querySingle<Tag>(
    `SELECT id, name FROM tags WHERE name = ? COLLATE NOCASE`,
    [trimmed],
  )
  if (existing) {
    return existing
  }

  const tag: Tag = { id: crypto.randomUUID(), name: trimmed }
  await db.execute(`INSERT INTO tags (id, name) VALUES (?, ?)`, [tag.id, tag.name])
  return tag
}

/**
 * Apply a tag to a card. A no-op if the card already has the tag.
 */
export async function addTagToCard(
  db: DatabaseAdapter,
  cardId: string,
  tagId: string,
): Promise<void> {
  await db.execute(`INSERT OR IGNORE INTO card_tags (id, card_id, tag_id) VALUES (?, ?, ?)`, [
    crypto.randomUUID(),
    cardId,
    tagId,
  ])
}

/**
 * Remove a tag from a card. The tag itself remains for other cards.
 */
export async function removeTagFromCard(
  db: DatabaseAdapter,
  cardId: string,
  tagId: string,
): Promise<void> {
  await db.execute(`DELETE FROM card_tags WHERE card_id = ? AND tag_id = ?`, [cardId, tagId])
}

/**
 * Delete a tag entirely — removed from every card via cascade.
 */
export async function deleteTag(db: DatabaseAdapter, tagId: string): Promise<void> {
  await db.execute(`DELETE FROM tags WHERE id = ?`, [tagId])
}
