import type { CefrLevel, LanguageCode } from '@lingora/types'
import { pickWordOfTheDay, type AIProvider } from '@lingora/ai'
import { getAllLemmaFormsForLanguage, type DatabaseAdapter } from '@lingora/database'

const STORE_KEY = 'lingora.word_of_the_day'
const HISTORY_KEY = 'lingora.wotd_history'

export interface WordOfTheDay {
  word: string
  explanation: string
  exampleSentence?: string
  exampleTranslation?: string
  language: LanguageCode
  nativeLanguage: LanguageCode
  cefrLevel: CefrLevel
  /** Local YYYY-MM-DD the word was generated for — see todayDateKey. */
  dateKey: string
  /** Lets the dashboard card's badge tell an AI-curated pick apart from an offline dictionary one. */
  source: 'ai' | 'dictionary'
}

/** Local calendar date, not UTC — a word generated at 11pm shouldn't look stale at 11:05pm just
 * because UTC rolled over. Mirrors apps/mobile/lib/wordOfTheDay.ts's todayDateKey exactly. */
function todayDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readStored(): WordOfTheDay | null {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as WordOfTheDay
  } catch {
    return null
  }
}

function writeStored(value: WordOfTheDay): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(value))
  } catch {
    // Ignore storage errors — worst case, the word regenerates next check.
  }
}

function readHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

function appendToHistory(word: string): void {
  try {
    const history = readHistory()
    const updated = [word, ...history.filter((w) => w.toLowerCase() !== word.toLowerCase())].slice(0, 60)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch {
    // Ignore history write errors.
  }
}

/** Returns whatever's cached if matching the current level/language pair, or null otherwise
 * (nothing cached yet, or a CEFR/language-pair change since it was generated). */
export function getStoredWordOfTheDay(
  cefrLevel?: CefrLevel,
  targetLanguage?: LanguageCode,
  nativeLanguage?: LanguageCode,
): WordOfTheDay | null {
  const stored = readStored()
  if (!stored) return null
  if (cefrLevel && stored.cefrLevel !== cefrLevel) return null
  if (targetLanguage && stored.language !== targetLanguage) return null
  if (nativeLanguage && stored.nativeLanguage !== nativeLanguage) return null
  return stored
}

/**
 * Generates and persists a fresh Word of the Day if the stored one is missing, from a previous
 * calendar day, or was generated for a CEFR level/language pair the learner has since changed in
 * Settings. Same selection logic and priority as apps/mobile's equivalent (AI when a provider is
 * configured, otherwise an installed local dictionary) via the shared `pickWordOfTheDay`
 * (packages/ai) — this only owns what's desktop-specific: localStorage persistence and the
 * rolling 60-word history that keeps today's pick from repeating a recent one. No daily
 * notification on desktop yet (Tauri has no OS notification wiring here) — see this file's
 * apps/mobile counterpart for that piece, deliberately not ported in this pass.
 */
export async function refreshWordOfTheDayIfNeeded(params: {
  ai: AIProvider | null
  db: DatabaseAdapter
  targetLanguage: LanguageCode
  nativeLanguage: LanguageCode
  cefrLevel: CefrLevel
}): Promise<WordOfTheDay | null> {
  const { ai, db, targetLanguage, nativeLanguage, cefrLevel } = params
  const today = todayDateKey()
  const existing = readStored()
  if (
    existing &&
    existing.dateKey === today &&
    existing.language === targetLanguage &&
    existing.nativeLanguage === nativeLanguage &&
    existing.cefrLevel === cefrLevel
  ) {
    return existing
  }

  const knownWords = await getAllLemmaFormsForLanguage(db, targetLanguage)
  const excludeList = Array.from(new Set([...knownWords, ...readHistory()]))

  const pick = await pickWordOfTheDay({ ai, db, targetLanguage, nativeLanguage, cefrLevel, excludeWords: excludeList })
  if (!pick) return existing

  const fresh: WordOfTheDay = {
    word: pick.word,
    explanation: pick.explanation,
    ...(pick.exampleSentence && { exampleSentence: pick.exampleSentence }),
    ...(pick.exampleTranslation && { exampleTranslation: pick.exampleTranslation }),
    language: targetLanguage,
    nativeLanguage,
    cefrLevel,
    dateKey: today,
    source: pick.source,
  }
  writeStored(fresh)
  appendToHistory(pick.word)
  return fresh
}
