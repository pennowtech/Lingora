import type { CefrLevel, LanguageCode, PartOfSpeech } from '@lingora/types'
import type { DatabaseAdapter } from './adapter'
import { parseClozeMarkup } from './cloze-parse'
import { getCardsByLemma } from './repositories/cards'
import { createCloze } from './repositories/cloze'
import { createCluster, createMeaning } from './repositories/clusters'
import { createExample } from './repositories/examples'
import { createInflections, createLemma } from './repositories/lemmas'
import { createSynonym } from './repositories/synonyms'
import { addTagToCard, getOrCreateTag } from './repositories/tags'

/**
 * Shared row-import logic for both the CSV and Anki `.apkg` importers —
 * everything past "we have a word/meaning/example/synonyms/tags and know
 * whether it duplicates an existing lemma" is identical between the two.
 */

/**
 * - 'skip': don't import this row (the caller filters it out before it
 *   reaches `importRow` — kept here only as the type's third state so
 *   callers have one enum for the whole decision, not two).
 * - 'merge': add this row's meaning/example/synonyms onto the FIRST
 *   existing card of the already-existing lemma, as additional
 *   (non-primary, non-selected) content — the existing primary
 *   meaning/selected example is left alone.
 * - 'duplicate': create a brand new card under the existing lemma.
 *   `lemmas.form` is UNIQUE, so a second lemma with the same form is not
 *   possible — a second card under the same lemma is the schema-respecting
 *   equivalent of "import it anyway, keep both".
 */
export type DuplicatePolicy = 'skip' | 'merge' | 'duplicate'

/** Splits a delimited field (commas, semicolons, or pipes) into trimmed, non-empty items. */
export function parseListField(raw: string): string[] {
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Fills in a missing word/meaning from cloze content when possible, instead
 * of always hard-requiring both. An Anki Cloze note has no standalone "word"
 * field the way a Basic note does — the fill-in-the-blank sentence itself
 * *is* the card, and the word being tested is whatever's inside `{{c1::…}}`.
 * When the example field carries cloze markup: an empty word falls back to
 * the cloze answer(s) (the actual target word/phrase), and an empty meaning
 * falls back to the example's translation (there's no separate word-level
 * meaning to give). Only turns into a real "empty" error when there's
 * nothing sensible to fall back to.
 */
export function resolveWordAndMeaning(fields: {
  word: string
  meaning: string
  example: string | null
  exampleTranslation: string | null
}): { word: string; meaning: string; errors: string[] } {
  const errors: string[] = []
  const clozeParsed = fields.example ? parseClozeMarkup(fields.example) : null

  let word = fields.word
  if (!word) {
    if (clozeParsed) word = clozeParsed.answers.join(' / ')
    else errors.push('Word field is empty.')
  }

  let meaning = fields.meaning
  if (!meaning) {
    if (fields.exampleTranslation) meaning = fields.exampleTranslation
    else if (clozeParsed) errors.push('Meaning field is empty — map "Example translation" too for cloze notes.')
    else errors.push('Meaning field is empty.')
  }

  return { word, meaning, errors }
}

export interface ImportableRow {
  word: string
  meaning: string
  example: string | null
  exampleTranslation: string | null
  synonyms: string[]
  partOfSpeech: PartOfSpeech
  cefrLevel: CefrLevel
  tags: string[]
}

/**
 * Writes one row's card content inside the caller's transaction.
 *
 * `existingLemmaId` is null for a genuinely new word (the common case):
 * creates a new lemma + inflection + card + state + deck membership. When
 * it's set (a 'merge' or 'duplicate' row), the lemma isn't recreated —
 * 'merge' reuses the lemma's first existing card; 'duplicate' creates a
 * new card under that same lemma. See `DuplicatePolicy` for why a genuine
 * second lemma is never created.
 */
export async function importRow(
  tx: DatabaseAdapter,
  row: ImportableRow,
  deckId: string,
  language: LanguageCode,
  existingLemmaId: string | null,
  duplicatePolicy: DuplicatePolicy,
  clusterDescription: string,
): Promise<void> {
  const now = Date.now()
  // A sentence containing Anki-style cloze markup ({{c1::word}}) routes to
  // a cloze practice card instead of a plain example — see cloze-parse.ts.
  // Only affects a brand-new card's `type`; a 'merge' reuses whatever type
  // the existing card already has.
  const clozeParsed = row.example ? parseClozeMarkup(row.example) : null
  let lemmaId = existingLemmaId

  if (!lemmaId) {
    lemmaId = crypto.randomUUID()
    await createLemma(tx, {
      id: lemmaId,
      form: row.word,
      language,
      partOfSpeech: row.partOfSpeech,
      createdAt: now,
      updatedAt: now,
    })
    await createInflections(tx, lemmaId, [row.word])
  }

  let cardId: string
  // A merge attaches to the existing card rather than creating a new one —
  // everything else (new card/state/deck membership) is the "new card"
  // path, whether the lemma itself is brand new or this is a 'duplicate'.
  const isNewCard = !(existingLemmaId && duplicatePolicy === 'merge')

  if (!isNewCard) {
    const existingCards = await getCardsByLemma(tx, lemmaId)
    const existingCard = existingCards[0]
    if (!existingCard) throw new Error(`"${row.word}" has no existing card to merge into.`)
    cardId = existingCard.id
    // The existing card may not already be a member of the deck the user
    // picked for this import (e.g. it was mined/generated but never added
    // to a deck) — without this, a successful merge could still be
    // invisible in the target deck. Safe to run even when it already is a
    // member: `deck_cards(deck_id, card_id)` is UNIQUE, so IGNORE no-ops.
    await tx.execute(`INSERT OR IGNORE INTO deck_cards (id, deck_id, card_id, added_at) VALUES (?, ?, ?, ?)`, [
      crypto.randomUUID(),
      deckId,
      cardId,
      now,
    ])
  } else {
    cardId = crypto.randomUUID()
    await tx.execute(
      `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?, NULL)`,
      [cardId, lemmaId, deckId, clozeParsed ? 'cloze' : 'basic', now, now],
    )
    await tx.execute(
      `INSERT INTO card_states
       (card_id, state, stability, difficulty, retrievability, lapses, last_reviewed_at, next_review_date)
       VALUES (?, 'new', 0, 0, 0, 0, NULL, ?)`,
      [cardId, now],
    )
    await tx.execute(`INSERT INTO deck_cards (id, deck_id, card_id, added_at) VALUES (?, ?, ?, ?)`, [
      crypto.randomUUID(),
      deckId,
      cardId,
      now,
    ])
  }

  const clusterId = crypto.randomUUID()
  await createCluster(tx, {
    id: clusterId,
    lemmaId,
    label: 'General',
    description: clusterDescription,
    cefrLevel: row.cefrLevel,
    orderIndex: 0,
  })

  const meaningId = crypto.randomUUID()
  await createMeaning(tx, {
    id: meaningId,
    cardId,
    clusterId,
    translation: row.meaning,
    explanation: '',
    cefrLevel: row.cefrLevel,
    // Merging onto an existing card must not displace its primary meaning
    // (exactly one primary meaning per card is an enforced invariant).
    isPrimary: isNewCard,
    orderIndex: 0,
  })
  if (isNewCard) {
    await tx.execute(`UPDATE cards SET primary_meaning_id = ?, updated_at = ? WHERE id = ?`, [meaningId, now, cardId])
  }

  if (clozeParsed) {
    await createCloze(tx, {
      id: crypto.randomUUID(),
      cardId,
      sentence: clozeParsed.blanked,
      answer: clozeParsed.answers.join('; '),
      translation: row.exampleTranslation ?? '',
      difficulty: 'contextual',
      cefrLevel: row.cefrLevel,
    })
  } else if (row.example) {
    await createExample(tx, {
      id: crypto.randomUUID(),
      cardId,
      clusterId,
      sentence: row.example,
      translation: row.exampleTranslation ?? '',
      context: 'casual',
      cefrLevel: row.cefrLevel,
      // Same invariant as isPrimary above — exactly one selected example per card.
      isSelected: isNewCard,
    })
  }

  for (const synonymWord of row.synonyms) {
    await createSynonym(tx, {
      id: crypto.randomUUID(),
      cardId,
      clusterId,
      word: synonymWord,
      cefrLevel: row.cefrLevel,
      formality: 'neutral',
    })
  }

  for (const tagName of row.tags) {
    const tag = await getOrCreateTag(tx, tagName)
    await addTagToCard(tx, cardId, tag.id)
  }
}
