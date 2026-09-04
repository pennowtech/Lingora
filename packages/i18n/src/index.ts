import { de } from './locales/de'
import { ENGLISH_PHRASES, type Phrase } from './locales/en'
import { es } from './locales/es'
import { fr } from './locales/fr'
import { hi } from './locales/hi'
import { vi } from './locales/vi'

/**
 * Shared i18next resource data for every Lingora client (apps/mobile, apps/desktop, and any
 * future client) — one common place to add or update a phrase instead of each app maintaining
 * its own, disconnected catalog. Locale copy lives in ./locales/<language>.ts; keys are the
 * literal English phrase (`keySeparator: false` in each app's own i18next.init call) so a
 * missing translation falls back to readable English rather than a raw key.
 *
 * This package only holds the *data* (locales, the assembled resources object, the supported-
 * language list) — each app still does its own `i18next.use(initReactI18next).init(...)` with
 * its own platform-specific device-language detection and persisted-preference storage (Expo
 * SecureStore + expo-localization for mobile, localStorage + navigator.language for desktop),
 * since those genuinely differ per platform and don't belong in a shared package.
 *
 * Adding a new phrase: add it to ENGLISH_PHRASES in ./locales/en.ts (exhaustive - every phrase
 * used by ANY app must be listed there), then add translations to whichever locale files you
 * can - de.ts/hi.ts are exhaustive (every phrase must have a translation), es.ts/fr.ts/vi.ts are
 * partial (untranslated phrases fall back to English via `complete()` below). A phrase specific
 * to one app is still added here, not app-locally - the whole point is one shared catalog.
 */

export type { Phrase }
export { ENGLISH_PHRASES }

export const APP_LANGUAGES = ['en', 'de', 'fr', 'es', 'hi', 'vi'] as const
export type AppLanguage = (typeof APP_LANGUAGES)[number]
export type AppLanguagePreference = AppLanguage | 'system'

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return (APP_LANGUAGES as readonly string[]).includes(value ?? '')
}

type PhraseMap = Record<string, string>

const english: PhraseMap = Object.fromEntries(ENGLISH_PHRASES.map((phrase) => [phrase, phrase]))

function complete(overrides: Partial<Record<Phrase, string>>): PhraseMap {
  return { ...english, ...overrides }
}

export const resources = {
  en: { translation: english },
  de: { translation: de },
  fr: { translation: complete(fr) },
  es: { translation: complete(es) },
  hi: { translation: hi },
  vi: { translation: complete(vi) },
} as const
