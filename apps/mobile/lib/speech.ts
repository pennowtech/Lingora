import type { LanguageCode } from '@lingora/types'
import { logger } from '@lingora/observability'
import * as Speech from 'expo-speech'
import { getDefaultCloudVoice } from './audioProviderMeta'
import { playCloudSpeech, stopCloudSpeech } from './cloudTts'
import { CloudTtsError } from './cloudTtsProviders'
import { getAudioProvider, getAvailableVoices, getCloudAudioConfig, getTtsSettings } from './ttsSettings'

const log = logger.child({ feature: 'app', component: 'speech' })

/** BCP-47 locale expo-speech expects — device TTS voice availability varies, but this picks the right language family. */
const LOCALES: Record<LanguageCode, string> = {
  de: 'de-DE',
  en: 'en-US',
  ja: 'ja-JP',
  es: 'es-ES',
  fr: 'fr-FR',
  vi: 'vi-VN',
  hi: 'hi-IN',
}

/**
 * Warms up the native TTS engine well before the first speaker-icon tap —
 * on Android, `expo-speech` binds to the system TextToSpeech service
 * asynchronously, so calling this once during app bootstrap (see
 * lib/services.tsx) means that bind is already done by the time a real tap
 * happens, rather than racing it.
 */
export function warmUpSpeechEngine(): void {
  void Speech.getAvailableVoicesAsync().catch(() => undefined)
}

/**
 * Android's TTS engine can offer a network/server-backed voice as the
 * language's OS default (observed identifier shape: `*-x-*-server`) as well
 * as an on-device one (`*-embedded`/`*-lstm-embedded`). The network variant
 * calls out to a synthesis server over HTTPS and can time out for minutes
 * at a time on networks that intercept/block that traffic (this project's
 * corporate-VPN dev machines, in particular — the same class of problem as
 * the Zscaler cert issue documented for AI-provider fetch() calls) while
 * every other network path in the app works fine. There's no cross-voice
 * "requires network" flag exposed through expo-speech's Voice type, so this
 * is a best-effort identifier heuristic, not a guarantee.
 */
const NETWORK_VOICE_PATTERN = /-server\b/i

/** Per-language, process-lifetime cache — voice availability doesn't change mid-session. */
const preferredVoiceCache: Partial<Record<LanguageCode, string | null>> = {}

/**
 * The first available voice for `language` that doesn't look network-backed
 * (see NETWORK_VOICE_PATTERN), or null if lookup fails or every voice for
 * that language looks network-backed — callers fall back to no explicit
 * voice (OS default) in that case, same as before this existed.
 */
async function getPreferredOfflineVoice(language: LanguageCode): Promise<string | null> {
  const cached = preferredVoiceCache[language]
  if (cached !== undefined) return cached
  const voices = await getAvailableVoices(language).catch(() => [])
  const offlineVoice = voices.find((v) => !NETWORK_VOICE_PATTERN.test(v.identifier))
  const chosen = offlineVoice?.identifier ?? null
  preferredVoiceCache[language] = chosen
  return chosen
}

/**
 * Speaks `text` in `language` using the device's built-in text-to-speech
 * engine (offline, no API key), applying whatever rate/pitch/voice the user
 * chose in Settings → Pronunciation (see lib/ttsSettings.ts). Stops any
 * speech already in progress first — tapping a second speaker button while
 * the first is still talking should replace it, not queue behind it.
 *
 * When the user hasn't picked a specific voice, steers away from a
 * network-backed default voice (see getPreferredOfflineVoice) rather than
 * leaving voice selection to the OS — an explicit user-chosen voice is
 * always respected as-is, network-backed or not.
 *
 * Also retries once on a native error, in case it's a transient synthesis
 * failure rather than the systematic network-voice timeout above.
 */
export function speak(text: string, language: LanguageCode): void {
  const trimmed = text.trim()
  if (trimmed === '') return
  void Speech.stop()
  stopCloudSpeech()
  getAudioProvider()
    .then(async (provider) => {
      if (provider === 'device') {
        speakOnDevice(trimmed, language)
        return
      }
      const { apiKey, voice, speed } = await getCloudAudioConfig(provider)
      if (apiKey === '') {
        // No key configured for the chosen cloud provider yet — fall back to device TTS
        // rather than a silent no-op on speaker-button tap.
        speakOnDevice(trimmed, language)
        return
      }
      try {
        const effectiveVoice = getDefaultCloudVoice(provider, language, voice)
        await playCloudSpeech(provider, trimmed, apiKey, effectiveVoice, speed)
      } catch (error) {
        log.warn('app.cloud_speech_failed', {
          message: 'Cloud text-to-speech failed, falling back to device voice',
          metadata: {
            provider,
            ...(error instanceof CloudTtsError ? { statusCode: error.status } : {}),
          },
        })
        speakOnDevice(trimmed, language)
      }
    })
    .catch(() => {
      // Provider lookup failed (SecureStore unavailable) — still speak with defaults rather than staying silent.
      Speech.speak(trimmed, { language: LOCALES[language] })
    })
}

function speakOnDevice(trimmed: string, language: LanguageCode): void {
  getTtsSettings(language)
    .then(async (settings) => {
      const voice = settings.voice ?? (await getPreferredOfflineVoice(language))
      speakWithSettings(trimmed, language, { ...settings, voice })
    })
    .catch(() => {
      // Settings lookup failed (SecureStore unavailable) — still speak with defaults rather than staying silent.
      Speech.speak(trimmed, { language: LOCALES[language] })
    })
}

function speakWithSettings(
  trimmed: string,
  language: LanguageCode,
  settings: { rate: number; pitch: number; voice: string | null },
  isRetry = false,
): void {
  Speech.speak(trimmed, {
    language: LOCALES[language],
    rate: settings.rate,
    pitch: settings.pitch,
    ...(settings.voice !== null && { voice: settings.voice }),
    onError: () => {
      log.warn('app.speech_failed', {
        message: 'Text-to-speech playback failed',
        metadata: { retryCount: isRetry ? 1 : 0 },
      })
      if (!isRetry) {
        setTimeout(() => speakWithSettings(trimmed, language, settings, true), 200)
      }
    },
  })
}
