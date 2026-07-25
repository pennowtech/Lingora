import type { CardState, ReviewEvent } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/** The columns of a review event row, aliased to the camelCase names of the ReviewEvent type. */
const REVIEW_EVENT_COLUMNS = `id, card_id AS cardId, rating, review_date AS reviewedAt, duration_ms AS durationMs`

/**
 * Record a review event and update the card's FSRS state.
 *
 * These two writes are always in a transaction because
 * they must always happen together. A review event with
 * no state update would leave the card stuck in the
 * wrong state forever.
 *
 * reviewEvents:  is immutable history — never touched again
 * card_states:  overwritten with new FSRS parameters or  scheduling parameters.
 *
 * @param db The database adapter to use for the query.
 * @param event The review event to record.
 * @param newState The new FSRS state for the card.
 * @returns A promise that resolves when the operation is complete.
 */
export async function recordReview(
  db: DatabaseAdapter,
  event: ReviewEvent,
  newState: CardState,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(
      `INSERT INTO review_events (id, card_id, rating, review_date, duration_ms)
       VALUES (?, ?, ?, ?, ?)`,
      [event.id, event.cardId, event.rating, event.reviewedAt, event.durationMs],
    )

    await tx.execute(
      `UPDATE card_states SET
         stability        = ?,
         difficulty       = ?,
         retrievability   = ?,
         next_review_date = ?,
         lapses           = ?,
         state            = ?,
         last_reviewed_at = ?
       WHERE card_id = ?`,
      [
        newState.stability,
        newState.difficulty,
        newState.retrievability,
        newState.nextReviewAt,
        newState.lapses,
        newState.state,
        newState.lastReviewAt ?? null,
        newState.cardId,
      ],
    )
  })
}

/**
 * Get the current FSRS scheduling state of a card.
 * The FSRS algorithm reads this, applies the user's rating, and the
 * result is written back via recordReview.
 * @param db The database adapter to use for the query.
 * @param cardId The ID of the card to get the state for.
 * @returns The card state if found, otherwise null.
 */
export async function getCardState(db: DatabaseAdapter, cardId: string): Promise<CardState | null> {
  return (
    (await db.querySingle<CardState>(
      `SELECT
         card_id AS cardId,
         state,
         stability,
         difficulty,
         retrievability,
         lapses,
         last_reviewed_at AS lastReviewAt,
         next_review_date AS nextReviewAt
       FROM card_states
       WHERE card_id = ?`,
      [cardId],
    )) ?? null
  )
}

/**
 * Get the full review history for a card.
 * Ordered newest first. Used on the card detail screen and debugging.
 * @param db The database adapter to use for the query.
 * @param cardId The ID of the card to get review history for.
 * @returns An array of review events.
 */
export async function getCardReviewHistory(
  db: DatabaseAdapter,
  cardId: string,
): Promise<ReviewEvent[]> {
  return db.query<ReviewEvent>(
    `SELECT ${REVIEW_EVENT_COLUMNS} FROM review_events
     WHERE card_id = ?
     ORDER BY review_date DESC`,
    [cardId],
  )
}

/**
 * Count reviews completed today.
 * Used on the home screen stats strip.
 * @param db The database adapter to use for the query.
 * @returns The number of reviews completed today.
 */
export async function getTodayReviewCount(db: DatabaseAdapter): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const result = await db.querySingle<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM review_events
     WHERE review_date >= ?`,
    [startOfDay.getTime()],
  )
  return result?.count ?? 0
}

/**
 * Distinct UTC day indexes (unix ms / 86400000) that have at least one
 * review, newest first. The home screen computes the streak from this:
 * consecutive day indexes counting back from today.
 */
export async function getReviewedDayIndexes(db: DatabaseAdapter, limit = 366): Promise<number[]> {
  const rows = await db.query<{ day: number }>(
    `SELECT DISTINCT CAST(review_date / 86400000 AS INTEGER) AS day
     FROM review_events
     ORDER BY day DESC
     LIMIT ?`,
    [limit],
  )
  return rows.map((row) => row.day)
}

/**
 * Get the retention rate over the last N days.
 * Retention = (hard + good + easy) / total reviews.
 *
 * Returns a value between 0 and 1.
 * 0.85 means 85% of reviews were remembered.
 * @param db The database adapter to use for the query.
 * @param days The number of days to look back for reviews.
 * @returns The retention rate as a decimal between 0 and 1.
 */
export async function getRetentionRate(db: DatabaseAdapter, days = 30): Promise<number> {
  const since = Date.now() - days * 24 * 60 * 60 * 1000

  const result = await db.querySingle<{
    total: number
    remembered: number
  }>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN rating != 'again' THEN 1 ELSE 0 END) as remembered
     FROM review_events
     WHERE review_date >= ?`,
    [since],
  )

  if (!result || result.total === 0) return 0
  return result.remembered / result.total
}
