import type { CefrLevel, LanguageCode } from '@lingora/types'
import type { AIProvider } from '@lingora/ai'
import { getAllLemmaFormsForLanguage, type DatabaseAdapter } from '@lingora/database'
import { logger } from '@lingora/observability'
import * as SecureStore from 'expo-secure-store'
import * as Notifications from 'expo-notifications'

const log = logger.child({ feature: 'vocabulary', component: 'wordOfTheDay' })

/** Same permissive shape as lib/providerValidation.ts's TranslateFn — accepts react-i18next's
 * real `t` (its exact overload signature is awkward to match structurally) or any simple fallback
 * with the same basic call shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslateFn = (key: string, options?: any) => string

const STORE_KEY = 'lingora.word_of_the_day'
const HISTORY_KEY = 'lingora.wotd_history'
const NOTIFICATION_TIME_KEY = 'lingora.wotd_notification_time'
/** Default local time the daily notification fires at, until the learner picks their own in
 * Settings → Learning (see getNotificationTime/setNotificationTime) — see scheduleNotification's
 * doc comment for why this is a repeating trigger rather than a fresh one-shot each day. */
const DEFAULT_NOTIFICATION_HOUR = 9
const DEFAULT_NOTIFICATION_MINUTE = 0

export interface NotificationTime {
  hour: number
  minute: number
}

/** The learner's chosen daily-notification time, falling back to the 9:00am default until they
 * ever set one. Exposed so Settings → Learning can show/edit it without duplicating the storage
 * key or the default. */
export async function getNotificationTime(): Promise<NotificationTime> {
  try {
    const raw = await SecureStore.getItemAsync(NOTIFICATION_TIME_KEY)
    if (!raw) return { hour: DEFAULT_NOTIFICATION_HOUR, minute: DEFAULT_NOTIFICATION_MINUTE }
    const parsed = JSON.parse(raw) as Partial<NotificationTime>
    if (typeof parsed.hour === 'number' && typeof parsed.minute === 'number') {
      return { hour: parsed.hour, minute: parsed.minute }
    }
  } catch {
    // Fall through to the default below.
  }
  return { hour: DEFAULT_NOTIFICATION_HOUR, minute: DEFAULT_NOTIFICATION_MINUTE }
}

/**
 * Persists the learner's chosen notification time and, if today's word is already known,
 * reschedules the standing notification to the new time immediately — otherwise the change would
 * silently do nothing until the next refresh happened to run. Safe to call with no word generated
 * yet (e.g. before the first one exists): the preference is still saved, and the next
 * refreshWordOfTheDayIfNeeded call picks it up when it first schedules.
 */
export async function setNotificationTime(time: NotificationTime, t: TranslateFn): Promise<void> {
  await SecureStore.setItemAsync(NOTIFICATION_TIME_KEY, JSON.stringify(time))
  const existing = await readStored()
  if (!existing) return
  const notificationId = await scheduleNotification(existing.word, existing.explanation, existing.notificationId, t)
  await writeStored({ ...existing, ...(notificationId && { notificationId }) })
}

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
}

interface StoredWordOfTheDay extends WordOfTheDay {
  /** The scheduled notification's id, so a later refresh can cancel it before scheduling the
   * replacement — otherwise stale and fresh notifications would both be pending at once. */
  notificationId?: string
}

/** Local calendar date, not UTC — a word generated at 11pm shouldn't look stale at 11:05pm just
 * because UTC rolled over, and the daily notification fires on the device's own clock too. */
function todayDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function readStored(): Promise<StoredWordOfTheDay | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredWordOfTheDay
  } catch {
    return null
  }
}

async function writeStored(value: StoredWordOfTheDay): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(value))
  } catch {
    // Ignore secure store errors — worst case, the word regenerates next check.
  }
}

async function readHistory(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

async function appendToHistory(word: string): Promise<void> {
  try {
    const history = await readHistory()
    const updated = [word, ...history.filter((w) => w.toLowerCase() !== word.toLowerCase())].slice(0, 60)
    await SecureStore.setItemAsync(HISTORY_KEY, JSON.stringify(updated))
  } catch {
    // Ignore history write errors.
  }
}

/** Returns whatever's cached if matching the current level/language, or null if a level change happened. */
export async function getStoredWordOfTheDay(
  cefrLevel?: CefrLevel,
  targetLanguage?: LanguageCode,
  nativeLanguage?: LanguageCode,
): Promise<WordOfTheDay | null> {
  const stored = await readStored()
  if (!stored) return null
  if (cefrLevel && stored.cefrLevel !== cefrLevel) return null
  if (targetLanguage && stored.language !== targetLanguage) return null
  if (nativeLanguage && stored.nativeLanguage !== nativeLanguage) return null
  return stored
}

let permissionRequested = false

async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync()
  if (current.granted) return true
  if (permissionRequested) return false
  permissionRequested = true
  const requested = await Notifications.requestPermissionsAsync()
  return requested.granted
}

/**
 * A DAILY repeating trigger (fires every day at a fixed local time), not a fresh one-shot
 * scheduled per day — this app has no backend/push infrastructure, so there's no reliable way to
 * regenerate content in the background on a day the user never opens the app. A repeating trigger
 * means the notification still fires on such a day (with yesterday's word, better than nothing);
 * the content just gets refreshed opportunistically, in-place, the next time the app IS opened and
 * a new word is generated — see refreshWordOfTheDayIfNeeded. Cancels any previously-scheduled
 * word-of-the-day notification first so a stale one is never left alongside the fresh one.
 */
async function scheduleNotification(
  word: string,
  explanation: string,
  previousNotificationId: string | undefined,
  t: TranslateFn,
): Promise<string | undefined> {
  try {
    if (!(await ensureNotificationPermission())) return undefined
    if (previousNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(previousNotificationId).catch(() => {})
    }
    const { hour, minute } = await getNotificationTime()
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: t('✨ Word of the Day: {{word}}', { word }),
        body: explanation,
        // Opens the same Home-screen "Word of the Day" summary popup a tap on the dashboard tile
        // opens (see openWotd in app/(tabs)/index.tsx) - not straight to the full word/[form]
        // detail screen. The popup's own "Explore Full Details" button is still there for anyone
        // who wants to go deeper.
        data: { path: '/', openWotd: '1' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    })
  } catch (error) {
    log.error('vocabulary.word_of_the_day_notification_failed', error, {
      message: 'Could not schedule the Word of the Day notification',
    })
    return undefined
  }
}

const MAX_UNIQUE_WORD_ATTEMPTS = 5

function normalizedWord(word: string): string {
  return word.normalize('NFKC').trim().toLocaleLowerCase()
}

/**
 * Asks the AI for a word, then actually verifies it's not a repeat instead of trusting the
 * prompt's exclude-list instruction alone — a model can and does occasionally ignore it,
 * especially once excludeWords gets long. Retries with the offending word appended to the
 * exclude list up to MAX_UNIQUE_WORD_ATTEMPTS times. A repeated result is never persisted as a
 * new daily word: after the final attempt this throws, leaving the previous value stale so the
 * next foreground transition can retry instead of silently recording a duplicate for today.
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
    log.warn('vocabulary.word_of_the_day_duplicate_suggested', {
      message: `AI suggested an already-known/recent word on attempt ${attempt} of ${MAX_UNIQUE_WORD_ATTEMPTS} - retrying`,
    })
    attemptExclude = [...attemptExclude, result.data.word]
  }
  throw new Error(`AI suggested a repeated Word of the Day ${MAX_UNIQUE_WORD_ATTEMPTS} times`)
}

/**
 * Generates and persists a fresh Word of the Day if the stored one is missing, from a previous
 * calendar day, or was generated for a CEFR level/language pair the learner has since changed in
 * Settings — a level change mid-day immediately generates a new word at their new level.
 */
export async function refreshWordOfTheDayIfNeeded(params: {
  ai: AIProvider
  db: DatabaseAdapter
  targetLanguage: LanguageCode
  nativeLanguage: LanguageCode
  cefrLevel: CefrLevel
  t: TranslateFn
}): Promise<WordOfTheDay | null> {
  const { ai, db, targetLanguage, nativeLanguage, cefrLevel, t } = params
  const today = todayDateKey()
  const existing = await readStored()
  if (
    existing &&
    existing.dateKey === today &&
    existing.language === targetLanguage &&
    existing.nativeLanguage === nativeLanguage &&
    existing.cefrLevel === cefrLevel
  ) {
    return existing
  }

  try {
    const [knownWords, historyWords] = await Promise.all([
      getAllLemmaFormsForLanguage(db, targetLanguage),
      readHistory(),
    ])
    const excludeList = Array.from(new Set([...knownWords, ...historyWords]))
    const result = await requestUniqueWord(ai, { cefrLevel, language: targetLanguage, nativeLanguage }, excludeList)
    const notificationId = await scheduleNotification(
      result.data.word,
      result.data.explanation,
      existing?.notificationId,
      t,
    )
    const fresh: StoredWordOfTheDay = {
      word: result.data.word,
      explanation: result.data.explanation,
      ...(result.data.exampleSentence && { exampleSentence: result.data.exampleSentence }),
      ...(result.data.exampleTranslation && { exampleTranslation: result.data.exampleTranslation }),
      language: targetLanguage,
      nativeLanguage,
      cefrLevel,
      dateKey: today,
      ...(notificationId && { notificationId }),
    }
    await Promise.all([
      writeStored(fresh),
      appendToHistory(result.data.word),
    ])
    log.info('vocabulary.word_of_the_day_refreshed', {
      message: 'Word of the Day generated',
      metadata: { tokenCountBucket: result.usage.tokensUsed > 500 ? '500+' : '<500' },
    })
    return fresh
  } catch (error) {
    log.error('vocabulary.word_of_the_day_refresh_failed', error, {
      message: 'Could not generate a fresh Word of the Day',
    })
    return existing
  }
}
