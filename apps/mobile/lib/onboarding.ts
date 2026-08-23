import * as SecureStore from 'expo-secure-store'
import {
  APP_LANGUAGE_STORE_KEY,
  ONBOARDING_CEFR_KEY,
  ONBOARDING_COMPLETED_KEY,
  ONBOARDING_NATIVE_LANG_KEY,
  ONBOARDING_TARGET_LANG_KEY,
  type OnboardingPreferences,
} from '@lingora/core'

export type { OnboardingPreferences }

export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(ONBOARDING_COMPLETED_KEY)
    return val === 'true'
  } catch {
    return false
  }
}

export async function setOnboardingCompleted(completed: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(ONBOARDING_COMPLETED_KEY, completed ? 'true' : 'false')
  } catch {
    // Ignore secure store errors
  }
}

export async function saveOnboardingPreferences(prefs: OnboardingPreferences): Promise<void> {
  try {
    await Promise.all([
      SecureStore.setItemAsync(ONBOARDING_NATIVE_LANG_KEY, prefs.nativeLanguage),
      SecureStore.setItemAsync(ONBOARDING_TARGET_LANG_KEY, prefs.targetLanguage),
      SecureStore.setItemAsync(ONBOARDING_CEFR_KEY, prefs.level),
      SecureStore.setItemAsync(APP_LANGUAGE_STORE_KEY, prefs.nativeLanguage),
      SecureStore.setItemAsync(ONBOARDING_COMPLETED_KEY, 'true'),
    ])
  } catch {
    // Ignore secure store errors
  }
}
