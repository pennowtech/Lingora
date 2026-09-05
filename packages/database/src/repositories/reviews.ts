import type { CardState, LanguageCode, ReviewEvent } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/** The columns of a review event row, aliased to the camelCase names of the ReviewEvent type. */
const REVIEW_EVENT_COLUMNS = `id, card_id AS cardId, rating, review_date AS reviewedAt, duration_ms AS durationMs, question_type AS questionType`

/**
 * Record a review event and update the card's FSRS state.
 *
 * These two writes are always in a transaction because
 * they must always happen together. A review event with
 * no state update would leave the card stuck in the
 * wrong state forever.
 *
 * reviewEvents:  is immutable history — never touched again
 * card_states:   overwritten with new FSRS parameters or scheduling parameters.
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
      `INSERT INTO review_events (id, card_id, rating, review_date, duration_ms, question_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [event.id, event.cardId, event.rating, event.reviewedAt, event.durationMs, event.questionType ?? null],
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
 * @param db The database adapter to use for the query.
 * @param cardId The ID of the card to get the cloze state for.
 * @returns The cloze state if found, otherwise null.
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
 * @param db The database adapter to use for the query.
 * @param event The review event to record.
 * @param newState The new FSRS state for the cloze card.
 * @returns A promise that resolves when the operation is complete.
 */
export async function recordClozeReview(
  db: DatabaseAdapter,
  event: ReviewEvent,
  newState: CardState,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(
      `INSERT INTO review_events (id, card_id, rating, review_date, duration_ms, question_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [event.id, event.cardId, event.rating, event.reviewedAt, event.durationMs, event.questionType ?? 'cloze'],
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
 * Get all review events for a card, ordered by date ascending.
 */
export async function getReviewHistoryForCard(
  db: DatabaseAdapter,
  cardId: string,
): Promise<ReviewEvent[]> {
  return db.query<ReviewEvent>(
    `SELECT ${REVIEW_EVENT_COLUMNS}
     FROM review_events
     WHERE card_id = ?
     ORDER BY review_date ASC`,
    [cardId],
  )
}

/**
 * Count total reviews recorded for a card.
 */
export async function getReviewCountForCard(db: DatabaseAdapter, cardId: string): Promise<number> {
  const result = await db.querySingle<{ count: number }>(
    `SELECT COUNT(*) as count FROM review_events WHERE card_id = ?`,
    [cardId],
  )
  return result?.count ?? 0
}

/**
 * Count reviews completed today, optionally scoped to language pair.
 */
export async function getTodayReviewCount(
  db: DatabaseAdapter,
  targetLanguage?: LanguageCode,
  nativeLanguage?: LanguageCode,
): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const params: unknown[] = [startOfDay.getTime()]

  let query = `SELECT COUNT(*) as count
     FROM review_events re
     JOIN cards c ON c.id = re.card_id
     JOIN lemmas l ON l.id = c.lemma_id
     WHERE re.review_date >= ?`

  if (targetLanguage) {
    query += ` AND l.language = ?`
    params.push(targetLanguage)
  }
  if (nativeLanguage) {
    query += ` AND c.native_language = ?`
    params.push(nativeLanguage)
  }

  const result = await db.querySingle<{ count: number }>(query, params)
  return result?.count ?? 0
}

/**
 * Distinct UTC day indexes (unix ms / 86400000) that have at least one review, newest first.
 * Used to calculate the study streak heatmap.
 *
 * Uses an INNER JOIN from review_events → cards → lemmas so that language-pair filtering is
 * possible. As a consequence, review events for a card that has since been deleted will not
 * appear in the heatmap — this is deliberate: deleted cards should no longer contribute to the
 * learner's activity record.
 * @param db The database adapter to use for the query.
 * @param limit Max number of distinct day indexes to return (defaults to one year's worth).
 * @param targetLanguage Optional target language to scope the streak to.
 * @param nativeLanguage Optional native language to scope the streak to.
 */
export async function getReviewedDayIndexes(
  db: DatabaseAdapter,
  limit = 366,
  targetLanguage?: LanguageCode,
  nativeLanguage?: LanguageCode,
): Promise<number[]> {
  const params: unknown[] = []
  const conditions: string[] = []

  let query = `SELECT DISTINCT CAST(re.review_date / 86400000 AS INTEGER) AS day
     FROM review_events re
     JOIN cards c ON c.id = re.card_id
     JOIN lemmas l ON l.id = c.lemma_id`

  if (targetLanguage) {
    conditions.push(`l.language = ?`)
    params.push(targetLanguage)
  }
  if (nativeLanguage) {
    conditions.push(`c.native_language = ?`)
    params.push(nativeLanguage)
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`
  }

  query += ` ORDER BY day DESC LIMIT ?`
  params.push(limit)

  const rows = await db.query<{ day: number }>(query, params)
  return rows.map((row) => row.day)
}

/** Review counts per UTC day index. */
export interface DayReviewCount {
  day: number
  count: number
}

/**
 * Review counts per UTC day index for the last `days` days.
 */
export async function getReviewCountsByDay(
  db: DatabaseAdapter,
  days = 35,
  targetLanguage?: LanguageCode,
  nativeLanguage?: LanguageCode,
): Promise<DayReviewCount[]> {
  const today = Math.floor(Date.now() / 86_400_000)
  const since = (today - days + 1) * 86_400_000
  const params: unknown[] = [since]

  let query = `SELECT CAST(re.review_date / 86400000 AS INTEGER) AS day, COUNT(*) AS count
     FROM review_events re
     JOIN cards c ON c.id = re.card_id
     JOIN lemmas l ON l.id = c.lemma_id
     WHERE re.review_date >= ?`

  if (targetLanguage) {
    query += ` AND l.language = ?`
    params.push(targetLanguage)
  }
  if (nativeLanguage) {
    query += ` AND c.native_language = ?`
    params.push(nativeLanguage)
  }

  query += ` GROUP BY day`

  const rows = await db.query<DayReviewCount>(query, params)
  const countByDay = new Map(rows.map((r) => [r.day, r.count]))

  const result: DayReviewCount[] = []
  for (let day = today - days + 1; day <= today; day++) {
    result.push({ day, count: countByDay.get(day) ?? 0 })
  }
  return result
}

/**
 * Retention rate over the last N days, plus how many actual reviews it's built from - the count
 * matters because the rate on its own reads like "how many of my cards are retained," when it's
 * really "of the reviews I've actually done in this window, what fraction weren't rated Again."
 * Those can look wildly different for a deck that was just imported: hundreds of due/total cards,
 * but a rate based on a handful of real reviews from a different deck entirely (confirmed against
 * a real device: 439 due / 515 total cards next to a 71% rate that turned out to reflect only 28
 * actual reviews in the last 30 days). Surfacing reviewCount alongside the rate is what lets the
 * UI say "based on 28 reviews" instead of leaving the percentage to be misread as a backlog stat.
 */
export async function getRetentionSummary(
  db: DatabaseAdapter,
  days = 30,
  targetLanguage?: LanguageCode,
  nativeLanguage?: LanguageCode,
): Promise<{ rate: number; reviewCount: number }> {
  const since = Date.now() - days * 24 * 60 * 60 * 1000
  const params: unknown[] = [since]

  let query = `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN re.rating != 'again' THEN 1 ELSE 0 END) as remembered
     FROM review_events re
     JOIN cards c ON c.id = re.card_id
     JOIN lemmas l ON l.id = c.lemma_id
     WHERE re.review_date >= ?`

  if (targetLanguage) {
    query += ` AND l.language = ?`
    params.push(targetLanguage)
  }
  if (nativeLanguage) {
    query += ` AND c.native_language = ?`
    params.push(nativeLanguage)
  }

  const result = await db.querySingle<{
    total: number
    remembered: number
  }>(query, params)

  if (!result || result.total === 0) return { rate: 0, reviewCount: 0 }
  return { rate: result.remembered / result.total, reviewCount: result.total }
}

/**
 * Get the retention rate over the last N days, optionally scoped to language pair.
 */
export async function getRetentionRate(
  db: DatabaseAdapter,
  days = 30,
  targetLanguage?: LanguageCode,
  nativeLanguage?: LanguageCode,
): Promise<number> {
  return (await getRetentionSummary(db, days, targetLanguage, nativeLanguage)).rate
}

/** One entry of the stats screen's "difficult words" list. */
export interface DifficultWord {
  form: string
  lapses: number
}

/**
 * Words with the most FSRS lapses, optionally scoped to language pair.
 */
export async function getDifficultWords(
  db: DatabaseAdapter,
  limit = 10,
  targetLanguage?: LanguageCode,
  nativeLanguage?: LanguageCode,
): Promise<DifficultWord[]> {
  const params: unknown[] = []
  const conditions: string[] = []

  let query = `SELECT l.form AS form, SUM(cs.lapses) AS lapses
     FROM card_states cs
     JOIN cards c ON c.id = cs.card_id
     JOIN lemmas l ON l.id = c.lemma_id`

  if (targetLanguage) {
    conditions.push(`l.language = ?`)
    params.push(targetLanguage)
  }
  if (nativeLanguage) {
    conditions.push(`c.native_language = ?`)
    params.push(nativeLanguage)
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`
  }

  query += ` GROUP BY l.id HAVING SUM(cs.lapses) > 0 ORDER BY lapses DESC LIMIT ?`
  params.push(limit)

  return db.query<DifficultWord>(query, params)
}

/** One day of the FSRS review forecast. */
export interface ReviewForecastDay {
  dayLabel: string
  dateMs: number
  dueCount: number
}

/**
 * Builds the parameterised SQL to fetch scheduled-card rows from one state table, filtered by
 * the active language pair. Shared by both the basic and cloze branches of getReviewForecast
 * to avoid duplicating the same language-filter logic twice.
 *
 * @param stateTable  Either 'card_states' (basic) or 'cloze_states' (cloze).
 * @param stateAlias  Column alias used in the SELECT (e.g. 'cs' or 'cls').
 * @param cardType    'basic' or 'cloze' — used in the WHERE clause.
 * @param targetLanguage  Optional target language filter.
 * @param nativeLanguage  Optional native language filter.
 */
function buildForecastCardQuery(
  stateTable: string,
  stateAlias: string,
  cardType: string,
  targetLanguage?: LanguageCode,
  nativeLanguage?: LanguageCode,
): { query: string; params: unknown[] } {
  const params: unknown[] = []
  let query = `SELECT ${stateAlias}.state, ${stateAlias}.next_review_date AS nextReviewDate
     FROM ${stateTable} ${stateAlias}
     JOIN cards c ON c.id = ${stateAlias}.card_id
     JOIN deck_cards dc ON dc.card_id = c.id
     JOIN lemmas l ON l.id = c.lemma_id
     WHERE c.suspended_at IS NULL AND c.type = '${cardType}'`
  if (targetLanguage) {
    query += ` AND l.language = ?`
    params.push(targetLanguage)
  }
  if (nativeLanguage) {
    query += ` AND c.native_language = ?`
    params.push(nativeLanguage)
  }
  return { query, params }
}

/**
 * Calculates projected review workload for the upcoming N days (default 7 days).
 * Combines basic cards and cloze cards from card_states and cloze_states.
 * Optionally scoped to the active language pair.
 * @param db The database adapter to use for the query.
 * @param days The number of days to forecast.
 * @param targetLanguage Optional target language to scope the forecast to.
 * @param nativeLanguage Optional native language to scope the forecast to.
 */
export async function getReviewForecast(
  db: DatabaseAdapter,
  days = 7,
  targetLanguage?: LanguageCode,
  nativeLanguage?: LanguageCode,
): Promise<ReviewForecastDay[]> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dayMs = 24 * 60 * 60 * 1000

  const basicQ = buildForecastCardQuery('card_states', 'cs', 'basic', targetLanguage, nativeLanguage)
  const clozeQ = buildForecastCardQuery('cloze_states', 'cls', 'cloze', targetLanguage, nativeLanguage)

  const [basicRows, clozeRows] = await Promise.all([
    db.query<{ state: string; nextReviewDate: number }>(basicQ.query, basicQ.params),
    db.query<{ state: string; nextReviewDate: number }>(clozeQ.query, clozeQ.params),
  ])

  const allCards = [...basicRows, ...clozeRows]
  const forecast: ReviewForecastDay[] = []
  const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' })

  for (let i = 0; i < days; i++) {
    const startOfForecastDay = todayStart + i * dayMs
    const endOfForecastDay = startOfForecastDay + dayMs - 1
    const forecastDate = new Date(startOfForecastDay)

    let count = 0
    for (const card of allCards) {
      if (i === 0) {
        if (card.state === 'new' || card.nextReviewDate <= endOfForecastDay) {
          count++
        }
      } else {
        if (card.state !== 'new' && card.nextReviewDate >= startOfForecastDay && card.nextReviewDate <= endOfForecastDay) {
          count++
        }
      }
    }

    const label = i === 0 ? 'Today' : dayFormatter.format(forecastDate)
    forecast.push({
      dayLabel: label,
      dateMs: startOfForecastDay,
      dueCount: count,
    })
  }

  return forecast
}
