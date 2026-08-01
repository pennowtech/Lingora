import type { Ionicons } from '@expo/vector-icons'
import type { LanguageCode } from '@lingora/types'

/**
 * This whole audio module (this file, cloudTtsProviders.ts, cloudTts.ts, ttsSettings.ts,
 * speech.ts) is written to be portable to another Expo app with minimal changes — it has no
 * dependency on Lingora's database, vocabulary, or screens, only on generic Expo packages
 * (expo-speech, expo-audio, expo-file-system, expo-secure-store). To reuse it elsewhere:
 *   1. Copy all five files as-is.
 *   2. Change APP_KEY_PREFIX below to the new app's own prefix (keeps SecureStore keys from
 *      colliding if both apps ever share a device/debug build).
 *   3. In ttsSettings.ts and speech.ts, swap the `LanguageCode` import for whatever the target
 *      app uses (or just `string`, if it doesn't need per-language voices).
 *   4. In cloudTts.ts and speech.ts, swap the `@lingora/observability` logger import for the
 *      target app's own logger, or drop the `log.warn(...)` calls entirely — they're
 *      diagnostics, not load-bearing.
 * Everything else (provider metadata, HTTP synthesis calls, playback orchestration, the single
 * speak() entry point) needs no changes.
 */
const APP_KEY_PREFIX = 'lingora'

/**
 * Every text-to-speech source Audio Settings can pick from. 'device' is the existing on-device
 * expo-speech engine (offline, no key); the other three are cloud APIs, bring-your-own-key, same
 * trust model as packages/ai's providers — keys live only in SecureStore, never sent anywhere but
 * that provider's own API.
 */
export const AUDIO_PROVIDERS = ['device', 'openai', 'elevenlabs', 'deepgram'] as const
export type AudioProviderName = (typeof AUDIO_PROVIDERS)[number]

export const CLOUD_AUDIO_PROVIDERS = ['openai', 'elevenlabs', 'deepgram'] as const
export type CloudAudioProviderName = (typeof CLOUD_AUDIO_PROVIDERS)[number]

export interface AudioProviderMeta {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  description: string
}

export const AUDIO_PROVIDER_META: Record<AudioProviderName, AudioProviderMeta> = {
  device: {
    label: 'Device (built-in)',
    icon: 'phone-portrait-outline',
    description: 'Your phone’s own text-to-speech engine. Offline, no API key, no per-word cost.',
  },
  openai: {
    label: 'OpenAI',
    icon: 'sparkles-outline',
    description: 'gpt-4o-mini-tts. For the most natural voice, pick Marin or Cedar below.',
  },
  elevenlabs: {
    label: 'ElevenLabs',
    icon: 'mic-outline',
    description: 'eleven_multilingual_v2. Paste a voice ID from your ElevenLabs voice library.',
  },
  deepgram: {
    label: 'Deepgram',
    icon: 'radio-outline',
    description: 'Aura-2. Enter the exact model name for the voice/language you want (see Deepgram’s docs).',
  },
}

/** OpenAI's documented gpt-4o-mini-tts voices — Marin and Cedar are OpenAI's own newest,
 * highest-quality recommendation, listed first and flagged in the UI. */
export const OPENAI_TTS_VOICES = [
  'marin',
  'cedar',
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'nova',
  'onyx',
  'sage',
  'shimmer',
  'verse',
] as const
export const OPENAI_RECOMMENDED_VOICES: readonly string[] = ['marin', 'cedar']
export const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini-tts'

export const ELEVENLABS_DEFAULT_MODEL = 'eleven_multilingual_v2'

/** A known-good multilingual ElevenLabs premade voice — used whenever no voice has been picked
 * yet, same role OpenAI's 'marin' fallback plays below. */
export const ELEVENLABS_DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'

/** Deepgram's Aura-2 model identifiers vary per voice/language (e.g. "aura-2-thalia-en") and
 * change often enough that hardcoding a full catalog here risks going stale — lib/audioProviderVoices.ts
 * fetches the real one live instead. This is just the fallback example shown/used when neither a
 * picked voice nor a language-matched default (below) is available. */
export const DEEPGRAM_EXAMPLE_MODEL = 'aura-2-thalia-en'

/** Per-target-language default Aura-2 model, so a first-time Deepgram user gets a voice that
 * actually speaks their learning language rather than always defaulting to English. Only covers
 * languages with a confirmed model name — an unlisted language falls back to
 * DEEPGRAM_EXAMPLE_MODEL, same as before this existed. */
export const DEEPGRAM_DEFAULT_MODEL_BY_LANGUAGE: Partial<Record<LanguageCode, string>> = {
  en: 'aura-2-thalia-en',
  de: 'aura-2-lara-de',
  es: 'aura-2-celeste-es',
  fr: 'aura-2-agathe-fr',
}

/** Providers whose synthesis API accepts a speaking-speed parameter (see cloudTtsProviders.ts) —
 * Deepgram's Aura-2 /v1/speak endpoint has no documented equivalent, so it's left out rather than
 * sending a parameter it would silently ignore or reject. */
export const SPEED_CAPABLE_PROVIDERS = ['openai', 'elevenlabs'] as const
export type SpeedCapableProviderName = (typeof SPEED_CAPABLE_PROVIDERS)[number]

export const DEFAULT_AUDIO_SPEED = 1.0

/** OpenAI's documented range is 0.25–4.0; ElevenLabs' voice_settings.speed is documented 0.7–1.2 —
 * these chip options stay inside both, and cloudTtsProviders.ts clamps defensively per provider
 * regardless of what's stored. */
export const AUDIO_SPEED_OPTIONS = [0.8, 1.0, 1.2] as const

export const AUDIO_STORE_KEYS: Record<CloudAudioProviderName, { key: string; voice: string; speed: string }> = {
  openai: {
    key: `${APP_KEY_PREFIX}.tts_openai_key`,
    voice: `${APP_KEY_PREFIX}.tts_openai_voice`,
    speed: `${APP_KEY_PREFIX}.tts_openai_speed`,
  },
  elevenlabs: {
    key: `${APP_KEY_PREFIX}.tts_elevenlabs_key`,
    voice: `${APP_KEY_PREFIX}.tts_elevenlabs_voice`,
    speed: `${APP_KEY_PREFIX}.tts_elevenlabs_speed`,
  },
  deepgram: {
    key: `${APP_KEY_PREFIX}.tts_deepgram_key`,
    voice: `${APP_KEY_PREFIX}.tts_deepgram_model`,
    speed: `${APP_KEY_PREFIX}.tts_deepgram_speed`,
  },
}

export const AUDIO_PROVIDER_STORE_KEY = `${APP_KEY_PREFIX}.tts_provider`

/** The voice/model actually used when the user hasn't picked one — single source of truth so the
 * picker's displayed default, the Test/Validate calls, and real playback all agree. `storedVoice`
 * wins whenever it's set; this only fills the gap before a user has ever chosen one. */
export function getDefaultCloudVoice(provider: CloudAudioProviderName, targetLanguage: LanguageCode, storedVoice: string): string {
  const trimmed = storedVoice.trim()
  if (trimmed !== '') return trimmed
  if (provider === 'openai') return 'marin'
  if (provider === 'elevenlabs') return ELEVENLABS_DEFAULT_VOICE_ID
  return DEEPGRAM_DEFAULT_MODEL_BY_LANGUAGE[targetLanguage] ?? DEEPGRAM_EXAMPLE_MODEL
}
