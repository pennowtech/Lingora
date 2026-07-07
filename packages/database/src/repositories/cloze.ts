import type { Cloze } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/**
 * Cloze card variants: a sentence with the target word blanked out.
 * "Wir gehen heute Abend ___." → answer "aus".
 */

const CLOZE_COLUMNS = `id, card_id AS cardId, sentence, cloze AS answer, translation, difficulty, cefr_level AS cefrLevel`

/**
 * Get all cloze variants of a card.
 */
export async function getClozesForCard(db: DatabaseAdapter, cardId: string): Promise<Cloze[]> {
  return db.query<Cloze>(`SELECT ${CLOZE_COLUMNS} FROM cloze_cards WHERE card_id = ?`, [cardId])
}

/**
 * Create a cloze variant.
 */
export async function createCloze(db: DatabaseAdapter, cloze: Cloze): Promise<void> {
  await db.execute(
    `INSERT INTO cloze_cards (id, card_id, sentence, cloze, translation, difficulty, cefr_level)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      cloze.id,
      cloze.cardId,
      cloze.sentence,
      cloze.answer,
      cloze.translation,
      cloze.difficulty,
      cloze.cefrLevel,
    ],
  )
}

/**
 * Delete a cloze variant.
 */
export async function deleteCloze(db: DatabaseAdapter, clozeId: string): Promise<void> {
  await db.execute(`DELETE FROM cloze_cards WHERE id = ?`, [clozeId])
}
