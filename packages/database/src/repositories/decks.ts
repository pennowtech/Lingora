import type { Deck } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/** The columns of a deck row, aliased to the camelCase names of the Deck type. */
const DECK_COLUMNS = `id, name, parent_id AS parentId, emoji, created_at AS createdAt, updated_at AS updatedAt`

/**
 * Get all decks in the database.
 * @param db The database adapter to use for the query.
 * @returns An array of decks.
 */
export async function getAllDecks(db: DatabaseAdapter): Promise<Deck[]> {
  return db.query<Deck>(`SELECT ${DECK_COLUMNS} FROM decks ORDER BY name ASC`)
}

/**
 * Get a single deck by its ID.
 * @param db The database adapter to use for the query.
 * @param deckId The ID of the deck to retrieve.
 * @returns The deck if found, otherwise null.
 */
export async function getDeckById(db: DatabaseAdapter, deckId: string): Promise<Deck | null> {
  return (
    (await db.querySingle<Deck>(`SELECT ${DECK_COLUMNS} FROM decks WHERE id = ?`, [deckId])) ?? null
  )
}

/**
 * Get all direct children of a deck.
 * Used to render nested deck trees.
 * @param db The database adapter to use for the query.
 * @param parentId The ID of the parent deck.
 * @returns An array of child decks.
 */
export async function getChildDecks(db: DatabaseAdapter, parentId: string): Promise<Deck[]> {
  return db.query<Deck>(`SELECT ${DECK_COLUMNS} FROM decks WHERE parent_id = ? ORDER BY name ASC`, [
    parentId,
  ])
}

/**
 * Create a new deck.
 * @param db The database adapter to use for the query.
 * @param deck The deck to create.
 */
export async function createDeck(db: DatabaseAdapter, deck: Deck): Promise<void> {
  await db.execute(
    `INSERT INTO decks (id, name, parent_id, emoji, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [deck.id, deck.name, deck.parentId ?? null, deck.emoji ?? null, deck.createdAt, deck.updatedAt],
  )
}

/**
 * Rename a deck.
 * @param db The database adapter to use for the query.
 * @param deckId The ID of the deck to rename.
 * @param name The new name for the deck.
 */
export async function renameDeck(db: DatabaseAdapter, deckId: string, name: string): Promise<void> {
  await db.execute(`UPDATE decks SET name = ?, updated_at = ? WHERE id = ?`, [
    name,
    Date.now(),
    deckId,
  ])
}

/**
 * Move a deck inside another deck, or to top level.
 * @param db The database adapter to use for the query.
 * @param deckId The ID of the deck to move.
 * @param newParentId The ID of the new parent deck, or null for top-level.
 */
export async function moveDeck(
  db: DatabaseAdapter,
  deckId: string,
  newParentId: string | null,
): Promise<void> {
  await db.execute(`UPDATE decks SET parent_id = ?, updated_at = ? WHERE id = ?`, [
    newParentId,
    Date.now(),
    deckId,
  ])
}

/**
 * Delete a deck and all its cards (via cascade).
 * Cards that are only in this deck are also deleted.
 * Cards in multiple decks remain in the other decks.
 * @param db The database adapter to use for the query.
 * @param deckId The ID of the deck to delete.
 */
export async function deleteDeck(db: DatabaseAdapter, deckId: string): Promise<void> {
  await db.execute(`DELETE FROM decks WHERE id = ?`, [deckId])
}

/** Card and due counts of one deck — the badges on the deck list. */
export interface DeckCounts {
  deckId: string
  cardCount: number
  dueCount: number
}

/**
 * Card and due counts for every deck in one query (single GROUP BY instead of
 * two queries per deck). Decks with no cards are absent from the result.
 */
export async function getDeckCounts(db: DatabaseAdapter): Promise<DeckCounts[]> {
  return db.query<DeckCounts>(
    `SELECT dc.deck_id AS deckId,
            COUNT(*) AS cardCount,
            SUM(CASE WHEN (cs.state = 'new' OR cs.next_review_date <= ?) AND c.suspended_at IS NULL
                     THEN 1 ELSE 0 END) AS dueCount
     FROM deck_cards dc
     JOIN cards c ON c.id = dc.card_id
     JOIN card_states cs ON cs.card_id = c.id
     GROUP BY dc.deck_id`,
    [Date.now()],
  )
}

/**
 * Number of cards in one deck.
 */
export async function getCardCountForDeck(db: DatabaseAdapter, deckId: string): Promise<number> {
  const result = await db.querySingle<{ count: number }>(
    `SELECT COUNT(*) AS count FROM deck_cards WHERE deck_id = ?`,
    [deckId],
  )
  return result?.count ?? 0
}

/**
 * Add a card to a deck.
 * @param db The database adapter to use for the query.
 * @param deckId The ID of the deck to add the card to.
 * @param cardId The ID of the card to add.
 */
export async function addCardToDeck(
  db: DatabaseAdapter,
  deckId: string,
  cardId: string,
): Promise<void> {
  await db.execute(
    `INSERT OR IGNORE INTO deck_cards (id, deck_id, card_id, added_at)
     VALUES (?, ?, ?, ?)`,
    [crypto.randomUUID(), deckId, cardId, Date.now()],
  )
}

/**
 * Remove a card from a deck. The card itself is untouched —
 * only the membership row is deleted.
 * @param db The database adapter to use for the query.
 * @param deckId The ID of the deck to remove the card from.
 * @param cardId The ID of the card to remove.
 */
export async function removeCardFromDeck(
  db: DatabaseAdapter,
  deckId: string,
  cardId: string,
): Promise<void> {
  await db.execute(`DELETE FROM deck_cards WHERE deck_id = ? AND card_id = ?`, [deckId, cardId])
}
