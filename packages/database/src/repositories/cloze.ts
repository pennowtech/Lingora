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
 * Create a cloze variant, and — the first time a card gets one — its own independent FSRS state
 * row in `cloze_states` (migration 0013). Cloze practice and word-meaning review of the same card
 * are separately scheduled, so this is the one place that needs to happen: every insert path
 * (generation, regeneration, CSV/Anki/Lin import) already funnels through this function, so
 * callers never have to remember to do it themselves. `INSERT OR IGNORE` — a card's second, third,
 * ... cloze variant shares the one state row already created by its first.
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
  await db.execute(
    `INSERT OR IGNORE INTO cloze_states (card_id, state, next_review_date) VALUES (?, 'new', 0)`,
    [cloze.cardId],
  )
}

/**
 * Delete a cloze variant.
 */
export async function deleteCloze(db: DatabaseAdapter, clozeId: string): Promise<void> {
  await db.execute(`DELETE FROM cloze_cards WHERE id = ?`, [clozeId])
}
