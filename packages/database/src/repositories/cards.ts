import type { Card, CardState, CefrLevel, LanguageCode } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/**
 * The columns of a card row, aliased to the camelCase names of the Card type.
 *
 * @param prefix Table alias to qualify the columns with, e.g. 'c' in a JOIN.
 */
function cardColumns(prefix = ''): string {
  const p = prefix === '' ? '' : `${prefix}.`
  return `${p}id, ${p}lemma_id AS lemmaId, ${p}deck_id AS deckId, ${p}type, ${p}primary_meaning_id AS primaryMeaningId, ${p}created_at AS createdAt, ${p}updated_at AS updatedAt, ${p}suspended_at AS suspendedAt, ${p}source, ${p}native_language AS nativeLanguage`
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
 * Get the card generated for a lemma under a specific native language, if one exists.
 * A lemma is shared across native languages; its cards are not — each (lemma,
 * nativeLanguage) pair gets its own card with its own meanings/examples/synonyms.
 */
export async function getCardByLemmaAndNativeLanguage(
  db: DatabaseAdapter,
  lemmaId: string,
  nativeLanguage: LanguageCode,
): Promise<Card | null> {
  return (
    (await db.querySingle<Card>(
      `SELECT ${cardColumns()} FROM cards WHERE lemma_id = ? AND native_language = ? LIMIT 1`,
      [lemmaId, nativeLanguage],
    )) ?? null
  )
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

  // INNER JOIN decks (not just deck_cards) so a deck_cards row surviving its deck's own deletion —
  // orphaned membership, seen in practice when a deletion path didn't cascade — can never resurrect
  // a card as "due" once every real deck it belonged to is gone.
  //
  // c.type = 'basic': every card gets a card_states row at creation regardless of type (see
  // upsertCard in import-shared.ts), so without this filter a cloze card would show up here too —
  // with no example/translation to show, since that content lives in cloze_cards instead. Cloze
  // cards have their own dedicated queue, getClozeCardsDueForReview, via cloze_states.
  let query = `SELECT DISTINCT ${cardColumns('c')} FROM cards c
    INNER JOIN deck_cards dc ON c.id = dc.card_id
    INNER JOIN decks d ON d.id = dc.deck_id
    INNER JOIN card_states cs ON c.id = cs.card_id
    WHERE c.type = 'basic' AND (cs.state = 'new' OR cs.next_review_date <= ?) AND c.suspended_at IS NULL`
  if (deckId) {
    query += ` AND dc.deck_id = ?`
    params.push(deckId)
  }
  // A stable order matters beyond display: the review session (apps/mobile/app/review/[deckId].tsx)
  // indexes into this array by position and re-fetches it mid-session (e.g. after generating an
  // on-demand AI explanation). Without an explicit ORDER BY, SQLite doesn't guarantee row order
  // between two calls — especially with DISTINCT, which can plan a different scan — so a refetch
  // could silently reshuffle the array and leave `queue[index]` pointing at a different card than
  // the one on screen, which read as the session randomly "jumping" to the next card.
  query += ` ORDER BY cs.next_review_date ASC, c.id ASC`
  return db.query<Card>(query, params)
}

/**
 * Get all cards due for CLOZE PRACTICE right now — the same "new or past next_review_date, not
 * suspended" rule as getCardsDueForReview, but against cloze_states (migration 0013), entirely
 * independent of the card's word-meaning schedule. INNER JOIN cloze_cards so a card without any
 * cloze variant never shows up here regardless of its cloze_states row.
 * @param db The database adapter to use for the query.
 * @param deckId Optional deck ID to filter cards by deck.
 * @returns An array of cards due for cloze practice.
 */
export async function getClozeCardsDueForReview(db: DatabaseAdapter, deckId?: string): Promise<Card[]> {
  const params: unknown[] = [Date.now()]

  // Same orphaned-membership guard as getCardsDueForReview above.
  let query = `SELECT DISTINCT ${cardColumns('c')} FROM cards c
    INNER JOIN deck_cards dc ON c.id = dc.card_id
    INNER JOIN decks d ON d.id = dc.deck_id
    INNER JOIN cloze_states cs ON c.id = cs.card_id
    INNER JOIN cloze_cards cc ON c.id = cc.card_id
    WHERE (cs.state = 'new' OR cs.next_review_date <= ?) AND c.suspended_at IS NULL`
  if (deckId) {
    query += ` AND dc.deck_id = ?`
    params.push(deckId)
  }
  // Same stable-order reasoning as getCardsDueForReview above — a re-fetched, silently-reordered
  // array desyncs from the session's numeric index into it.
  query += ` ORDER BY cs.next_review_date ASC, c.id ASC`
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
      (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at, source, native_language)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        card.id,
        card.lemmaId,
        card.deckId,
        card.type,
        card.primaryMeaningId ?? null,
        card.createdAt,
        card.updatedAt,
        card.suspendedAt ?? null,
        card.source ?? null,
        card.nativeLanguage,
      ],
    )
    await tx.execute(
      `INSERT INTO card_states
      (card_id, state, stability, difficulty, retrievability, lapses, last_reviewed_at, next_review_date, reps, learning_steps)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        initialState.cardId,
        initialState.state,
        initialState.stability,
        initialState.difficulty,
        initialState.retrievability,
        initialState.lapses,
        initialState.lastReviewAt ?? null,
        initialState.nextReviewAt,
        initialState.reps,
        initialState.learningSteps,
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

/** One row of a card list (home "Recently added", deck detail) — card + display fields. */
export interface CardListItem {
  cardId: string
  lemmaId: string
  form: string
  translation: string | null
  cefrLevel: CefrLevel | null
  createdAt: number
  /** True when this card has a cloze variant — either a standalone `type: 'cloze'` card, or a
   * `type: 'basic'` card the word-detail screen's manual cloze editor attached one to (see
   * setCloze in repositories/cloze.ts) — shown as a small badge. */
  hasCloze: boolean
}

interface RawCardListRow {
  cardId: string
  lemmaId: string
  form: string
  translation: string | null
  cefrLevel: CefrLevel | null
  createdAt: number
  cardType: string
  /** 0/1 from EXISTS() — SQLite has no real boolean column type. */
  hasOwnCloze: number
}

const CARD_LIST_SELECT = `SELECT c.id AS cardId, l.id AS lemmaId, l.form,
    COALESCE(m.translation, (SELECT translation FROM meanings WHERE card_id = c.id LIMIT 1)) AS translation,
    COALESCE(m.cefr_level, (SELECT cefr_level FROM meanings WHERE card_id = c.id LIMIT 1)) AS cefrLevel,
    c.type AS cardType,
    EXISTS(SELECT 1 FROM cloze_cards cz WHERE cz.card_id = c.id) AS hasOwnCloze`

/**
 * Folds a standalone `type: 'cloze'` card onto an existing `type: 'basic'` row for the same
 * lemma — e.g. from a two-pass CSV import (once as basic, once as cloze; see cardType in
 * apps/mobile/app/settings/csv-import.tsx) or "Add card manually" → Cloze — so it reads as one
 * word with a cloze badge rather than an accidental duplicate. Deliberately does **not** merge two
 * DIFFERENT `type: 'basic'` cards for the same lemma: those are always genuinely separate content
 * now (one card per sense, see createCardForSense in manual-card.ts; or a deliberate
 * `DuplicatePolicy: 'duplicate'` re-import), so they stay as separate rows.
 */
function collapseByLemma(rows: RawCardListRow[]): CardListItem[] {
  const items: CardListItem[] = []
  const basicIndexByLemma = new Map<string, number>()

  // Two passes rather than one interleaved one deliberately: the caller's query orders by
  // recency (newest first), and a cloze card is normally added *after* its basic sibling — so
  // the cloze row routinely comes first in that ordering. A single pass that only merges a cloze
  // row onto an *already-seen* basic row would silently fail to merge in exactly that common
  // case. Collecting every basic row first makes the merge independent of row order.
  for (const row of rows) {
    if (row.cardType === 'cloze') continue
    items.push({
      cardId: row.cardId,
      lemmaId: row.lemmaId,
      form: row.form,
      translation: row.translation,
      cefrLevel: row.cefrLevel,
      createdAt: row.createdAt,
      hasCloze: row.hasOwnCloze === 1,
    })
    if (!basicIndexByLemma.has(row.lemmaId)) {
      basicIndexByLemma.set(row.lemmaId, items.length - 1)
    }
  }

  for (const row of rows) {
    if (row.cardType !== 'cloze') continue
    const basicIndex = basicIndexByLemma.get(row.lemmaId)
    if (basicIndex !== undefined) {
      items[basicIndex]!.hasCloze = true
      continue
    }
    items.push({
      cardId: row.cardId,
      lemmaId: row.lemmaId,
      form: row.form,
      translation: row.translation,
      cefrLevel: row.cefrLevel,
      createdAt: row.createdAt,
      hasCloze: true,
    })
  }

  return items.sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * The most recently created cards with their lemma form and primary meaning.
 * Home screen "Recently added" list.
 */
export async function getRecentlyAddedWords(
  db: DatabaseAdapter,
  limit = 10,
): Promise<CardListItem[]> {
  const rows = await db.query<RawCardListRow>(
    `${CARD_LIST_SELECT}, c.created_at AS createdAt
     FROM cards c
     JOIN lemmas l ON l.id = c.lemma_id
     LEFT JOIN meanings m ON m.id = c.primary_meaning_id
     ORDER BY c.created_at DESC`,
  )
  return collapseByLemma(rows).slice(0, limit)
}

/**
 * The cards of one deck, newest membership first. Deck detail card list.
 */
export async function getCardsForDeck(
  db: DatabaseAdapter,
  deckId: string,
  limit = 100,
): Promise<CardListItem[]> {
  const rows = await db.query<RawCardListRow>(
    `${CARD_LIST_SELECT}, dc.added_at AS createdAt
     FROM deck_cards dc
     JOIN cards c ON c.id = dc.card_id
     JOIN lemmas l ON l.id = c.lemma_id
     LEFT JOIN meanings m ON m.id = c.primary_meaning_id
     WHERE dc.deck_id = ?
     ORDER BY dc.added_at DESC`,
    [deckId],
  )
  return collapseByLemma(rows).slice(0, limit)
}

/**
 * Total number of cards actually in a deck — Home/Stats screen stat strip. Deliberately not
 * `COUNT(*) FROM cards`: a card can exist with no deck_cards row at all (e.g. Search's
 * "Generate with AI" and Word of the Day both create the card with `addToDeck: false`, see
 * persistWordGeneration/persistTranslationAsCard, so the learner can explore/regenerate it before
 * ever choosing to add it to a deck) — counting those inflated this stat well above what summing
 * every deck's own card count would show, which is confusing on a screen whose whole point is "how
 * many cards do I actually have." Counts distinct cards, not deck_cards rows, so a card added to
 * more than one deck is still only counted once.
 */
export async function getTotalCardCount(db: DatabaseAdapter): Promise<number> {
  const result = await db.querySingle<{ count: number }>(
    `SELECT COUNT(DISTINCT card_id) AS count FROM deck_cards`,
  )
  return result?.count ?? 0
}

/** One week's new-word count for the stats screen's vocabulary growth chart. */
export interface WeeklyGrowth {
  /** Unix ms — the start of this week's bucket. */
  weekStart: number
  count: number
}

/**
 * New words per week for the last `weeks` weeks, oldest first (most recent
 * last — the chart reads left to right). Counts distinct **lemmas**, not
 * cards: a single import row can now create both a basic and a cloze card
 * for the same word at once (see import-shared.ts#importRow) — counting
 * cards would show a word as "2 new words" the day it's added.
 */
export async function getVocabularyGrowth(db: DatabaseAdapter, weeks = 7): Promise<WeeklyGrowth[]> {
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const since = Date.now() - weeks * weekMs

  const rows = await db.query<{ createdAt: number }>(`SELECT created_at AS createdAt FROM lemmas WHERE created_at >= ?`, [
    since,
  ])

  const buckets: WeeklyGrowth[] = []
  for (let i = 0; i < weeks; i++) {
    const weekStart = since + i * weekMs
    const weekEnd = weekStart + weekMs
    const count = rows.filter((r) => r.createdAt >= weekStart && r.createdAt < weekEnd).length
    buckets.push({ weekStart, count })
  }
  return buckets
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
  // Same orphaned-membership guard, and same c.type = 'basic' filter, as getCardsDueForReview —
  // see its comment.
  let query = `SELECT COUNT(DISTINCT c.id) as count FROM cards c
     INNER JOIN deck_cards dc ON c.id = dc.card_id
     INNER JOIN decks d ON d.id = dc.deck_id
     INNER JOIN card_states cs ON c.id = cs.card_id
     WHERE c.type = 'basic' AND (cs.state = 'new' OR cs.next_review_date <= ?) AND c.suspended_at IS NULL`
  if (deckId) {
    query += ` AND dc.deck_id = ?`
    params.push(deckId)
  }
  const result = await db.querySingle<{ count: number }>(query, params)
  return result?.count ?? 0
}

/**
 * Count of cards due for cloze practice right now — the cloze_states equivalent of
 * getDueCardsCount, for the deck detail screen's "Practice N cloze" label.
 * @param db The database adapter to use for the query.
 * @param deckId The ID of the deck to count due cloze cards for.
 * @returns The number of cards due for cloze practice.
 */
export async function getDueClozeCount(db: DatabaseAdapter, deckId?: string): Promise<number> {
  const params: unknown[] = [Date.now()]
  // Same orphaned-membership guard as getCardsDueForReview — see its comment.
  let query = `SELECT COUNT(DISTINCT c.id) as count FROM cards c
     INNER JOIN deck_cards dc ON c.id = dc.card_id
     INNER JOIN decks d ON d.id = dc.deck_id
     INNER JOIN cloze_states cs ON c.id = cs.card_id
     INNER JOIN cloze_cards cc ON c.id = cc.card_id
     WHERE (cs.state = 'new' OR cs.next_review_date <= ?) AND c.suspended_at IS NULL`
  if (deckId) {
    query += ` AND dc.deck_id = ?`
    params.push(deckId)
  }
  const result = await db.querySingle<{ count: number }>(query, params)
  return result?.count ?? 0
}

/**
 * Total count of cards in a deck that have a cloze variant at all, regardless of due state — unlike
 * `getDueClozeCount`, which only counts what's due *right now*. Used to decide whether the "Practice
 * cloze" action should be offered at all (a deck with zero cloze cards has nothing to practice,
 * today or ever, until one is imported/generated) rather than just how urgent it is.
 * @param db The database adapter to use for the query.
 * @param deckId The ID of the deck to count cloze cards for.
 * @returns The number of cards in the deck that have a cloze variant.
 */
export async function getClozeCardCountForDeck(db: DatabaseAdapter, deckId: string): Promise<number> {
  const result = await db.querySingle<{ count: number }>(
    `SELECT COUNT(DISTINCT c.id) as count FROM cards c
     INNER JOIN deck_cards dc ON c.id = dc.card_id
     INNER JOIN cloze_cards cc ON c.id = cc.card_id
     WHERE dc.deck_id = ?`,
    [deckId],
  )
  return result?.count ?? 0
}

/** One row of wrong-answer material for a true/false or multiple-choice review question. */
export interface DistractorMeaning {
  cardId: string
  word: string
  meaning: string
}

/**
 * Random other cards' primary meanings, for building true/false and multiple-choice wrong
 * answers in mixed review sessions (see apps/mobile/app/review/[deckId].tsx `mode=mixed`).
 * Fetched once per session and sampled client-side, not once per question. `excludeCardId` keeps
 * the card currently being tested out of its own distractor pool; callers must additionally
 * exclude it when checking eligibility, since a card can still appear here as a distractor for a
 * *different* card in the same session.
 * @param db The database adapter to use for the query.
 * @param excludeCardId The card currently being tested — excluded from the pool.
 * @param deckId Optional deck ID to scope the pool to (undefined = all decks).
 * @param limit Maximum number of distractor rows to return.
 */
export async function getDistractorMeanings(
  db: DatabaseAdapter,
  excludeCardId: string,
  deckId: string | undefined,
  limit: number,
): Promise<DistractorMeaning[]> {
  const params: unknown[] = []
  let query = `SELECT DISTINCT c.id AS cardId, l.form AS word, m.translation AS meaning
    FROM cards c
    JOIN meanings m ON m.id = c.primary_meaning_id
    JOIN lemmas l ON l.id = c.lemma_id`
  if (deckId) {
    query += ` INNER JOIN deck_cards dc ON dc.card_id = c.id AND dc.deck_id = ?`
    params.push(deckId)
  }
  query += ` WHERE c.id != ? ORDER BY RANDOM() LIMIT ?`
  params.push(excludeCardId, limit)
  return db.query<DistractorMeaning>(query, params)
}
