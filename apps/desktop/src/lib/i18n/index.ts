import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { APP_LANGUAGES, isAppLanguage, resources, type AppLanguage, type AppLanguagePreference } from '@lingora/i18n'

/**
 * App UI localization - same tooling/conventions as apps/mobile/lib/i18n/index.ts (i18next +
 * react-i18next, keys are the literal English phrase via keySeparator: false). The phrase
 * catalog itself (locale files, resources assembly, APP_LANGUAGES) lives in `@lingora/i18n`,
 * shared with apps/mobile - one place to add or update a phrase instead of each app maintaining
 * its own disconnected catalog. This module only wires that shared data into i18next with
 * desktop's own platform primitives: `navigator.language` for device-locale detection (mobile
 * uses expo-localization), `localStorage` for persisted preference (mobile uses the async
 * SecureStore - desktop already uses localStorage for every other persisted setting, see
 * services/desktopServices.tsx) - synchronous, so there's no separate async "apply stored
 * preference" bootstrap step the way mobile needs; the stored preference is read before
 * i18next ever initializes.
 */

export { APP_LANGUAGES, isAppLanguage }
export type { AppLanguage, AppLanguagePreference }

const APP_LANGUAGE_STORE_KEY = 'lingora.app_language'

function deviceLanguage(): AppLanguage {
  const code = navigator.language?.split('-')[0]
  return isAppLanguage(code) ? code : 'en'
}

/** The persisted preference, defaulting to 'system' (not yet set, or an unrecognized value). */
export function getStoredLanguagePreference(): AppLanguagePreference {
  const stored = localStorage.getItem(APP_LANGUAGE_STORE_KEY)
  return stored === 'system' || isAppLanguage(stored) ? (stored as AppLanguagePreference) : 'system'
}

function resolveLanguage(preference: AppLanguagePreference): AppLanguage {
  return preference === 'system' ? deviceLanguage() : preference
}

void i18n.use(initReactI18next).init({
  resources,
  lng: resolveLanguage(getStoredLanguagePreference()),
  fallbackLng: 'en',
  supportedLngs: APP_LANGUAGES,
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnNull: false,
})

/** Sets and persists the app language preference - called from Settings. */
export function setAppLanguagePreference(preference: AppLanguagePreference): void {
  localStorage.setItem(APP_LANGUAGE_STORE_KEY, preference)
  void i18n.changeLanguage(resolveLanguage(preference))
}

export default i18n
