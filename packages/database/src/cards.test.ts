import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildCsvImportPreview, importCsvRows, parseCsv } from './csv-import'
import { getCardsForDeck, getRecentlyAddedWords } from './repositories/cards'
import { createDeck } from './repositories/decks'
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
    await importCsvRows(db, previews, deckId, 'de')
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
})
