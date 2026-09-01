/** i18next resource assembly. Locale copy lives in ./locales/<language>.ts. */
import { de } from './locales/de'
import { ENGLISH_PHRASES, type Phrase } from './locales/en'
import { es } from './locales/es'
import { fr } from './locales/fr'
import { hi } from './locales/hi'
import { vi } from './locales/vi'

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
