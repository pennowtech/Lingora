import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createBackup, type BackupPayload } from './backup'
import { buildCsvImportPreview, importCsvRows, parseCsv } from './csv-import'
import {
  buildLinImportPreview,
  getDecksInPayload,
  importLinDeck,
  parseLinImportFile,
} from './lin-import'
import { migrate } from './migrations'
import { getCardsByLemma, getCardsForDeck } from './repositories/cards'
import { createDeck } from './repositories/decks'
import { getLemmaByForm } from './repositories/lemmas'
import { recordReview } from './repositories/reviews'
import { NodeSqliteAdapter } from './testing/node-sqlite-adapter'

async function seedTwoDeckSource(db: NodeSqliteAdapter): Promise<{ deckAId: string; deckBId: string }> {
  const now = Date.now()
  const deckAId = 'deck-a'
  const deckBId = 'deck-b'
  await createDeck(db, { id: deckAId, name: 'Deck A', createdAt: now, updatedAt: now })
  await createDeck(db, { id: deckBId, name: 'Deck B', createdAt: now, updatedAt: now })

  const { rows: rowsA } = parseCsv(
    'word,meaning,example,synonyms\n' +
      'Haus,house,Das ist mein Haus.,Gebäude\n' +
      'Auto,car,Das Auto ist rot.,\n',
  )
  const previewsA = await buildCsvImportPreview(db, rowsA, {
    mapping: { word: 0, meaning: 1, example: 2, synonyms: 3 },
    language: 'de',
  })
  await importCsvRows(db, previewsA, deckAId, 'de')

  const { rows: rowsB } = parseCsv('word,meaning\nBaum,tree\n')
  const previewsB = await buildCsvImportPreview(db, rowsB, { mapping: { word: 0, meaning: 1 }, language: 'de' })
  await importCsvRows(db, previewsB, deckBId, 'de')

  // Give the "Haus" card real review history + FSRS state to verify carryover.
  const hausLemma = await getLemmaByForm(db, 'Haus', 'de')
  const hausCard = (await getCardsByLemma(db, hausLemma!.id))[0]!
  await recordReview(
    db,
    { id: crypto.randomUUID(), cardId: hausCard.id, rating: 'again', reviewedAt: Date.now(), durationMs: 1200 },
    {
      cardId: hausCard.id,
      stability: 2.5,
      difficulty: 6.1,
      retrievability: 0.8,
      nextReviewAt: Date.now() + 86_400_000,
      lapses: 1,
      state: 'relearning',
      reps: 1,
      learningSteps: 1,
    },
  )

  return { deckAId, deckBId }
}

describe('lin-import (deck-scoped .lin import)', () => {
  let source: NodeSqliteAdapter
  let target: NodeSqliteAdapter
  let deckAId: string
  let deckBId: string
  let payload: BackupPayload

  beforeEach(async () => {
    source = new NodeSqliteAdapter()
    await migrate(source)
    ;({ deckAId, deckBId } = await seedTwoDeckSource(source))
    payload = await createBackup(source, {}, '1.0.0')

    target = new NodeSqliteAdapter()
    await migrate(target)
  })

  afterEach(() => {
    source.close()
    target.close()
  })

  it('parseLinImportFile round-trips through parseBackup validation', () => {
    const parsed = parseLinImportFile(JSON.stringify(payload))
    expect(parsed.tables.lemmas?.length).toBeGreaterThan(0)
  })

  it('getDecksInPayload lists every deck in the file with its own card count', () => {
    const decks = getDecksInPayload(payload)
    expect(decks).toHaveLength(2)
    expect(decks.find((d) => d.id === deckAId)).toMatchObject({ name: 'Deck A', cardCount: 2 })
    expect(decks.find((d) => d.id === deckBId)).toMatchObject({ name: 'Deck B', cardCount: 1 })
  })

  it("previews and imports only the chosen deck's lemmas, never the other deck's", async () => {
    const now = Date.now()
    await createDeck(target, { id: 'target-deck', name: 'Imported', createdAt: now, updatedAt: now })

    const previews = await buildLinImportPreview(target, payload, deckAId, 'de')
    expect(previews).toHaveLength(2)
    expect(previews.every((p) => p.status === 'ok')).toBe(true)
    expect(previews.map((p) => p.form).sort()).toEqual(['Auto', 'Haus'])

    const result = await importLinDeck(target, payload, deckAId, 'target-deck', 'de', previews)
    expect(result).toEqual({ imported: 2, skipped: 0, cardsImported: 2 })

    const cards = await getCardsForDeck(target, 'target-deck')
    expect(cards).toHaveLength(2)
    expect(cards.find((c) => c.form === 'Haus')).toMatchObject({ translation: 'house' })

    // Deck B's word must not have leaked in.
    expect(await getLemmaByForm(target, 'Baum', 'de')).toBeNull()
  })

  it('carries over FSRS state and review history for the imported card', async () => {
    const now = Date.now()
    await createDeck(target, { id: 'target-deck', name: 'Imported', createdAt: now, updatedAt: now })
    const previews = await buildLinImportPreview(target, payload, deckAId, 'de')
    await importLinDeck(target, payload, deckAId, 'target-deck', 'de', previews)

    const lemma = await getLemmaByForm(target, 'Haus', 'de')
    const card = (await getCardsByLemma(target, lemma!.id))[0]!
    const state = await target.querySingle<{ lapses: number; state: string }>(
      `SELECT lapses, state FROM card_states WHERE card_id = ?`,
      [card.id],
    )
    expect(state).toMatchObject({ lapses: 1, state: 'relearning' })

    const events = await target.query(`SELECT * FROM review_events WHERE card_id = ?`, [card.id])
    expect(events).toHaveLength(1)
  })

  it("flags a word that already exists locally as 'duplicate', and 'skip' policy leaves it untouched", async () => {
    const now = Date.now()
    await createDeck(target, { id: 'target-deck', name: 'Imported', createdAt: now, updatedAt: now })
    const firstPass = await buildLinImportPreview(target, payload, deckAId, 'de')
    await importLinDeck(target, payload, deckAId, 'target-deck', 'de', firstPass)

    const secondPass = await buildLinImportPreview(target, payload, deckAId, 'de')
    expect(secondPass.every((p) => p.status === 'duplicate')).toBe(true)

    const result = await importLinDeck(target, payload, deckAId, 'target-deck', 'de', secondPass, 'skip')
    expect(result).toEqual({ imported: 0, skipped: 2, cardsImported: 0 })

    const lemma = await getLemmaByForm(target, 'Haus', 'de')
    const cards = await getCardsByLemma(target, lemma!.id)
    expect(cards).toHaveLength(1)
  })

  it("'duplicate' policy adds a second card under the existing local lemma — never a second lemma", async () => {
    const now = Date.now()
    await createDeck(target, { id: 'target-deck', name: 'Imported', createdAt: now, updatedAt: now })
    const firstPass = await buildLinImportPreview(target, payload, deckAId, 'de')
    await importLinDeck(target, payload, deckAId, 'target-deck', 'de', firstPass)

    const secondPass = await buildLinImportPreview(target, payload, deckAId, 'de')
    const result = await importLinDeck(target, payload, deckAId, 'target-deck', 'de', secondPass, 'duplicate')
    expect(result).toEqual({ imported: 2, skipped: 0, cardsImported: 2 })

    const lemmas = await target.query(`SELECT id FROM lemmas WHERE form = ?`, ['Haus'])
    expect(lemmas).toHaveLength(1)

    const lemma = await getLemmaByForm(target, 'Haus', 'de')
    const cards = await getCardsByLemma(target, lemma!.id)
    expect(cards).toHaveLength(2)
  })
})
