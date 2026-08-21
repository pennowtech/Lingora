import { clearSyncSnapshots, syncAllTables, type CloudSyncBackend, type DatabaseAdapter } from '@lingora/database'
import { logger } from '@lingora/observability'
import * as SecureStore from 'expo-secure-store'
import { useSyncExternalStore } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { CloudSyncNotConfiguredError, type CloudAccount, type CloudAuthService } from './cloudSyncTypes'
import { FirebaseCloudAuthService, observeCloudAccount } from './firebaseAuth'
import { deleteAllCloudData, FirestoreSyncBackend } from './firestoreSyncBackend'
import { notifySyncFailed, notifySyncSucceeded } from './syncNotifications'

const log = logger.child({ feature: 'sync', screen: 'CloudSync' })

export type { CloudAccount, CloudAuthService } from './cloudSyncTypes'
export { CloudSyncNotConfiguredError } from './cloudSyncTypes'

/**
 * Cloud sync (decks/cards/review progress → a per-user Google account) — the same shape Shelfie
 * (a sibling app) uses: Google Sign-In for identity (lib/firebaseAuth.ts), Firestore for the
 * actual data (lib/firestoreSyncBackend.ts), a manual "Sync now" action (here, and as an icon
 * button on the Decks screen), and — matching Shelfie — automatic background sync triggered on
 * app-background with a minimum-interval cooldown, plus a local notification on completion or
 * failure. Deliberately different from Shelfie in one place: no Wi-Fi-only gating. Automatic sync
 * runs on whatever connection is available.
 */

function getCloudAuthService(): CloudAuthService {
  return new FirebaseCloudAuthService()
}
function createSyncBackend(uid: string): CloudSyncBackend {
  return new FirestoreSyncBackend(uid)
}

const SYNC_KEYS = {
  lastSuccessAt: 'lingora.cloud_sync_last_success_at',
  lastError: 'lingora.cloud_sync_last_error',
  automatic: 'lingora.cloud_sync_automatic',
  minimumIntervalMinutes: 'lingora.cloud_sync_minimum_interval_minutes',
} as const

export const SYNC_INTERVAL_OPTIONS_MINUTES = [15, 30, 60, 180] as const
const DEFAULT_MINIMUM_INTERVAL_MINUTES = 30

export type CloudSyncPhase = 'not-configured' | 'signed-out' | 'ready' | 'syncing' | 'error'

export interface CloudSyncSummary {
  pulled: number
  pushed: number
  deleted: number
}

export interface CloudSyncState {
  phase: CloudSyncPhase
  account: CloudAccount | null
  lastSyncedAt: number | null
  lastError: string | null
  lastSummary: CloudSyncSummary | null
  automatic: boolean
  minimumIntervalMinutes: number
}

let state: CloudSyncState = {
  phase: 'not-configured',
  account: null,
  lastSyncedAt: null,
  lastError: null,
  lastSummary: null,
  automatic: false,
  minimumIntervalMinutes: DEFAULT_MINIMUM_INTERVAL_MINUTES,
}

const listeners = new Set<() => void>()

function setState(patch: Partial<CloudSyncState>): void {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

function subscribeCloudSync(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getCloudSyncSnapshot(): CloudSyncState {
  return state
}

let loaded = false
let loadPromise: Promise<void> | null = null

async function ensureLoaded(): Promise<void> {
  if (loaded) return
  if (!loadPromise) {
    loadPromise = (async () => {
      const [lastSuccessRaw, lastError, automaticRaw, intervalRaw, account] = await Promise.all([
        SecureStore.getItemAsync(SYNC_KEYS.lastSuccessAt),
        SecureStore.getItemAsync(SYNC_KEYS.lastError),
        SecureStore.getItemAsync(SYNC_KEYS.automatic),
        SecureStore.getItemAsync(SYNC_KEYS.minimumIntervalMinutes),
        getCloudAuthService().getCurrentAccount(),
      ])
      loaded = true
      setState({
        phase: account ? 'ready' : 'signed-out',
        account,
        lastSyncedAt: lastSuccessRaw ? Number(lastSuccessRaw) : null,
        lastError: lastError ?? null,
        automatic: automaticRaw === 'true',
        minimumIntervalMinutes: intervalRaw ? Number(intervalRaw) : DEFAULT_MINIMUM_INTERVAL_MINUTES,
      })

      // React to sign-out/token expiry happening outside signIn()/signOut() (e.g. a revoked
      // session) — not just the two explicit actions below.
      observeCloudAccount((nextAccount) => {
        if (nextAccount?.uid === state.account?.uid) return
        setState({ phase: nextAccount ? 'ready' : 'signed-out', account: nextAccount })
      })
    })()
  }
  await loadPromise
}

export async function initCloudSync(): Promise<void> {
  await ensureLoaded()
}

export async function signInToCloudSync(): Promise<CloudAccount> {
  const account = await getCloudAuthService().signIn()
  setState({ phase: 'ready', account, lastError: null })
  log.info('sync.signed_in', { message: 'Signed in to cloud sync' })
  return account
}

export async function signOutOfCloudSync(): Promise<void> {
  await getCloudAuthService().signOut()
  setState({ phase: 'signed-out', account: null })
  log.info('sync.signed_out', { message: 'Signed out of cloud sync' })
}

/**
 * The Google Play "Account & Data Deletion" flow (2026 mandate) has three required parts, all
 * covered here: permanently erases every document this account ever synced to Firestore (the
 * "sandboxed" app data), revokes the app's OAuth grant for the Google account (breaking the link —
 * see CloudAuthService#revokeAccess; signing out alone leaves the account still "linked" and able
 * to silently re-authenticate), and signs out locally. Also clears this device's local sync
 * bookkeeping (last-synced timestamp/error, automatic-sync preference, the merge engine's own
 * snapshot table — but NOT the user's local decks/cards, which remain fully usable offline).
 * Irreversible — the caller (the Sync settings screen) is responsible for confirming with the user
 * first. Revocation is best-effort: a failure there (e.g. a network hiccup) is logged but doesn't
 * block the data deletion or local sign-out, which are the parts that must not be left half-done.
 */
export async function deleteCloudAccountAndData(db: DatabaseAdapter): Promise<void> {
  await ensureLoaded()
  const account = state.account
  if (!account) throw new CloudSyncNotConfiguredError()

  log.info('sync.account_deletion_started', { message: 'Cloud account & data deletion started' })
  try {
    await deleteAllCloudData(account.uid)
    await clearSyncSnapshots(db)
    await Promise.all([
      SecureStore.deleteItemAsync(SYNC_KEYS.lastSuccessAt),
      SecureStore.deleteItemAsync(SYNC_KEYS.lastError),
      SecureStore.deleteItemAsync(SYNC_KEYS.automatic),
      SecureStore.deleteItemAsync(SYNC_KEYS.minimumIntervalMinutes),
    ])
    try {
      await getCloudAuthService().revokeAccess(account.email)
    } catch {
      log.warn('sync.account_revoke_failed', {
        message: 'Revoking the Google OAuth grant failed — data was deleted and the local session will still be signed out',
      })
    }
    await getCloudAuthService().signOut()
    setState({
      phase: 'signed-out',
      account: null,
      lastSyncedAt: null,
      lastError: null,
      lastSummary: null,
      automatic: false,
      minimumIntervalMinutes: DEFAULT_MINIMUM_INTERVAL_MINUTES,
    })
    log.info('sync.account_deletion_completed', { message: 'Cloud account & data deletion completed' })
  } catch (error) {
    log.error('sync.account_deletion_failed', error, { message: 'Cloud account & data deletion failed' })
    throw error
  }
}

export async function setCloudSyncAutomatic(value: boolean): Promise<void> {
  setState({ automatic: value })
  await SecureStore.setItemAsync(SYNC_KEYS.automatic, value ? 'true' : 'false')
  log.info('sync.automatic_changed', { message: `${value ? 'Enabled' : 'Disabled'} automatic background sync` })
}

export async function setCloudSyncMinimumInterval(minutes: number): Promise<void> {
  setState({ minimumIntervalMinutes: minutes })
  await SecureStore.setItemAsync(SYNC_KEYS.minimumIntervalMinutes, String(minutes))
}

let activeSync: Promise<CloudSyncSummary> | null = null

/** Single-flight: a second call while a sync is already running just waits on the same result
 * rather than starting a duplicate pass — matters here since the Settings screen, the Decks
 * screen's icon button, and the automatic background trigger can all reach this. */
export async function requestCloudSync(db: DatabaseAdapter, options?: { notify?: boolean }): Promise<CloudSyncSummary> {
  await ensureLoaded()
  if (activeSync) return activeSync
  if (!state.account) {
    const error = new CloudSyncNotConfiguredError()
    setState({ phase: state.phase === 'not-configured' ? 'not-configured' : 'signed-out', lastError: error.message })
    throw error
  }
  const notify = options?.notify ?? false

  activeSync = (async () => {
    setState({ phase: 'syncing', lastError: null })
    log.info('sync.sync_started', { message: 'Cloud sync started' })
    try {
      const backend = createSyncBackend(state.account!.uid)
      const result = await syncAllTables(db, backend)
      const summary = Object.values(result.tableCounts).reduce<CloudSyncSummary>(
        (acc, counts) => ({
          pulled: acc.pulled + (counts?.pulled ?? 0),
          pushed: acc.pushed + (counts?.pushed ?? 0),
          deleted: acc.deleted + (counts?.deleted ?? 0),
        }),
        { pulled: 0, pushed: 0, deleted: 0 },
      )
      const now = Date.now()
      setState({ phase: 'ready', lastSyncedAt: now, lastError: null, lastSummary: summary })
      await SecureStore.setItemAsync(SYNC_KEYS.lastSuccessAt, String(now))
      await SecureStore.setItemAsync(SYNC_KEYS.lastError, '')
      if (notify) void notifySyncSucceeded(summary)
      return summary
    } catch (error) {
      const message = String(error)
      setState({ phase: 'error', lastError: message })
      await SecureStore.setItemAsync(SYNC_KEYS.lastError, message)
      log.error('sync.sync_failed', error, { message: 'Cloud sync failed' })
      if (notify) void notifySyncFailed(message)
      throw error
    } finally {
      activeSync = null
    }
  })()
  return activeSync
}

/** Live cloud-sync state, for any screen that shows sign-in/sync status. */
export function useCloudSync(): CloudSyncState {
  return useSyncExternalStore(subscribeCloudSync, getCloudSyncSnapshot)
}

// ─── Automatic background sync ───────────────────────────────────────────────
//
// Triggered when the app is backgrounded (the same boundary Shelfie fires on, minus its "chapter/
// book close" hook — Lemmory has no equivalent mid-session boundary worth syncing on). Gated only
// by the minimum-interval cooldown and being signed in — deliberately no Wi-Fi-only check.

let db: DatabaseAdapter | null = null
let appStateSubscription: { remove: () => void } | null = null

function dueForAutomaticSync(): boolean {
  if (!state.automatic || !state.account || state.phase === 'syncing') return false
  if (!state.lastSyncedAt) return true
  const elapsedMinutes = (Date.now() - state.lastSyncedAt) / 60_000
  return elapsedMinutes >= state.minimumIntervalMinutes
}

function handleAppStateChange(next: AppStateStatus): void {
  if (next !== 'background' || !db) return
  if (!dueForAutomaticSync()) return
  requestCloudSync(db, { notify: true }).catch((error: unknown) => {
    log.error('sync.automatic_sync_failed', error, { message: 'Automatic background sync failed' })
  })
}

/** Mounted once at app root (see components/CloudSyncLifecycle.tsx) so automatic sync can fire on
 * backgrounding regardless of which screen is on top. */
export function startCloudSyncLifecycle(database: DatabaseAdapter): () => void {
  db = database
  void ensureLoaded()
  appStateSubscription = AppState.addEventListener('change', handleAppStateChange)
  return () => {
    appStateSubscription?.remove()
    appStateSubscription = null
    db = null
  }
}
