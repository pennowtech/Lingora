import * as SecureStore from 'expo-secure-store'
import type { CefrLevel, LanguageCode } from '@lingora/types'

const ONBOARDING_COMPLETED_KEY = 'lingora.onboarding_completed'
const STORED_NATIVE_LANG_KEY = 'lingora.native_language'
const STORED_TARGET_LANG_KEY = 'lingora.target_language'
const STORED_CEFR_KEY = 'lingora.default_cefr'
const APP_LANGUAGE_STORE_KEY = 'lingora.app_language'

export interface OnboardingPreferences {
  nativeLanguage: LanguageCode
  targetLanguage: LanguageCode
  level: CefrLevel
}

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
      SecureStore.setItemAsync(STORED_NATIVE_LANG_KEY, prefs.nativeLanguage),
      SecureStore.setItemAsync(STORED_TARGET_LANG_KEY, prefs.targetLanguage),
      SecureStore.setItemAsync(STORED_CEFR_KEY, prefs.level),
      SecureStore.setItemAsync(APP_LANGUAGE_STORE_KEY, prefs.nativeLanguage),
      SecureStore.setItemAsync(ONBOARDING_COMPLETED_KEY, 'true'),
    ])
  } catch {
    // Ignore secure store errors
  }
}
