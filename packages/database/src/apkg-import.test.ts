import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from './migrations'
import { createDeck } from './repositories/decks'
import { getLemmaByForm } from './repositories/lemmas'
import { NodeSqliteAdapter } from './testing/node-sqlite-adapter'
import {
  buildApkgImportPreview,
  dominantNoteType,
  importApkgNotes,
  readAnkiCollection,
  stripAnkiHtml,
  type AnkiNote,
} from './apkg-import'

const FIELD_SEPARATOR = '\x1f'

/** Builds a minimal legacy-schema (single `col` row, JSON blobs) Anki collection for tests. */
async function seedAnkiCollection(db: NodeSqliteAdapter): Promise<void> {
  await db.executeScript(`
    CREATE TABLE notes (id INTEGER PRIMARY KEY, mid INTEGER NOT NULL, flds TEXT NOT NULL, tags TEXT NOT NULL);
    CREATE TABLE cards (id INTEGER PRIMARY KEY, nid INTEGER NOT NULL, did INTEGER NOT NULL);
    CREATE TABLE col (id INTEGER PRIMARY KEY, decks TEXT NOT NULL, models TEXT NOT NULL);
  `)
  await db.execute(`INSERT INTO notes (id, mid, flds, tags) VALUES (?, ?, ?, ?)`, [
    1,
    900,
    ['Haus', 'house', 'Das <b>Haus</b> ist groß.<br>Zweite Zeile.'].join(FIELD_SEPARATOR),
    ' common home ',
  ])
  await db.execute(`INSERT INTO notes (id, mid, flds, tags) VALUES (?, ?, ?, ?)`, [
    2,
    900,
    ['', 'missing word'].join(FIELD_SEPARATOR),
    '',
  ])
  await db.execute(`INSERT INTO cards (id, nid, did) VALUES (?, ?, ?)`, [10, 1, 100])
  await db.execute(`INSERT INTO cards (id, nid, did) VALUES (?, ?, ?)`, [20, 2, 100])
  await db.execute(`INSERT INTO col (id, decks, models) VALUES (?, ?, ?)`, [
    1,
    JSON.stringify({ '100': { id: 100, name: 'German::Vocab' } }),
    JSON.stringify({
      '900': { id: 900, name: 'Basic', flds: [{ name: 'German' }, { name: 'English' }, { name: 'Example' }] },
    }),
  ])
}

describe('stripAnkiHtml', () => {
  it('strips media references, tags, and decodes common entities', () => {
    expect(stripAnkiHtml('Das <b>Haus</b>[sound:word.mp3]<img src="x.jpg">')).toBe('Das Haus')
    expect(stripAnkiHtml('Line one<br>Line two')).toBe('Line one\nLine two')
    expect(stripAnkiHtml('Tom &amp; Jerry &quot;fun&quot;')).toBe('Tom & Jerry "fun"')
  })
})

describe('readAnkiCollection', () => {
  let ankiDb: NodeSqliteAdapter

  beforeEach(async () => {
    ankiDb = new NodeSqliteAdapter()
    await seedAnkiCollection(ankiDb)
  })

  afterEach(() => ankiDb.close())

  it('reads notes with split fields, trimmed tags, and their first card deck', async () => {
    const { notes } = await readAnkiCollection(ankiDb)
    expect(notes).toHaveLength(2)
    expect(notes[0]).toMatchObject({ id: 1, tags: ['common', 'home'], deckId: 100 })
    expect(notes[0]?.fields[0]).toBe('Haus')
  })

  it('reads deck names from the col.decks JSON blob, stripping the Anki subdeck path', async () => {
    const { decks } = await readAnkiCollection(ankiDb)
    expect(decks).toEqual([{ id: 100, name: 'Vocab' }])
  })

  it('reads note-type field names from the col.models JSON blob', async () => {
    const { noteTypes } = await readAnkiCollection(ankiDb)
    expect(noteTypes).toEqual([{ id: 900, name: 'Basic', fieldNames: ['German', 'English', 'Example'] }])
  })

  it('dominantNoteType picks the note type with the most notes', async () => {
    const { notes, noteTypes } = await readAnkiCollection(ankiDb)
    expect(dominantNoteType(notes, noteTypes)).toEqual({
      id: 900,
      name: 'Basic',
      fieldNames: ['German', 'English', 'Example'],
    })
    expect(dominantNoteType([], noteTypes)).toEqual({ id: 900, name: 'Basic', fieldNames: ['German', 'English', 'Example'] })
    expect(dominantNoteType(notes, [])).toBeNull()
  })

  it('degrades gracefully when col.decks/col.models are missing', async () => {
    const bareDb = new NodeSqliteAdapter()
    await bareDb.executeScript(`
      CREATE TABLE notes (id INTEGER PRIMARY KEY, mid INTEGER NOT NULL, flds TEXT NOT NULL, tags TEXT NOT NULL);
      CREATE TABLE cards (id INTEGER PRIMARY KEY, nid INTEGER NOT NULL, did INTEGER NOT NULL);
    `)
    const { notes, decks, noteTypes } = await readAnkiCollection(bareDb)
    expect(notes).toEqual([])
    expect(noteTypes).toEqual([])
    expect(decks).toEqual([])
    bareDb.close()
  })
})

describe('buildApkgImportPreview / importApkgNotes', () => {
  let ankiDb: NodeSqliteAdapter
  let lingoraDb: NodeSqliteAdapter
  let notes: AnkiNote[]
  let deckId: string

  beforeEach(async () => {
    ankiDb = new NodeSqliteAdapter()
    await seedAnkiCollection(ankiDb)
    notes = (await readAnkiCollection(ankiDb)).notes

    lingoraDb = new NodeSqliteAdapter()
    await migrate(lingoraDb)
    const now = Date.now()
    deckId = 'test-deck'
    await createDeck(lingoraDb, { id: deckId, name: 'Anki import test deck', createdAt: now, updatedAt: now })
  })

  afterEach(() => {
    ankiDb.close()
    lingoraDb.close()
  })

  it('maps fields, strips HTML, and flags the empty-word note as an error', async () => {
    const previews = await buildApkgImportPreview(lingoraDb, notes, {
      mapping: { word: 0, meaning: 1, example: 2 },
      language: 'de',
    })

    expect(previews[0]).toMatchObject({ status: 'ok', word: 'Haus', meaning: 'house', tags: ['common', 'home'] })
    expect(previews[0]?.example).toBe('Das Haus ist groß.\nZweite Zeile.')
    expect(previews[1]?.status).toBe('error')
  })

  it('imports ok notes transactionally with tags, counts skipped/failed, and reports progress', async () => {
    const previews = await buildApkgImportPreview(lingoraDb, notes, {
      mapping: { word: 0, meaning: 1, example: 2 },
      language: 'de',
    })

    const progressCalls: Array<[number, number]> = []
    const result = await importApkgNotes(lingoraDb, previews, deckId, 'de', 'en', {
      onProgress: (done, total) => progressCalls.push([done, total]),
    })

    expect(result).toEqual({ imported: 1, skipped: 0, failed: 1, cancelled: false })
    expect(progressCalls).toEqual([
      [1, 2],
      [2, 2],
    ])

    const lemma = await getLemmaByForm(lingoraDb, 'Haus', 'de')
    expect(lemma).not.toBeNull()

    const tags = await lingoraDb.query<{ name: string }>(
      `SELECT t.name FROM tags t JOIN card_tags ct ON ct.tag_id = t.id JOIN cards c ON c.id = ct.card_id WHERE c.lemma_id = ?`,
      [lemma?.id],
    )
    expect(tags.map((t) => t.name).sort()).toEqual(['common', 'home'])
  })

  it('stops early and reports cancelled when shouldCancel returns true', async () => {
    const previews = await buildApkgImportPreview(lingoraDb, notes, {
      mapping: { word: 0, meaning: 1 },
      language: 'de',
    })

    const result = await importApkgNotes(lingoraDb, previews, deckId, 'de', 'en', { shouldCancel: () => true })
    expect(result).toEqual({ imported: 0, skipped: 0, failed: 0, cancelled: true })
  })
})
