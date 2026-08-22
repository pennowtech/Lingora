import { useEffect, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import * as Linking from 'expo-linking'
import * as Notifications from 'expo-notifications'
import { logger } from '@lingora/observability'
import { refreshWordOfTheDayIfNeeded } from '../lib/wordOfTheDay'
import { useServices } from '../lib/services'

const log = logger.child({ feature: 'vocabulary', component: 'WordOfTheDayLifecycle' })

/**
 * Mounted once at the app root (app/_layout.tsx), alongside the other headless lifecycle
 * components — regenerates today's Word of the Day (and its notification) whenever the app opens
 * with a stale one, and navigates to the word when the notification itself is tapped. Renders
 * nothing. Entirely inert without an AI provider configured (tier !== 'full') — see
 * refreshWordOfTheDayIfNeeded's own gating, mirrored here so this doesn't even attempt the check.
 */
export function WordOfTheDayLifecycle(): JSX.Element | null {
  const { ai, db, tier, targetLanguage, nativeLanguage, defaultCefr } = useServices()
  const { t } = useTranslation()

  useEffect(() => {
    if (tier !== 'full' || !ai) return
    refreshWordOfTheDayIfNeeded({ ai, db, targetLanguage, nativeLanguage, cefrLevel: defaultCefr, t }).catch(
      (error: unknown) => {
        log.error('vocabulary.word_of_the_day_lifecycle_failed', error, {
          message: 'Word of the Day refresh threw outside its own try/catch',
        })
      },
    )
  }, [ai, db, tier, targetLanguage, nativeLanguage, defaultCefr])

  // Tapping the daily notification opens the word directly — same cold-start-safe
  // Linking.openURL pattern CaptureIntentHandler uses, for the same reason: this listener can fire
  // before the root navigator has finished mounting on a cold start from the notification itself.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data
      const path = data?.path
      if (typeof path !== 'string') return
      // Carries the notification's own explanation text through so word/[form].tsx can show it
      // right away (its isGeneratingNewWord skeleton) instead of a bare loading badge while the
      // full AI card generates in the background.
      const initialExplanation = typeof data?.initialExplanation === 'string' ? data.initialExplanation : undefined
      const url = Linking.createURL(path, { ...(initialExplanation && { queryParams: { initialExplanation } }) })
      Linking.openURL(url).catch((error: unknown) => {
        log.error('vocabulary.word_of_the_day_notification_navigation_failed', error, {
          message: 'Failed to open Word of the Day notification',
        })
      })
    })
    return () => subscription.remove()
  }, [])

  return null
}
