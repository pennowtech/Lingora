import type { RemoteRecord } from './types'

export type SyncAction =
  | { kind: 'noop' }
  | { kind: 'apply-remote'; data: Record<string, unknown> }
  | { kind: 'delete-local' }
  | { kind: 'push-local'; data: Record<string, unknown> }
  | { kind: 'push-delete' }

function stableStringify(value: Record<string, unknown> | null | undefined): string {
  if (value == null) return 'null'
  const keys = Object.keys(value).sort()
  return JSON.stringify(keys.map((key) => [key, value[key]]))
}

function rowsEqual(a: Record<string, unknown> | null | undefined, b: Record<string, unknown> | null | undefined): boolean {
  return stableStringify(a ?? null) === stableStringify(b ?? null)
}

/**
 * Decides what to do with one record given its state as of the last sync (`snapshot`), its
 * current local state, and its current remote state — a row-level 3-way compare (see migration
 * 0014's doc comment for why row-level rather than field-level: most tables here have no per-row
 * `updated_at` to arbitrate a field merge with). `local`/`remote.data` of `undefined`/`null` both
 * mean "doesn't exist"; the distinction that matters is `remote === undefined` (this backend has
 * never heard of the id) vs `remote.data === null` (an explicit remote tombstone).
 */
export function resolveSyncRecord(args: {
  snapshot: Record<string, unknown> | undefined
  local: Record<string, unknown> | undefined
  remote: RemoteRecord | undefined
}): SyncAction {
  const { snapshot, local, remote } = args
  const remoteExists = remote !== undefined
  const remoteDeleted = remoteExists && remote.data === null
  const remoteData = remoteExists ? remote.data : undefined

  if (!snapshot) {
    if (local && (!remoteExists || remoteDeleted)) return { kind: 'push-local', data: local }
    if (!local && remoteData) return { kind: 'apply-remote', data: remoteData }
    if (local && remoteData) {
      return rowsEqual(local, remoteData) ? { kind: 'noop' } : { kind: 'apply-remote', data: remoteData }
    }
    return { kind: 'noop' }
  }

  const localChanged = !rowsEqual(local, snapshot)
  const remoteChanged = remoteExists && !rowsEqual(remoteDeleted ? null : remoteData, snapshot)

  if (!localChanged && !remoteChanged) return { kind: 'noop' }

  if (!remoteChanged) {
    // Remote hasn't moved since the last sync — whatever local did (edit or delete) is safe to push.
    return local ? { kind: 'push-local', data: local } : { kind: 'push-delete' }
  }

  if (!localChanged) {
    // Local hasn't moved since the last sync — pull whatever remote did.
    return remoteDeleted ? { kind: 'delete-local' } : { kind: 'apply-remote', data: remoteData! }
  }

  // Both sides changed since the last sync and disagree. No per-field timestamps to arbitrate, so
  // remote wins — the same conservative fallback Shelfie (the sibling app this was ported from)
  // falls back to whenever it has no usable 3-way base.
  return remoteDeleted ? { kind: 'delete-local' } : { kind: 'apply-remote', data: remoteData! }
}
