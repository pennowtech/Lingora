/**
 * On-device (offline, no API key) text-to-speech — the shared contract, not a shared
 * implementation. Mobile speaks through expo-speech (apps/mobile/lib/deviceTts.ts); desktop speaks
 * through the browser/WebView's Web Speech API (apps/desktop/src/services/desktopDeviceTts.ts) —
 * two genuinely different native APIs (different voice-identifier shapes, different error/event
 * models), so each platform normalizes its own engine into this interface. What *is* shared is the
 * retry-once-on-error orchestration and the network-backed-voice-avoidance heuristic below, which
 * only need a DeviceTts to run unchanged on either platform.
 */
export interface DeviceVoice {
  /** Opaque per-platform voice id — an expo-speech Voice.identifier, or a Web Speech
   * SpeechSynthesisVoice's voiceURI/name. Passed back into DeviceTts.speak's `voice` option as-is. */
  identifier: string
  name: string
  /** BCP-47 language tag, e.g. 'de-DE'. */
  language: string
  /** True for a platform-flagged higher-quality voice, when the platform distinguishes one. */
  enhanced?: boolean
}

export interface DeviceTtsSpeakOptions {
  /** BCP-47 locale, e.g. 'de-DE'. */
  language: string
  rate: number
  pitch: number
  /** A DeviceVoice.identifier, or null for the platform's own default voice for `language`. */
  voice: string | null
  onError?: () => void
}

export interface DeviceTts {
  /** Stops whatever this same object was already speaking, then speaks `text`. Fire-and-forget —
   * completion/failure is reported only through `options.onError`, matching both expo-speech's and
   * the Web Speech API's own event-callback shape rather than a Promise. */
  speak(text: string, options: DeviceTtsSpeakOptions): void
  stop(): void
  getAvailableVoices(): Promise<DeviceVoice[]>
}

/**
 * Android's TTS engine can offer a network/server-backed voice as a language's OS default
 * (observed identifier shape: `*-server`) alongside on-device ones (`*-embedded`/`*-lstm-embedded`)
 * — the network variant calls out to a synthesis server over HTTPS and can time out for minutes at
 * a time on networks that intercept/block that traffic. There's no cross-platform "requires
 * network" flag, so this is a best-effort identifier heuristic, not a guarantee — harmless (matches
 * nothing) on platforms/voices that don't use this naming convention.
 */
const NETWORK_VOICE_PATTERN = /-server\b/i

/** The first voice in `voices` that doesn't look network-backed (see NETWORK_VOICE_PATTERN), or
 * null if none do — callers fall back to no explicit voice (platform default) in that case. */
export function pickPreferredOfflineVoice(voices: DeviceVoice[]): string | null {
  return voices.find((v) => !NETWORK_VOICE_PATTERN.test(v.identifier))?.identifier ?? null
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Speaks `text` via `deviceTts`, retrying once (after a short delay) if the platform reports a
 * failure through `options.onError` — in practice, an occasional transient synthesis error rather
 * than a systematic one, so silently retrying once is more useful than surfacing it. Calls
 * `onFailedAfterRetry` (for logging) only once the retry has also failed.
 */
export function speakOnDeviceWithRetry(
  deviceTts: DeviceTts,
  text: string,
  options: Omit<DeviceTtsSpeakOptions, 'onError'>,
  onFailedAfterRetry?: (retryCount: number) => void,
): void {
  const attempt = (isRetry: boolean): void => {
    deviceTts.speak(text, {
      ...options,
      onError: () => {
        if (!isRetry) {
          void wait(200).then(() => attempt(true))
        } else {
          onFailedAfterRetry?.(1)
        }
      },
    })
  }
  attempt(false)
}
