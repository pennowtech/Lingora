import type { Meaning, MeaningCluster } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/**
 * Meaning clusters and meanings.
 *
 * A cluster is a semantic context ('social', 'financial', 'electrical').
 * Meanings, examples and synonyms are always scoped to one cluster so
 * contexts never bleed into each other.
 */

const CLUSTER_COLUMNS = `id, lemma_id AS lemmaId, label, description, cefr_level AS cefrLevel, order_index AS orderIndex`

/** Raw meaning row as it comes back from SQLite (booleans are 0/1). */
interface MeaningRow extends Omit<Meaning, 'isPrimary'> {
  isPrimary: number
}

const MEANING_COLUMNS = `id, card_id AS cardId, meaning_cluster_id AS clusterId, translation, explanation, usage, is_primary AS isPrimary, cefr_level AS cefrLevel, order_index AS orderIndex`

/** SQLite stores booleans as 0/1 — convert so callers get a real boolean. */
function toMeaning(row: MeaningRow): Meaning {
  return { ...row, isPrimary: row.isPrimary !== 0 }
}

/**
 * Get all meaning clusters of a lemma, in display order.
 * One cluster per semantic context — these become the context tabs in the UI.
 */
export async function getClustersForLemma(
  db: DatabaseAdapter,
  lemmaId: string,
): Promise<MeaningCluster[]> {
  return db.query<MeaningCluster>(
    `SELECT ${CLUSTER_COLUMNS} FROM meaning_clusters WHERE lemma_id = ? ORDER BY order_index ASC`,
    [lemmaId],
  )
}

/**
 * Create a meaning cluster for a lemma.
 * Called after AI generation splits a word into semantic contexts.
 */
export async function createCluster(db: DatabaseAdapter, cluster: MeaningCluster): Promise<void> {
  await db.execute(
    `INSERT INTO meaning_clusters (id, lemma_id, label, description, cefr_level, order_index)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      cluster.id,
      cluster.lemmaId,
      cluster.label,
      cluster.description,
      cluster.cefrLevel ?? null,
      cluster.orderIndex,
    ],
  )
}

/**
 * Delete a meaning cluster. Cascades to its meanings, examples, and synonyms.
 */
export async function deleteCluster(db: DatabaseAdapter, clusterId: string): Promise<void> {
  await db.execute(`DELETE FROM meaning_clusters WHERE id = ?`, [clusterId])
}

/**
 * Get all meanings of a card, primary meaning first, then by display order.
 */
export async function getMeaningsForCard(db: DatabaseAdapter, cardId: string): Promise<Meaning[]> {
  const rows = await db.query<MeaningRow>(
    `SELECT ${MEANING_COLUMNS} FROM meanings
     WHERE card_id = ?
     ORDER BY is_primary DESC, order_index ASC`,
    [cardId],
  )
  return rows.map(toMeaning)
}

/**
 * Get the meanings of one cluster of a card — what a single context tab shows.
 */
export async function getMeaningsForCluster(
  db: DatabaseAdapter,
  cardId: string,
  clusterId: string,
): Promise<Meaning[]> {
  const rows = await db.query<MeaningRow>(
    `SELECT ${MEANING_COLUMNS} FROM meanings
     WHERE card_id = ? AND meaning_cluster_id = ?
     ORDER BY is_primary DESC, order_index ASC`,
    [cardId, clusterId],
  )
  return rows.map(toMeaning)
}

/**
 * Create a meaning inside a cluster.
 */
export async function createMeaning(db: DatabaseAdapter, meaning: Meaning): Promise<void> {
  await db.execute(
    `INSERT INTO meanings (id, card_id, meaning_cluster_id, translation, explanation, usage, is_primary, cefr_level, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      meaning.id,
      meaning.cardId,
      meaning.clusterId,
      meaning.translation,
      meaning.explanation,
      meaning.usage ?? null,
      meaning.isPrimary ? 1 : 0,
      meaning.cefrLevel ?? null,
      meaning.orderIndex,
    ],
  )
}

/**
 * Make one meaning the primary meaning of its card.
 *
 * Runs in a transaction: the old primary is cleared and the new one set
 * atomically, so a card never ends up with two primary meanings.
 */
export async function updatePrimaryMeaning(
  db: DatabaseAdapter,
  cardId: string,
  meaningId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(`UPDATE meanings SET is_primary = 0 WHERE card_id = ?`, [cardId])
    await tx.execute(`UPDATE meanings SET is_primary = 1 WHERE id = ? AND card_id = ?`, [
      meaningId,
      cardId,
    ])
    await tx.execute(`UPDATE cards SET primary_meaning_id = ?, updated_at = ? WHERE id = ?`, [
      meaningId,
      Date.now(),
      cardId,
    ])
  })
}

/**
 * Overwrite a meaning's own translation/explanation text — the manual "edit
 * the card" path (distinct from `updatePrimaryMeaning`, which only changes
 * which existing meaning is primary).
 */
export async function updateMeaningText(
  db: DatabaseAdapter,
  meaningId: string,
  translation: string,
  explanation: string,
  usage?: string,
): Promise<void> {
  await db.execute(`UPDATE meanings SET translation = ?, explanation = ?, usage = ? WHERE id = ?`, [
    translation,
    explanation,
    usage ?? null,
    meaningId,
  ])
}

/**
 * Delete a meaning.
 */
export async function deleteMeaning(db: DatabaseAdapter, meaningId: string): Promise<void> {
  await db.execute(`DELETE FROM meanings WHERE id = ?`, [meaningId])
}
