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
  /** Revokes the app's OAuth grant for this Google account — distinct from `signOut()`, which only
   * clears the local session and leaves the account still "linked" (able to sign back in silently,
   * still listed under the user's "Apps with access to your Google Account"). Required by Google
   * Play's Account & Data Deletion policy alongside data deletion and local sign-out — see
   * lib/cloudSync.ts#deleteCloudAccountAndData. */
  revokeAccess(email: string): Promise<void>
}

export class CloudSyncNotConfiguredError extends Error {
  constructor() {
    super('Cloud sync isn’t set up yet for this app — it needs a Firebase project before sign-in works.')
    this.name = 'CloudSyncNotConfiguredError'
  }
}
