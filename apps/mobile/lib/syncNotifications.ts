import { logger } from '@lingora/observability'
import * as Notifications from 'expo-notifications'
import type { CloudSyncSummary } from './cloudSync'

const log = logger.child({ feature: 'sync', component: 'SyncNotifications' })

Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
})

let permissionRequested = false

/** Requests notification permission once per app run, the first time a sync actually needs to
 * notify — not proactively at startup, so a user who never enables automatic sync is never
 * interrupted by a permission prompt for a feature they're not using. */
async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync()
  if (current.granted) return true
  if (permissionRequested) return false
  permissionRequested = true
  const requested = await Notifications.requestPermissionsAsync()
  return requested.granted
}

export async function notifySyncSucceeded(summary: CloudSyncSummary): Promise<void> {
  if (summary.pulled === 0 && summary.pushed === 0 && summary.deleted === 0) return
  try {
    if (!(await ensurePermission())) return
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Lemmory synced',
        body: `${summary.pulled} pulled · ${summary.pushed} pushed · ${summary.deleted} deleted`,
      },
      trigger: null,
    })
  } catch (error) {
    log.error('sync.notification_failed', error, { message: 'Could not show sync-success notification' })
  }
}

export async function notifySyncFailed(message: string): Promise<void> {
  try {
    if (!(await ensurePermission())) return
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Lemmory sync failed', body: message },
      trigger: null,
    })
  } catch (error) {
    log.error('sync.notification_failed', error, { message: 'Could not show sync-failure notification' })
  }
}
