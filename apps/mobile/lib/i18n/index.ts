import { getLocales } from 'expo-localization'
import * as SecureStore from 'expo-secure-store'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from './resources'

/**
 * App UI localization — English, German, French, Spanish, Hindi. Same
 * tooling/conventions as the sibling Shelfie project's `src/i18n/` (same
 * author): i18next + react-i18next, `expo-localization` for device-locale
 * detection, keys are the English phrase itself (`keySeparator: false`) so
 * a missing translation falls back to readable English rather than a raw
 * key. See `resources.ts` for the actual phrase maps and current coverage.
 *
 * Word Guide dictionary *content* (LingoraDocs/6_word_guides_plan.md) is a
 * separate, unrelated concept — this module is only the app's own UI chrome
 * (buttons, labels, screen titles).
 */

export const APP_LANGUAGES = ['en', 'de', 'fr', 'es', 'hi', 'vi'] as const
export type AppLanguage = (typeof APP_LANGUAGES)[number]
export type AppLanguagePreference = AppLanguage | 'system'

/**
 * Not `STORE_KEYS.appLanguage` from `lib/services.tsx` — that file would
 * need to import this module too (to call `applyStoredLanguagePreference`
 * during bootstrap), which would create a circular import. This key lives
 * here instead, following the same `lingora.*` naming convention.
 */
const APP_LANGUAGE_STORE_KEY = 'lingora.app_language'

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return (APP_LANGUAGES as readonly string[]).includes(value ?? '')
}

function deviceLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode
  return isAppLanguage(code) ? code : 'en'
}

void i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  fallbackLng: 'en',
  supportedLngs: APP_LANGUAGES,
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnNull: false,
})

/**
 * Reads the persisted language preference and applies it — called once
 * during app bootstrap (`services.tsx`, before `ServicesProvider` reveals
 * its children), so there's no flash of the wrong language while
 * `SecureStore.getItemAsync` resolves.
 */
export async function applyStoredLanguagePreference(): Promise<void> {
  const stored = await SecureStore.getItemAsync(APP_LANGUAGE_STORE_KEY)
  const preference: AppLanguagePreference = stored === 'system' || isAppLanguage(stored) ? (stored as AppLanguagePreference) : 'system'
  await i18n.changeLanguage(preference === 'system' ? deviceLanguage() : preference)
}

export function getStoredLanguagePreference(): Promise<string | null> {
  return SecureStore.getItemAsync(APP_LANGUAGE_STORE_KEY)
}

/** Sets and persists the app language preference — called from Settings. */
export async function setAppLanguagePreference(preference: AppLanguagePreference): Promise<void> {
  await SecureStore.setItemAsync(APP_LANGUAGE_STORE_KEY, preference)
  await i18n.changeLanguage(preference === 'system' ? deviceLanguage() : preference)
}

export default i18n
