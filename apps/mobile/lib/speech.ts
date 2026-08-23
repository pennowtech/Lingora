import type { LanguageCode } from '@lingora/types'
import { logger } from '@lingora/observability'
import * as Speech from 'expo-speech'
import { CloudTtsError, getDefaultCloudVoice, pickPreferredOfflineVoice, speakOnDeviceWithRetry, type DeviceVoice } from '@lingora/core'
import { playCloudSpeech, stopCloudSpeech } from './cloudTts'
import { expoDeviceTts } from './deviceTts'
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

/** Per-language, process-lifetime cache — voice availability doesn't change mid-session. See
 * @lingora/core's pickPreferredOfflineVoice for why a network-backed voice is avoided (this
 * project's corporate-VPN dev machines, in particular, can time out for minutes on Android's
 * network/server-backed TTS voices — the same class of problem as the Zscaler cert issue
 * documented for AI-provider fetch() calls). */
const preferredVoiceCache: Partial<Record<LanguageCode, string | null>> = {}

async function getPreferredOfflineVoice(language: LanguageCode): Promise<string | null> {
  const cached = preferredVoiceCache[language]
  if (cached !== undefined) return cached
  const voices: DeviceVoice[] = await getAvailableVoices(language).catch(() => [])
  const chosen = pickPreferredOfflineVoice(voices)
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
      const { apiKey, voice, speed, model } = await getCloudAudioConfig(provider)
      if (apiKey === '') {
        // No key configured for the chosen cloud provider yet — fall back to device TTS
        // rather than a silent no-op on speaker-button tap.
        speakOnDevice(trimmed, language)
        return
      }
      try {
        const effectiveVoice = getDefaultCloudVoice(provider, language, voice)
        await playCloudSpeech(provider, trimmed, apiKey, effectiveVoice, speed, model || undefined)
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

function speakWithSettings(trimmed: string, language: LanguageCode, settings: { rate: number; pitch: number; voice: string | null }): void {
  speakOnDeviceWithRetry(expoDeviceTts, trimmed, { language: LOCALES[language], ...settings }, (retryCount) => {
    log.warn('app.speech_failed', {
      message: 'Text-to-speech playback failed after retry',
      metadata: { retryCount },
    })
  })
}
