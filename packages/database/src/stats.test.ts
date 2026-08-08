import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from './migrations'
import { createCardWithState, getVocabularyGrowth } from './repositories/cards'
import { createDeck } from './repositories/decks'
import { createLemma } from './repositories/lemmas'
import { getDifficultWords, getReviewCountsByDay, recordReview } from './repositories/reviews'
import { NodeSqliteAdapter } from './testing/node-sqlite-adapter'

const DAY_MS = 86_400_000

function initialState(cardId: string) {
  return {
    cardId,
    stability: 1,
    difficulty: 5,
    retrievability: 1,
    nextReviewAt: Date.now(),
    lapses: 0,
    state: 'new' as const,
    reps: 0,
    learningSteps: 0,
  }
}

async function addWord(
  db: NodeSqliteAdapter,
  deckId: string,
  form: string,
  createdAt: number,
): Promise<string> {
  const lemmaId = crypto.randomUUID()
  await createLemma(db, {
    id: lemmaId,
    form,
    language: 'de',
    partOfSpeech: 'noun',
    createdAt,
    updatedAt: createdAt,
  })
  const cardId = crypto.randomUUID()
  await createCardWithState(
    db,
    { id: cardId, lemmaId, deckId, type: 'basic', createdAt, updatedAt: createdAt, nativeLanguage: 'en' },
    initialState(cardId),
  )
  return cardId
}

describe('stats repository functions', () => {
  let db: NodeSqliteAdapter
  let deckId: string

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
    deckId = 'test-deck'
    const now = Date.now()
    await createDeck(db, { id: deckId, name: 'Stats test deck', createdAt: now, updatedAt: now })
  })

  afterEach(() => {
    db.close()
  })

  it('getVocabularyGrowth buckets lemma creation into weekly windows, oldest first', async () => {
    const now = Date.now()
    await addWord(db, deckId, 'Haus', now - 13.5 * DAY_MS) // oldest bucket ([now-14d, now-7d))
    await addWord(db, deckId, 'Auto', now - 0.5 * DAY_MS) // most recent bucket ([now-7d, now))
    await addWord(db, deckId, 'Baum', now - 0.4 * DAY_MS) // same recent bucket

    const buckets = await getVocabularyGrowth(db, 2)
    expect(buckets).toHaveLength(2)
    expect(buckets[0]?.count).toBe(1)
    expect(buckets[1]?.count).toBe(2)
    expect(buckets[0]?.weekStart).toBeLessThan(buckets[1]?.weekStart ?? 0)
  })

  it('getReviewCountsByDay fills zero-count days and counts reviews on days with activity', async () => {
    const cardId = await addWord(db, deckId, 'Haus', Date.now())
    const today = Math.floor(Date.now() / DAY_MS)
    const todayStart = today * DAY_MS

    await recordReview(
      db,
      { id: crypto.randomUUID(), cardId, rating: 'good', reviewedAt: todayStart + 1000, durationMs: 500 },
      { ...initialState(cardId), state: 'review', reps: 1 },
    )

    const counts = await getReviewCountsByDay(db, 3)
    expect(counts).toHaveLength(3)
    expect(counts[counts.length - 1]).toMatchObject({ day: today, count: 1 })
    expect(counts[0]?.count).toBe(0)
  })

  it('getDifficultWords ranks by summed lapses and excludes words with zero lapses', async () => {
    const easyCardId = await addWord(db, deckId, 'Easy', Date.now())
    const hardCardId = await addWord(db, deckId, 'Hard', Date.now())

    await recordReview(
      db,
      { id: crypto.randomUUID(), cardId: easyCardId, rating: 'good', reviewedAt: Date.now(), durationMs: 500 },
      { ...initialState(easyCardId), lapses: 0, state: 'review', reps: 1 },
    )
    await recordReview(
      db,
      { id: crypto.randomUUID(), cardId: hardCardId, rating: 'again', reviewedAt: Date.now(), durationMs: 500 },
      { ...initialState(hardCardId), lapses: 3, state: 'relearning', reps: 1 },
    )

    const difficult = await getDifficultWords(db, 10)
    expect(difficult).toHaveLength(1)
    expect(difficult[0]).toMatchObject({ form: 'Hard', lapses: 3 })
  })
})
