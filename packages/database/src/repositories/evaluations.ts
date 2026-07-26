import type { Evaluation, EvaluationRating, EvaluationReportReason, EvaluationTarget } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/**
 * Evaluations: user quality ratings (thumbs up/down) on generated content,
 * optionally attached to a report category and note. Joined with
 * generation_metadata they show which prompts, providers and models produce
 * content users actually keep.
 */

const EVALUATION_COLUMNS = `id, target_type AS targetType, target_id AS targetId, rating, reason, note, created_at AS createdAt`

/** Raw evaluation row: reason/note come back as SQL NULL, not undefined. */
interface EvaluationRow extends Omit<Evaluation, 'reason' | 'note'> {
  reason: EvaluationReportReason | null
  note: string | null
}

function toEvaluation(row: EvaluationRow): Evaluation {
  const { reason, note, ...rest } = row
  return {
    ...rest,
    ...(reason !== null && { reason }),
    ...(note !== null && { note }),
  }
}

/**
 * Record a rating on a generated item. Prefer setEvaluation from the UI —
 * this is the raw insert it builds on.
 */
export async function createEvaluation(db: DatabaseAdapter, evaluation: Evaluation): Promise<void> {
  await db.execute(
    `INSERT INTO evaluations (id, target_type, target_id, rating, reason, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      evaluation.id,
      evaluation.targetType,
      evaluation.targetId,
      evaluation.rating,
      evaluation.reason ?? null,
      evaluation.note ?? null,
      evaluation.createdAt,
    ],
  )
}

/**
 * Get every rating a specific item has received, newest first.
 */
export async function getEvaluationsForTarget(
  db: DatabaseAdapter,
  targetId: string,
): Promise<Evaluation[]> {
  const rows = await db.query<EvaluationRow>(
    `SELECT ${EVALUATION_COLUMNS} FROM evaluations WHERE target_id = ? ORDER BY created_at DESC`,
    [targetId],
  )
  return rows.map(toEvaluation)
}

/**
 * The current (most recent) rating for each of a set of targets, as a map —
 * one query for a whole screen's worth of examples/synonyms, so the UI can
 * show which thumb is currently active without an N+1 fetch.
 */
export async function getLatestEvaluationsForTargets(
  db: DatabaseAdapter,
  targetIds: string[],
): Promise<Map<string, Evaluation>> {
  const map = new Map<string, Evaluation>()
  if (targetIds.length === 0) return map

  const placeholders = targetIds.map(() => '?').join(', ')
  const rows = await db.query<EvaluationRow>(
    `SELECT ${EVALUATION_COLUMNS} FROM evaluations
     WHERE target_id IN (${placeholders})
     ORDER BY created_at DESC`,
    targetIds,
  )
  // Rows arrive newest first; the first time we see a target_id is its latest rating.
  for (const row of rows) {
    if (!map.has(row.targetId)) map.set(row.targetId, toEvaluation(row))
  }
  return map
}

/**
 * Set (or clear) a target's rating — the up/down and report buttons call
 * this rather than createEvaluation directly.
 *
 * Replaces any prior rating for the target (so one item never accumulates
 * unlimited duplicate rows from repeated taps) EXCEPT when the new rating
 * exactly repeats the current plain up/down rating with no report — that
 * case is treated as "undo" and clears the rating instead.
 */
export async function setEvaluation(
  db: DatabaseAdapter,
  args: {
    targetType: EvaluationTarget
    targetId: string
    rating: EvaluationRating
    reason?: EvaluationReportReason
    note?: string
  },
): Promise<{ applied: boolean }> {
  return db.transaction(async (tx) => {
    const existing = await tx.querySingle<{ id: string; rating: EvaluationRating }>(
      `SELECT id, rating FROM evaluations WHERE target_id = ? ORDER BY created_at DESC LIMIT 1`,
      [args.targetId],
    )

    const isUndo = existing?.rating === args.rating && args.reason === undefined && args.note === undefined
    await tx.execute(`DELETE FROM evaluations WHERE target_id = ?`, [args.targetId])
    if (isUndo) return { applied: false }

    await createEvaluation(tx, {
      id: crypto.randomUUID(),
      targetType: args.targetType,
      targetId: args.targetId,
      rating: args.rating,
      ...(args.reason !== undefined && { reason: args.reason }),
      ...(args.note !== undefined && { note: args.note }),
      createdAt: Date.now(),
    })
    return { applied: true }
  })
}
