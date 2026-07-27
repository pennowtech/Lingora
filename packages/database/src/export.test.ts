import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApkgExport } from './apkg-export'
import { buildCsvImportPreview, importCsvRows, parseCsv } from './csv-import'
import { buildCsvExport } from './csv-export'
import { buildMarkdownExport } from './markdown-export'
import { getExportableCards } from './export-shared'
import { migrate } from './migrations'
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
      'word,meaning,example,exampleTranslation,synonyms,tags\n' +
        'Haus,house,Das ist mein Haus.,This is my house.,Gebäude,vocab\n' +
        'ausgehen,to go out,Wir gehen heute Abend {{c1::aus}}.,We are going out tonight.,,cloze\n',
    )
    const previews = await buildCsvImportPreview(db, rows, {
      mapping: { word: 0, meaning: 1, example: 2, exampleTranslation: 3, synonyms: 4, tags: 5 },
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
      expect(ausgehen?.example).toBe('Wir gehen heute Abend {{c1::aus}}.')
      expect(ausgehen?.exampleTranslation).toBe('We are going out tonight.')
    })
  })

  describe('buildCsvExport', () => {
    it('produces a header + one row per card, re-importable through buildCsvImportPreview', async () => {
      const csv = await buildCsvExport(db, { deckId })
      const { headers, rows } = parseCsv(csv)
      expect(headers).toEqual(['word', 'meaning', 'example', 'exampleTranslation', 'synonyms', 'partOfSpeech', 'cefrLevel', 'tags'])
      expect(rows).toHaveLength(2)

      // Round-trip: re-parse the exported CSV as if importing it fresh.
      const reimported = await buildCsvImportPreview(db, rows, {
        mapping: { word: 0, meaning: 1, example: 2, exampleTranslation: 3, synonyms: 4, partOfSpeech: 5, cefrLevel: 6, tags: 7 },
        language: 'de',
      })
      // Both rows already exist (imported in beforeEach), so a re-import sees them as duplicates, not errors.
      expect(reimported.every((r) => r.status === 'duplicate')).toBe(true)
    })
  })

  describe('buildMarkdownExport', () => {
    it('includes a heading per card and the meaning/example text', async () => {
      const md = await buildMarkdownExport(db, { deckId, title: 'Export test deck' })
      expect(md).toContain('# Export test deck')
      expect(md).toContain('### Haus')
      expect(md).toContain('**Meaning:** house')
      expect(md).toContain('Wir gehen heute Abend {{c1::aus}}.')
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
})
