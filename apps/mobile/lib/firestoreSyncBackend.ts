import type { BackupTableName, CloudSyncBackend, PushChange, RemoteRecord } from '@lingora/database'
import { collection, doc, getFirestore, writeBatch } from '@react-native-firebase/firestore'

/** Firestore can't literally forget a document mid-sync (another device might not have seen the
 * deletion yet) — a deletion is represented as a small marker document instead of removing it, so
 * every device converges on "this record is gone" rather than racing on whether it still exists. */
const TOMBSTONE_MARKER = { deleted: true } as const

function isTombstone(data: Record<string, unknown> | undefined): boolean {
  return data?.deleted === true
}

// Firestore batched writes cap at 500 operations; chunk comfortably under that.
const BATCH_CHUNK_SIZE = 400

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

/**
 * Every user's synced data lives under `users/{uid}/{tableName}/{recordId}` — one collection per
 * table, mirroring `packages/database`'s own table names 1:1. Authorized entirely by Firestore
 * security rules (`request.auth.uid == uid`, see firestore.rules at the repo root), not by
 * anything this class does — it never needs to check whose data it's touching beyond the uid it
 * was constructed with.
 */
export class FirestoreSyncBackend implements CloudSyncBackend {
  constructor(private readonly uid: string) {}

  async pullTable(tableName: BackupTableName): Promise<Record<string, RemoteRecord>> {
    const db = getFirestore()
    const col = collection(db, 'users', this.uid, tableName)
    const snapshot = await col.get({ source: 'server' })

    const result: Record<string, RemoteRecord> = {}
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data() as Record<string, unknown> | undefined
      result[docSnapshot.id] = { data: isTombstone(data) ? null : (data ?? null) }
    }
    return result
  }

  async pushTable(tableName: BackupTableName, changes: readonly PushChange[]): Promise<void> {
    if (changes.length === 0) return
    const db = getFirestore()
    const col = collection(db, 'users', this.uid, tableName)

    for (const group of chunk(changes, BATCH_CHUNK_SIZE)) {
      const batch = writeBatch(db)
      for (const change of group) {
        const ref = doc(col, change.recordId)
        batch.set(ref, change.data === null ? TOMBSTONE_MARKER : change.data)
      }
      await batch.commit()
    }
  }
}
