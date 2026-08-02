import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildCsvImportPreview, importCsvRows, parseCsv } from './csv-import'
import {
  createCardWithState,
  getCardsDueForReview,
  getCardsForDeck,
  getClozeCardCountForDeck,
  getDueCardsCount,
  getRecentlyAddedWords,
} from './repositories/cards'
import { createDeck } from './repositories/decks'
import { createLemma } from './repositories/lemmas'
import { migrate } from './migrations'
import { NodeSqliteAdapter } from './testing/node-sqlite-adapter'

describe('card list de-duplication (basic + cloze cards of the same word)', () => {
  let db: NodeSqliteAdapter
  let deckId: string

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
    const now = Date.now()
    deckId = 'test-deck'
    await createDeck(db, { id: deckId, name: 'List test deck', createdAt: now, updatedAt: now })

    const { rows } = parseCsv(
      'word,meaning,example,exampleTranslation,cloze\n' +
        'Haus,house,Das ist mein Haus.,This is my house.,\n' +
        'einbrechen,to break in,Der Dieb wollte ins Haus einbrechen.,The thief wanted to break into the house.,Der Dieb wollte ins Haus {{c1::einbrechen}}.\n',
    )
    const previews = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1, example: 2, exampleTranslation: 3, cloze: 4 },
      language: 'de',
    })
    await importCsvRows(db, previews, deckId, 'de', 'skip', 'basic')

    // 'einbrechen' needs both a basic and a cloze card for this describe block's de-duplication
    // scenario — cardType only produces one card per row, so a second pass (now flagged
    // 'duplicate' since the lemma exists) adds the cloze card under the same lemma.
    const dupPreviews = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1, example: 2, exampleTranslation: 3, cloze: 4 },
      language: 'de',
    })
    const einbrechenDup = dupPreviews.filter((p) => p.word === 'einbrechen' && p.status === 'duplicate')
    await importCsvRows(db, einbrechenDup, deckId, 'de', 'duplicate', 'cloze')
  })

  afterEach(() => {
    db.close()
  })

  it("getCardsForDeck lists a word with both a basic and cloze card once, flagged hasCloze", async () => {
    const cards = await getCardsForDeck(db, deckId)
    expect(cards).toHaveLength(2)

    const einbrechen = cards.find((c) => c.form === 'einbrechen')
    expect(einbrechen).toMatchObject({ translation: 'to break in', hasCloze: true })

    const haus = cards.find((c) => c.form === 'Haus')
    expect(haus).toMatchObject({ translation: 'house', hasCloze: false })
  })

  it('getRecentlyAddedWords also collapses a word with both card types into one row', async () => {
    const words = await getRecentlyAddedWords(db, 10)
    expect(words).toHaveLength(2)
    expect(words.find((w) => w.form === 'einbrechen')).toMatchObject({ hasCloze: true })
  })

  it('getClozeCardCountForDeck counts only the cloze card, regardless of due state', async () => {
    // Haus has a basic card only, einbrechen has a basic AND a cloze card — exactly 1 cloze card
    // in the deck, used by the deck detail screen to decide whether "Practice cloze" is offered.
    expect(await getClozeCardCountForDeck(db, deckId)).toBe(1)
  })
})

describe('due-card queries ignore orphaned deck memberships', () => {
  let db: NodeSqliteAdapter

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
  })

  afterEach(() => {
    db.close()
  })

  // Reproduces a real device state found in the field: a deck_cards row survived its own deck's
  // deletion (observed with zero rows in `decks` but hundreds of still-referenced deck_cards rows —
  // some deletion path evidently didn't cascade). Simulated here by turning foreign_keys off just
  // for the raw delete, the same way that real-world gap must have happened, since the schema does
  // declare ON DELETE CASCADE and every adapter enables the pragma on its own connections.
  it('a card whose only deck was deleted out from under it no longer counts as due', async () => {
    const now = Date.now()
    const deckId = 'orphan-deck'
    await createDeck(db, { id: deckId, name: 'Soon to be deleted', createdAt: now, updatedAt: now })

    const lemmaId = crypto.randomUUID()
    await createLemma(db, { id: lemmaId, form: 'Haus', language: 'de', partOfSpeech: 'noun', createdAt: now, updatedAt: now })
    const cardId = crypto.randomUUID()
    await createCardWithState(
      db,
      { id: cardId, lemmaId, deckId, type: 'basic', createdAt: now, updatedAt: now },
      { cardId, stability: 1, difficulty: 5, retrievability: 1, nextReviewAt: now, lapses: 0, state: 'new', reps: 0, learningSteps: 0 },
    )

    expect(await getDueCardsCount(db)).toBe(1)

    await db.execute('PRAGMA foreign_keys = OFF')
    await db.execute('DELETE FROM decks WHERE id = ?', [deckId])
    await db.execute('PRAGMA foreign_keys = ON')

    expect(await getDueCardsCount(db)).toBe(0)
    expect(await getCardsDueForReview(db)).toHaveLength(0)
  })
})
