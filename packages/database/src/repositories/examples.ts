import type { Example } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/**
 * Example sentences, always scoped to a meaning cluster — an example for the
 * 'social' cluster of 'ausgehen' is never shown under the 'run out' cluster.
 */

/** Raw example row as it comes back from SQLite (booleans are 0/1). */
interface ExampleRow extends Omit<Example, 'isSelected'> {
  isSelected: number
}

// context_tags carries the Example.context category; grammar_tags stays a
// DB-only JSON column until the grammar filter UI lands in Phase 4.
const EXAMPLE_COLUMNS = `id, card_id AS cardId, meaning_cluster_id AS clusterId, sentence, translation, context_tags AS context, cefr_level AS cefrLevel, is_selected AS isSelected, generation_meta_data_id AS generationMetadataId`

/** SQLite stores booleans as 0/1 — convert so callers get a real boolean. */
function toExample(row: ExampleRow): Example {
  return { ...row, isSelected: row.isSelected !== 0 }
}

/**
 * Get all examples of a card, optionally narrowed to one meaning cluster.
 * The selected example (the one shown on the flashcard) sorts first.
 */
export async function getExamplesForCard(
  db: DatabaseAdapter,
  cardId: string,
  clusterId?: string,
): Promise<Example[]> {
  const params: unknown[] = [cardId]
  let query = `SELECT ${EXAMPLE_COLUMNS} FROM examples WHERE card_id = ?`
  if (clusterId) {
    query += ` AND meaning_cluster_id = ?`
    params.push(clusterId)
  }
  query += ` ORDER BY is_selected DESC`
  const rows = await db.query<ExampleRow>(query, params)
  return rows.map(toExample)
}

/**
 * Create an example sentence.
 */
export async function createExample(db: DatabaseAdapter, example: Example): Promise<void> {
  await db.execute(
    `INSERT INTO examples (id, card_id, meaning_cluster_id, sentence, translation, context_tags, cefr_level, is_selected, generation_meta_data_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      example.id,
      example.cardId,
      example.clusterId,
      example.sentence,
      example.translation,
      example.context,
      example.cefrLevel,
      example.isSelected ? 1 : 0,
      example.generationMetadataId ?? null,
    ],
  )
}

/**
 * Mark one example as the one shown on the flashcard.
 *
 * Runs in a transaction: deselects every other example of the card first,
 * so exactly one example is ever selected.
 */
export async function updateSelectedExample(
  db: DatabaseAdapter,
  cardId: string,
  exampleId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(`UPDATE examples SET is_selected = 0 WHERE card_id = ?`, [cardId])
    await tx.execute(`UPDATE examples SET is_selected = 1 WHERE id = ? AND card_id = ?`, [
      exampleId,
      cardId,
    ])
  })
}

/**
 * Delete an example. Used by the evaluation flow when the user
 * rejects a generated sentence.
 */
export async function deleteExample(db: DatabaseAdapter, exampleId: string): Promise<void> {
  await db.execute(`DELETE FROM examples WHERE id = ?`, [exampleId])
}
