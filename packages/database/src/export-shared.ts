import type { CefrLevel, PartOfSpeech } from '@lingora/types'
import type { DatabaseAdapter } from './adapter'
import { buildClozeMarkup } from './cloze-parse'
import { getSynonymsForCard } from './repositories/synonyms'
import { getTagsForCard } from './repositories/tags'

/**
 * Shared query for every export format (CSV, Anki `.apkg`, Markdown) — the
 * same card shape `import-shared.ts#importRow` writes, read back out. A
 * cloze card's `{{c1::answer}}` markup (re-embedded via `buildClozeMarkup`,
 * the reverse of `parseClozeMarkup`) lands in its own `cloze` field, not
 * `example` — mirroring the dedicated "Cloze sentence" import mapping
 * (`CsvField`/`ApkgField`'s `cloze`), so a cloze card's `example` is always
 * null and vice versa. Exporting then re-importing (or opening in real
 * Anki) round-trips the same cloze behavior rather than a blank-less plain
 * sentence — and CSV/Markdown output no longer show raw `{{c1::...}}`
 * markup under a column/heading labeled "Example."
 */

export interface ExportableCard {
  cardId: string
  word: string
  meaning: string
  /** `{{c1::answer}}` markup, set only for a cloze card — `example` is null when this is set, and vice versa. */
  cloze: string | null
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
    const exampleTranslation = isCloze ? row.clozeTranslation : row.exampleTranslation
    // Any imported card's stored "meaning" can equal its example
    // translation verbatim — not just cloze cards: import-shared.ts#resolveWordAndMeaning
    // falls back to the example translation whenever meaning was left
    // unmapped/empty, for a plain vocab row exactly the same as a cloze
    // one. Surfacing that as a distinct "Meaning" column/field just repeats
    // "Example translation" in every export format. Blank it instead: a
    // fresh import with no meaning mapped produces the exact same result,
    // so this doesn't change what a re-import derives.
    const meaning = row.meaning === exampleTranslation ? '' : row.meaning
    const [synonyms, tags] = await Promise.all([getSynonymsForCard(db, row.cardId), getTagsForCard(db, row.cardId)])

    cards.push({
      cardId: row.cardId,
      word: row.word,
      meaning,
      cloze: isCloze ? buildClozeMarkup(row.clozeSentence!, row.clozeAnswer!) : null,
      example: isCloze ? null : row.exampleSentence,
      exampleTranslation,
      synonyms: synonyms.map((s) => s.word),
      tags: tags.map((t) => t.name),
      partOfSpeech: row.partOfSpeech,
      cefrLevel: row.cefrLevel ?? 'A1',
      isCloze,
    })
  }

  return cards
}

/**
 * Merges a lemma's separate basic + cloze cards (see
 * `import-shared.ts#importRow`) into one row — for CSV/Markdown, where a
 * word showing up as two rows (one plain, one its cloze variant) reads as
 * an accidental duplicate rather than two study modes of the same word.
 * `lemmas.form` is globally UNIQUE, so grouping by `word` is exactly
 * grouping by lemma. Prefers the non-cloze card's own fields (word/
 * meaning matter more for display than a cloze sentence) and folds in the
 * other card's `cloze`/`exampleTranslation`.
 *
 * Deliberately **not** applied to Anki `.apkg` export: real Anki's own
 * data model wants a separate Basic note and Cloze note for a word studied
 * both ways, so `apkg-export.ts` consumes `getExportableCards`'s raw,
 * unmerged, one-row-per-card output directly.
 */
export function mergeCardsByWord(cards: ExportableCard[]): ExportableCard[] {
  const byWord = new Map<string, ExportableCard>()
  for (const card of cards) {
    const existing = byWord.get(card.word)
    if (!existing) {
      byWord.set(card.word, card)
      continue
    }
    const basic = existing.isCloze ? card : existing
    const other = existing.isCloze ? existing : card
    byWord.set(card.word, {
      ...basic,
      cloze: basic.cloze ?? other.cloze,
      exampleTranslation: basic.exampleTranslation ?? other.exampleTranslation,
      isCloze: false,
    })
  }
  return Array.from(byWord.values())
}
