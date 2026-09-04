import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildCsvImportPreview, importCsvRows, parseCsv } from './csv-import'
import { migrate } from './migrations'
import { getCardsDueForReview, getDueCardsCount, getRecentlyAddedWords, getTotalCardCount } from './repositories/cards'
import { createDeck, getAllDecks, getDeckCounts } from './repositories/decks'
import { searchLemmasWithPreview } from './repositories/lemmas'
import { createMineEntry, deleteAllMineEntries, getAllMineEntries, getPendingMineEntries } from './repositories/mining'
import { loadReviewQueue } from './repositories/reviewQueue'
import { getRetentionRate, getTodayReviewCount, recordReview } from './repositories/reviews'
import { NodeSqliteAdapter } from './testing/node-sqlite-adapter'
import { createInitialCardState } from '@lingora/srs'

describe('Language-Pair Scoping', () => {
  let db: NodeSqliteAdapter

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
  })

  afterEach(() => {
    db.close()
  })

  it('strictly isolates decks by targetLanguage and nativeLanguage', async () => {
    const now = Date.now()
    // Deck 1: English -> German (Native: en, Target: de)
    await createDeck(db, {
      id: 'deck-de',
      name: 'German Deck',
      targetLanguage: 'de',
      nativeLanguage: 'en',
      createdAt: now,
      updatedAt: now,
    })

    // Deck 2: English -> Spanish (Native: en, Target: es)
    await createDeck(db, {
      id: 'deck-es',
      name: 'Spanish Deck',
      targetLanguage: 'es',
      nativeLanguage: 'en',
      createdAt: now,
      updatedAt: now,
    })

    // Deck 3: German -> English (Native: de, Target: en)
    await createDeck(db, {
      id: 'deck-en',
      name: 'English Deck',
      targetLanguage: 'en',
      nativeLanguage: 'de',
      createdAt: now,
      updatedAt: now,
    })

    // Query for En -> De
    const enDeDecks = await getAllDecks(db, 'de', 'en')
    expect(enDeDecks.map((d) => d.name)).toEqual(['German Deck'])

    // Query for En -> Es
    const enEsDecks = await getAllDecks(db, 'es', 'en')
    expect(enEsDecks.map((d) => d.name)).toEqual(['Spanish Deck'])

    // Query for De -> En (reverse)
    const deEnDecks = await getAllDecks(db, 'en', 'de')
    expect(deEnDecks.map((d) => d.name)).toEqual(['English Deck'])
  })

  it('strictly isolates card stats and counts across language pairs', async () => {
    const now = Date.now()
    await createDeck(db, {
      id: 'deck-de',
      name: 'German Deck',
      targetLanguage: 'de',
      nativeLanguage: 'en',
      createdAt: now,
      updatedAt: now,
    })
    await createDeck(db, {
      id: 'deck-es',
      name: 'Spanish Deck',
      targetLanguage: 'es',
      nativeLanguage: 'en',
      createdAt: now,
      updatedAt: now,
    })

    // Import German word (target: de, native: en)
    const deRows = parseCsv('word,meaning\nHaus,house\n').rows
    const dePreviews = await buildCsvImportPreview(db, deRows, { mapping: { word: 0, meaning: 1 }, language: 'de' })
    await importCsvRows(db, dePreviews, 'deck-de', 'de', 'en')

    // Import Spanish word (target: es, native: en)
    const esRows = parseCsv('word,meaning\ncasa,house\n').rows
    const esPreviews = await buildCsvImportPreview(db, esRows, { mapping: { word: 0, meaning: 1 }, language: 'es' })
    await importCsvRows(db, esPreviews, 'deck-es', 'es', 'en')

    // Deck counts scoped
    const deCounts = await getDeckCounts(db, 'de', 'en')
    expect(deCounts).toHaveLength(1)
    expect(deCounts[0]?.deckId).toBe('deck-de')
    expect(deCounts[0]?.cardCount).toBe(1)

    const esCounts = await getDeckCounts(db, 'es', 'en')
    expect(esCounts).toHaveLength(1)
    expect(esCounts[0]?.deckId).toBe('deck-es')
    expect(esCounts[0]?.cardCount).toBe(1)

    // Total cards scoped
    expect(await getTotalCardCount(db, 'de', 'en')).toBe(1)
    expect(await getTotalCardCount(db, 'es', 'en')).toBe(1)
    expect(await getTotalCardCount(db, 'fr', 'en')).toBe(0)

    // Due cards count scoped
    expect(await getDueCardsCount(db, undefined, 'de', 'en')).toBe(1)
    expect(await getDueCardsCount(db, undefined, 'es', 'en')).toBe(1)
    expect(await getDueCardsCount(db, undefined, 'fr', 'en')).toBe(0)

    // Recently added words scoped
    const deRecent = await getRecentlyAddedWords(db, 10, 'de', 'en')
    expect(deRecent.map((r) => r.form)).toEqual(['Haus'])

    const esRecent = await getRecentlyAddedWords(db, 10, 'es', 'en')
    expect(esRecent.map((r) => r.form)).toEqual(['casa'])

    // Review queue scoped
    const deQueue = await loadReviewQueue(db, 'all', false, 10, undefined, 'de', 'en')
    expect(deQueue.views.map((v) => v.form)).toEqual(['Haus'])

    const esQueue = await loadReviewQueue(db, 'all', false, 10, undefined, 'es', 'en')
    expect(esQueue.views.map((v) => v.form)).toEqual(['casa'])

    // Search scoped
    const deSearch = await searchLemmasWithPreview(db, 'house', 'de', 'en')
    expect(deSearch.map((s) => s.lemma.form)).toEqual(['Haus'])

    const esSearch = await searchLemmasWithPreview(db, 'house', 'es', 'en')
    expect(esSearch.map((s) => s.lemma.form)).toEqual(['casa'])
  })

  it('strictly isolates review events and retention stats by language pair', async () => {
    const now = Date.now()
    await createDeck(db, {
      id: 'deck-de',
      name: 'German Deck',
      targetLanguage: 'de',
      nativeLanguage: 'en',
      createdAt: now,
      updatedAt: now,
    })

    const deRows = parseCsv('word,meaning\nHaus,house\n').rows
    const dePreviews = await buildCsvImportPreview(db, deRows, { mapping: { word: 0, meaning: 1 }, language: 'de' })
    await importCsvRows(db, dePreviews, 'deck-de', 'de', 'en')

    const card = await db.querySingle<{ id: string }>('SELECT id FROM cards WHERE native_language = ?', ['en'])
    expect(card).not.toBeNull()

    // Record review for German card
    const initial = createInitialCardState(card!.id)
    await recordReview(
      db,
      {
        id: 'review-1',
        cardId: card!.id,
        rating: 'good',
        reviewedAt: now,
        durationMs: 1500,
      },
      initial,
    )

    // German review stats
    expect(await getTodayReviewCount(db, 'de', 'en')).toBe(1)
    expect(await getRetentionRate(db, 30, 'de', 'en')).toBe(1)

    // Spanish / other language stats should be 0
    expect(await getTodayReviewCount(db, 'es', 'en')).toBe(0)
    expect(await getRetentionRate(db, 30, 'es', 'en')).toBe(0)
  })

  it('strictly isolates Mining Studio passages by targetLanguage - the reported "old-pair passages leak into a new pair" bug', async () => {
    const now = Date.now()
    await createMineEntry(db, {
      id: 'mine-de',
      rawText: 'Das Haus ist groß.',
      sourceType: 'manual',
      status: 'pending',
      capturedAt: now,
      processed: false,
      targetLanguage: 'de',
    })
    await createMineEntry(db, {
      id: 'mine-fr',
      rawText: 'La maison est grande.',
      sourceType: 'manual',
      status: 'pending',
      capturedAt: now + 1,
      processed: false,
      targetLanguage: 'fr',
    })

    // A German passage never shows up once the pair switches to French, and vice versa.
    expect((await getAllMineEntries(db, 'de')).map((e) => e.id)).toEqual(['mine-de'])
    expect((await getAllMineEntries(db, 'fr')).map((e) => e.id)).toEqual(['mine-fr'])
    expect((await getPendingMineEntries(db, 'de')).map((e) => e.id)).toEqual(['mine-de'])
    expect((await getPendingMineEntries(db, 'fr')).map((e) => e.id)).toEqual(['mine-fr'])

    // "Clear All" while viewing one pair only clears that pair's passages.
    await deleteAllMineEntries(db, 'de')
    expect((await getAllMineEntries(db, 'de')).map((e) => e.id)).toEqual([])
    expect((await getAllMineEntries(db, 'fr')).map((e) => e.id)).toEqual(['mine-fr'])
  })
})
