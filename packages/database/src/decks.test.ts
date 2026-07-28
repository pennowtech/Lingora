import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildCsvImportPreview, importCsvRows, parseCsv } from './csv-import'
import { migrate } from './migrations'
import { createDeck, deleteDeck, getAllDecks, mergeDecks } from './repositories/decks'
import { getLemmaByForm } from './repositories/lemmas'
import { NodeSqliteAdapter } from './testing/node-sqlite-adapter'

describe('deleteDeck', () => {
  let db: NodeSqliteAdapter

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
  })

  afterEach(() => {
    db.close()
  })

  it('deletes a card (and its lemma) that exists only in the deleted deck', async () => {
    const now = Date.now()
    await createDeck(db, { id: 'deck-a', name: 'A', createdAt: now, updatedAt: now })
    const { rows } = parseCsv('word,meaning\nHaus,house\n')
    const previews = await buildCsvImportPreview(db, rows, { mapping: { word: 0, meaning: 1 }, language: 'de' })
    await importCsvRows(db, previews, 'deck-a', 'de')

    const lemmaBefore = await getLemmaByForm(db, 'Haus', 'de')
    expect(lemmaBefore).not.toBeNull()

    await deleteDeck(db, 'deck-a')

    const lemmaAfter = await getLemmaByForm(db, 'Haus', 'de')
    expect(lemmaAfter).toBeNull()
    const cards = await db.query('SELECT id FROM cards')
    expect(cards).toHaveLength(0)
    const clusters = await db.query('SELECT id FROM meaning_clusters')
    expect(clusters).toHaveLength(0)
    const meanings = await db.query('SELECT id FROM meanings')
    expect(meanings).toHaveLength(0)
  })

  it('a re-import of the same word after the deck is deleted is treated as new, not a duplicate', async () => {
    const now = Date.now()
    await createDeck(db, { id: 'deck-a', name: 'A', createdAt: now, updatedAt: now })
    const { rows } = parseCsv('word,meaning\nHaus,house\n')
    const previews = await buildCsvImportPreview(db, rows, { mapping: { word: 0, meaning: 1 }, language: 'de' })
    await importCsvRows(db, previews, 'deck-a', 'de')
    await deleteDeck(db, 'deck-a')

    await createDeck(db, { id: 'deck-b', name: 'B', createdAt: now, updatedAt: now })
    const secondPreviews = await buildCsvImportPreview(db, rows, { mapping: { word: 0, meaning: 1 }, language: 'de' })
    expect(secondPreviews[0]?.status).toBe('ok')

    const result = await importCsvRows(db, secondPreviews, 'deck-b', 'de')
    expect(result).toEqual({ imported: 1, skipped: 0, failed: 0 })
  })

  it('keeps a card that is also in another deck, only removing its membership in the deleted one', async () => {
    const now = Date.now()
    await createDeck(db, { id: 'deck-a', name: 'A', createdAt: now, updatedAt: now })
    await createDeck(db, { id: 'deck-b', name: 'B', createdAt: now, updatedAt: now })
    const { rows } = parseCsv('word,meaning\nHaus,house\n')
    const previews = await buildCsvImportPreview(db, rows, { mapping: { word: 0, meaning: 1 }, language: 'de' })
    await importCsvRows(db, previews, 'deck-a', 'de')

    const lemma = await getLemmaByForm(db, 'Haus', 'de')
    const card = await db.querySingle<{ id: string }>('SELECT id FROM cards WHERE lemma_id = ?', [lemma?.id])
    const now2 = Date.now()
    await db.execute(`INSERT INTO deck_cards (id, deck_id, card_id, added_at) VALUES (?, ?, ?, ?)`, [
      'membership-b',
      'deck-b',
      card?.id,
      now2,
    ])

    await deleteDeck(db, 'deck-a')

    const cardsAfter = await db.query('SELECT id FROM cards')
    expect(cardsAfter).toHaveLength(1)
    const membershipsAfter = await db.query<{ deckId: string }>('SELECT deck_id AS deckId FROM deck_cards WHERE card_id = ?', [
      card?.id,
    ])
    expect(membershipsAfter).toEqual([{ deckId: 'deck-b' }])
  })
})

describe('mergeDecks', () => {
  let db: NodeSqliteAdapter

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
  })

  afterEach(() => {
    db.close()
  })

  it("moves the source deck's cards into the target and deletes the source", async () => {
    const now = Date.now()
    await createDeck(db, { id: 'deck-a', name: 'A', createdAt: now, updatedAt: now })
    await createDeck(db, { id: 'deck-b', name: 'B', createdAt: now, updatedAt: now })
    const { rows } = parseCsv('word,meaning\nHaus,house\n')
    const previews = await buildCsvImportPreview(db, rows, { mapping: { word: 0, meaning: 1 }, language: 'de' })
    await importCsvRows(db, previews, 'deck-a', 'de')

    await mergeDecks(db, 'deck-a', 'deck-b')

    const decks = await getAllDecks(db)
    expect(decks.map((d) => d.id)).toEqual(['deck-b'])
    const memberships = await db.query<{ deckId: string }>('SELECT deck_id AS deckId FROM deck_cards')
    expect(memberships).toEqual([{ deckId: 'deck-b' }])
  })

  it('a card already in both decks keeps a single membership, not a duplicate row', async () => {
    const now = Date.now()
    await createDeck(db, { id: 'deck-a', name: 'A', createdAt: now, updatedAt: now })
    await createDeck(db, { id: 'deck-b', name: 'B', createdAt: now, updatedAt: now })
    const { rows } = parseCsv('word,meaning\nHaus,house\n')
    const previews = await buildCsvImportPreview(db, rows, { mapping: { word: 0, meaning: 1 }, language: 'de' })
    await importCsvRows(db, previews, 'deck-a', 'de')
    const card = await db.querySingle<{ id: string }>('SELECT id FROM cards')
    await db.execute(`INSERT INTO deck_cards (id, deck_id, card_id, added_at) VALUES (?, ?, ?, ?)`, [
      'membership-b',
      'deck-b',
      card?.id,
      now,
    ])

    await mergeDecks(db, 'deck-a', 'deck-b')

    const memberships = await db.query<{ deckId: string }>('SELECT deck_id AS deckId FROM deck_cards WHERE card_id = ?', [
      card?.id,
    ])
    expect(memberships).toEqual([{ deckId: 'deck-b' }])
  })

  it('re-parents decks nested under the source onto the target instead of orphaning them', async () => {
    const now = Date.now()
    await createDeck(db, { id: 'deck-a', name: 'A', createdAt: now, updatedAt: now })
    await createDeck(db, { id: 'deck-b', name: 'B', createdAt: now, updatedAt: now })
    await createDeck(db, { id: 'deck-a-child', name: 'A child', parentId: 'deck-a', createdAt: now, updatedAt: now })

    await mergeDecks(db, 'deck-a', 'deck-b')

    const child = await db.querySingle<{ parentId: string }>('SELECT parent_id AS parentId FROM decks WHERE id = ?', [
      'deck-a-child',
    ])
    expect(child).toEqual({ parentId: 'deck-b' })
  })
})
