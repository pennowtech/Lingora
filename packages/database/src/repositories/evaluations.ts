import type { Evaluation } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/**
 * Evaluations: user quality ratings (thumbs up/down) on generated content.
 * Joined with generation_metadata they show which prompts, providers and
 * models produce content users actually keep.
 */

const EVALUATION_COLUMNS = `id, target_type AS targetType, target_id AS targetId, rating, created_at AS createdAt`

/**
 * Record a rating on a generated item.
 */
export async function createEvaluation(db: DatabaseAdapter, evaluation: Evaluation): Promise<void> {
  await db.execute(
    `INSERT INTO evaluations (id, target_type, target_id, rating, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      evaluation.id,
      evaluation.targetType,
      evaluation.targetId,
      evaluation.rating,
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
  return db.query<Evaluation>(
    `SELECT ${EVALUATION_COLUMNS} FROM evaluations WHERE target_id = ? ORDER BY created_at DESC`,
    [targetId],
  )
}
