import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from './migrations'
import { seedDatabase } from './seed_dummy_data'
import { NodeSqliteAdapter } from './testing/node-sqlite-adapter'
import {
  BACKUP_FORMAT_VERSION,
  BackupValidationError,
  createBackup,
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
})
