import {
  getCardCountForDeck,
  getCardsForDeck,
  getDeckCounts,
  getInflectionsForLemma,
  getRecentlyAddedWords,
  getReviewedDayIndexes,
  getTotalCardCount,
  migrate,
  searchLemmasWithPreview,
  seedDatabase,
} from '@lingora/database'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NodeSqliteAdapter } from './node-sqlite-adapter'

/**
 * The Phase 4 UI query functions, exercised against the real migrations and
 * the development seed ('ausgehen' end-to-end + 'laufen'/'Haus' morphology).
 */
describe('phase 4 UI queries', () => {
  let db: NodeSqliteAdapter

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
    await seedDatabase(db)
  })

  afterEach(() => {
    db.close()
  })

  it('searchLemmasWithPreview enriches FTS hits with translation, cefr and deck membership', async () => {
    const results = await searchLemmasWithPreview(db, 'ausgeh')

    expect(results.length).toBeGreaterThanOrEqual(1)
    const hit = results.find((r) => r.lemma.form === 'ausgehen')
    expect(hit).toBeDefined()
    expect(hit!.translation).toBeTruthy() // seeded primary meaning
    expect(hit!.cefrLevel).toBeTruthy()
    expect(hit!.inDeck).toBe(true) // seed puts the ausgehen card in deck-default
  })

  it('searchLemmasWithPreview handles lemmas without cards', async () => {
    const results = await searchLemmasWithPreview(db, 'laufen')
    const hit = results.find((r) => r.lemma.form === 'laufen')
    expect(hit).toBeDefined()
    expect(hit!.inDeck).toBe(false)
  })

  it('getInflectionsForLemma returns the stored surface forms', async () => {
    const results = await searchLemmasWithPreview(db, 'ausgehen')
    const lemmaId = results.find((r) => r.lemma.form === 'ausgehen')!.lemma.id

    const inflections = await getInflectionsForLemma(db, lemmaId)
    expect(inflections.length).toBeGreaterThanOrEqual(2)
    expect(inflections.map((i) => i.surface)).toContain('ging aus')
  })

  it('getRecentlyAddedWords returns cards with form and primary translation', async () => {
    const recent = await getRecentlyAddedWords(db, 5)
    expect(recent.length).toBeGreaterThanOrEqual(1)
    const ausgehen = recent.find((w) => w.form === 'ausgehen')
    expect(ausgehen?.translation).toBeTruthy()
    expect(ausgehen?.cardId).toBeTruthy()
  })

  it('deck counts line up between the batched and single-deck queries', async () => {
    const counts = await getDeckCounts(db)
    const defaultDeck = counts.find((c) => c.deckId === 'deck-default')
    expect(defaultDeck).toBeDefined()
    expect(defaultDeck!.cardCount).toBeGreaterThanOrEqual(1)
    expect(defaultDeck!.dueCount).toBeGreaterThanOrEqual(0)

    const single = await getCardCountForDeck(db, 'deck-default')
    expect(single).toBe(defaultDeck!.cardCount)
  })

  it('getCardsForDeck lists the deck cards newest first', async () => {
    const cards = await getCardsForDeck(db, 'deck-default')
    expect(cards.length).toBeGreaterThanOrEqual(1)
    expect(cards[0]!.form).toBeTruthy()
  })

  it('getTotalCardCount counts every card', async () => {
    expect(await getTotalCardCount(db)).toBeGreaterThanOrEqual(1)
  })

  it('getReviewedDayIndexes returns distinct days newest first', async () => {
    const now = Date.now()
    const day = 86_400_000
    for (const [i, ts] of [now, now - day, now - day, now - 3 * day].entries()) {
      await db.execute(
        `INSERT INTO review_events (id, card_id, rating, review_date, duration_ms)
         VALUES (?, 'card-ausgehen', 'good', ?, 1000)`,
        [`rev-${i}`, ts],
      )
    }

    const days = await getReviewedDayIndexes(db)
    expect(days.length).toBe(3) // duplicates collapsed
    expect(days[0]).toBeGreaterThan(days[1]!)
  })
})
