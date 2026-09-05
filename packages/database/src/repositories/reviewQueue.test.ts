import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildCsvImportPreview, importCsvRows, parseCsv } from '../csv-import'
import { createDeck } from './decks'
import { loadReviewQueue } from './reviewQueue'
import { migrate } from '../migrations'
import { NodeSqliteAdapter } from '../testing/node-sqlite-adapter'

describe('loadReviewQueue lemma grouping (sibling card rows of the same word)', () => {
  let db: NodeSqliteAdapter
  let deckId: string

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
    const now = Date.now()
    deckId = 'test-deck'
    await createDeck(db, { id: deckId, name: 'Review queue test deck', createdAt: now, updatedAt: now })

    const { rows } = parseCsv(
      'word,meaning,example,exampleTranslation,cloze\n' +
        'Haus,house,Das ist mein Haus.,This is my house.,\n' +
        'einbrechen,to break in,Der Dieb wollte ins Haus einbrechen.,The thief wanted to break into the house.,Der Dieb wollte ins Haus {{c1::einbrechen}}.\n',
    )
    const mapping = { word: 0, meaning: 1, example: 2, exampleTranslation: 3, cloze: 4 }
    const previews = await buildCsvImportPreview(db, rows, { mapping, language: 'de' })
    await importCsvRows(db, previews, deckId, 'de', 'en', 'skip', 'basic')

    // Give 'einbrechen' a second sibling card row (basic + cloze) under the same lemma, matching
    // how a real CSV/Anki import can split word-meaning and cloze content of one word onto two
    // separate `cards` rows sharing one `lemma_id` — see cards.test.ts's identical setup.
    const dupPreviews = await buildCsvImportPreview(db, rows, { mapping, language: 'de' })
    const einbrechenDup = dupPreviews.filter((p) => p.word === 'einbrechen' && p.status === 'duplicate')
    await importCsvRows(db, einbrechenDup, deckId, 'de', 'en', 'duplicate', 'cloze')
  })

  afterEach(() => {
    db.close()
  })

  it('caps the session by unique lemma, not raw card row, while including every due sibling row', async () => {
    // Both 'Haus' (1 card) and 'einbrechen' (2 sibling cards) are due (freshly created 'new' cards).
    // A sessionCardLimit of 1 unique word must still include ALL of that word's due sibling rows.
    const result = await loadReviewQueue(db, deckId, false, 1, undefined, 'de', 'en')
    const lemmaIds = new Set(result.views.map((v) => v.card.lemmaId))
    expect(lemmaIds.size).toBe(1)
    // Whichever single lemma was selected, EVERY due sibling row for it must be present - the bug
    // this test guards against ('first-row-wins' dedup) silently dropped every row after the first.
    expect(result.views.length).toBeGreaterThanOrEqual(1)
    expect(result.views.every((v) => v.card.lemmaId === [...lemmaIds][0])).toBe(true)
    expect(result.hasMore).toBe(true)
  })

  it('never drops a due sibling row when the lemma limit covers both words', async () => {
    const result = await loadReviewQueue(db, deckId, false, 2, undefined, 'de', 'en')
    const lemmaIds = new Set(result.views.map((v) => v.card.lemmaId))
    expect(lemmaIds.size).toBe(2)
    // 'einbrechen' has 2 sibling card rows (basic + cloze) - both must appear, not just one.
    expect(result.views.length).toBe(3)
    expect(result.hasMore).toBe(false)
  })

  it("a sibling card's hasClozeVariant reflects only its own content, not a borrowed sibling's - so Mixed practice never double-tests the same cloze sentence", async () => {
    const result = await loadReviewQueue(db, deckId, false, 2, undefined, 'de', 'en')
    const einbrechenViews = result.views.filter((v) => v.form === 'einbrechen' || v.example?.includes('einbrechen'))
    const basicView = result.views.find((v) => v.card.lemmaId === einbrechenViews[0]?.card.lemmaId && v.card.type === 'basic')
    const clozeView = result.views.find((v) => v.card.lemmaId === einbrechenViews[0]?.card.lemmaId && v.card.type === 'cloze')
    expect(basicView).toBeDefined()
    expect(clozeView).toBeDefined()

    // The basic sibling has no cloze content of its own - it must NOT be reported as cloze-eligible,
    // even though it still renders the borrowed cloze sentence (for the single-card preview toggle).
    expect(basicView?.hasClozeVariant).toBe(false)
    expect(basicView?.clozeSentence).toBe(clozeView?.clozeSentence)
    expect(basicView?.clozeSentence).toContain('Haus')

    // The cloze sibling genuinely has its own cloze content.
    expect(clozeView?.hasClozeVariant).toBe(true)
  })
})
