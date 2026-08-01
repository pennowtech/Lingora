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
         last_reviewed_at = ?,
         reps             = ?,
         learning_steps   = ?
       WHERE card_id = ?`,
      [
        newState.stability,
        newState.difficulty,
        newState.retrievability,
        newState.nextReviewAt,
        newState.lapses,
        newState.state,
        newState.lastReviewAt ?? null,
        newState.reps,
        newState.learningSteps,
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
  const row = await db.querySingle<Omit<CardState, 'lastReviewAt'> & { lastReviewAt: number | null }>(
    `SELECT
       card_id AS cardId,
       state,
       stability,
       difficulty,
       retrievability,
       lapses,
       last_reviewed_at AS lastReviewAt,
       next_review_date AS nextReviewAt,
       reps,
       learning_steps AS learningSteps
     FROM card_states
     WHERE card_id = ?`,
    [cardId],
  )
  if (!row) return null
  const { lastReviewAt, ...rest } = row
  return { ...rest, ...(lastReviewAt !== null && { lastReviewAt }) }
}

/**
 * Cloze practice's own FSRS state — see recordClozeReview and migration 0013. Same shape and
 * same "state='new' is always due" rule as getCardState/card_states, just a different table so
 * cloze practice is scheduled entirely independently of the card's word-meaning review.
 */
export async function getClozeState(db: DatabaseAdapter, cardId: string): Promise<CardState | null> {
  const row = await db.querySingle<Omit<CardState, 'lastReviewAt'> & { lastReviewAt: number | null }>(
    `SELECT
       card_id AS cardId,
       state,
       stability,
       difficulty,
       retrievability,
       lapses,
       last_reviewed_at AS lastReviewAt,
       next_review_date AS nextReviewAt,
       reps,
       learning_steps AS learningSteps
     FROM cloze_states
     WHERE card_id = ?`,
    [cardId],
  )
  if (!row) return null
  const { lastReviewAt, ...rest } = row
  return { ...rest, ...(lastReviewAt !== null && { lastReviewAt }) }
}

/**
 * Cloze practice's own recordReview — writes to the same immutable review_events log (a cloze
 * review is still a real review for streak/today-count/retention purposes) but updates
 * cloze_states instead of card_states, so it never touches the card's word-meaning schedule.
 */
export async function recordClozeReview(
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
      `UPDATE cloze_states SET
         stability        = ?,
         difficulty       = ?,
         retrievability   = ?,
         next_review_date = ?,
         lapses           = ?,
         state            = ?,
         last_reviewed_at = ?,
         reps             = ?,
         learning_steps   = ?
       WHERE card_id = ?`,
      [
        newState.stability,
        newState.difficulty,
        newState.retrievability,
        newState.nextReviewAt,
        newState.lapses,
        newState.state,
        newState.lastReviewAt ?? null,
        newState.reps,
        newState.learningSteps,
        newState.cardId,
      ],
    )
  })
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
 * Review counts per UTC day index (unix ms / 86400000) for the last `days`
 * days, including days with zero reviews — the stats screen's heatmap
 * needs a real count per cell (intensity), not just which days had any
 * review at all (`getReviewedDayIndexes`, still used for the streak).
 */
export interface DayReviewCount {
  day: number
  count: number
}

export async function getReviewCountsByDay(db: DatabaseAdapter, days = 35): Promise<DayReviewCount[]> {
  const today = Math.floor(Date.now() / 86_400_000)
  const since = (today - days + 1) * 86_400_000

  const rows = await db.query<DayReviewCount>(
    `SELECT CAST(review_date / 86400000 AS INTEGER) AS day, COUNT(*) AS count
     FROM review_events
     WHERE review_date >= ?
     GROUP BY day`,
    [since],
  )
  const countByDay = new Map(rows.map((r) => [r.day, r.count]))

  const result: DayReviewCount[] = []
  for (let day = today - days + 1; day <= today; day++) {
    result.push({ day, count: countByDay.get(day) ?? 0 })
  }
  return result
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

/** One entry of the stats screen's "difficult words" list. */
export interface DifficultWord {
  form: string
  lapses: number
}

/**
 * Words with the most FSRS lapses ("again" ratings that dropped a card
 * back to relearning), most-lapsed first, `lapses = 0` excluded (nothing
 * difficult about a card that's never been forgotten). A lemma with
 * several cards (e.g. a basic + cloze pair, see import-shared.ts) sums
 * their lapses — the word itself is what's difficult, not one specific
 * card of it.
 */
export async function getDifficultWords(db: DatabaseAdapter, limit = 10): Promise<DifficultWord[]> {
  return db.query<DifficultWord>(
    `SELECT l.form AS form, SUM(cs.lapses) AS lapses
     FROM card_states cs
     JOIN cards c ON c.id = cs.card_id
     JOIN lemmas l ON l.id = c.lemma_id
     GROUP BY l.id
     HAVING SUM(cs.lapses) > 0
     ORDER BY lapses DESC
     LIMIT ?`,
    [limit],
  )
}
