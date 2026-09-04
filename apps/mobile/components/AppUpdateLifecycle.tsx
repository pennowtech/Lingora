import { useEffect, useRef, useState, type JSX } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import * as Notifications from 'expo-notifications'
import { logger } from '@lingora/observability'
import { checkForAppUpdate } from '../lib/updateManager'
import { WhatsNewModal } from './WhatsNewModal'

const log = logger.child({ feature: 'app', component: 'AppUpdateLifecycle' })

/**
 * Headless lifecycle component mounted at the app root (_layout.tsx).
 * 1. Checks for updates in the background when auto-update is disabled (throttled).
 * 2. Listens for update notification taps and immediately displays "What's Fresh in Lemony"
 *    via the WhatsNewModal.
 */
export function AppUpdateLifecycle(): JSX.Element | null {
  const [whatsNewVisible, setWhatsNewVisible] = useState(false)
  const [releaseVersion, setReleaseVersion] = useState<string | undefined>()
  const [releaseChangelog, setReleaseChangelog] = useState<string | undefined>()
  const [isPlayStoreUpdate, setIsPlayStoreUpdate] = useState(false)

  const handledNotificationIdsRef = useRef(new Set<string>())
  const checkInFlightRef = useRef<Promise<unknown> | null>(null)

  const runCheck = (): void => {
    if (checkInFlightRef.current) return
    const promise = checkForAppUpdate()
      .catch((err) => {
        log.error('updater.lifecycle_check_failed', err, { message: 'Background update check error' })
      })
      .finally(() => {
        checkInFlightRef.current = null
      })
    checkInFlightRef.current = promise
  }

  useEffect(() => {
    // Run update check on mount & when app comes to the foreground
    runCheck()
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        runCheck()
      }
    })
    return () => sub.remove()
  }, [])

  useEffect(() => {
    let active = true

    const handleResponse = async (response: Notifications.NotificationResponse | null): Promise<void> => {
      if (!response || !active) return
      const notificationId = response.notification.request.identifier
      if (handledNotificationIdsRef.current.has(notificationId)) return

      const data = response.notification.request.content.data
      if (data?.openWhatsNew === '1' || data?.type === 'app_update') {
        handledNotificationIdsRef.current.add(notificationId)
        await Notifications.clearLastNotificationResponseAsync().catch(() => {})

        const version = typeof data?.version === 'string' ? data.version : undefined
        const changelog = typeof data?.changelog === 'string' ? data.changelog : undefined
        const isPlayStore = data?.source === 'play_store' || !!data?.playStoreUrl

        setReleaseVersion(version)
        setReleaseChangelog(changelog)
        setIsPlayStoreUpdate(isPlayStore)
        setWhatsNewVisible(true)
      }
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      void handleResponse(response)
    })
    void Notifications.getLastNotificationResponseAsync().then(handleResponse)

    return () => {
      active = false
      subscription.remove()
    }
  }, [])

  return (
    <WhatsNewModal
      visible={whatsNewVisible}
      onClose={() => setWhatsNewVisible(false)}
      version={releaseVersion}
      markdownContent={releaseChangelog}
      showPlayStoreButton={isPlayStoreUpdate}
    />
  )
}
