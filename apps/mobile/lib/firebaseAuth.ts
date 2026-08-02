import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithCredential, signOut, type User } from '@react-native-firebase/auth'
import { logger } from '@lingora/observability'
import { GoogleOneTapSignIn } from 'react-native-nitro-google-signin'
import type { CloudAccount, CloudAuthService } from './cloudSyncTypes'

const log = logger.child({ feature: 'sync', component: 'FirebaseAuth' })

let configured = false
function ensureConfigured(): void {
  if (configured) return
  configured = true
  // 'autoDetect' reads the web client id straight out of google-services.json (the
  // default_web_client_id RNFB's config plugin generates) — no client id hardcoded here.
  GoogleOneTapSignIn.configure({ webClientId: 'autoDetect' })
}

function toAccount(user: User): CloudAccount {
  return { uid: user.uid, email: user.email ?? '', displayName: user.displayName }
}

/**
 * Real Google Sign-In (via Credential Manager on Android) + Firebase Auth, mirroring Shelfie's
 * FirebaseAuthService — Google Sign-In is purely an identity provider here; the actual sync data
 * lives in Firestore (see firestoreSyncBackend.ts), authorized by each user's own uid.
 */
export class FirebaseCloudAuthService implements CloudAuthService {
  getCurrentAccount(): Promise<CloudAccount | null> {
    const user = getAuth().currentUser
    return Promise.resolve(user ? toAccount(user) : null)
  }

  async signIn(): Promise<CloudAccount> {
    ensureConfigured()
    await GoogleOneTapSignIn.checkPlayServices()

    // Same three-step fallback chain Shelfie uses. Each step is progressively more willing to
    // show UI: signIn() only offers an account this app was already authorized for (no picker at
    // all); createAccount() shows every account on the device via Credential Manager; if even
    // that finds nothing — a real gap seen on some devices/emulators where Credential Manager
    // reports no accounts despite one being signed in at the OS level — presentExplicitSignIn()
    // falls back to the older, more permissive "Sign in with Google" account-chooser API.
    let response = await GoogleOneTapSignIn.signIn()
    if (response.type === 'noSavedCredentialFound') {
      response = await GoogleOneTapSignIn.createAccount()
    }
    if (response.type === 'noSavedCredentialFound') {
      response = await GoogleOneTapSignIn.presentExplicitSignIn()
    }
    if (response.type === 'cancelled') {
      throw new Error('Sign-in was cancelled.')
    }
    if (response.type !== 'success' || !response.data) {
      throw new Error('Google sign-in did not return an account.')
    }

    const credential = GoogleAuthProvider.credential(response.data.idToken)
    const userCredential = await signInWithCredential(getAuth(), credential)
    log.info('sync.google_signed_in', { message: 'Signed in with Google' })
    return toAccount(userCredential.user)
  }

  async signOut(): Promise<void> {
    await GoogleOneTapSignIn.signOut()
    await signOut(getAuth())
  }

  async revokeAccess(email: string): Promise<void> {
    await GoogleOneTapSignIn.revokeAccess(email)
  }
}

/** Fires `listener` immediately with the current account, then again on every auth state change —
 * for the one place (lib/cloudSync.ts) that needs to react to sign-in/out happening outside its
 * own signIn()/signOut() calls (e.g. a token expiring). */
export function observeCloudAccount(listener: (account: CloudAccount | null) => void): () => void {
  return onAuthStateChanged(getAuth(), (user) => listener(user ? toAccount(user) : null))
}
