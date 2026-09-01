import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'

const LAST_SEEN_WHATS_NEW_KEY = 'lingora_last_seen_whats_new_version'

export async function shouldShowWhatsNew(version?: string): Promise<boolean> {
  const currentVersion = version ?? Constants.expoConfig?.version ?? '0.2.0'
  try {
    const lastSeen = await SecureStore.getItemAsync(LAST_SEEN_WHATS_NEW_KEY)
    if (!lastSeen) {
      // First time running or update
      return true
    }
    return lastSeen !== currentVersion
  } catch {
    return false
  }
}

export async function markWhatsNewSeen(version?: string): Promise<void> {
  const currentVersion = version ?? Constants.expoConfig?.version ?? '0.2.0'
  try {
    await SecureStore.setItemAsync(LAST_SEEN_WHATS_NEW_KEY, currentVersion)
  } catch {
    // Ignore secure store write failures
  }
}
