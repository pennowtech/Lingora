import type { LanguageCode } from '@lingora/types'
import * as Speech from 'expo-speech'
import * as SecureStore from 'expo-secure-store'

// Declared locally rather than imported from './services' — services.tsx pulls in
// lib/speech.ts (to warm up the TTS engine at bootstrap), and speech.ts pulls in this
// module, so importing STORE_KEYS from services.tsx here closed a require cycle
// (services -> speech -> ttsSettings -> services). Same fix lib/i18n/index.ts already
// uses for the identical reason.
const TTS_RATE_STORE_KEY = 'lingora.tts_rate'
const TTS_PITCH_STORE_KEY = 'lingora.tts_pitch'

/** A per-language chosen voice is its own key — a German voice choice shouldn't apply to English playback. */
function voiceKey(language: LanguageCode): string {
  return `lingora.tts_voice.${language}`
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
}

/** The device's installed TTS voices for `language`, for a voice picker in Settings. */
export async function getAvailableVoices(language: LanguageCode): Promise<Speech.Voice[]> {
  const all = await Speech.getAvailableVoicesAsync()
  const prefix = LOCALE_PREFIXES[language]
  return all.filter((v) => v.language.toLowerCase().startsWith(prefix))
}
