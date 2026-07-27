import type { CefrLevel, PartOfSpeech } from '@lingora/types'
import type { DatabaseAdapter } from './adapter'
import { buildClozeMarkup } from './cloze-parse'
import { getSynonymsForCard } from './repositories/synonyms'
import { getTagsForCard } from './repositories/tags'

/**
 * Shared query for every export format (CSV, Anki `.apkg`, Markdown) — the
 * same card shape `import-shared.ts#importRow` writes, read back out. A
 * cloze card's `example` has its `{{c1::answer}}` markup re-embedded via
 * `buildClozeMarkup` (the reverse of `parseClozeMarkup`), so exporting then
 * re-importing (or opening in real Anki) round-trips the same cloze
 * behavior rather than exporting a cloze card as a blank-less plain
 * sentence.
 */

export interface ExportableCard {
  cardId: string
  word: string
  meaning: string
  example: string | null
  exampleTranslation: string | null
  synonyms: string[]
  tags: string[]
  partOfSpeech: PartOfSpeech
  cefrLevel: CefrLevel
  isCloze: boolean
}

interface CardRow {
  cardId: string
  word: string
  partOfSpeech: PartOfSpeech
  meaning: string | null
  cefrLevel: CefrLevel | null
  exampleSentence: string | null
  exampleTranslation: string | null
  clozeSentence: string | null
  clozeAnswer: string | null
  clozeTranslation: string | null
}

/**
 * Every exportable card, optionally narrowed to one deck (via `deck_cards`
 * membership — the same table `getCardsForDeck` reads, not `cards.deck_id`,
 * so a card only shows up for a deck it's actually a member of). Cards with
 * no primary meaning yet (mid-generation, shouldn't normally happen for a
 * fully-imported/generated card) are skipped rather than exported with a
 * blank meaning.
 */
export async function getExportableCards(
  db: DatabaseAdapter,
  options: { deckId?: string },
): Promise<ExportableCard[]> {
  const params: unknown[] = []
  let query = `
    SELECT
      c.id AS cardId,
      c.type AS cardType,
      l.form AS word,
      l.part_of_speech AS partOfSpeech,
      m.translation AS meaning,
      m.cefr_level AS cefrLevel,
      e.sentence AS exampleSentence,
      e.translation AS exampleTranslation,
      cz.sentence AS clozeSentence,
      cz.cloze AS clozeAnswer,
      cz.translation AS clozeTranslation
    FROM cards c
    JOIN lemmas l ON l.id = c.lemma_id
    LEFT JOIN meanings m ON m.card_id = c.id AND m.is_primary = 1
    LEFT JOIN examples e ON e.card_id = c.id AND e.is_selected = 1
    LEFT JOIN cloze_cards cz ON cz.card_id = c.id
  `
  if (options.deckId) {
    query += ` WHERE c.id IN (SELECT card_id FROM deck_cards WHERE deck_id = ?)`
    params.push(options.deckId)
  }
  query += ` ORDER BY l.form ASC`

  const rows = await db.query<CardRow & { cardType: string }>(query, params)
  const cards: ExportableCard[] = []

  for (const row of rows) {
    if (!row.meaning) continue
    const isCloze = row.cardType === 'cloze' && row.clozeSentence !== null && row.clozeAnswer !== null
    const [synonyms, tags] = await Promise.all([getSynonymsForCard(db, row.cardId), getTagsForCard(db, row.cardId)])

    cards.push({
      cardId: row.cardId,
      word: row.word,
      meaning: row.meaning,
      example: isCloze
        ? buildClozeMarkup(row.clozeSentence!, row.clozeAnswer!)
        : row.exampleSentence,
      exampleTranslation: isCloze ? row.clozeTranslation : row.exampleTranslation,
      synonyms: synonyms.map((s) => s.word),
      tags: tags.map((t) => t.name),
      partOfSpeech: row.partOfSpeech,
      cefrLevel: row.cefrLevel ?? 'A1',
      isCloze,
    })
  }

  return cards
}
