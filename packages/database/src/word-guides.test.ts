import type { WordGuideEntry } from '@lingora/types'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from './migrations'
import {
  getInstalledWordGuideChunkIds,
  getWordGuide,
  installWordGuideChunk,
  uninstallWordGuideChunk,
} from './repositories/word-guides'
import { NodeSqliteAdapter } from './testing/node-sqlite-adapter'

const ERFAHREN: Omit<WordGuideEntry, 'language' | 'chunkId'> = {
  headword: 'erfahren',
  partOfSpeech: 'verb',
  usage: '3rd person: erfährt · past: erfuhr · perfect: hat erfahren',
  intro: 'To experience or to learn (find out) something.',
  synonyms: [{ word: 'erleben', gloss: 'to experience' }],
  examples: [
    { sentence: 'Ich habe viel über die Kultur erfahren.', translation: 'I learned a lot about the culture.', type: 'indicative' },
  ],
}

const HAUS: Omit<WordGuideEntry, 'language' | 'chunkId'> = {
  headword: 'Haus',
  partOfSpeech: 'noun',
  gender: 'das',
  intro: 'A building where people live.',
  synonyms: [],
  examples: [{ sentence: 'Das Haus ist groß.', translation: 'The house is big.', type: 'indicative' }],
}

describe('word_guides repository', () => {
  let db: NodeSqliteAdapter

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
  })

  afterEach(() => {
    db.close()
  })

  it('installs a chunk and looks up a word by headword, case-insensitively', async () => {
    await installWordGuideChunk(db, 1, 'de', [ERFAHREN, HAUS])

    const entry = await getWordGuide(db, 'ERFAHREN', 'de')
    expect(entry).toMatchObject({
      headword: 'erfahren',
      language: 'de',
      chunkId: 1,
      partOfSpeech: 'verb',
      synonyms: [{ word: 'erleben', gloss: 'to experience' }],
    })
    expect(entry?.examples).toHaveLength(1)
  })

  it('returns null for a word that was never installed', async () => {
    await installWordGuideChunk(db, 1, 'de', [ERFAHREN])
    expect(await getWordGuide(db, 'unbekannt', 'de')).toBeNull()
  })

  it('scopes lookups by language — the same headword in another language does not match', async () => {
    await installWordGuideChunk(db, 1, 'de', [ERFAHREN])
    expect(await getWordGuide(db, 'erfahren', 'en')).toBeNull()
  })

  it('uninstalling a chunk removes exactly its rows and nothing else — the entire uninstall story', async () => {
    await installWordGuideChunk(db, 1, 'de', [ERFAHREN])
    await installWordGuideChunk(db, 2, 'de', [HAUS])

    await uninstallWordGuideChunk(db, 1, 'de')

    expect(await getWordGuide(db, 'erfahren', 'de')).toBeNull()
    expect(await getWordGuide(db, 'Haus', 'de')).not.toBeNull()
    const remaining = await db.query('SELECT * FROM word_guides')
    expect(remaining).toHaveLength(1)
  })

  it('getInstalledWordGuideChunkIds reports installed chunks, ascending, per language', async () => {
    await installWordGuideChunk(db, 2, 'de', [HAUS])
    await installWordGuideChunk(db, 1, 'de', [ERFAHREN])

    expect(await getInstalledWordGuideChunkIds(db, 'de')).toEqual([1, 2])
    expect(await getInstalledWordGuideChunkIds(db, 'en')).toEqual([])
  })

  it('re-installing a chunk replaces its content rather than erroring or duplicating', async () => {
    await installWordGuideChunk(db, 1, 'de', [ERFAHREN])
    const updated = { ...ERFAHREN, intro: 'An updated explanation.' }
    await installWordGuideChunk(db, 1, 'de', [updated])

    const entry = await getWordGuide(db, 'erfahren', 'de')
    expect(entry?.intro).toBe('An updated explanation.')
    const rows = await db.query('SELECT * FROM word_guides')
    expect(rows).toHaveLength(1)
  })

  it('installs the real chunk-0001.json (WP2 pilot data) and looks up a real entry end-to-end', async () => {
    const chunkPath = fileURLToPath(new URL('../../../tools/word-guides/chunks/chunk-0001.json', import.meta.url))
    const chunk = JSON.parse(readFileSync(chunkPath, 'utf8')) as { entries: Omit<WordGuideEntry, 'language' | 'chunkId'>[] }
    expect(chunk.entries).toHaveLength(100)

    await installWordGuideChunk(db, 1, 'de', chunk.entries)

    expect(await getInstalledWordGuideChunkIds(db, 'de')).toEqual([1])
    const kommen = await getWordGuide(db, 'kommen', 'de')
    expect(kommen).toMatchObject({ headword: 'kommen', partOfSpeech: 'verb' })
    expect(kommen?.examples).toHaveLength(4)
    expect(kommen?.examples.map((e) => e.type).sort()).toEqual(['indicative', 'indicative', 'konjunktivII', 'passive'])
  })
})
