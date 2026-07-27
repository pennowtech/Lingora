import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildCsvImportPreview, importCsvRows, parseCsv } from './csv-import'
import { migrate } from './migrations'
import { createDeck } from './repositories/decks'
import { seedDatabase } from './seed_dummy_data'
import { NodeSqliteAdapter } from './testing/node-sqlite-adapter'
import {
  BACKUP_FORMAT_VERSION,
  BackupValidationError,
  createBackup,
  createDeckBackup,
  parseBackup,
  restoreBackup,
  type BackupPayload,
} from './backup'

describe('backup / restore', () => {
  let db: NodeSqliteAdapter

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
    await seedDatabase(db)
  })

  afterEach(() => {
    db.close()
  })

  it('exports every backed-up table with rows from the seed data', async () => {
    const backup = await createBackup(db, { defaultCefr: 'B1' }, '1.0.0')

    expect(backup.formatVersion).toBe(BACKUP_FORMAT_VERSION)
    expect(backup.tables.lemmas?.length).toBeGreaterThan(0)
    expect(backup.tables.cards?.length).toBeGreaterThan(0)
    expect(backup.tables.decks?.length).toBeGreaterThan(0)
  })

  it('never includes an API key — none exists in the schema by construction', async () => {
    const backup = await createBackup(db, {}, '1.0.0')
    const serialized = JSON.stringify(backup)
    expect(serialized.toLowerCase()).not.toContain('apikey')
    expect(serialized.toLowerCase()).not.toContain('api_key')
  })

  it('round-trips through JSON without losing or altering rows', async () => {
    const backup = await createBackup(db, { defaultCefr: 'B2', translationProvider: 'google' }, '1.0.0')
    const parsed = parseBackup(JSON.stringify(backup))
    expect(parsed).toEqual(backup)
  })

  it('restores exactly the backed-up row counts, replacing whatever was there', async () => {
    const before = await createBackup(db, {}, '1.0.0')
    const beforeLemmaCount = before.tables.lemmas?.length ?? 0

    // Simulate drift since the backup was taken: an extra card the backup doesn't know about.
    await db.execute(
      `INSERT INTO lemmas (id, form, language, part_of_speech, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ['stray-lemma', 'Fremdwort', 'de', 'noun', Date.now(), Date.now()],
    )
    const drifted = await db.query('SELECT * FROM lemmas')
    expect(drifted.length).toBe(beforeLemmaCount + 1)

    const result = await restoreBackup(db, before)
    expect(result.tableCounts.lemmas).toBe(beforeLemmaCount)

    const after = await db.query<{ id: string }>('SELECT id FROM lemmas')
    expect(after.length).toBe(beforeLemmaCount)
    expect(after.some((row) => row.id === 'stray-lemma')).toBe(false)
  })

  it('restoring a full export leaves the database byte-for-byte equivalent', async () => {
    const before = await createBackup(db, {}, '1.0.0')
    await restoreBackup(db, before)
    const after = await createBackup(db, {}, '1.0.0')
    expect(after.tables).toEqual(before.tables)
  })

  it('rejects a file that is not valid JSON', () => {
    expect(() => parseBackup('not json')).toThrow(BackupValidationError)
  })

  it('rejects an unsupported format version', () => {
    const payload: BackupPayload = {
      formatVersion: 999,
      exportedAt: Date.now(),
      appVersion: '1.0.0',
      settings: {},
      tables: {},
    }
    expect(() => parseBackup(JSON.stringify(payload))).toThrow(BackupValidationError)
  })

  it('rejects a backup with an unrecognized column', () => {
    const raw = JSON.stringify({
      formatVersion: BACKUP_FORMAT_VERSION,
      exportedAt: Date.now(),
      appVersion: '1.0.0',
      settings: {},
      tables: { lemmas: [{ id: 'x', form: 'x', apiKey: 'sk-should-never-be-here' }] },
    })
    expect(() => parseBackup(raw)).toThrow(BackupValidationError)
  })

  it('rejects an unknown table name', () => {
    const raw = JSON.stringify({
      formatVersion: BACKUP_FORMAT_VERSION,
      exportedAt: Date.now(),
      appVersion: '1.0.0',
      settings: {},
      tables: { not_a_real_table: [{ id: 'x' }] },
    })
    expect(() => parseBackup(raw)).toThrow(BackupValidationError)
  })

  it('rolls back entirely if a restore fails partway through', async () => {
    const before = await db.query('SELECT * FROM lemmas')

    const corrupt: BackupPayload = {
      formatVersion: BACKUP_FORMAT_VERSION,
      exportedAt: Date.now(),
      appVersion: '1.0.0',
      settings: {},
      tables: {
        // meanings references cards/meaning_clusters that don't exist in this
        // payload — the FK violation should abort the whole transaction.
        meanings: [
          {
            id: 'orphan-meaning',
            card_id: 'missing-card',
            meaning_cluster_id: 'missing-cluster',
            translation: 'x',
            is_primary: 0,
            cefr_level: 'A1',
            order_index: 0,
          },
        ],
      },
    }

    await expect(restoreBackup(db, corrupt)).rejects.toThrow()

    const after = await db.query('SELECT * FROM lemmas')
    expect(after).toEqual(before)
  })

  describe('createDeckBackup', () => {
    it("includes only the target deck's own cards and their content", async () => {
      const backup = await createDeckBackup(db, 'deck-default', {}, '1.0.0')
      expect(backup.tables.decks).toHaveLength(1)
      expect(backup.tables.decks?.[0]).toMatchObject({ id: 'deck-default' })
      expect(backup.tables.cards).toHaveLength(1)
      expect(backup.tables.cards?.[0]).toMatchObject({ id: 'card-ausgehen' })
      expect(backup.tables.meanings?.length).toBeGreaterThan(0)
      expect(backup.tables.cloze_cards?.length).toBeGreaterThan(0)
    })

    it('omits mining queue and evaluations, and never includes an API key', async () => {
      const backup = await createDeckBackup(db, 'deck-default', {}, '1.0.0')
      expect(backup.tables.sentence_mining_queue).toBeUndefined()
      expect(backup.tables.evaluations).toBeUndefined()
      expect(JSON.stringify(backup)).not.toMatch(/api[_-]?key/i)
    })

    it("excludes another deck's cards, lemmas, and meanings entirely", async () => {
      const now = Date.now()
      await createDeck(db, { id: 'other-deck', name: 'Other', createdAt: now, updatedAt: now })
      const { rows } = parseCsv('word,meaning\nHund,dog\n')
      const previews = await buildCsvImportPreview(db, rows, { mapping: { word: 0, meaning: 1 }, language: 'de' })
      await importCsvRows(db, previews, 'other-deck', 'de')

      const deckDefaultBackup = await createDeckBackup(db, 'deck-default', {}, '1.0.0')
      expect(deckDefaultBackup.tables.decks?.map((d) => d.id)).toEqual(['deck-default'])
      expect(deckDefaultBackup.tables.lemmas?.map((l) => l.form)).not.toContain('Hund')
      expect(deckDefaultBackup.tables.cards).toHaveLength(1)

      const otherDeckBackup = await createDeckBackup(db, 'other-deck', {}, '1.0.0')
      expect(otherDeckBackup.tables.decks?.map((d) => d.id)).toEqual(['other-deck'])
      expect(otherDeckBackup.tables.lemmas?.map((l) => l.form)).toEqual(['Hund'])
      expect(otherDeckBackup.tables.lemmas?.map((l) => l.form)).not.toContain('ausgehen')
      expect(otherDeckBackup.tables.cards).toHaveLength(1)
    })

    it('returns empty card-scoped tables for a deck with no cards', async () => {
      const now = Date.now()
      await db.execute(`INSERT INTO decks (id, name, parent_id, created_at, updated_at) VALUES (?, ?, NULL, ?, ?)`, [
        'empty-deck',
        'Empty',
        now,
        now,
      ])
      const backup = await createDeckBackup(db, 'empty-deck', {}, '1.0.0')
      expect(backup.tables.cards).toEqual([])
      expect(backup.tables.decks).toHaveLength(1)
      // Reference tables are still included in full, regardless of deck.
      expect(backup.tables.templates?.length).toBeGreaterThan(0)
    })
  })
})
