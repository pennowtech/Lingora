import * as SecureStore from 'expo-secure-store'

const STORE_KEY = 'lingora.capture_destination'

/**
 * Where text captured from outside the app (Android's "Process Text" selection-toolbar entry, or
 * the standard share sheet — see `components/CaptureIntentHandler.tsx`) lands once Lemmory opens:
 *  - 'search': always the Search screen, prefilled — one destination, no guessing.
 *  - 'split': Process Text (usually one selected word) goes to Search; a share (usually a whole
 *    sentence/paragraph) goes to the Mine capture queue instead.
 *  - 'chooser': both show a small sheet with the captured text and a choice, every time.
 */
export type CaptureDestination = 'search' | 'split' | 'chooser'

const DEFAULT_DESTINATION: CaptureDestination = 'search'

function isCaptureDestination(value: string): value is CaptureDestination {
  return value === 'search' || value === 'split' || value === 'chooser'
}

export async function getCaptureDestination(): Promise<CaptureDestination> {
  const stored = await SecureStore.getItemAsync(STORE_KEY)
  return stored && isCaptureDestination(stored) ? stored : DEFAULT_DESTINATION
}

export async function setCaptureDestination(value: CaptureDestination): Promise<void> {
  await SecureStore.setItemAsync(STORE_KEY, value)
}
