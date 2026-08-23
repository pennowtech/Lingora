import { synthesizeSpeech, type CloudAudioProviderName } from './audio'

/**
 * Playing already-synthesized audio bytes — the shared contract, not a shared implementation.
 * Mobile needs a real temp file (expo-audio's player only accepts a URI, not raw bytes); a
 * browser/Tauri WebView can play a Blob directly with no filesystem step at all. Each platform
 * supplies its own object satisfying this interface - apps/mobile/lib/cloudTts.ts (expo-audio) and
 * apps/desktop/src/services/desktopAudioPlayback.ts (HTMLAudioElement). What *is* shared is the
 * fetch-then-play-then-retry-once orchestration below, which only needs an AudioPlayback to run
 * unchanged on either platform.
 */
export interface AudioPlayback {
  /** Starts playing `bytes` once, replacing/stopping whatever this same object was already
   * playing. Resolves once playback has started (not once it finishes) — matches expo-audio's
   * `.play()` being fire-and-forget; each implementation owns its own cleanup once playback ends. */
  play(bytes: Uint8Array, mimeType: string): Promise<void>
  stop(): void
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetches speech audio from `provider` and plays it via `playback` — the cloud-TTS half of a
 * platform's own speak() orchestration (see apps/mobile/lib/speech.ts). Retries once on failure:
 * observed in practice as an occasional first-attempt-only failure right after switching a cloud
 * provider's voice, symptom consistent with the native player still finishing its async load of a
 * freshly-written/freshly-created source when play() is called — a transient race, not a real
 * synthesis/key problem, so silently retrying once is more useful than surfacing it as an error.
 */
export async function playCloudSpeech(
  playback: AudioPlayback,
  provider: CloudAudioProviderName,
  text: string,
  apiKey: string,
  voice: string,
  speed?: number,
  fetchFn?: typeof fetch,
  model?: string,
): Promise<void> {
  const synthesizeAndPlay = async (): Promise<void> => {
    const bytes = await synthesizeSpeech(
      provider,
      { text, apiKey, voice, ...(speed !== undefined && { speed }), ...(model !== undefined && { model }) },
      fetchFn,
    )
    await playback.play(new Uint8Array(bytes), 'audio/mpeg')
  }
  try {
    await synthesizeAndPlay()
  } catch {
    playback.stop()
    await wait(250)
    try {
      await synthesizeAndPlay()
    } catch (retryError) {
      playback.stop()
      throw retryError
    }
  }
}

export function stopCloudSpeech(playback: AudioPlayback): void {
  playback.stop()
}
