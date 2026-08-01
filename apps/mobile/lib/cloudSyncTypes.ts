/** Shared between lib/cloudSync.ts (the coordinator) and its concrete implementations
 * (lib/firebaseAuth.ts, lib/firestoreSyncBackend.ts) — kept separate so neither implementation
 * has to import the coordinator just for these types. */

export interface CloudAccount {
  uid: string
  email: string
  displayName: string | null
}

export interface CloudAuthService {
  getCurrentAccount(): Promise<CloudAccount | null>
  signIn(): Promise<CloudAccount>
  signOut(): Promise<void>
}

export class CloudSyncNotConfiguredError extends Error {
  constructor() {
    super('Cloud sync isn’t set up yet for this app — it needs a Firebase project before sign-in works.')
    this.name = 'CloudSyncNotConfiguredError'
  }
}
