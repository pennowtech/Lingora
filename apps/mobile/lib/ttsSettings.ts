import type { LanguageCode } from '@lingora/types'
import * as Speech from 'expo-speech'
import * as SecureStore from 'expo-secure-store'
import {
  AUDIO_PROVIDER_STORE_KEY,
  AUDIO_PROVIDERS,
  AUDIO_STORE_KEYS,
  DEFAULT_AUDIO_SPEED,
  type AudioProviderName,
  type CloudAudioProviderName,
} from './audioProviderMeta'

// Declared locally rather than imported from './services' — services.tsx pulls in
// lib/speech.ts (to warm up the TTS engine at bootstrap), and speech.ts pulls in this
// module, so importing STORE_KEYS from services.tsx here closed a require cycle
// (services -> speech -> ttsSettings -> services). Same fix lib/i18n/index.ts already
// uses for the identical reason.
// Kept in sync with audioProviderMeta.ts's APP_KEY_PREFIX by convention rather than importing it —
// avoids pulling the whole provider-metadata module into every ttsSettings.ts import site just for
// a string prefix. Change both if reusing this module in another app (see audioProviderMeta.ts).
const APP_KEY_PREFIX = 'lingora'
const TTS_RATE_STORE_KEY = `${APP_KEY_PREFIX}.tts_rate`
const TTS_PITCH_STORE_KEY = `${APP_KEY_PREFIX}.tts_pitch`

/** A per-language chosen voice is its own key — a German voice choice shouldn't apply to English playback. */
function voiceKey(language: LanguageCode): string {
  return `${APP_KEY_PREFIX}.tts_voice.${language}`
}

export const DEFAULT_TTS_RATE = 1.0
export const DEFAULT_TTS_PITCH = 1.0

export interface TtsSettings {
  rate: number
  pitch: number
  /** expo-speech voice identifier, or null to let the OS pick its default voice for the language. */
  voice: string | null
}

/** Reads this device's stored TTS preferences for `language` — falls back to sane defaults if unset. */
export async function getTtsSettings(language: LanguageCode): Promise<TtsSettings> {
  const [rateRaw, pitchRaw, voice] = await Promise.all([
    SecureStore.getItemAsync(TTS_RATE_STORE_KEY),
    SecureStore.getItemAsync(TTS_PITCH_STORE_KEY),
    SecureStore.getItemAsync(voiceKey(language)),
  ])
  const rate = rateRaw !== null ? Number(rateRaw) : DEFAULT_TTS_RATE
  const pitch = pitchRaw !== null ? Number(pitchRaw) : DEFAULT_TTS_PITCH
  return {
    rate: Number.isFinite(rate) ? rate : DEFAULT_TTS_RATE,
    pitch: Number.isFinite(pitch) ? pitch : DEFAULT_TTS_PITCH,
    voice,
  }
}

export async function setTtsRate(rate: number): Promise<void> {
  await SecureStore.setItemAsync(TTS_RATE_STORE_KEY, String(rate))
}

export async function setTtsPitch(pitch: number): Promise<void> {
  await SecureStore.setItemAsync(TTS_PITCH_STORE_KEY, String(pitch))
}

/** `voice: null` clears the override and goes back to the OS default voice for the language. */
export async function setTtsVoice(language: LanguageCode, voice: string | null): Promise<void> {
  if (voice === null) await SecureStore.deleteItemAsync(voiceKey(language))
  else await SecureStore.setItemAsync(voiceKey(language), voice)
}

/** BCP-47 locale prefix used to filter the device's full voice list down to one language. */
const LOCALE_PREFIXES: Record<LanguageCode, string> = {
  de: 'de',
  en: 'en',
  ja: 'ja',
  es: 'es',
  fr: 'fr',
  vi: 'vi',
}

/** The device's installed TTS voices for `language`, for a voice picker in Settings. */
export async function getAvailableVoices(language: LanguageCode): Promise<Speech.Voice[]> {
  const all = await Speech.getAvailableVoicesAsync()
  const prefix = LOCALE_PREFIXES[language]
  return all.filter((v) => v.language.toLowerCase().startsWith(prefix))
}

// ─── Which engine speaks, not just how ─────────────────────────────────────
//
// One provider choice for the whole app — lib/speech.ts#speak() reads this and routes every
// speaker button (word detail, review session, search, everywhere) through the same engine, so
// switching providers here changes pronunciation everywhere uniformly instead of screen by screen.

/** The active TTS provider — 'device' (default) or one of the cloud providers. */
export async function getAudioProvider(): Promise<AudioProviderName> {
  const raw = await SecureStore.getItemAsync(AUDIO_PROVIDER_STORE_KEY)
  return (AUDIO_PROVIDERS as readonly string[]).includes(raw ?? '') ? (raw as AudioProviderName) : 'device'
}

export async function setAudioProvider(provider: AudioProviderName): Promise<void> {
  await SecureStore.setItemAsync(AUDIO_PROVIDER_STORE_KEY, provider)
}

/** A cloud provider's stored API key + chosen voice/model + speaking speed — one of each per
 * provider, not per language (a cloud voice is generally multilingual, unlike device voices). */
export async function getCloudAudioConfig(provider: CloudAudioProviderName): Promise<{ apiKey: string; voice: string; speed: number }> {
  const keys = AUDIO_STORE_KEYS[provider]
  const [apiKey, voice, speedRaw] = await Promise.all([
    SecureStore.getItemAsync(keys.key),
    SecureStore.getItemAsync(keys.voice),
    SecureStore.getItemAsync(keys.speed),
  ])
  const speed = speedRaw !== null ? Number(speedRaw) : DEFAULT_AUDIO_SPEED
  return { apiKey: apiKey ?? '', voice: voice ?? '', speed: Number.isFinite(speed) ? speed : DEFAULT_AUDIO_SPEED }
}

export async function setCloudAudioKey(provider: CloudAudioProviderName, apiKey: string): Promise<void> {
  await SecureStore.setItemAsync(AUDIO_STORE_KEYS[provider].key, apiKey)
}

export async function setCloudAudioVoice(provider: CloudAudioProviderName, voice: string): Promise<void> {
  await SecureStore.setItemAsync(AUDIO_STORE_KEYS[provider].voice, voice)
}

export async function setCloudAudioSpeed(provider: CloudAudioProviderName, speed: number): Promise<void> {
  await SecureStore.setItemAsync(AUDIO_STORE_KEYS[provider].speed, String(speed))
}
