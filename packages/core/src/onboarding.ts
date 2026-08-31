import type { CefrLevel, LanguageCode } from '@lingora/types'
import { STORE_KEYS } from './constants'

/** Storage key names — the app-layer key/value store (SecureStore on mobile, localStorage on
 * desktop) actually persists these. `nativeLanguage`/`targetLanguage`/`defaultCefr` intentionally
 * reuse STORE_KEYS' own entries rather than redeclaring the same string literals, so onboarding
 * and Settings can never silently drift onto two different keys for the same preference. */
export const ONBOARDING_COMPLETED_KEY = 'lingora.onboarding_completed'
export const APP_LANGUAGE_STORE_KEY = 'lingora.app_language'
export const ONBOARDING_NATIVE_LANG_KEY = STORE_KEYS.nativeLanguage
export const ONBOARDING_TARGET_LANG_KEY = STORE_KEYS.targetLanguage
export const ONBOARDING_CEFR_KEY = STORE_KEYS.defaultCefr

export interface OnboardingPreferences {
  nativeLanguage: LanguageCode
  targetLanguage: LanguageCode
  level: CefrLevel
}
