import { useEffect, useRef, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import * as Linking from 'expo-linking'
import * as Notifications from 'expo-notifications'
import { AppState, type AppStateStatus } from 'react-native'
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
  const queryClient = useQueryClient()

  // Params captured by the AppState listener below need to stay current without re-subscribing
  // it on every render (that would drop/re-add the listener constantly) - a ref does that.
  const paramsRef = useRef({ ai, db, tier, targetLanguage, nativeLanguage, defaultCefr, t })
  paramsRef.current = { ai, db, tier, targetLanguage, nativeLanguage, defaultCefr, t }
  const refreshInFlightRef = useRef<Promise<void> | null>(null)
  const handledNotificationIdsRef = useRef(new Set<string>())

  const runRefresh = (): Promise<void> => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current
    const p = paramsRef.current
    if (p.tier !== 'full' || !p.ai) return Promise.resolve()

    const refresh = refreshWordOfTheDayIfNeeded({
      ai: p.ai,
      db: p.db,
      targetLanguage: p.targetLanguage,
      nativeLanguage: p.nativeLanguage,
      cefrLevel: p.defaultCefr,
      t: p.t,
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ['word-of-the-day'] }))
      .catch((error: unknown) => {
        log.error('vocabulary.word_of_the_day_lifecycle_failed', error, {
          message: 'Word of the Day refresh threw outside its own try/catch',
        })
      })
      .then(() => undefined)

    refreshInFlightRef.current = refresh
    void refresh.finally(() => {
      if (refreshInFlightRef.current === refresh) refreshInFlightRef.current = null
    })
    return refresh
  }

  useEffect(() => {
    // A cold start is only one moment in a mobile app's life - most days the app is simply
    // resumed from the background (tapping the icon, tapping the daily notification, switching
    // back to it) without the process, and this component, ever remounting. Checking only on
    // mount meant the stored word could go stale for days at a time even though the *notification*
    // itself kept firing daily (its own OS-level repeating trigger doesn't depend on this at all)
    // - the in-app word and the next notification's content both just kept re-showing whatever was
    // generated the last time the app happened to cold-start. Re-running the same staleness check
    // on every foreground transition, not just mount, is what actually makes "once a day" true.
    void runRefresh()
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') void runRefresh()
    })
    return () => subscription.remove()
  }, [queryClient])

  // Tapping the daily notification opens the Home screen's own Word of the Day popup — same
  // summary a tap on the dashboard tile opens — via the `openWotd` param (see app/(tabs)/index.tsx).
  // Uses the same cold-start-safe Linking.openURL pattern CaptureIntentHandler uses, for the same
  // reason: this listener can fire before the root navigator has finished mounting on a cold start
  // from the notification itself.
  useEffect(() => {
    let active = true

    const handleResponse = async (response: Notifications.NotificationResponse | null): Promise<void> => {
      if (!response || !active) return
      const notificationId = response.notification.request.identifier
      if (handledNotificationIdsRef.current.has(notificationId)) return

      const data = response.notification.request.content.data
      const path = data?.path
      if (typeof path !== 'string' || data?.openWotd !== '1') return
      handledNotificationIdsRef.current.add(notificationId)
      await Notifications.clearLastNotificationResponseAsync().catch(() => {})

      // AppState becomes active before this callback on some Android versions. Wait for that
      // refresh (or start it here) before opening Home, otherwise the modal can render yesterday's
      // cached word for a moment and look as though the daily word repeated.
      await runRefresh()
      if (!active) return
      const openWotd = typeof data?.openWotd === 'string' ? data.openWotd : undefined
      const url = Linking.createURL(path, { ...(openWotd && { queryParams: { openWotd } }) })
      await Linking.openURL(url).catch((error: unknown) => {
        log.error('vocabulary.word_of_the_day_notification_navigation_failed', error, {
          message: 'Failed to open Word of the Day notification',
        })
      })
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      void handleResponse(response)
    })
    // The event listener only covers taps received after JavaScript has mounted. Reading the last
    // response handles a notification that cold-started a previously terminated app.
    void Notifications.getLastNotificationResponseAsync().then(handleResponse)

    return () => {
      active = false
      subscription.remove()
    }
  }, [])

  return null
}
