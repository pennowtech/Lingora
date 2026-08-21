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
/** Fixed local time the daily notification fires at — see scheduleNotification's doc comment for
 * why this is a repeating trigger rather than a fresh one-shot each day. */
const NOTIFICATION_HOUR = 9
const NOTIFICATION_MINUTE = 0

export interface WordOfTheDay {
  word: string
  explanation: string
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

/** Returns whatever's cached, stale or not — callers that just want something to show right away
 * (the Home card) use this; refreshIfNeeded is what keeps it from staying stale forever. */
export async function getStoredWordOfTheDay(): Promise<WordOfTheDay | null> {
  return readStored()
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
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: t('✨ Word of the Day: {{word}}', { word }),
        body: explanation,
        data: { path: `/word/${encodeURIComponent(word)}` },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: NOTIFICATION_HOUR,
        minute: NOTIFICATION_MINUTE,
      },
    })
  } catch (error) {
    log.error('vocabulary.word_of_the_day_notification_failed', error, {
      message: 'Could not schedule the Word of the Day notification',
    })
    return undefined
  }
}

/**
 * Generates and persists a fresh Word of the Day if the stored one is missing, from a previous
 * calendar day, or was generated for a CEFR level/language pair the learner has since changed in
 * Settings — a level change mid-day shouldn't leave yesterday's (now wrong-level) word sitting
 * there until midnight. (Re)schedules today's notification with whatever it settles on. A no-op,
 * returning the existing value, if it's still fresh on every count — so calling this on every app
 * open/Home focus is cheap and safe. Only ever called when tier === 'full' (an AI provider is
 * configured) — the whole feature is unavailable otherwise, see the Home screen's own gating.
 */
export async function refreshWordOfTheDayIfNeeded(params: {
  ai: AIProvider
  db: DatabaseAdapter
  targetLanguage: LanguageCode
  nativeLanguage: LanguageCode
  cefrLevel: CefrLevel
  /** Same permissive shape as lib/providerValidation.ts's TranslateFn — accepts react-i18next's
   * real `t` (its exact overload signature is awkward to match structurally) or any simple
   * fallback with the same basic call shape. */
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
    const knownWords = await getAllLemmaFormsForLanguage(db, targetLanguage)
    const result = await ai.suggestWordOfTheDay({ cefrLevel, language: targetLanguage, nativeLanguage }, knownWords)
    const notificationId = await scheduleNotification(
      result.data.word,
      result.data.explanation,
      existing?.notificationId,
      t,
    )
    const fresh: StoredWordOfTheDay = {
      word: result.data.word,
      explanation: result.data.explanation,
      language: targetLanguage,
      nativeLanguage,
      cefrLevel,
      dateKey: today,
      ...(notificationId && { notificationId }),
    }
    await writeStored(fresh)
    log.info('vocabulary.word_of_the_day_refreshed', {
      message: 'Word of the Day generated',
      metadata: { tokenCountBucket: result.usage.tokensUsed > 500 ? '500+' : '<500' },
    })
    return fresh
  } catch (error) {
    log.error('vocabulary.word_of_the_day_refresh_failed', error, {
      message: 'Could not generate a fresh Word of the Day',
    })
    // Stale is still better than nothing on the Home card, even though it failed to refresh.
    return existing
  }
}
