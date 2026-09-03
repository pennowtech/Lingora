import { NativeModule, requireNativeModule } from 'expo'
import { Platform } from 'react-native'

type ProcessTextIntentEvents = {
  onProcessText: (event: { text: string }) => void
}

declare class ProcessTextIntentNativeModule extends NativeModule<ProcessTextIntentEvents> {
  /** Drains whatever PROCESS_TEXT intent launched the app cold (null if none, or already drained). */
  getInitialProcessText(): Promise<string | null>
}

const nativeModule: ProcessTextIntentNativeModule | null =
  Platform.OS === 'android' ? requireNativeModule<ProcessTextIntentNativeModule>('ProcessTextIntent') : null

/**
 * Android's "Process Text" intent — the entry Lemony adds to the system text-selection toolbar
 * (long-press a word in any app -> a "Search in Lemony" option appears next to Copy/Web search).
 * iOS has no equivalent OS hook, so this module (and its config plugin) is Android-only; every
 * export here is a safe no-op on iOS instead of throwing.
 *
 * `getInitialProcessText()` — call once on startup; resolves the text if the app was launched
 * cold by a Process Text tap, otherwise null. `addProcessTextListener(cb)` — call while the app
 * may already be running; fires for a Process Text tap that arrives mid-session. Both can fire for
 * the same launch in principle (cold start also triggers a fresh mount), so callers should treat
 * them as "the same event, delivered whichever way applies" rather than expecting exactly one.
 */
export async function getInitialProcessText(): Promise<string | null> {
  if (!nativeModule) return null
  return nativeModule.getInitialProcessText()
}

export function addProcessTextListener(callback: (text: string) => void): () => void {
  if (!nativeModule) return () => {}
  const subscription = nativeModule.addListener('onProcessText', (event) => callback(event.text))
  return () => subscription.remove()
}
