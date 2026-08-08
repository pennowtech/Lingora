import type { CefrLevel, LanguageCode, PartOfSpeech } from '@lingora/types'
import type { DatabaseAdapter } from './adapter'
import { parseClozeMarkup } from './cloze-parse'
import { getCardsByLemma } from './repositories/cards'
import { createCloze } from './repositories/cloze'
import { createCluster, createMeaning, getClustersForLemma } from './repositories/clusters'
import { createExample } from './repositories/examples'
import { createInflections, createLemma, getLemmaByForm } from './repositories/lemmas'
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
 * When importing as cloze cards (`cardType: 'cloze'`) and the cloze field
 * carries valid markup: an empty word falls back to the cloze answer(s)
 * (the actual target word/phrase), and an empty meaning falls back to the
 * example's translation (there's no separate word-level meaning to give).
 * Importing as cloze cards with NO valid markup on a row is a hard error —
 * see the doc comment on `importRow` for why silently falling back to a
 * basic card here would be wrong. Importing as basic cards never looks at
 * `cloze` at all, matching the field-mapping UI, which doesn't offer that
 * column in basic mode.
 */
export function resolveWordAndMeaning(fields: {
  word: string
  meaning: string
  cloze: string | null
  example: string | null
  exampleTranslation: string | null
  cardType: 'basic' | 'cloze'
}): { word: string; meaning: string; errors: string[] } {
  const errors: string[] = []
  const clozeSource = fields.cardType === 'cloze' ? fields.cloze : null
  const clozeParsed = clozeSource ? parseClozeMarkup(clozeSource) : null

  if (fields.cardType === 'cloze' && !clozeParsed) {
    errors.push('No cloze markup found — map a column with {{c1::word}} syntax to Cloze sentence.')
  }

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
  /**
   * True when `word`/`meaning` are genuine, user-provided content — not
   * `resolveWordAndMeaning`'s cloze-derived fallback (the answer/
   * translation stood in for a missing word/meaning). Set by the caller
   * (`buildCsvImportPreview`/`buildApkgImportPreview`) from the *raw*
   * mapped cells, before the fallback ran — `importRow` can't tell the two
   * apart from the resolved strings alone. Drives whether a row with both
   * real vocab content *and* cloze markup gets one card or two — see
   * `importRow`.
   */
  hasOwnVocab: boolean
  /**
   * A dedicated cloze-sentence field (`{{c1::word}}` markup), mapped
   * separately from `example` — a real Anki Cloze note has no independent
   * "example," the cloze sentence *is* the example. When `cloze` is null,
   * `importRow` falls back to scanning `example` for cloze markup (the
   * older behavior, kept for a mapping that puts cloze text there instead).
   */
  cloze: string | null
  example: string | null
  exampleTranslation: string | null
  synonyms: string[]
  partOfSpeech: PartOfSpeech
  cefrLevel: CefrLevel
  tags: string[]
}

/**
 * Writes one row's card content inside the caller's transaction — always
 * exactly one card, never two, and always the type the caller asked for.
 *
 * `cardType` is the sole decider: 'basic' always creates a basic card from
 * `example` and never looks at `cloze`; 'cloze' always creates a cloze card
 * from `cloze` and never looks at `example` — this row's mapped fields
 * already reflect that choice (see FIELDS_BY_CARD_TYPE in
 * apps/mobile/app/settings/csv-import.tsx), so there's nothing to silently
 * fall back to either way. A 'cloze' row with no valid `{{c1::word}}`
 * markup throws rather than quietly becoming a basic card — the caller
 * (`buildCsvImportPreview`/`buildApkgImportPreview` via
 * `resolveWordAndMeaning`) is expected to have already flagged that row as
 * an error at preview time, so this is defense-in-depth, not the normal
 * path. To get both a basic AND a cloze card for the same rich source,
 * import the file twice with different `cardType` values and
 * `duplicatePolicy: 'duplicate'` (or 'merge') on the second pass — see
 * `DuplicatePolicy`.
 *
 * `existingLemmaId` is null for a genuinely new word (the common case):
 * creates a new lemma + inflection, then the one applicable card + state +
 * deck membership. When it's set (a 'merge' or 'duplicate' row), the lemma
 * isn't recreated — 'merge' reuses the lemma's existing card of the same
 * type if one exists (falling back to any existing card if not — a lemma
 * that only ever got one type of card before); 'duplicate' creates a new
 * card under that same lemma. See `DuplicatePolicy` for why a genuine
 * second lemma is never created.
 */
export async function importRow(
  tx: DatabaseAdapter,
  row: ImportableRow,
  deckId: string,
  language: LanguageCode,
  nativeLanguage: LanguageCode,
  existingLemmaId: string | null,
  duplicatePolicy: DuplicatePolicy,
  clusterDescription: string,
  cardType: 'basic' | 'cloze' = 'basic',
): Promise<void> {
  const now = Date.now()
  const clozeSource = cardType === 'cloze' ? row.cloze : null
  const clozeParsed = clozeSource ? parseClozeMarkup(clozeSource) : null
  if (cardType === 'cloze' && !clozeParsed) {
    throw new Error(`"${row.word}" has no cloze markup to build a cloze card from.`)
  }

  // `existingLemmaId` reflects the DB as of preview time. A whole file imports inside one
  // transaction (see importCsvRows/importApkgNotes), so a lemma an EARLIER row in this same batch
  // just created (e.g. the file has the same word on two rows) isn't reflected in a preview that
  // ran before any of this batch's own inserts happened. Re-checking live, in-transaction state
  // here — instead of trusting the caller's possibly-stale null — is what makes the second row
  // attach to that lemma as a duplicate/merge instead of hitting lemmas.form's UNIQUE constraint.
  let lemmaId = existingLemmaId ?? (await getLemmaByForm(tx, row.word, language))?.id ?? null
  const lemmaAlreadyExisted = lemmaId !== null

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

  // One cluster per lemma, reused across every card this row writes (basic
  // and cloze both scope their meaning/example/synonyms to it) and across
  // repeated imports of the same word (merge/duplicate) — creating a fresh
  // "General" cluster every time was the actual cause of a word showing up
  // with many identical "General A1" clusters on its detail page: once per
  // dual-card row before this fix, and once per merge/duplicate import
  // before that. `getClustersForLemma` returns clusters in `orderIndex`
  // order, so `[0]` is the first/default one.
  const existingClusters = lemmaAlreadyExisted ? await getClustersForLemma(tx, lemmaId) : []
  // Downstream card upsert logic (below) needs to know whether the LEMMA existed before this row
  // ran — not just what the caller originally passed in, now that a within-batch duplicate is
  // resolved above — or it would still try to create a second card instead of merging/duplicating
  // onto the one this same batch just created.
  const resolvedExistingLemmaId = lemmaAlreadyExisted ? lemmaId : null
  let clusterId = existingClusters[0]?.id
  if (!clusterId) {
    clusterId = crypto.randomUUID()
    await createCluster(tx, {
      id: clusterId,
      lemmaId,
      label: 'General',
      description: clusterDescription,
      cefrLevel: row.cefrLevel,
      orderIndex: 0,
    })
  }

  if (cardType === 'cloze') {
    await upsertCard(tx, {
      type: 'cloze',
      lemmaId,
      clusterId,
      deckId,
      nativeLanguage,
      row,
      existingLemmaId: resolvedExistingLemmaId,
      duplicatePolicy,
      now,
      // Non-null: the cardType === 'cloze' && !clozeParsed case threw above.
      content: { kind: 'cloze', parsed: clozeParsed! },
    })
  } else {
    await upsertCard(tx, {
      type: 'basic',
      lemmaId,
      clusterId,
      deckId,
      nativeLanguage,
      row,
      existingLemmaId: resolvedExistingLemmaId,
      duplicatePolicy,
      now,
      content: { kind: 'example', text: row.example },
    })
  }
}

type CardContent = { kind: 'example'; text: string | null } | { kind: 'cloze'; parsed: { blanked: string; answers: string[] } }

/** Creates (or merges onto) exactly one card of `type` — the per-card-type body factored out of `importRow` so a row that produces two cards doesn't duplicate this logic. */
async function upsertCard(
  tx: DatabaseAdapter,
  args: {
    type: 'basic' | 'cloze'
    lemmaId: string
    /** Shared across every card this row writes and across repeated merge/duplicate imports of the same lemma — see the "one cluster per lemma" comment in `importRow`. */
    clusterId: string
    deckId: string
    nativeLanguage: LanguageCode
    row: ImportableRow
    existingLemmaId: string | null
    duplicatePolicy: DuplicatePolicy
    now: number
    content: CardContent
  },
): Promise<void> {
  const { type, lemmaId, clusterId, deckId, nativeLanguage, row, existingLemmaId, duplicatePolicy, now, content } = args

  let cardId: string
  // A merge attaches to the existing card of the same type rather than
  // creating a new one — everything else (new card/state/deck membership)
  // is the "new card" path, whether the lemma itself is brand new or this
  // is a 'duplicate'.
  const isNewCard = !(existingLemmaId && duplicatePolicy === 'merge')

  if (!isNewCard) {
    const existingCards = await getCardsByLemma(tx, lemmaId)
    // Prefer a card already of this type; fall back to any existing card
    // for a lemma that (before this import) only ever got one type.
    const existingCard = existingCards.find((c) => c.type === type) ?? existingCards[0]
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
      `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at, native_language)
       VALUES (?, ?, ?, ?, NULL, ?, ?, NULL, ?)`,
      [cardId, lemmaId, deckId, type, now, now, nativeLanguage],
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

  if (content.kind === 'cloze') {
    await createCloze(tx, {
      id: crypto.randomUUID(),
      cardId,
      sentence: content.parsed.blanked,
      answer: content.parsed.answers.join('; '),
      translation: row.exampleTranslation ?? '',
      difficulty: 'contextual',
      cefrLevel: row.cefrLevel,
    })
  } else if (content.text) {
    await createExample(tx, {
      id: crypto.randomUUID(),
      cardId,
      clusterId,
      sentence: content.text,
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
