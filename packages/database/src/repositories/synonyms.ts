import type { Synonym } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/**
 * Synonyms, always scoped to a meaning cluster — 'rennen' is a synonym for
 * the 'to run' cluster of 'laufen', never for its 'to function' cluster.
 */

// synonym → word and formality_level → formality: the column names predate
// the shared Synonym type; the aliases bridge them.
const SYNONYM_COLUMNS = `id, card_id AS cardId, meaning_cluster_id AS clusterId, synonym AS word, nuance, cefr_level AS cefrLevel, formality_level AS formality`

/**
 * Get all synonyms of a card, optionally narrowed to one meaning cluster.
 */
export async function getSynonymsForCard(
  db: DatabaseAdapter,
  cardId: string,
  clusterId?: string,
): Promise<Synonym[]> {
  const params: unknown[] = [cardId]
  let query = `SELECT ${SYNONYM_COLUMNS} FROM synonyms WHERE card_id = ?`
  if (clusterId) {
    query += ` AND meaning_cluster_id = ?`
    params.push(clusterId)
  }
  return db.query<Synonym>(query, params)
}

/**
 * Create a synonym.
 */
export async function createSynonym(db: DatabaseAdapter, synonym: Synonym): Promise<void> {
  await db.execute(
    `INSERT INTO synonyms (id, card_id, meaning_cluster_id, synonym, nuance, cefr_level, formality_level)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      synonym.id,
      synonym.cardId,
      synonym.clusterId,
      synonym.word,
      synonym.nuance ?? null,
      synonym.cefrLevel,
      synonym.formality,
    ],
  )
}

/**
 * Delete a synonym. Used by the evaluation flow when the user
 * rejects a generated synonym.
 */
export async function deleteSynonym(db: DatabaseAdapter, synonymId: string): Promise<void> {
  await db.execute(`DELETE FROM synonyms WHERE id = ?`, [synonymId])
}

/**
 * Update a synonym's nuance and formality level on-demand.
 */
export async function updateSynonymNuance(
  db: DatabaseAdapter,
  synonymId: string,
  nuance: string,
  formality?: Synonym['formality'],
): Promise<void> {
  await db.execute(
    `UPDATE synonyms SET nuance = ?, formality_level = COALESCE(?, formality_level) WHERE id = ?`,
    [nuance, formality ?? null, synonymId],
  )
}
