import { NativeModule, requireNativeModule } from 'expo'
import { Linking, Platform } from 'react-native'

export interface PlayStoreUpdateInfo {
  updateAvailable: boolean
  availableVersionCode?: number
  stalenessDays?: number
  availabilityCode?: number
  error?: string
}

declare class PlayInAppUpdateNativeModule extends NativeModule {
  checkPlayStoreUpdate(): Promise<PlayStoreUpdateInfo>
  openPlayStoreListing(): Promise<boolean>
}

let nativeModule: PlayInAppUpdateNativeModule | null = null
if (Platform.OS === 'android') {
  try {
    nativeModule = requireNativeModule<PlayInAppUpdateNativeModule>('PlayInAppUpdate')
  } catch {
    nativeModule = null
  }
}

/**
 * Queries Google Play Store on the device using Google Play In-App Updates API.
 * Returns update availability and available version code directly from Play Store.
 */
export async function checkPlayStoreUpdate(): Promise<PlayStoreUpdateInfo> {
  if (!nativeModule) {
    return { updateAvailable: false, error: 'Google Play module not loaded' }
  }
  return nativeModule.checkPlayStoreUpdate()
}

/**
 * Directly launches the Google Play Store app to the Lemony app listing.
 * Falls back to web URL if Play Store app is unavailable.
 */
export async function openPlayStoreListing(packageName = 'com.lingora.mobile'): Promise<void> {
  if (nativeModule) {
    try {
      await nativeModule.openPlayStoreListing()
      return
    } catch {
      // Fall through to Linking
    }
  }

  const marketUrl = `market://details?id=${packageName}`
  const webUrl = `https://play.google.com/store/apps/details?id=${packageName}`
  const canOpen = await Linking.canOpenURL(marketUrl).catch(() => false)
  if (canOpen) {
    await Linking.openURL(marketUrl).catch(() => Linking.openURL(webUrl))
  } else {
    await Linking.openURL(webUrl).catch(() => {})
  }
}
