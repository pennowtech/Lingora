import type { Card, CardState } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/**
 * The columns of a card row, aliased to the camelCase names of the Card type.
 *
 * @param prefix Table alias to qualify the columns with, e.g. 'c' in a JOIN.
 */
function cardColumns(prefix = ''): string {
  const p = prefix === '' ? '' : `${prefix}.`
  return `${p}id, ${p}lemma_id AS lemmaId, ${p}deck_id AS deckId, ${p}type, ${p}primary_meaning_id AS primaryMeaningId, ${p}created_at AS createdAt, ${p}updated_at AS updatedAt, ${p}suspended_at AS suspendedAt`
}

/**
 * Get a single card by its ID
 * @param db The database adapter to use for the query.
 * @param cardId The ID of the card to retrieve.
 * @returns The card if found, otherwise null.
 */
export async function getCardById(db: DatabaseAdapter, cardId: string): Promise<Card | null> {
  return (
    (await db.querySingle<Card>(`SELECT ${cardColumns()} FROM cards WHERE id = ?`, [cardId])) ??
    null
  )
}

/**
 * Get all cards linked to a lemma. Used by the lookup flow to show
 * whether the user already has cards for a word.
 */
export async function getCardsByLemma(db: DatabaseAdapter, lemmaId: string): Promise<Card[]> {
  return db.query<Card>(`SELECT ${cardColumns()} FROM cards WHERE lemma_id = ?`, [lemmaId])
}

/**
 * Get all cards due for review right now.
 *
 * A card is due when:
 * - Its state is 'new' (never reviewed)
 * - OR its next_review_date timestamp is in the past
 * - AND it is not suspended
 * @param db The database adapter to use for the query.
 * @param deckId Optional deck ID to filter cards by deck.
 * @returns An array of cards due for review.
 */
export async function getCardsDueForReview(db: DatabaseAdapter, deckId?: string): Promise<Card[]> {
  const params: unknown[] = [Date.now()]

  let query = `SELECT DISTINCT ${cardColumns('c')} FROM cards c
    INNER JOIN deck_cards dc ON c.id = dc.card_id
    INNER JOIN card_states cs ON c.id = cs.card_id
    WHERE (cs.state = 'new' OR cs.next_review_date <= ?) AND c.suspended_at IS NULL`
  if (deckId) {
    query += ` AND dc.deck_id = ?`
    params.push(deckId)
  }
  return db.query<Card>(query, params)
}

/**
 * Create a card, its initial FSRS state, and its deck membership in a single transaction.
 *
 * Using a transaction here means if any of the three inserts fails,
 * the others are rolled back. You can never end up with a card that
 * has no state or belongs to no deck.
 * @param db The database adapter to use for the query.
 * @param card The card to create.
 * @param initialState The initial FSRS state for the card.
 */
export async function createCardWithState(
  db: DatabaseAdapter,
  card: Card,
  initialState: CardState,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(
      `INSERT INTO cards
      (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        card.id,
        card.lemmaId,
        card.deckId,
        card.type,
        card.primaryMeaningId ?? null,
        card.createdAt,
        card.updatedAt,
        card.suspendedAt ?? null,
      ],
    )
    await tx.execute(
      `INSERT INTO card_states
      (card_id, state, stability, difficulty, retrievability, lapses, last_reviewed_at, next_review_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        initialState.cardId,
        initialState.state,
        initialState.stability,
        initialState.difficulty,
        initialState.retrievability,
        initialState.lapses,
        initialState.lastReviewAt ?? null,
        initialState.nextReviewAt,
      ],
    )
    await tx.execute(
      `INSERT OR IGNORE INTO deck_cards (id, deck_id, card_id, added_at)
      VALUES (?, ?, ?, ?)`,
      [crypto.randomUUID(), card.deckId, card.id, Date.now()],
    )
  })
}

/**
 * Set the primary meaning of a card. Done as a second step after the card and
 * its meanings are created, because meanings reference the card.
 * @param db The database adapter to use for the query.
 * @param cardId The ID of the card to update.
 * @param meaningId The ID of the meaning to set as primary.
 */
export async function updateCardPrimaryMeaning(
  db: DatabaseAdapter,
  cardId: string,
  meaningId: string,
): Promise<void> {
  await db.execute(`UPDATE cards SET primary_meaning_id = ?, updated_at = ? WHERE id = ?`, [
    meaningId,
    Date.now(),
    cardId,
  ])
}

/**
 * Suspend a card. It stays in the deck but won't
 * appear in review sessions until unsuspended.
 * @param db The database adapter to use for the query.
 * @param cardId The ID of the card to suspend.
 */
export async function suspendCard(db: DatabaseAdapter, cardId: string): Promise<void> {
  await db.execute(`UPDATE cards SET suspended_at = ? WHERE id = ?`, [Date.now(), cardId])
}

/**
 * Unsuspend a card — returns it to the review queue.
 * @param db The database adapter to use for the query.
 * @param cardId The ID of the card to unsuspend.
 */
export async function unsuspendCard(db: DatabaseAdapter, cardId: string): Promise<void> {
  await db.execute(`UPDATE cards SET suspended_at = NULL WHERE id = ?`, [cardId])
}

/**
 * Delete a card. Cascades to its meanings, examples, synonyms, phrases,
 * cloze variants, audio, states, review history, and deck memberships.
 * @param db The database adapter to use for the query.
 * @param cardId The ID of the card to delete.
 */
export async function deleteCard(db: DatabaseAdapter, cardId: string): Promise<void> {
  await db.execute(`DELETE FROM cards WHERE id = ?`, [cardId])
}

/**
 * Count how many cards in a deck are due right now.
 * Used on the home screen to show the due count badge.
 * @param db The database adapter to use for the query.
 * @param deckId The ID of the deck to count due cards for.
 * @returns The number of cards due for review.
 */
export async function getDueCardsCount(db: DatabaseAdapter, deckId?: string): Promise<number> {
  const params: unknown[] = [Date.now()]
  let query = `SELECT COUNT(DISTINCT c.id) as count FROM cards c
     INNER JOIN deck_cards dc ON c.id = dc.card_id
     INNER JOIN card_states cs ON c.id = cs.card_id
     WHERE (cs.state = 'new' OR cs.next_review_date <= ?) AND c.suspended_at IS NULL`
  if (deckId) {
    query += ` AND dc.deck_id = ?`
    params.push(deckId)
  }
  const result = await db.querySingle<{ count: number }>(query, params)
  return result?.count ?? 0
}
