import type { LanguageCode } from '@lingora/types'
import * as Speech from 'expo-speech'
import * as SecureStore from 'expo-secure-store'
import {
  AUDIO_PROVIDER_STORE_KEY,
  AUDIO_PROVIDERS,
  AUDIO_STORE_KEYS,
  DEFAULT_AUDIO_SPEED,
  DEFAULT_TTS_PITCH,
  DEFAULT_TTS_RATE,
  TTS_LOCALE_PREFIXES,
  TTS_PITCH_STORE_KEY,
  TTS_RATE_STORE_KEY,
  ttsVoiceStoreKey,
  type AudioProviderName,
  type CloudAudioProviderName,
  type TtsSettings,
} from '@lingora/core'

export { DEFAULT_TTS_PITCH, DEFAULT_TTS_RATE, type TtsSettings }

/** Reads this device's stored TTS preferences for `language` — falls back to sane defaults if unset. */
export async function getTtsSettings(language: LanguageCode): Promise<TtsSettings> {
  const [rateRaw, pitchRaw, voice] = await Promise.all([
    SecureStore.getItemAsync(TTS_RATE_STORE_KEY),
    SecureStore.getItemAsync(TTS_PITCH_STORE_KEY),
    SecureStore.getItemAsync(ttsVoiceStoreKey(language)),
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
  if (voice === null) await SecureStore.deleteItemAsync(ttsVoiceStoreKey(language))
  else await SecureStore.setItemAsync(ttsVoiceStoreKey(language), voice)
}

/** The device's installed TTS voices for `language`, for a voice picker in Settings. */
export async function getAvailableVoices(language: LanguageCode): Promise<Speech.Voice[]> {
  const all = await Speech.getAvailableVoicesAsync()
  const prefix = TTS_LOCALE_PREFIXES[language]
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
