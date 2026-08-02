import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from './migrations'
import { createManualClozeCard, createManualWordCard } from './manual-card'
import { getMeaningsForCard } from './repositories/clusters'
import { getClozesForCard } from './repositories/cloze'
import { NodeSqliteAdapter } from './testing/node-sqlite-adapter'

describe('createManualWordCard', () => {
  let db: NodeSqliteAdapter

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
    await db.execute(`INSERT INTO decks (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`, [
      'deck-a',
      'A',
      Date.now(),
      Date.now(),
    ])
  })

  afterEach(() => {
    db.close()
  })

  it('creates a lemma, card, primary meaning, and deck membership from the minimum required fields', async () => {
    const result = await createManualWordCard(db, 'deck-a', 'de', {
      word: 'ablehnen',
      partOfSpeech: 'verb',
      meaning: 'to refuse',
      cefrLevel: 'B1',
    })

    expect(result.lemma.form).toBe('ablehnen')
    const card = await db.querySingle<{ deckId: string; primaryMeaningId: string; source: string }>(
      `SELECT deck_id AS deckId, primary_meaning_id AS primaryMeaningId, source FROM cards WHERE id = ?`,
      [result.cardId],
    )
    expect(card?.deckId).toBe('deck-a')
    expect(card?.primaryMeaningId).toBeTruthy()
    expect(card?.source).toBe('manual')

    const membership = await db.query(`SELECT id FROM deck_cards WHERE deck_id = ? AND card_id = ?`, [
      'deck-a',
      result.cardId,
    ])
    expect(membership).toHaveLength(1)

    const cardState = await db.querySingle<{ state: string }>(`SELECT state FROM card_states WHERE card_id = ?`, [
      result.cardId,
    ])
    expect(cardState?.state).toBe('new')

    const meanings = await getMeaningsForCard(db, result.cardId)
    expect(meanings).toHaveLength(1)
    expect(meanings[0]).toMatchObject({ translation: 'to refuse', isPrimary: true })
  })

  it('reuses an existing lemma of the same form/language instead of failing on the UNIQUE constraint', async () => {
    const first = await createManualWordCard(db, 'deck-a', 'de', {
      word: 'ablehnen',
      partOfSpeech: 'verb',
      meaning: 'to refuse',
      cefrLevel: 'B1',
    })
    const second = await createManualWordCard(db, 'deck-a', 'de', {
      word: 'ablehnen',
      partOfSpeech: 'verb',
      meaning: 'to decline',
      cefrLevel: 'B1',
    })

    expect(second.lemma.id).toBe(first.lemma.id)
    expect(second.cardId).not.toBe(first.cardId)
    const lemmas = await db.query(`SELECT id FROM lemmas WHERE form = 'ablehnen'`)
    expect(lemmas).toHaveLength(1)
  })
})

describe('createManualClozeCard', () => {
  let db: NodeSqliteAdapter

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
    await db.execute(`INSERT INTO decks (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`, [
      'deck-a',
      'A',
      Date.now(),
      Date.now(),
    ])
  })

  afterEach(() => {
    db.close()
  })

  it('creates a cloze card with no meaning, and both an FSRS card_states and cloze_states row', async () => {
    const result = await createManualClozeCard(db, 'deck-a', 'de', {
      sentence: 'Wir gehen heute Abend [...].',
      answer: 'aus',
      translation: 'We are going out tonight.',
      cefrLevel: 'A2',
    })

    const card = await db.querySingle<{ type: string; primaryMeaningId: string | null }>(
      `SELECT type, primary_meaning_id AS primaryMeaningId FROM cards WHERE id = ?`,
      [result.cardId],
    )
    expect(card?.type).toBe('cloze')
    expect(card?.primaryMeaningId).toBeNull()

    const meanings = await getMeaningsForCard(db, result.cardId)
    expect(meanings).toHaveLength(0)

    const clozes = await getClozesForCard(db, result.cardId)
    expect(clozes).toHaveLength(1)
    expect(clozes[0]).toMatchObject({ sentence: 'Wir gehen heute Abend [...].', answer: 'aus' })

    const cardState = await db.querySingle(`SELECT card_id FROM card_states WHERE card_id = ?`, [result.cardId])
    expect(cardState).not.toBeNull()
    const clozeState = await db.querySingle(`SELECT card_id FROM cloze_states WHERE card_id = ?`, [result.cardId])
    expect(clozeState).not.toBeNull()
  })
})
