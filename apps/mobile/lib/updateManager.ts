import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import { logger } from '@lingora/observability'
import i18n from './i18n'
import {
  checkPlayStoreUpdate,
  openPlayStoreListing,
  type PlayStoreUpdateInfo,
} from '../modules/play-in-app-update'

export { openPlayStoreListing }

const log = logger.child({ feature: 'app', component: 'UpdateManager' })

export const PLAY_STORE_PACKAGE = 'com.lingora.mobile'
const AUTO_UPDATE_KEY = 'lingora.auto_update_enabled'
const LAST_NOTIFIED_VERSION_KEY = 'lingora.last_notified_version'
const LAST_CHECK_TIME_KEY = 'lingora.last_update_check_time'

// Check interval when app is active: minimum 24 hours between automatic checks to conserve battery
const MIN_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000

export interface AppUpdateNotificationPayload {
  version?: string | undefined
  versionCode?: number | undefined
  changelog?: string | undefined
}

export interface CheckUpdateResult {
  updateAvailable: boolean
  currentVersion: string
  currentVersionCode: number
  availableVersionCode?: number | undefined
  latestVersion?: string | undefined
  changelog?: string | undefined
  playStoreUrl: string
  error?: boolean | undefined
}

let permissionRequested = false

async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync()
    if (current.granted) return true
    if (permissionRequested) return false
    permissionRequested = true
    const requested = await Notifications.requestPermissionsAsync()
    return requested.granted
  } catch (err) {
    log.error('app.permission_error', err, { message: 'Failed to request notification permission' })
    return false
  }
}

/**
 * Returns true if update checks and notifications are enabled.
 * Defaults to true. If the user disables it, updateManager respects
 * that decision and triggers no automatic checks or notifications.
 */
export async function getAutoUpdateEnabled(): Promise<boolean> {
  try {
    const stored = await SecureStore.getItemAsync(AUTO_UPDATE_KEY)
    if (stored === null) return true // Default: true (enabled by default)
    return stored === 'true'
  } catch {
    return true
  }
}

export async function setAutoUpdateEnabled(enabled: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(AUTO_UPDATE_KEY, enabled ? 'true' : 'false')
  } catch (err) {
    log.error('app.set_preference_failed', err, { message: 'Failed to save auto-update preference' })
  }
}

/**
 * Fires a local system notification informing the user that a new version is available on Google Play.
 * Tapping this notification passes `{ type: 'app_update', openWhatsNew: '1', source: 'play_store', ... }`
 * to the notification response handler to display "What's Fresh".
 */
export async function notifyUpdateAvailable(payload?: AppUpdateNotificationPayload): Promise<void> {
  try {
    const granted = await ensureNotificationPermission()
    if (!granted) return

    const currentVersion = Constants.expoConfig?.version ?? '0.3.0'
    const versionLabel = payload?.version ?? currentVersion

    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('Lemony Update Available'),
        body: i18n.t("A new version is ready on Google Play Store. Tap to see what's fresh!"),
        data: {
          type: 'app_update',
          openWhatsNew: '1',
          source: 'play_store',
          version: versionLabel,
          versionCode: payload?.versionCode,
          changelog: payload?.changelog,
          playStoreUrl: `market://details?id=${PLAY_STORE_PACKAGE}`,
        },
      },
      trigger: null,
    })

    const versionKey = payload?.versionCode ? `vc_${payload.versionCode}` : versionLabel
    await SecureStore.setItemAsync(LAST_NOTIFIED_VERSION_KEY, versionKey).catch(() => {})
  } catch (err) {
    log.error('app.notification_failed', err, { message: 'Failed to schedule Play Store update notification' })
  }
}

/**
 * Main update check logic querying the Google Play Store directly.
 * Checks for updates if:
 * 1. user has enabled update checks (or force === true), AND
 * 2. enough time has elapsed since last check (unless force === true).
 */
export async function checkForAppUpdate(options?: {
  force?: boolean
  notify?: boolean
}): Promise<CheckUpdateResult> {
  const currentVersion = Constants.expoConfig?.version ?? '0.3.0'
  const currentVersionCode = Constants.expoConfig?.android?.versionCode ?? 13
  const autoUpdate = await getAutoUpdateEnabled()
  const playStoreUrl = `market://details?id=${PLAY_STORE_PACKAGE}`

  if (!options?.force) {
    // If the user disabled update checks, strictly respect that decision: no checks, no triggers, no notifications
    if (!autoUpdate) {
      return {
        updateAvailable: false,
        currentVersion,
        currentVersionCode,
        playStoreUrl,
      }
    }

    // Rate-limit automated checks
    const lastCheckStr = await SecureStore.getItemAsync(LAST_CHECK_TIME_KEY).catch(() => null)
    if (lastCheckStr) {
      const lastCheckTime = parseInt(lastCheckStr, 10)
      if (Date.now() - lastCheckTime < MIN_CHECK_INTERVAL_MS) {
        return {
          updateAvailable: false,
          currentVersion,
          currentVersionCode,
          playStoreUrl,
        }
      }
    }
  }

  await SecureStore.setItemAsync(LAST_CHECK_TIME_KEY, Date.now().toString()).catch(() => {})

  // Query Google Play Store using Google Play In-App Updates
  let updateAvailable = false
  let availableVersionCode: number | undefined
  let hasError = false

  try {
    const playInfo: PlayStoreUpdateInfo = await checkPlayStoreUpdate()
    if (playInfo.error && !playInfo.updateAvailable) {
      log.warn('app.play_store_query_warn', { message: playInfo.error })
      hasError = true
    } else {
      updateAvailable = playInfo.updateAvailable
      availableVersionCode = playInfo.availableVersionCode
    }
  } catch (err) {
    log.error('updater.play_store_query_error', err, { message: 'Failed to query Play Store' })
    hasError = true
  }

  if (updateAvailable && options?.notify !== false) {
    const versionKey = availableVersionCode ? `vc_${availableVersionCode}` : 'play_store_latest'
    const lastNotified = await SecureStore.getItemAsync(LAST_NOTIFIED_VERSION_KEY).catch(() => null)
    if (options?.force || lastNotified !== versionKey) {
      await notifyUpdateAvailable({
        versionCode: availableVersionCode,
      })
    }
  }

  return {
    updateAvailable,
    currentVersion,
    currentVersionCode,
    availableVersionCode,
    playStoreUrl,
    error: hasError && !updateAvailable,
  }
}
