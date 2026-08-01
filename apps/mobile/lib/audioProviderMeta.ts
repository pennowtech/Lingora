import type { Ionicons } from '@expo/vector-icons'

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

/** Deepgram's Aura-2 model identifiers vary per voice/language (e.g. "aura-2-thalia-en") and
 * change often enough that hardcoding a list here risks going stale — the field in Audio Settings
 * is free text with this as a placeholder example, not a picker, so a wrong guess here is a UI
 * hint, not a broken feature. */
export const DEEPGRAM_EXAMPLE_MODEL = 'aura-2-thalia-en'

export const AUDIO_STORE_KEYS: Record<CloudAudioProviderName, { key: string; voice: string }> = {
  openai: { key: `${APP_KEY_PREFIX}.tts_openai_key`, voice: `${APP_KEY_PREFIX}.tts_openai_voice` },
  elevenlabs: { key: `${APP_KEY_PREFIX}.tts_elevenlabs_key`, voice: `${APP_KEY_PREFIX}.tts_elevenlabs_voice` },
  deepgram: { key: `${APP_KEY_PREFIX}.tts_deepgram_key`, voice: `${APP_KEY_PREFIX}.tts_deepgram_model` },
}

export const AUDIO_PROVIDER_STORE_KEY = `${APP_KEY_PREFIX}.tts_provider`
