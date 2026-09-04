import type { CefrLevel, LanguageCode } from '@lingora/types'
import { getRandomWordGuide, type DatabaseAdapter } from '@lingora/database'
import { logger } from '@lingora/observability'
import type { AIProvider } from '../providers/types'

const log = logger.child({ feature: 'ai', component: 'wordOfTheDayPipeline' })

const MAX_UNIQUE_WORD_ATTEMPTS = 5

function normalizedWord(word: string): string {
  return word.normalize('NFKC').trim().toLocaleLowerCase()
}

/**
 * Asks the AI for a word, then actually verifies it's not a repeat instead of trusting the
 * prompt's exclude-list instruction alone — a model can and does occasionally ignore it,
 * especially once excludeWords gets long. Retries with the offending word appended to the
 * exclude list up to MAX_UNIQUE_WORD_ATTEMPTS times, then throws so the caller can decide what
 * to fall back to (see pickWordOfTheDay below).
 */
async function requestUniqueWord(
  ai: AIProvider,
  ctx: { cefrLevel: CefrLevel; language: LanguageCode; nativeLanguage: LanguageCode },
  excludeWords: string[],
): ReturnType<AIProvider['suggestWordOfTheDay']> {
  const alreadySeen = new Set(excludeWords.map(normalizedWord))
  let attemptExclude = excludeWords

  for (let attempt = 1; attempt <= MAX_UNIQUE_WORD_ATTEMPTS; attempt++) {
    const result = await ai.suggestWordOfTheDay(ctx, attemptExclude)
    if (!alreadySeen.has(normalizedWord(result.data.word))) return result
    log.warn('ai.word_of_the_day_duplicate_suggested', {
      message: `AI suggested an already-known/recent word on attempt ${attempt} of ${MAX_UNIQUE_WORD_ATTEMPTS} - retrying`,
    })
    attemptExclude = [...attemptExclude, result.data.word]
  }
  throw new Error(`AI suggested a repeated Word of the Day ${MAX_UNIQUE_WORD_ATTEMPTS} times`)
}

export interface WordOfTheDayPick {
  word: string
  explanation: string
  exampleSentence?: string
  exampleTranslation?: string
  /** Lets a caller's UI tell an AI-curated pick apart from an offline dictionary one. */
  source: 'ai' | 'dictionary'
}

/**
 * Picks today's word: tries the AI provider (with retry-on-duplicate against excludeWords) if
 * one is configured, otherwise falls back to a random entry from the installed local dictionary
 * (the `word_guides` table). Returns null if neither source could produce anything — no AI
 * configured and no dictionary installed for this language, every dictionary candidate excluded,
 * or the AI call itself failed (deliberately does NOT fall through to the dictionary on an AI
 * failure — a caller with an existing stored word should keep showing it rather than silently
 * downgrading to a lower-quality dictionary pick just because of a transient AI error; see
 * apps/mobile/lib/wordOfTheDay.ts and apps/desktop/src/lib/wordOfTheDay.ts for how each platform
 * uses that null to fall back to whatever was already stored).
 *
 * Pure selection only — no persistence, notifications, or history bookkeeping. Every platform
 * caller owns its own excludeWords (known lemmas + its own rolling recent-word history) and its
 * own storage of the result.
 */
export async function pickWordOfTheDay(params: {
  ai: AIProvider | null
  db: DatabaseAdapter
  targetLanguage: LanguageCode
  nativeLanguage: LanguageCode
  cefrLevel: CefrLevel
  excludeWords: string[]
}): Promise<WordOfTheDayPick | null> {
  const { ai, db, targetLanguage, nativeLanguage, cefrLevel, excludeWords } = params

  if (ai) {
    try {
      const result = await requestUniqueWord(ai, { cefrLevel, language: targetLanguage, nativeLanguage }, excludeWords)
      return {
        word: result.data.word,
        explanation: result.data.explanation,
        ...(result.data.exampleSentence && { exampleSentence: result.data.exampleSentence }),
        ...(result.data.exampleTranslation && { exampleTranslation: result.data.exampleTranslation }),
        source: 'ai',
      }
    } catch (error) {
      log.error('ai.word_of_the_day_ai_pick_failed', error, {
        message: 'Could not generate a Word of the Day via AI',
      })
      return null
    }
  }

  try {
    const entry = await getRandomWordGuide(db, targetLanguage, excludeWords)
    if (!entry) return null
    const firstExample = entry.examples[0]
    return {
      word: entry.headword,
      explanation: entry.intro,
      ...(firstExample && { exampleSentence: firstExample.sentence, exampleTranslation: firstExample.translation }),
      source: 'dictionary',
    }
  } catch (error) {
    log.error('ai.word_of_the_day_dictionary_pick_failed', error, {
      message: 'Could not pick a Word of the Day from the installed dictionary',
    })
    return null
  }
}
