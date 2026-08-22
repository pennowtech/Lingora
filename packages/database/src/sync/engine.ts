import { logger } from '@lingora/observability'
import type { DatabaseAdapter } from '../adapter'
import { TABLE_COLUMNS, TABLE_ORDER, type BackupTableName } from '../backup'
import { resolveSyncRecord } from './merge'
import type { CloudSyncBackend, PushChange, SyncResult, SyncTableCounts } from './types'

const log = logger.child({ feature: 'sync', component: 'engine' })

/** Every synced table's primary key column — `id` except the two FSRS state tables, which are
 * keyed by the card they belong to (see migration 0006/0013). */
const PRIMARY_KEY: Record<BackupTableName, string> = {
  lemmas: 'id',
  inflections: 'id',
  decks: 'id',
  meaning_clusters: 'id',
  cards: 'id',
  meanings: 'id',
  examples: 'id',
  synonyms: 'id',
  phrases: 'id',
  cloze_cards: 'id',
  audio: 'id',
  deck_cards: 'id',
  tags: 'id',
  card_tags: 'id',
  templates: 'id',
  prompt_versions: 'id',
  generation_metadata: 'id',
  card_states: 'card_id',
  cloze_states: 'card_id',
  review_events: 'id',
  sentence_mining_queue: 'id',
  evaluations: 'id',
  card_chat_messages: 'id',
}

async function readSnapshots(
  db: DatabaseAdapter,
  tableName: BackupTableName,
): Promise<Map<string, Record<string, unknown>>> {
  const rows = await db.query<{ recordId: string; data: string }>(
    `SELECT record_id AS recordId, data FROM sync_snapshots WHERE table_name = ?`,
    [tableName],
  )
  return new Map(rows.map((row) => [row.recordId, JSON.parse(row.data) as Record<string, unknown>]))
}

async function readLocalRows(
  db: DatabaseAdapter,
  tableName: BackupTableName,
): Promise<Map<string, Record<string, unknown>>> {
  const pk = PRIMARY_KEY[tableName]
  const rows = await db.query<Record<string, unknown>>(`SELECT * FROM ${tableName}`)
  return new Map(rows.map((row) => [String(row[pk]), row]))
}

/**
 * Runs one full sync pass against `backend` — every table `packages/database/src/backup.ts`
 * exports (i.e. every user-owned table except `ai_cache`/`sync_queue`), in `TABLE_ORDER` so a
 * remote insert of a child row (e.g. a card) never lands before its parent (its lemma) does.
 *
 * Table-by-table, not one pull-everything-then-apply-everything pass, for the same FK-ordering
 * reason: a table's remote pull is applied locally before moving to the next table, so by the time
 * `cards` is processed, `lemmas` already reflects this sync's changes.
 */
export async function syncAllTables(db: DatabaseAdapter, backend: CloudSyncBackend): Promise<SyncResult> {
  const startedAt = Date.now()
  const tableCounts: SyncTableCounts = {}

  for (const tableName of TABLE_ORDER) {
    const [snapshots, local, remote] = await Promise.all([
      readSnapshots(db, tableName),
      readLocalRows(db, tableName),
      backend.pullTable(tableName),
    ])

    const ids = new Set<string>([...snapshots.keys(), ...local.keys(), ...Object.keys(remote)])
    const pushChanges: PushChange[] = []
    let pulled = 0
    let pushed = 0
    let deleted = 0

    await db.transaction(async (tx) => {
      const columns = TABLE_COLUMNS[tableName]
      const pk = PRIMARY_KEY[tableName]
      const placeholders = columns.map(() => '?').join(', ')

      for (const id of ids) {
        const action = resolveSyncRecord({
          snapshot: snapshots.get(id),
          local: local.get(id),
          remote: remote[id],
        })

        switch (action.kind) {
          case 'noop':
            break
          case 'apply-remote': {
            const values = columns.map((column) => (column in action.data ? action.data[column] : null))
            await tx.execute(
              `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})
               ON CONFLICT(${pk}) DO UPDATE SET ${columns
                 .filter((c) => c !== pk)
                 .map((c) => `${c} = excluded.${c}`)
                 .join(', ')}`,
              values,
            )
            await tx.execute(
              `INSERT INTO sync_snapshots (table_name, record_id, data, synced_at) VALUES (?, ?, ?, ?)
               ON CONFLICT(table_name, record_id) DO UPDATE SET data = excluded.data, synced_at = excluded.synced_at`,
              [tableName, id, JSON.stringify(action.data), Date.now()],
            )
            pulled += 1
            break
          }
          case 'delete-local': {
            await tx.execute(`DELETE FROM ${tableName} WHERE ${pk} = ?`, [id])
            await tx.execute(`DELETE FROM sync_snapshots WHERE table_name = ? AND record_id = ?`, [tableName, id])
            deleted += 1
            break
          }
          case 'push-local': {
            pushChanges.push({ recordId: id, data: action.data })
            await tx.execute(
              `INSERT INTO sync_snapshots (table_name, record_id, data, synced_at) VALUES (?, ?, ?, ?)
               ON CONFLICT(table_name, record_id) DO UPDATE SET data = excluded.data, synced_at = excluded.synced_at`,
              [tableName, id, JSON.stringify(action.data), Date.now()],
            )
            pushed += 1
            break
          }
          case 'push-delete': {
            pushChanges.push({ recordId: id, data: null })
            await tx.execute(`DELETE FROM sync_snapshots WHERE table_name = ? AND record_id = ?`, [tableName, id])
            pushed += 1
            break
          }
        }
      }
    })

    if (pushChanges.length > 0) await backend.pushTable(tableName, pushChanges)
    if (pulled + pushed + deleted > 0) tableCounts[tableName] = { pulled, pushed, deleted }
  }

  const finishedAt = Date.now()
  log.info('sync.sync_completed', {
    message: 'Cloud sync pass completed',
    result: 'success',
    durationMs: finishedAt - startedAt,
    metadata: { itemCount: Object.keys(tableCounts).length },
  })

  return { tableCounts, startedAt, finishedAt }
}

/** Wipes local sync bookkeeping (last-known-synced snapshot of every record) so a fresh sign-in —
 * by the same or a different account — starts from a clean slate instead of comparing against a
 * stale remote state. Local vocabulary data (decks/cards/etc.) is untouched; this only clears the
 * merge engine's own memory of what it last pushed/pulled. */
export async function clearSyncSnapshots(db: DatabaseAdapter): Promise<void> {
  await db.execute(`DELETE FROM sync_snapshots`)
}
