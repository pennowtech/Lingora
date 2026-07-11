import { ALL_MIGRATIONS, migrate } from '@lingora/database'
import { afterEach, describe, expect, it } from 'vitest'
import { NodeSqliteAdapter } from './node-sqlite-adapter'

describe('NodeSqliteAdapter', () => {
  let db: NodeSqliteAdapter

  afterEach(() => {
    db.close()
  })

  it('applies every migration to a fresh in-memory database', async () => {
    db = new NodeSqliteAdapter()
    const applied = await migrate(db)
    expect(applied).toEqual(ALL_MIGRATIONS.map((m) => m.version))

    const tables = await db.query<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`,
    )
    const names = tables.map((t) => t.name)
    expect(names).toContain('lemmas')
    expect(names).toContain('prompt_versions')
    expect(names).toContain('ai_cache')
  })

  it('rolls a transaction back completely on failure', async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)

    await expect(
      db.transaction(async (tx) => {
        await tx.execute(`INSERT INTO decks (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`, [
          'deck-1',
          'Test deck',
          Date.now(),
          Date.now(),
        ])
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')

    const decks = await db.query(`SELECT id FROM decks`)
    expect(decks).toHaveLength(0)
  })

  it('enforces foreign keys', async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)

    await expect(
      db.execute(
        `INSERT INTO cards (id, lemma_id, deck_id, type, created_at, updated_at)
         VALUES ('c1', 'missing-lemma', 'missing-deck', 'basic', 0, 0)`,
      ),
    ).rejects.toThrow()
  })
})
