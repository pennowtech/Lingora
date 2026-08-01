import type { BackupTableName } from '../backup'

/** A remote row as the sync engine sees it. `data: null` is an explicit remote tombstone — the
 * record existed and was deleted on some other device, as opposed to a missing key (this device's
 * backend has simply never heard of this record id at all). */
export interface RemoteRecord {
  data: Record<string, unknown> | null
}

/** A local upsert (`data` present) or delete (`data: null`) to push for one record. */
export interface PushChange {
  recordId: string
  data: Record<string, unknown> | null
}

/**
 * What a concrete cloud backend (Firestore, or anything else) needs to implement. The sync engine
 * (`syncEngine.ts`) is written entirely against this interface — no backend-specific code lives
 * there — so a Firestore implementation can be dropped in later without touching the merge logic.
 */
export interface CloudSyncBackend {
  /** Every remote record currently known for one table, keyed by record id. */
  pullTable(tableName: BackupTableName): Promise<Record<string, RemoteRecord>>
  /** Upsert/delete a batch of records for one table. Called with an empty array is a no-op. */
  pushTable(tableName: BackupTableName, changes: readonly PushChange[]): Promise<void>
}

/** Per-table row count, for a sync summary. */
export type SyncTableCounts = Partial<Record<BackupTableName, { pulled: number; pushed: number; deleted: number }>>

export interface SyncResult {
  tableCounts: SyncTableCounts
  startedAt: number
  finishedAt: number
}
