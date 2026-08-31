import type { Deck, QuestionType } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/** The columns of a deck row, aliased to the camelCase names of the Deck type -
 * enabledQuestionTypes stays a raw JSON string here (see DeckRow) until toDeck parses it. */
const DECK_COLUMNS = `id, name, parent_id AS parentId, emoji, enabled_question_types AS enabledQuestionTypesJson, created_at AS createdAt, updated_at AS updatedAt`

/** Raw deck row as it comes back from SQLite (enabled_question_types is a JSON string column, or
 * NULL for a deck with no override - see migration 0022's doc comment). */
interface DeckRow extends Omit<Deck, 'enabledQuestionTypes'> {
  enabledQuestionTypesJson: string | null
}

function toDeck(row: DeckRow): Deck {
  const { enabledQuestionTypesJson, ...rest } = row
  let enabledQuestionTypes: QuestionType[] | null = null
  if (enabledQuestionTypesJson) {
    try {
      const parsed: unknown = JSON.parse(enabledQuestionTypesJson)
      if (Array.isArray(parsed)) enabledQuestionTypes = parsed as QuestionType[]
    } catch {
      enabledQuestionTypes = null
    }
  }
  return { ...rest, enabledQuestionTypes }
}

/**
 * Get all decks in the database.
 * @param db The database adapter to use for the query.
 * @returns An array of decks.
 */
export async function getAllDecks(db: DatabaseAdapter): Promise<Deck[]> {
  const rows = await db.query<DeckRow>(`SELECT ${DECK_COLUMNS} FROM decks ORDER BY name ASC`)
  return rows.map(toDeck)
}

/**
 * Get a single deck by its ID.
 * @param db The database adapter to use for the query.
 * @param deckId The ID of the deck to retrieve.
 * @returns The deck if found, otherwise null.
 */
export async function getDeckById(db: DatabaseAdapter, deckId: string): Promise<Deck | null> {
  const row = await db.querySingle<DeckRow>(`SELECT ${DECK_COLUMNS} FROM decks WHERE id = ?`, [deckId])
  return row ? toDeck(row) : null
}

/**
 * Every deck that has any card of this lemma — a lemma can have more than one card (e.g. a basic
 * and a cloze card, see import-shared.ts), each possibly in a different deck. Used to show "which
 * deck(s) is this word already in" instead of an "Add to deck" button that would just duplicate
 * an existing membership.
 * @param db The database adapter to use for the query.
 * @param lemmaId The ID of the lemma to look up deck membership for.
 */
export async function getDecksForLemma(db: DatabaseAdapter, lemmaId: string): Promise<Deck[]> {
  const rows = await db.query<DeckRow>(
    `SELECT DISTINCT d.id, d.name, d.parent_id AS parentId, d.emoji, d.enabled_question_types AS enabledQuestionTypesJson, d.created_at AS createdAt, d.updated_at AS updatedAt
     FROM decks d
     JOIN deck_cards dc ON dc.deck_id = d.id
     JOIN cards c ON c.id = dc.card_id
     WHERE c.lemma_id = ?
     ORDER BY d.name ASC`,
    [lemmaId],
  )
  return rows.map(toDeck)
}

/**
 * Get all direct children of a deck.
 * Used to render nested deck trees.
 * @param db The database adapter to use for the query.
 * @param parentId The ID of the parent deck.
 * @returns An array of child decks.
 */
export async function getChildDecks(db: DatabaseAdapter, parentId: string): Promise<Deck[]> {
  const rows = await db.query<DeckRow>(`SELECT ${DECK_COLUMNS} FROM decks WHERE parent_id = ? ORDER BY name ASC`, [
    parentId,
  ])
  return rows.map(toDeck)
}

/**
 * Create a new deck.
 * @param db The database adapter to use for the query.
 * @param deck The deck to create.
 */
export async function createDeck(db: DatabaseAdapter, deck: Deck): Promise<void> {
  await db.execute(
    `INSERT INTO decks (id, name, parent_id, emoji, enabled_question_types, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      deck.id,
      deck.name,
      deck.parentId ?? null,
      deck.emoji ?? null,
      deck.enabledQuestionTypes ? JSON.stringify(deck.enabledQuestionTypes) : null,
      deck.createdAt,
      deck.updatedAt,
    ],
  )
}

/**
 * Update which review formats a deck's cards get reviewed with - null clears the override,
 * falling back to the learner's global Settings -> Learning preference again.
 * @param db The database adapter to use for the query.
 * @param deckId The ID of the deck to update.
 * @param enabledQuestionTypes The new review formats, or null to clear the override.
 */
export async function setDeckQuestionTypes(
  db: DatabaseAdapter,
  deckId: string,
  enabledQuestionTypes: Deck['enabledQuestionTypes'],
): Promise<void> {
  await db.execute(`UPDATE decks SET enabled_question_types = ?, updated_at = ? WHERE id = ?`, [
    enabledQuestionTypes && enabledQuestionTypes.length > 0 ? JSON.stringify(enabledQuestionTypes) : null,
    Date.now(),
    deckId,
  ])
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
 * Delete a deck and all its cards.
 * Cards that are only in this deck are also deleted; cards that are also
 * in another deck just lose their membership in this one.
 *
 * `deck_cards.deck_id` cascades on delete, but `cards.deck_id` deliberately
 * has no foreign key (a card's "home" deck at creation vs. its actual
 * memberships in `deck_cards` are different things — see the database
 * package's architecture notes) — so deleting the `decks` row alone never
 * touched `cards` at all. Every card exclusively in this deck is deleted
 * explicitly first (cascading to its meanings/examples/synonyms/cloze/
 * card_states/review_events/tags via their own `ON DELETE CASCADE` from
 * `cards`), then any lemma left with zero cards anywhere is deleted too —
 * otherwise it lingers forever as a false "already exists" on the next
 * import/lookup of the same word, and re-importing it (merge/duplicate)
 * keeps adding onto an orphaned, invisible card.
 * @param db The database adapter to use for the query.
 * @param deckId The ID of the deck to delete.
 */
export async function deleteDeck(db: DatabaseAdapter, deckId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const onlyInThisDeck = await tx.query<{ cardId: string }>(
      `SELECT dc.card_id AS cardId
       FROM deck_cards dc
       WHERE dc.deck_id = ?
         AND (SELECT COUNT(*) FROM deck_cards dc2 WHERE dc2.card_id = dc.card_id) = 1`,
      [deckId],
    )
    for (const { cardId } of onlyInThisDeck) {
      await tx.execute(`DELETE FROM cards WHERE id = ?`, [cardId])
    }
    await tx.execute(`DELETE FROM lemmas WHERE id NOT IN (SELECT DISTINCT lemma_id FROM cards)`)
    await tx.execute(`DELETE FROM decks WHERE id = ?`, [deckId])
  })
}

/**
 * Merge `sourceDeckId` into `targetDeckId`: every card in the source deck
 * ends up in the target deck too, any deck nested under the source is
 * re-parented under the target instead of being orphaned, and the source
 * deck itself is deleted. Cards are never deleted — a card that was
 * exclusively in the source deck now lives only in the target; a card that
 * was already in both keeps a single membership (the source's duplicate
 * `deck_cards` row is dropped, not the target's).
 *
 * The caller is responsible for not passing a `targetDeckId` that is `source`
 * itself or one of its own descendants — merging a deck into its own child
 * would try to re-parent that child onto itself, a cycle. `apps/mobile/app/
 * deck/[id].tsx`'s deck picker excludes both before this is ever called.
 * @param db The database adapter to use for the query.
 * @param sourceDeckId The deck to merge away.
 * @param targetDeckId The deck to merge into.
 */
export async function mergeDecks(
  db: DatabaseAdapter,
  sourceDeckId: string,
  targetDeckId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    // A card already in both decks would violate deck_cards' (deck_id, card_id)
    // unique index if its source row were simply re-pointed — drop the
    // source's redundant membership first, keeping the target's.
    await tx.execute(
      `DELETE FROM deck_cards
       WHERE deck_id = ? AND card_id IN (SELECT card_id FROM deck_cards WHERE deck_id = ?)`,
      [sourceDeckId, targetDeckId],
    )
    await tx.execute(`UPDATE deck_cards SET deck_id = ? WHERE deck_id = ?`, [
      targetDeckId,
      sourceDeckId,
    ])
    await tx.execute(`UPDATE decks SET parent_id = ?, updated_at = ? WHERE parent_id = ?`, [
      targetDeckId,
      Date.now(),
      sourceDeckId,
    ])
    await tx.execute(`DELETE FROM decks WHERE id = ?`, [sourceDeckId])
  })
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

/**
 * Reset every card in a deck back to a fresh, never-reviewed FSRS state — both the word-meaning
 * schedule (card_states) and the independent cloze schedule (cloze_states, migration 0013), since
 * practicing one no longer touches the other's due date. Review history (review_events) is left
 * alone; this resets what's due next, not the record of what was already studied — "reset
 * progress" means the learning schedule starts over, not that the study log gets erased.
 * @param db The database adapter to use for the query.
 * @param deckId The ID of the deck whose cards' progress should be reset.
 */
export async function resetDeckProgress(db: DatabaseAdapter, deckId: string): Promise<void> {
  await db.transaction(async (tx) => {
    for (const table of ['card_states', 'cloze_states']) {
      await tx.execute(
        `UPDATE ${table} SET
           state = 'new',
           stability = 0,
           difficulty = 0,
           retrievability = 0,
           lapses = 0,
           last_reviewed_at = NULL,
           next_review_date = 0,
           reps = 0,
           learning_steps = 0
         WHERE card_id IN (SELECT card_id FROM deck_cards WHERE deck_id = ?)`,
        [deckId],
      )
    }
  })
}
