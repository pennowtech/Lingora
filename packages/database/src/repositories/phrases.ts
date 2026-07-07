import type { Phrase } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/**
 * Phrases: idioms, collocations, and separable verb patterns.
 * 'davon ausgehen' (to assume) is a phrase of the card for 'ausgehen'.
 */

const PHRASE_COLUMNS = `id, card_id AS cardId, expression, meaning, example_sentence AS exampleSentence, example_translation AS exampleTranslation, cefr_level AS cefrLevel`

/**
 * Get all phrases of a card.
 */
export async function getPhrasesForCard(db: DatabaseAdapter, cardId: string): Promise<Phrase[]> {
  return db.query<Phrase>(`SELECT ${PHRASE_COLUMNS} FROM phrases WHERE card_id = ?`, [cardId])
}

/**
 * Create a phrase.
 */
export async function createPhrase(db: DatabaseAdapter, phrase: Phrase): Promise<void> {
  await db.execute(
    `INSERT INTO phrases (id, card_id, expression, meaning, example_sentence, example_translation, cefr_level)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      phrase.id,
      phrase.cardId,
      phrase.expression,
      phrase.meaning,
      phrase.exampleSentence,
      phrase.exampleTranslation,
      phrase.cefrLevel,
    ],
  )
}

/**
 * Delete a phrase.
 */
export async function deletePhrase(db: DatabaseAdapter, phraseId: string): Promise<void> {
  await db.execute(`DELETE FROM phrases WHERE id = ?`, [phraseId])
}
