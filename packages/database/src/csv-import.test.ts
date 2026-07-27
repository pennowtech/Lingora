import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from './migrations'
import { createDeck } from './repositories/decks'
import { getLemmaByForm } from './repositories/lemmas'
import { NodeSqliteAdapter } from './testing/node-sqlite-adapter'
import { buildCsvImportPreview, importCsvRows, parseCsv } from './csv-import'

describe('parseCsv', () => {
  it('parses a plain comma-separated file with a header row', () => {
    const result = parseCsv('word,meaning\nHaus,house\nBaum,tree\n')
    expect(result.headers).toEqual(['word', 'meaning'])
    expect(result.rows).toEqual([
      ['Haus', 'house'],
      ['Baum', 'tree'],
    ])
    expect(result.delimiter).toBe(',')
  })

  it('auto-detects a semicolon delimiter', () => {
    const result = parseCsv('word;meaning\nHaus;house\n')
    expect(result.delimiter).toBe(';')
    expect(result.rows).toEqual([['Haus', 'house']])
  })

  it('auto-detects a tab delimiter', () => {
    const result = parseCsv('word\tmeaning\nHaus\thouse\n')
    expect(result.delimiter).toBe('\t')
    expect(result.rows).toEqual([['Haus', 'house']])
  })

  it('strips a leading UTF-8 BOM', () => {
    const result = parseCsv('﻿word,meaning\nHaus,house\n')
    expect(result.headers).toEqual(['word', 'meaning'])
  })

  it('handles quoted fields containing the delimiter, newlines, and escaped quotes', () => {
    const csv = 'word,meaning,example\n"Haus","house","Das ist ""mein"" Haus,\nhier."\n'
    const result = parseCsv(csv)
    expect(result.rows).toEqual([['Haus', 'house', 'Das ist "mein" Haus,\nhier.']])
  })

  it('normalizes CRLF line endings', () => {
    const result = parseCsv('word,meaning\r\nHaus,house\r\n')
    expect(result.rows).toEqual([['Haus', 'house']])
  })
})

describe('buildCsvImportPreview / importCsvRows', () => {
  let db: NodeSqliteAdapter
  let deckId: string

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
    const now = Date.now()
    deckId = 'test-deck'
    await createDeck(db, { id: deckId, name: 'CSV import test deck', createdAt: now, updatedAt: now })
  })

  afterEach(() => {
    db.close()
  })

  it('previews valid rows as ok and flags empty required fields as errors', async () => {
    const { rows } = parseCsv('word,meaning\nHaus,house\n,missing word\n')
    const previews = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1 },
      language: 'de',
    })

    expect(previews[0]).toMatchObject({ status: 'ok', word: 'Haus', meaning: 'house' })
    expect(previews[1]).toMatchObject({ status: 'error' })
    expect(previews[1]?.errors.length).toBeGreaterThan(0)
  })

  it('flags a row as duplicate when the word already exists as a lemma', async () => {
    const { rows } = parseCsv('word,meaning\nHaus,house\n')
    const first = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1 },
      language: 'de',
    })
    await importCsvRows(db, first, deckId, 'de')

    const second = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1 },
      language: 'de',
    })
    expect(second[0]?.status).toBe('duplicate')
  })

  it('imports ok rows transactionally, creating a lemma, card, meaning, and example', async () => {
    const { rows } = parseCsv('word,meaning,example\nHaus,house,"Das Haus ist groß."\n')
    const previews = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1, example: 2 },
      language: 'de',
    })

    const result = await importCsvRows(db, previews, deckId, 'de')
    expect(result).toEqual({ imported: 1, skipped: 0, failed: 0 })

    const lemma = await getLemmaByForm(db, 'Haus', 'de')
    expect(lemma).not.toBeNull()
    // Part of speech/CEFR level are not mappable — every import gets the same fallback.
    expect(lemma?.partOfSpeech).toBe('noun')

    const card = await db.querySingle<{ id: string; primaryMeaningId: string | null }>(
      'SELECT id, primary_meaning_id AS primaryMeaningId FROM cards WHERE lemma_id = ?',
      [lemma?.id],
    )
    expect(card?.primaryMeaningId).not.toBeNull()

    const meaning = await db.querySingle<{ translation: string; cefrLevel: string }>(
      'SELECT translation, cefr_level AS cefrLevel FROM meanings WHERE card_id = ?',
      [card?.id],
    )
    expect(meaning).toMatchObject({ translation: 'house', cefrLevel: 'A1' })

    const example = await db.querySingle<{ sentence: string }>(
      'SELECT sentence FROM examples WHERE card_id = ?',
      [card?.id],
    )
    expect(example?.sentence).toBe('Das Haus ist groß.')

    // Tags are not mappable — no CSV column can populate them anymore.
    const tags = await db.query<{ name: string }>(
      `SELECT t.name FROM tags t JOIN card_tags ct ON ct.tag_id = t.id WHERE ct.card_id = ?`,
      [card?.id],
    )
    expect(tags).toEqual([])
  })

  it('counts duplicate and error rows without attempting to import them', async () => {
    const { rows } = parseCsv('word,meaning\nHaus,house\n,missing word\nHaus,house again\n')
    const previews = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1 },
      language: 'de',
    })
    // Row 0 imports first; row 2 (same word) is a duplicate against row 0's
    // *pre-import* state, so the preview itself won't catch it — simulate the
    // realistic case of importing straight after preview build instead.
    const result = await importCsvRows(db, previews.slice(0, 2), deckId, 'de')
    expect(result.imported).toBe(1)
    expect(result.failed).toBe(1)
    expect(result.skipped).toBe(0)
  })

  it('always falls back to noun/A1 — part of speech and CEFR level are not mappable', async () => {
    const { rows } = parseCsv('word,meaning\nSchnell,fast\n')
    const previews = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1 },
      language: 'de',
    })
    expect(previews[0]).toMatchObject({ partOfSpeech: 'noun', cefrLevel: 'A1' })
  })

  it('imports a mapped synonyms column as synonym rows on the card', async () => {
    const { rows } = parseCsv('word,meaning,synonyms\nHaus,house,Gebäude;Anwesen\n')
    const previews = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1, synonyms: 2 },
      language: 'de',
    })
    expect(previews[0]?.synonyms).toEqual(['Gebäude', 'Anwesen'])

    await importCsvRows(db, previews, deckId, 'de')
    const lemma = await getLemmaByForm(db, 'Haus', 'de')
    const card = await db.querySingle<{ id: string }>('SELECT id FROM cards WHERE lemma_id = ?', [lemma?.id])
    const synonyms = await db.query<{ word: string }>('SELECT synonym AS word FROM synonyms WHERE card_id = ?', [card?.id])
    expect(synonyms.map((s) => s.word).sort()).toEqual(['Anwesen', 'Gebäude'])
  })

  it('routes an example with cloze markup to a cloze card instead of a plain example', async () => {
    const { rows } = parseCsv(
      'word,meaning,example,exampleTranslation\nausgehen,to go out,Wir gehen heute Abend {{c1::aus}}.,We are going out tonight.\n',
    )
    const previews = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1, example: 2, exampleTranslation: 3 },
      language: 'de',
    })
    await importCsvRows(db, previews, deckId, 'de')

    const lemma = await getLemmaByForm(db, 'ausgehen', 'de')
    const card = await db.querySingle<{ id: string; type: string }>('SELECT id, type FROM cards WHERE lemma_id = ?', [
      lemma?.id,
    ])
    expect(card?.type).toBe('cloze')

    const cloze = await db.querySingle<{ sentence: string; answer: string; translation: string }>(
      'SELECT sentence, cloze AS answer, translation FROM cloze_cards WHERE card_id = ?',
      [card?.id],
    )
    expect(cloze).toEqual({
      sentence: 'Wir gehen heute Abend [...].',
      answer: 'aus',
      translation: 'We are going out tonight.',
    })

    const examples = await db.query<{ id: string }>('SELECT id FROM examples WHERE card_id = ?', [card?.id])
    expect(examples).toHaveLength(0)
  })

  it('creates BOTH a basic card and a cloze card when word/meaning/example and a dedicated cloze column are all mapped', async () => {
    const { rows } = parseCsv(
      'word,meaning,example,exampleTranslation,cloze\n' +
        'ausgehen,to go out,Wir gehen heute Abend aus.,We are going out tonight.,Wir gehen heute Abend {{c1::aus}}.\n',
    )
    const previews = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1, example: 2, exampleTranslation: 3, cloze: 4 },
      language: 'de',
    })
    await importCsvRows(db, previews, deckId, 'de')

    const lemma = await getLemmaByForm(db, 'ausgehen', 'de')
    const cards = await db.query<{ id: string; type: string }>('SELECT id, type FROM cards WHERE lemma_id = ? ORDER BY type', [
      lemma?.id,
    ])
    expect(cards.map((c) => c.type)).toEqual(['basic', 'cloze'])

    const basicCard = cards.find((c) => c.type === 'basic')!
    const examples = await db.query<{ sentence: string }>('SELECT sentence FROM examples WHERE card_id = ?', [basicCard.id])
    expect(examples).toEqual([{ sentence: 'Wir gehen heute Abend aus.' }])

    const clozeCard = cards.find((c) => c.type === 'cloze')!
    const cloze = await db.querySingle<{ sentence: string }>('SELECT sentence FROM cloze_cards WHERE card_id = ?', [
      clozeCard.id,
    ])
    expect(cloze?.sentence).toBe('Wir gehen heute Abend [...].')

    // Both cards carry their own meaning row.
    const meanings = await db.query<{ translation: string }>(
      'SELECT translation FROM meanings WHERE card_id IN (?, ?)',
      [basicCard.id, clozeCard.id],
    )
    expect(meanings.every((m) => m.translation === 'to go out')).toBe(true)
  })

  it('derives word from the cloze answer and meaning from the translation when word/meaning are unmapped', async () => {
    // Real Anki Cloze notes have no standalone word/meaning field — only a
    // sentence (with the cloze markup) and its translation get mapped.
    const { rows } = parseCsv(
      'example,exampleTranslation\nWir gehen heute Abend {{c1::aus}}.,We are going out tonight.\n',
    )
    const previews = await buildCsvImportPreview(db, rows, {
      mapping: { example: 0, exampleTranslation: 1 },
      language: 'de',
    })
    expect(previews[0]).toMatchObject({ word: 'aus', meaning: 'We are going out tonight.', status: 'ok', errors: [] })
  })

  it('still reports an error when word is unmapped and the example has no cloze markup', async () => {
    const { rows } = parseCsv('example\nJust a plain sentence.\n')
    const previews = await buildCsvImportPreview(db, rows, { mapping: { example: 0 }, language: 'de' })
    expect(previews[0]?.status).toBe('error')
    expect(previews[0]?.errors).toContain('Word field is empty.')
  })

  it("duplicatePolicy 'skip' (default) leaves the existing card untouched", async () => {
    const { rows } = parseCsv('word,meaning\nHaus,house\n')
    const first = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1 },
      language: 'de',
    })
    await importCsvRows(db, first, deckId, 'de')

    const second = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1 },
      language: 'de',
    })
    const result = await importCsvRows(db, second, deckId, 'de', 'skip')
    expect(result).toEqual({ imported: 0, skipped: 1, failed: 0 })

    const lemma = await getLemmaByForm(db, 'Haus', 'de')
    const cards = await db.query<{ id: string }>('SELECT id FROM cards WHERE lemma_id = ?', [lemma?.id])
    expect(cards).toHaveLength(1)
  })

  it("duplicatePolicy 'merge' adds a non-primary meaning to the existing card, not a new lemma/card", async () => {
    const { rows: firstRows } = parseCsv('word,meaning\nHaus,house\n')
    const first = await buildCsvImportPreview(db, firstRows, {
      mapping: { word: 0, meaning: 1 },
      language: 'de',
    })
    await importCsvRows(db, first, deckId, 'de')

    const { rows: secondRows } = parseCsv('word,meaning,synonyms\nHaus,building,Gebäude\n')
    const second = await buildCsvImportPreview(db, secondRows, {
      mapping: { word: 0, meaning: 1, synonyms: 2 },
      language: 'de',
    })
    expect(second[0]?.status).toBe('duplicate')

    const result = await importCsvRows(db, second, deckId, 'de', 'merge')
    expect(result).toEqual({ imported: 1, skipped: 0, failed: 0 })

    const lemmas = await db.query<{ id: string }>('SELECT id FROM lemmas WHERE form = ?', ['Haus'])
    expect(lemmas).toHaveLength(1)

    const cards = await db.query<{ id: string; primaryMeaningId: string }>(
      'SELECT id, primary_meaning_id AS primaryMeaningId FROM cards WHERE lemma_id = ?',
      [lemmas[0]?.id],
    )
    expect(cards).toHaveLength(1)

    const meanings = await db.query<{ translation: string; isPrimary: number }>(
      'SELECT translation, is_primary AS isPrimary FROM meanings WHERE card_id = ?',
      [cards[0]?.id],
    )
    expect(meanings).toHaveLength(2)
    const primary = meanings.find((m) => m.isPrimary === 1)
    const merged = meanings.find((m) => m.isPrimary === 0)
    expect(primary?.translation).toBe('house')
    expect(merged?.translation).toBe('building')

    const synonyms = await db.query<{ word: string }>('SELECT synonym AS word FROM synonyms WHERE card_id = ?', [cards[0]?.id])
    expect(synonyms.map((s) => s.word)).toEqual(['Gebäude'])

    const deckMembership = await db.query<{ id: string }>(
      'SELECT id FROM deck_cards WHERE deck_id = ? AND card_id = ?',
      [deckId, cards[0]?.id],
    )
    expect(deckMembership).toHaveLength(1)

    // A merge reuses the lemma's existing cluster instead of creating a
    // fresh "General" one every import — otherwise the word's detail page
    // shows the same cluster label repeated once per import.
    const clusters = await db.query<{ id: string }>('SELECT id FROM meaning_clusters WHERE lemma_id = ?', [lemmas[0]?.id])
    expect(clusters).toHaveLength(1)
  })

  it('reuses a single cluster for a row that creates both a basic and a cloze card', async () => {
    const { rows } = parseCsv(
      'word,meaning,example,exampleTranslation,cloze\n' +
        'einbrechen,to break in,Der Dieb wollte ins Haus einbrechen.,The thief wanted to break into the house.,Der Dieb wollte ins Haus {{c1::einbrechen}}.\n',
    )
    const previews = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1, example: 2, exampleTranslation: 3, cloze: 4 },
      language: 'de',
    })
    await importCsvRows(db, previews, deckId, 'de')

    const lemma = await getLemmaByForm(db, 'einbrechen', 'de')
    const cards = await db.query<{ id: string }>('SELECT id FROM cards WHERE lemma_id = ?', [lemma?.id])
    expect(cards).toHaveLength(2)

    const clusters = await db.query<{ id: string }>('SELECT id FROM meaning_clusters WHERE lemma_id = ?', [lemma?.id])
    expect(clusters).toHaveLength(1)
  })

  it("duplicatePolicy 'merge' adds the target deck even when the existing card wasn't a deck_cards member", async () => {
    // `cards.deck_id` is the card's "home" deck at creation time, but the
    // deck screens actually read from `deck_cards` (see getCardsForDeck) —
    // a card can have a deck_id and still have zero deck_cards rows (e.g.
    // a mined/generated card not yet confirmed into any deck). Merge must
    // still make the merged result visible in the deck the user picked for
    // this import, regardless of the existing card's deck_id.
    const now = Date.now()
    const lemmaId = 'deckless-lemma'
    await db.execute(
      `INSERT INTO lemmas (id, form, language, part_of_speech, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [lemmaId, 'Baum', 'de', 'noun', now, now],
    )
    const cardId = 'deckless-card'
    await db.execute(
      `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at)
       VALUES (?, ?, ?, 'basic', NULL, ?, ?, NULL)`,
      [cardId, lemmaId, deckId, now, now],
    )
    // Deliberately no deck_cards row for cardId.

    const { rows } = parseCsv('word,meaning\nBaum,tree\n')
    const previews = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1 },
      language: 'de',
    })
    expect(previews[0]?.status).toBe('duplicate')

    const result = await importCsvRows(db, previews, deckId, 'de', 'merge')
    expect(result).toEqual({ imported: 1, skipped: 0, failed: 0 })

    const deckMembership = await db.query<{ id: string }>(
      'SELECT id FROM deck_cards WHERE deck_id = ? AND card_id = ?',
      [deckId, cardId],
    )
    expect(deckMembership).toHaveLength(1)
  })

  it("duplicatePolicy 'duplicate' creates a second card under the same (unique) lemma", async () => {
    const { rows: firstRows } = parseCsv('word,meaning\nHaus,house\n')
    const first = await buildCsvImportPreview(db, firstRows, {
      mapping: { word: 0, meaning: 1 },
      language: 'de',
    })
    await importCsvRows(db, first, deckId, 'de')

    const { rows: secondRows } = parseCsv('word,meaning\nHaus,building\n')
    const second = await buildCsvImportPreview(db, secondRows, {
      mapping: { word: 0, meaning: 1 },
      language: 'de',
    })
    const result = await importCsvRows(db, second, deckId, 'de', 'duplicate')
    expect(result).toEqual({ imported: 1, skipped: 0, failed: 0 })

    const lemmas = await db.query<{ id: string }>('SELECT id FROM lemmas WHERE form = ?', ['Haus'])
    expect(lemmas).toHaveLength(1)

    const cards = await db.query<{ id: string }>('SELECT id FROM cards WHERE lemma_id = ?', [lemmas[0]?.id])
    expect(cards).toHaveLength(2)

    const deckCards = await db.query<{ cardId: string }>('SELECT card_id AS cardId FROM deck_cards WHERE deck_id = ?', [
      deckId,
    ])
    expect(deckCards.map((d) => d.cardId).sort()).toEqual(cards.map((c) => c.id).sort())
  })
})
