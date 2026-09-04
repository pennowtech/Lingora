import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from '../migrations'
import { createDeck, getAllDecks } from '../repositories/decks'
import { NodeSqliteAdapter } from '../testing/node-sqlite-adapter'
import { syncAllTables } from './engine'
import type { BackupTableName } from '../backup'
import type { CloudSyncBackend, PushChange, RemoteRecord } from './types'

/** An in-memory stand-in for a real cloud backend (Firestore or otherwise) — enough to exercise
 * the engine's pull/push/merge behavior without any network or SDK dependency. */
class FakeBackend implements CloudSyncBackend {
  private readonly tables = new Map<BackupTableName, Map<string, RemoteRecord>>()

  seed(tableName: BackupTableName, recordId: string, data: Record<string, unknown> | null): void {
    const table = this.tables.get(tableName) ?? new Map<string, RemoteRecord>()
    table.set(recordId, { data })
    this.tables.set(tableName, table)
  }

  get(tableName: BackupTableName, recordId: string): RemoteRecord | undefined {
    return this.tables.get(tableName)?.get(recordId)
  }

  pullTable(tableName: BackupTableName): Promise<Record<string, RemoteRecord>> {
    const table = this.tables.get(tableName)
    return Promise.resolve(table ? Object.fromEntries(table.entries()) : {})
  }

  pushTable(tableName: BackupTableName, changes: readonly PushChange[]): Promise<void> {
    const table = this.tables.get(tableName) ?? new Map<string, RemoteRecord>()
    for (const change of changes) table.set(change.recordId, { data: change.data })
    this.tables.set(tableName, table)
    return Promise.resolve()
  }
}

describe('syncAllTables', () => {
  let db: NodeSqliteAdapter
  let backend: FakeBackend

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
    backend = new FakeBackend()
  })

  afterEach(() => {
    db.close()
  })

  it('pushes a new local record to a backend that has never heard of it', async () => {
    const now = Date.now()
    await createDeck(db, { id: 'deck-a', name: 'A', createdAt: now, updatedAt: now })

    await syncAllTables(db, backend)

    const remote = backend.get('decks', 'deck-a')
    expect(remote?.data?.name).toBe('A')
  })

  it('pulls a new remote record down to a device that has never seen it', async () => {
    const now = Date.now()
    backend.seed('decks', 'deck-b', {
      id: 'deck-b',
      name: 'B',
      parent_id: null,
      target_language: 'de',
      native_language: 'en',
      created_at: now,
      updated_at: now,
      emoji: null,
    })

    await syncAllTables(db, backend)

    const decks = await getAllDecks(db)
    expect(decks.map((d) => d.name)).toEqual(['B'])
  })

  it('does nothing on a second sync with no changes on either side', async () => {
    const now = Date.now()
    await createDeck(db, { id: 'deck-a', name: 'A', createdAt: now, updatedAt: now })
    await syncAllTables(db, backend)

    const snapshotBefore = await db.query('SELECT * FROM sync_snapshots')
    await syncAllTables(db, backend)
    const snapshotAfter = await db.query('SELECT * FROM sync_snapshots')

    expect(snapshotAfter).toEqual(snapshotBefore)
  })

  it('propagates a local delete to the backend as a remote tombstone', async () => {
    const now = Date.now()
    await createDeck(db, { id: 'deck-a', name: 'A', createdAt: now, updatedAt: now })
    await syncAllTables(db, backend)
    expect(backend.get('decks', 'deck-a')?.data).not.toBeNull()

    await db.execute('DELETE FROM decks WHERE id = ?', ['deck-a'])
    await syncAllTables(db, backend)

    expect(backend.get('decks', 'deck-a')?.data).toBeNull()
  })

  it('applies a remote delete locally', async () => {
    const now = Date.now()
    await createDeck(db, { id: 'deck-a', name: 'A', createdAt: now, updatedAt: now })
    await syncAllTables(db, backend)

    backend.seed('decks', 'deck-a', null)
    await syncAllTables(db, backend)

    const decks = await getAllDecks(db)
    expect(decks).toHaveLength(0)
  })

  it('resolves a same-record conflict (both sides edited since last sync) in favor of remote', async () => {
    const now = Date.now()
    await createDeck(db, { id: 'deck-a', name: 'Original', createdAt: now, updatedAt: now })
    await syncAllTables(db, backend)

    await db.execute('UPDATE decks SET name = ? WHERE id = ?', ['Local edit', 'deck-a'])
    backend.seed('decks', 'deck-a', {
      id: 'deck-a',
      name: 'Remote edit',
      parent_id: null,
      target_language: 'de',
      native_language: 'en',
      created_at: now,
      updated_at: now,
      emoji: null,
    })

    await syncAllTables(db, backend)

    const decks = await getAllDecks(db)
    expect(decks[0]?.name).toBe('Remote edit')
  })
})
