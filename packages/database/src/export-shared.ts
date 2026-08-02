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
  /** `{{c1::answer}}` markup, set only for a `type: 'cloze'` card (export-format shaping — `example`
   * is null when this is set, and vice versa, so CSV/Anki/Markdown export never show both). A
   * `type: 'basic'` card that ALSO has a cloze variant (the AI-generation pipeline can attach one to
   * an ordinary card — see persistWordGeneration) has this as null even though it has cloze content;
   * see `hasClozeVariant`/`clozeMarkup` below for that case. */
  cloze: string | null
  example: string | null
  exampleTranslation: string | null
  synonyms: string[]
  tags: string[]
  partOfSpeech: PartOfSpeech
  cefrLevel: CefrLevel
  isCloze: boolean
  /** True whenever this card has ANY cloze variant, regardless of `cards.type` — unlike `isCloze`
   * (which only reflects `type: 'cloze'` cards, for export-format shaping), this also catches a
   * `type: 'basic'` card the AI pipeline gave a cloze variant alongside its regular example. Drives
   * which cards belong in a "cloze" view (e.g. the deck table's Cloze tab) — that's a different
   * question from "should this card's example be suppressed for export," which is what `isCloze`
   * answers. */
  hasClozeVariant: boolean
  /** `{{c1::answer}}` markup whenever `hasClozeVariant` is true, independent of card type — unlike
   * `cloze` above, never null just because this happens to be a `type: 'basic'` card. */
  clozeMarkup: string | null
  /** The cloze variant's own translation, independent of card type — unlike `exampleTranslation`
   * (which is the *example's* translation for a `type: 'basic'` card, even one that also has a
   * cloze variant with its own, possibly different, translation). */
  clozeVariantTranslation: string | null
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
    -- "Exactly one primary meaning / one selected example per card" is an app-level invariant
    -- (see the repositories that write these tables), not a database constraint — a bug anywhere
    -- along the way (an old import path, a partial failure, ...) that leaves two rows flagged
    -- is_primary/is_selected for the same card would otherwise fan this query out into two result
    -- rows for what's still one card (the "duplicate key" symptom in any list keyed by cardId).
    -- Pinning to one row (the first-created, by rowid) makes this query robust to that regardless
    -- of whether the invariant actually held when the data was written.
    LEFT JOIN meanings m ON m.rowid = (
      SELECT MIN(m2.rowid) FROM meanings m2 WHERE m2.card_id = c.id AND m2.is_primary = 1
    )
    LEFT JOIN examples e ON e.rowid = (
      SELECT MIN(e2.rowid) FROM examples e2 WHERE e2.card_id = c.id AND e2.is_selected = 1
    )
    -- A card can have more than one cloze_cards row (createCloze's own doc comment: "a card's
    -- second, third, ... cloze variant") — same reasoning as above, pinned the same way.
    LEFT JOIN cloze_cards cz ON cz.rowid = (
      SELECT MIN(cz2.rowid) FROM cloze_cards cz2 WHERE cz2.card_id = c.id
    )
  `
  if (options.deckId) {
    query += ` WHERE c.id IN (SELECT card_id FROM deck_cards WHERE deck_id = ?)`
    params.push(options.deckId)
  }
  query += ` ORDER BY l.form ASC`

  const rows = await db.query<CardRow & { cardType: string }>(query, params)
  const cards: ExportableCard[] = []

  for (const row of rows) {
    const isCloze = row.cardType === 'cloze' && row.clozeSentence !== null && row.clozeAnswer !== null
    const hasClozeVariant = row.clozeSentence !== null && row.clozeAnswer !== null
    const clozeMarkup = hasClozeVariant ? buildClozeMarkup(row.clozeSentence!, row.clozeAnswer!) : null
    // A manually-added cloze card (createManualClozeCard) deliberately has no meaning row at all —
    // sentence/answer stand in for word/meaning the same way a real Anki Cloze note does (see
    // AddCardScreen's doc comment). Skipping every card with no meaning used to also skip these
    // legitimate cloze cards outright; only skip when there's neither a meaning NOR cloze content,
    // since that's the only case with nothing exportable at all.
    if (!row.meaning && !hasClozeVariant) continue
    const exampleTranslation = isCloze ? row.clozeTranslation : row.exampleTranslation
    // Any imported card's stored "meaning" can equal its example
    // translation verbatim — not just cloze cards: import-shared.ts#resolveWordAndMeaning
    // falls back to the example translation whenever meaning was left
    // unmapped/empty, for a plain vocab row exactly the same as a cloze
    // one. Surfacing that as a distinct "Meaning" column/field just repeats
    // "Example translation" in every export format. Blank it instead: a
    // fresh import with no meaning mapped produces the exact same result,
    // so this doesn't change what a re-import derives.
    const meaning = !row.meaning || row.meaning === exampleTranslation ? '' : row.meaning
    const [synonyms, tags] = await Promise.all([getSynonymsForCard(db, row.cardId), getTagsForCard(db, row.cardId)])

    cards.push({
      cardId: row.cardId,
      word: row.word,
      meaning,
      cloze: isCloze ? clozeMarkup : null,
      example: isCloze ? null : row.exampleSentence,
      exampleTranslation,
      synonyms: synonyms.map((s) => s.word),
      tags: tags.map((t) => t.name),
      partOfSpeech: row.partOfSpeech,
      cefrLevel: row.cefrLevel ?? 'A1',
      isCloze,
      hasClozeVariant,
      clozeMarkup,
      clozeVariantTranslation: hasClozeVariant ? row.clozeTranslation : null,
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
