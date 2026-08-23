import type { LanguageCode } from '@lingora/types'

/**
 * Cloud text-to-speech provider metadata, voice catalogs, and synthesis calls — shared between
 * apps/mobile (plays audio via expo-audio) and the desktop app (plays audio via the Web Audio
 * API/HTMLAudioElement). Every provider is BYOK — the key never leaves the device except as that
 * provider's own Authorization header, same trust model as packages/ai's providers.
 *
 * Kept platform-agnostic on purpose: no expo-secure-store, no expo-speech, no device playback.
 * Each app owns its own key storage and playback; this module only owns the shared data + the
 * fetch calls themselves.
 */
const APP_KEY_PREFIX = 'lingora'

/**
 * Every text-to-speech source Audio Settings can pick from. 'device' is an on-device engine
 * (offline, no key, platform-specific — mobile uses expo-speech); the other three are cloud APIs.
 */
export const AUDIO_PROVIDERS = ['device', 'openai', 'elevenlabs', 'deepgram'] as const
export type AudioProviderName = (typeof AUDIO_PROVIDERS)[number]

export const CLOUD_AUDIO_PROVIDERS = ['openai', 'elevenlabs', 'deepgram'] as const
export type CloudAudioProviderName = (typeof CLOUD_AUDIO_PROVIDERS)[number]

export interface AudioProviderMeta {
  label: string
  /** A Lucide icon name (lucide-react-native on mobile, lucide-react on desktop) — both apps
   * share the same icon set, so this string means the same glyph on either platform. */
  icon: string
  description: string
}

export const AUDIO_PROVIDER_META: Record<AudioProviderName, AudioProviderMeta> = {
  device: {
    label: 'Device (built-in)',
    icon: 'Smartphone',
    description: 'Your device\'s own text-to-speech engine. Offline, no API key, no per-word cost.',
  },
  openai: {
    label: 'OpenAI',
    icon: 'Sparkles',
    description: 'gpt-4o-mini-tts. For the most natural voice, pick Marin or Cedar below.',
  },
  elevenlabs: {
    label: 'ElevenLabs',
    icon: 'Mic',
    description: 'eleven_multilingual_v2. Paste a voice ID from your ElevenLabs voice library.',
  },
  deepgram: {
    label: 'Deepgram',
    icon: 'Radio',
    description: 'Aura-2. Enter the exact model name for the voice/language you want (see Deepgram\'s docs).',
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
 * change often enough that hardcoding a full catalog here risks going stale — fetchProviderVoices
 * below fetches the real one live instead. This is just the fallback example shown/used when
 * neither a picked voice nor a language-matched default (below) is available. */
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

/** Providers whose synthesis API accepts a speaking-speed parameter (see synthesizeSpeech below)
 * — Deepgram's Aura-2 /v1/speak endpoint has no documented equivalent, so it's left out rather
 * than sending a parameter it would silently ignore or reject. */
export const SPEED_CAPABLE_PROVIDERS = ['openai', 'elevenlabs'] as const
export type SpeedCapableProviderName = (typeof SPEED_CAPABLE_PROVIDERS)[number]

export const DEFAULT_AUDIO_SPEED = 1.0

/** OpenAI's documented range is 0.25-4.0; ElevenLabs' voice_settings.speed is documented 0.7-1.2 —
 * these chip options stay inside both, and synthesizeSpeech clamps defensively per provider
 * regardless of what's stored. */
export const AUDIO_SPEED_OPTIONS = [0.8, 1.0, 1.2] as const

/** Storage key names — the app-layer key/value store (SecureStore on mobile, localStorage on
 * desktop) is what actually persists these; this is just the shared naming so both apps agree on
 * what a given preference is called. */
export const AUDIO_STORE_KEYS: Record<CloudAudioProviderName, { key: string; voice: string; speed: string; validatedKey: string }> = {
  openai: {
    key: `${APP_KEY_PREFIX}.tts_openai_key`,
    voice: `${APP_KEY_PREFIX}.tts_openai_voice`,
    speed: `${APP_KEY_PREFIX}.tts_openai_speed`,
    validatedKey: `${APP_KEY_PREFIX}.tts_openai_validated_key`,
  },
  elevenlabs: {
    key: `${APP_KEY_PREFIX}.tts_elevenlabs_key`,
    voice: `${APP_KEY_PREFIX}.tts_elevenlabs_voice`,
    speed: `${APP_KEY_PREFIX}.tts_elevenlabs_speed`,
    validatedKey: `${APP_KEY_PREFIX}.tts_elevenlabs_validated_key`,
  },
  deepgram: {
    key: `${APP_KEY_PREFIX}.tts_deepgram_key`,
    voice: `${APP_KEY_PREFIX}.tts_deepgram_model`,
    speed: `${APP_KEY_PREFIX}.tts_deepgram_speed`,
    validatedKey: `${APP_KEY_PREFIX}.tts_deepgram_validated_key`,
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

// ─── Voice catalogs (live fetch) ────────────────────────────────────────────────

/** A voice/model a user can pick from a provider's own library, fetched live with their key
 * rather than hardcoded — avoids shipping a curated ID list that goes stale or (worse) never
 * matched the provider's real catalog in the first place. */
export interface ProviderVoiceOption {
  id: string
  label: string
  description?: string
}

/** ElevenLabs' voice library — one of their oldest, most stable endpoints. Every account, even a
 * scoped key with only text-to-speech access, can list its own available voices (premade +
 * cloned) this way. */
async function fetchElevenLabsVoices(apiKey: string): Promise<ProviderVoiceOption[]> {
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': apiKey },
  })
  if (!response.ok) return []
  const body: unknown = await response.json()
  if (typeof body !== 'object' || body === null || !('voices' in body) || !Array.isArray((body as { voices: unknown }).voices)) {
    return []
  }
  const voices = (body as { voices: unknown[] }).voices
  return voices
    .filter((v): v is { voice_id: string; name: string; labels?: { gender?: string; accent?: string; description?: string } } =>
      typeof v === 'object' && v !== null && typeof (v as { voice_id?: unknown }).voice_id === 'string' && typeof (v as { name?: unknown }).name === 'string',
    )
    .map((v) => ({
      id: v.voice_id,
      label: v.name,
      ...((v.labels?.gender ?? v.labels?.accent) && {
        description: [v.labels?.gender, v.labels?.accent].filter(Boolean).join(' · '),
      }),
    }))
}

/** Deepgram's public model catalog — GET /v1/models needs no project scope, just a valid key.
 * Response shape is defensively narrowed (rather than assumed) since this is less exhaustively
 * documented than ElevenLabs' voices endpoint; any unexpected shape yields an empty list instead
 * of throwing, so the UI just falls back to manual entry rather than breaking. */
async function fetchDeepgramModels(apiKey: string): Promise<ProviderVoiceOption[]> {
  const response = await fetch('https://api.deepgram.com/v1/models', {
    headers: { Authorization: `Token ${apiKey}` },
  })
  if (!response.ok) return []
  const body: unknown = await response.json()
  if (typeof body !== 'object' || body === null) return []
  // Deepgram's models list has historically grouped by { stt: [...], tts: [...] } — fall back to
  // treating the whole body as the array if that grouping isn't present.
  const candidateList = 'tts' in body && Array.isArray((body as { tts: unknown }).tts) ? (body as { tts: unknown[] }).tts : Array.isArray(body) ? body : []
  return candidateList
    .filter((m): m is { name: string; canonical_name?: string; architecture?: string; languages?: string[] } =>
      typeof m === 'object' && m !== null && typeof (m as { name?: unknown }).name === 'string',
    )
    .filter((m) => m.name.startsWith('aura'))
    .map((m) => ({
      id: m.canonical_name ?? m.name,
      label: m.name,
      ...(m.languages && m.languages.length > 0 && { description: m.languages.join(', ') }),
    }))
}

const FETCHERS: Record<CloudAudioProviderName, ((apiKey: string) => Promise<ProviderVoiceOption[]>) | null> = {
  openai: null, // OpenAI's voice set is small and fixed — OPENAI_TTS_VOICES above already lists it, no API call needed.
  elevenlabs: fetchElevenLabsVoices,
  deepgram: fetchDeepgramModels,
}

/** Returns `[]` (never throws) on any failure — callers should fall back to manual entry rather
 * than surface an error for what's a convenience picker, not a required step. */
export async function fetchProviderVoices(provider: CloudAudioProviderName, apiKey: string): Promise<ProviderVoiceOption[]> {
  const fetcher = FETCHERS[provider]
  if (!fetcher || apiKey.trim() === '') return []
  try {
    return await fetcher(apiKey)
  } catch {
    return []
  }
}

// ─── Synthesis (live fetch) ─────────────────────────────────────────────────────

export interface CloudTtsRequest {
  text: string
  apiKey: string
  /** The stored voice/model choice for this provider — provider-specific meaning (an OpenAI voice
   * name, an ElevenLabs voice ID, a Deepgram model string). Empty falls back to a sane default. */
  voice: string
  /** Speaking speed, 1.0 = normal. Only OpenAI and ElevenLabs support this (see
   * SPEED_CAPABLE_PROVIDERS above) — synthesizeDeepgram ignores it, Aura-2's /v1/speak endpoint
   * has no documented equivalent. */
  speed?: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Carries the HTTP status + response body separately from the message, so callers (Audio
 * Settings' Validate button) can show the provider's own error text to the user directly, while a
 * caller's log call can still report just the numeric statusCode, keeping free text out of the
 * observability pipeline. */
export class CloudTtsError extends Error {
  readonly status: number
  readonly body: string
  constructor(message: string, status: number, body: string) {
    super(message)
    this.name = 'CloudTtsError'
    this.status = status
    this.body = body
  }
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 200)
  } catch {
    return ''
  }
}

async function synthesizeOpenAI(req: CloudTtsRequest): Promise<ArrayBuffer> {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${req.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_DEFAULT_MODEL,
      input: req.text,
      voice: req.voice.trim() || 'marin',
      response_format: 'mp3',
      speed: clamp(req.speed ?? DEFAULT_AUDIO_SPEED, 0.25, 4.0),
    }),
  })
  if (!response.ok) {
    const body = await readErrorBody(response)
    throw new CloudTtsError(`OpenAI text-to-speech request failed (${response.status}): ${body}`, response.status, body)
  }
  return response.arrayBuffer()
}

async function synthesizeElevenLabs(req: CloudTtsRequest): Promise<ArrayBuffer> {
  // Callers resolve a language-aware default before reaching here (see getDefaultCloudVoice
  // above) — this fallback is just a safety net.
  const voiceId = req.voice.trim() || ELEVENLABS_DEFAULT_VOICE_ID
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: 'POST',
    headers: {
      'xi-api-key': req.apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: req.text,
      model_id: ELEVENLABS_DEFAULT_MODEL,
      voice_settings: { speed: clamp(req.speed ?? DEFAULT_AUDIO_SPEED, 0.7, 1.2) },
    }),
  })
  if (!response.ok) {
    const body = await readErrorBody(response)
    throw new CloudTtsError(`ElevenLabs text-to-speech request failed (${response.status}): ${body}`, response.status, body)
  }
  return response.arrayBuffer()
}

async function synthesizeDeepgram(req: CloudTtsRequest): Promise<ArrayBuffer> {
  // Callers resolve a per-target-language default before reaching here (see
  // getDefaultCloudVoice above) — DEEPGRAM_EXAMPLE_MODEL here is just a safety net.
  const model = req.voice.trim() || DEEPGRAM_EXAMPLE_MODEL
  const response = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${req.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: req.text }),
  })
  if (!response.ok) {
    const body = await readErrorBody(response)
    throw new CloudTtsError(`Deepgram text-to-speech request failed (${response.status}): ${body}`, response.status, body)
  }
  return response.arrayBuffer()
}

const SYNTHESIZERS: Record<CloudAudioProviderName, (req: CloudTtsRequest) => Promise<ArrayBuffer>> = {
  openai: synthesizeOpenAI,
  elevenlabs: synthesizeElevenLabs,
  deepgram: synthesizeDeepgram,
}

export async function synthesizeSpeech(provider: CloudAudioProviderName, req: CloudTtsRequest): Promise<ArrayBuffer> {
  return SYNTHESIZERS[provider](req)
}

// ─── TTS settings (pure shape/keys — actual storage stays app-side) ─────────────

export const DEFAULT_TTS_RATE = 1.0
export const DEFAULT_TTS_PITCH = 1.0

export interface TtsSettings {
  rate: number
  pitch: number
  /** A device/engine voice identifier, or null to let the OS/engine pick its own default for the language. */
  voice: string | null
}

export const TTS_RATE_STORE_KEY = `${APP_KEY_PREFIX}.tts_rate`
export const TTS_PITCH_STORE_KEY = `${APP_KEY_PREFIX}.tts_pitch`

/** A per-language chosen voice is its own key — a German voice choice shouldn't apply to English playback. */
export function ttsVoiceStoreKey(language: LanguageCode): string {
  return `${APP_KEY_PREFIX}.tts_voice.${language}`
}

/** BCP-47 locale prefix used to filter a device's full voice list down to one language. */
export const TTS_LOCALE_PREFIXES: Record<LanguageCode, string> = {
  de: 'de',
  en: 'en',
  ja: 'ja',
  es: 'es',
  fr: 'fr',
  vi: 'vi',
  hi: 'hi',
}
