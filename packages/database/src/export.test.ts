import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApkgExport } from './apkg-export'
import { buildCsvImportPreview, importCsvRows, parseCsv } from './csv-import'
import { buildCsvExport } from './csv-export'
import { buildMarkdownExport } from './markdown-export'
import { getExportableCards, mergeCardsByWord } from './export-shared'
import { migrate } from './migrations'
import { createCloze } from './repositories/cloze'
import { createDeck } from './repositories/decks'
import { NodeSqliteAdapter } from './testing/node-sqlite-adapter'

describe('export formats', () => {
  let db: NodeSqliteAdapter
  let deckId: string

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
    const now = Date.now()
    deckId = 'test-deck'
    await createDeck(db, { id: deckId, name: 'Export test deck', createdAt: now, updatedAt: now })

    const { rows } = parseCsv(
      'word,meaning,example,exampleTranslation,synonyms\n' +
        'Haus,house,Das ist mein Haus.,This is my house.,Gebäude\n' +
        'ausgehen,to go out,Wir gehen heute Abend {{c1::aus}}.,We are going out tonight.,\n',
    )
    const previews = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1, example: 2, exampleTranslation: 3, synonyms: 4 },
      language: 'de',
    })
    await importCsvRows(db, previews, deckId, 'de')
  })

  afterEach(() => {
    db.close()
  })

  describe('getExportableCards', () => {
    it('returns every card with its meaning/example and re-embeds cloze markup', async () => {
      const cards = await getExportableCards(db, { deckId })
      expect(cards).toHaveLength(2)

      const haus = cards.find((c) => c.word === 'Haus')
      expect(haus).toMatchObject({ meaning: 'house', example: 'Das ist mein Haus.', isCloze: false, synonyms: ['Gebäude'] })

      const ausgehen = cards.find((c) => c.isCloze)
      expect(ausgehen?.cloze).toBe('Wir gehen heute Abend {{c1::aus}}.')
      expect(ausgehen?.example).toBeNull()
      expect(ausgehen?.exampleTranslation).toBe('We are going out tonight.')
    })

    it('still returns exactly one row for a card with more than one cloze variant', async () => {
      // A card can legitimately have several cloze_cards rows (createCloze's own doc comment: "a
      // card's second, third, ... cloze variant") — the query must pin to one of them, or a card
      // with N variants fans out into N rows for what's still one card.
      const cards = await getExportableCards(db, { deckId })
      const ausgehen = cards.find((c) => c.isCloze)!

      await createCloze(db, {
        id: crypto.randomUUID(),
        cardId: ausgehen.cardId,
        sentence: 'Ich gehe morgen [...].',
        answer: 'aus',
        translation: 'I am going out tomorrow.',
        difficulty: 'contextual',
        cefrLevel: 'A1',
      })

      const after = await getExportableCards(db, { deckId })
      expect(after.filter((c) => c.cardId === ausgehen.cardId)).toHaveLength(1)
    })

    it("blanks a cloze card's meaning instead of duplicating the example translation", async () => {
      // A note type with no separate word/meaning field (the real-world
      // Anki Cloze case) leaves meaning to fall back to the example
      // translation at import time (resolveWordAndMeaning) — exporting
      // that fallback value back out under "Meaning" would just repeat
      // "Example translation" verbatim in every format.
      const { rows } = parseCsv(
        'example,exampleTranslation\nDer Dieb wollte ins Haus {{c1::einbrechen}}.,The thief wanted to break into the house.\n',
      )
      const previews = await buildCsvImportPreview(db, rows, { mapping: { example: 0, exampleTranslation: 1 }, language: 'de' })
      await importCsvRows(db, previews, deckId, 'de')

      const cards = await getExportableCards(db, { deckId })
      const card = cards.find((c) => c.word === 'einbrechen')
      expect(card?.meaning).toBe('')
      expect(card?.exampleTranslation).toBe('The thief wanted to break into the house.')
    })

    it("also blanks a non-cloze card's meaning when it duplicates the example translation", async () => {
      // Same underlying cause as the cloze case above, but for a plain
      // vocab row: resolveWordAndMeaning's fallback isn't cloze-specific —
      // any row with Word mapped but Meaning left unmapped/empty falls
      // back to the example translation too.
      const { rows } = parseCsv(
        'word,example,exampleTranslation\nSchmetterling,Der Schmetterling fliegt.,The butterfly is flying.\n',
      )
      const previews = await buildCsvImportPreview(db, rows, {
        mapping: { word: 0, example: 1, exampleTranslation: 2 },
        language: 'de',
      })
      await importCsvRows(db, previews, deckId, 'de')

      const cards = await getExportableCards(db, { deckId })
      const card = cards.find((c) => c.word === 'Schmetterling')
      expect(card?.isCloze).toBe(false)
      expect(card?.meaning).toBe('')
      expect(card?.exampleTranslation).toBe('The butterfly is flying.')
    })
  })

  describe('buildCsvExport', () => {
    it('produces a header + one row per card, re-importable through buildCsvImportPreview', async () => {
      const csv = await buildCsvExport(db, { deckId })
      const { headers, rows } = parseCsv(csv)
      // 'tags' is omitted — neither exported card has any; 'partOfSpeech'/
      // 'cefrLevel' are never included at all (not mappable on import).
      expect(headers).toEqual(['word', 'meaning', 'cloze', 'example', 'exampleTranslation', 'synonyms'])
      expect(rows).toHaveLength(2)

      // Round-trip: re-parse the exported CSV as if importing it fresh.
      const reimported = await buildCsvImportPreview(db, rows, {
        mapping: { word: 0, meaning: 1, cloze: 2, example: 3, exampleTranslation: 4, synonyms: 5 },
        language: 'de',
      })
      // Both rows already exist (imported in beforeEach), so a re-import sees them as duplicates, not errors.
      expect(reimported.every((r) => r.status === 'duplicate')).toBe(true)
    })

    it('omits an optional column entirely when no exported card has a value for it', async () => {
      const csv = await buildCsvExport(db, { deckId })
      const { headers } = parseCsv(csv)
      expect(headers).not.toContain('tags')
      expect(headers).not.toContain('partOfSpeech')
      expect(headers).not.toContain('cefrLevel')
    })
  })

  describe('buildMarkdownExport', () => {
    it('includes a heading per card and the meaning/example text', async () => {
      const md = await buildMarkdownExport(db, { deckId, title: 'Export test deck' })
      expect(md).toContain('# Export test deck')
      expect(md).toContain('### Haus')
      expect(md).toContain('**Meaning:** house')
      // Cloze markup is fully revealed for a human-readable Markdown file, not raw {{c1::...}} syntax.
      expect(md).toContain('Wir gehen heute Abend aus.')
      expect(md).not.toContain('{{c1::')
    })
  })

  describe('buildApkgExport', () => {
    it('writes a legacy Anki collection with one note+card per card, cloze notes using the Cloze model', async () => {
      const target = new NodeSqliteAdapter()
      const cards = await getExportableCards(db, { deckId })
      await buildApkgExport(target, cards, { deckName: 'Export test deck' })

      const noteCount = await target.query<{ n: number }>('SELECT COUNT(*) AS n FROM notes')
      const cardCount = await target.query<{ n: number }>('SELECT COUNT(*) AS n FROM cards')
      expect(noteCount[0]?.n).toBe(2)
      expect(cardCount[0]?.n).toBe(2)

      const colRow = await target.querySingle<{ models: string; decks: string }>('SELECT models, decks FROM col')
      const models = JSON.parse(colRow!.models) as Record<string, { name: string; type: number }>
      const modelNames = Object.values(models).map((m) => m.name)
      expect(modelNames).toEqual(expect.arrayContaining(['Lingora Basic', 'Lingora Cloze']))

      const notes = await target.query<{ flds: string; mid: number }>('SELECT flds, mid FROM notes')
      const clozeModelId = Object.entries(models).find(([, m]) => m.type === 1)?.[0]
      const clozeNote = notes.find((n) => String(n.mid) === clozeModelId)
      expect(clozeNote?.flds).toContain('{{c1::aus}}')

      target.close()
    })
  })

  describe('mergeCardsByWord', () => {
    it('merges a word with both a basic and cloze card into one row, but leaves the raw Anki export list untouched', async () => {
      const { rows } = parseCsv(
        'word,meaning,example,exampleTranslation,cloze\n' +
          'einbrechen,to break in,Der Dieb wollte ins Haus einbrechen.,The thief wanted to break into the house.,Der Dieb wollte ins Haus {{c1::einbrechen}}.\n',
      )
      const previews = await buildCsvImportPreview(db, rows, {
        mapping: { word: 0, meaning: 1, example: 2, exampleTranslation: 3, cloze: 4 },
        language: 'de',
      })
      await importCsvRows(db, previews, deckId, 'de', 'skip', 'basic')
      const dupPreviews = await buildCsvImportPreview(db, rows, {
        mapping: { word: 0, meaning: 1, example: 2, exampleTranslation: 3, cloze: 4 },
        language: 'de',
      })
      await importCsvRows(db, dupPreviews, deckId, 'de', 'duplicate', 'cloze')

      const raw = await getExportableCards(db, { deckId })
      // 2 from beforeEach (Haus, ausgehen) + 2 for einbrechen (basic + cloze) = 4 raw cards.
      expect(raw).toHaveLength(4)
      expect(raw.filter((c) => c.word === 'einbrechen')).toHaveLength(2)

      const merged = mergeCardsByWord(raw)
      expect(merged).toHaveLength(3)
      const einbrechen = merged.find((c) => c.word === 'einbrechen')
      expect(einbrechen).toMatchObject({
        meaning: 'to break in',
        example: 'Der Dieb wollte ins Haus einbrechen.',
        cloze: 'Der Dieb wollte ins Haus {{c1::einbrechen}}.',
        exampleTranslation: 'The thief wanted to break into the house.',
      })
    })

    it('produces a single CSV row and a single Markdown block for a word with both card types', async () => {
      const { rows } = parseCsv(
        'word,meaning,example,exampleTranslation,cloze\n' +
          'einbrechen,to break in,Der Dieb wollte ins Haus einbrechen.,The thief wanted to break into the house.,Der Dieb wollte ins Haus {{c1::einbrechen}}.\n',
      )
      const previews = await buildCsvImportPreview(db, rows, {
        mapping: { word: 0, meaning: 1, example: 2, exampleTranslation: 3, cloze: 4 },
        language: 'de',
      })
      await importCsvRows(db, previews, deckId, 'de', 'skip', 'basic')
      const dupPreviews = await buildCsvImportPreview(db, rows, {
        mapping: { word: 0, meaning: 1, example: 2, exampleTranslation: 3, cloze: 4 },
        language: 'de',
      })
      await importCsvRows(db, dupPreviews, deckId, 'de', 'duplicate', 'cloze')

      const csv = await buildCsvExport(db, { deckId })
      const einbrechenRows = csv.split('\r\n').filter((line) => line.startsWith('einbrechen,'))
      expect(einbrechenRows).toHaveLength(1)

      const md = await buildMarkdownExport(db, { deckId })
      expect(md.match(/### einbrechen/g)).toHaveLength(1)
    })
  })
})
