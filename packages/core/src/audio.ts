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
export const AUDIO_PROVIDERS = ['device', 'openai', 'elevenlabs', 'deepgram', 'google'] as const
export type AudioProviderName = (typeof AUDIO_PROVIDERS)[number]

export const CLOUD_AUDIO_PROVIDERS = ['openai', 'elevenlabs', 'deepgram', 'google'] as const
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
    description: 'eleven_multilingual_v2 or eleven_flash_v2_5. Paste a voice ID from your ElevenLabs voice library.',
  },
  deepgram: {
    label: 'Deepgram',
    icon: 'Radio',
    description: 'Aura-2. Enter the exact model name for the voice/language you want (see Deepgram\'s docs).',
  },
  google: {
    label: 'Google Cloud TTS',
    icon: 'Cloud',
    description: 'Neural2/WaveNet voices. BYOK — a Google Cloud API key, restricted to the Text-to-Speech API (not the free Google Translate used elsewhere in the app).',
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

/** eleven_multilingual_v2 (default, broadest language/quality coverage) and eleven_flash_v2_5
 * (lower latency, still multilingual) — ElevenLabs' two model IDs this app offers a picker for. */
export const ELEVENLABS_MODELS = ['eleven_multilingual_v2', 'eleven_flash_v2_5'] as const
export const ELEVENLABS_DEFAULT_MODEL: string = ELEVENLABS_MODELS[0]

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

/** Google Cloud TTS's documented voice identifiers, one triple per language this app supports
 * (matches TTS_LOCALE_PREFIXES below) — three quality/cost tiers: Standard (oldest, lowest cost),
 * WaveNet (higher quality), Neural2 (Google's newest tier, the default here). Voice IDs encode
 * their own BCP-47 language code as a prefix (e.g. "en-US-Neural2-F" → "en-US"), extracted in
 * synthesizeGoogle rather than stored separately. */
export const GOOGLE_TTS_VOICES_BY_LANGUAGE: Record<LanguageCode, { standard: string; wavenet: string; neural2: string }> = {
  en: { standard: 'en-US-Standard-C', wavenet: 'en-US-Wavenet-D', neural2: 'en-US-Neural2-F' },
  de: { standard: 'de-DE-Standard-A', wavenet: 'de-DE-Wavenet-C', neural2: 'de-DE-Neural2-F' },
  es: { standard: 'es-ES-Standard-A', wavenet: 'es-ES-Wavenet-B', neural2: 'es-ES-Neural2-A' },
  fr: { standard: 'fr-FR-Standard-A', wavenet: 'fr-FR-Wavenet-C', neural2: 'fr-FR-Neural2-A' },
  hi: { standard: 'hi-IN-Standard-A', wavenet: 'hi-IN-Wavenet-D', neural2: 'hi-IN-Neural2-A' },
  ja: { standard: 'ja-JP-Standard-B', wavenet: 'ja-JP-Wavenet-A', neural2: 'ja-JP-Neural2-B' },
  vi: { standard: 'vi-VN-Standard-A', wavenet: 'vi-VN-Wavenet-A', neural2: 'vi-VN-Neural2-A' },
}
export const GOOGLE_TTS_DEFAULT_VOICE = GOOGLE_TTS_VOICES_BY_LANGUAGE.en.neural2

/** Providers whose synthesis API accepts a speaking-speed parameter (see synthesizeSpeech below)
 * — Deepgram's Aura-2 /v1/speak endpoint has no documented equivalent, so it's left out rather
 * than sending a parameter it would silently ignore or reject. */
export const SPEED_CAPABLE_PROVIDERS = ['openai', 'elevenlabs', 'google'] as const
export type SpeedCapableProviderName = (typeof SPEED_CAPABLE_PROVIDERS)[number]

export const DEFAULT_AUDIO_SPEED = 1.0

/** OpenAI's documented range is 0.25-4.0; ElevenLabs' voice_settings.speed is documented 0.7-1.2 —
 * these chip options stay inside both, and synthesizeSpeech clamps defensively per provider
 * regardless of what's stored. */
export const AUDIO_SPEED_OPTIONS = [0.8, 1.0, 1.2] as const

/** Storage key names — the app-layer key/value store (SecureStore on mobile, localStorage on
 * desktop) is what actually persists these; this is just the shared naming so both apps agree on
 * what a given preference is called. */
export const AUDIO_STORE_KEYS: Record<CloudAudioProviderName, { key: string; voice: string; speed: string; validatedKey: string; model?: string }> = {
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
    // The only cloud TTS provider with a user-selectable model today (ELEVENLABS_MODELS) — OpenAI
    // has one fixed TTS model, Deepgram's "voice" field IS its model string already.
    model: `${APP_KEY_PREFIX}.tts_elevenlabs_model`,
  },
  deepgram: {
    key: `${APP_KEY_PREFIX}.tts_deepgram_key`,
    voice: `${APP_KEY_PREFIX}.tts_deepgram_model`,
    speed: `${APP_KEY_PREFIX}.tts_deepgram_speed`,
    validatedKey: `${APP_KEY_PREFIX}.tts_deepgram_validated_key`,
  },
  google: {
    key: `${APP_KEY_PREFIX}.tts_google_key`,
    voice: `${APP_KEY_PREFIX}.tts_google_voice`,
    speed: `${APP_KEY_PREFIX}.tts_google_speed`,
    validatedKey: `${APP_KEY_PREFIX}.tts_google_validated_key`,
  },
}

export const AUDIO_PROVIDER_STORE_KEY = `${APP_KEY_PREFIX}.tts_provider`

/** Device-observed usage counters per cloud TTS provider — same "requests + a usage unit" shape
 * AI Providers tracks (see packages/ai's provider `.usage` field / apps/mobile/lib/providerUsage.ts),
 * just recorded differently: TTS has no object-oriented provider instance to wrap in a Proxy, so
 * each app increments these directly after a successful synthesis call (apps/mobile/lib/cloudTts.ts,
 * apps/desktop/src/services/desktopAudioPlayback.ts) rather than intercepting a method call.
 * "characters" (not tokens) because every cloud TTS provider bills by input character count. */
export const AUDIO_USAGE_STORE_KEYS: Record<CloudAudioProviderName, { requests: string; characters: string }> = {
  openai: { requests: `${APP_KEY_PREFIX}.tts_openai_usage_requests`, characters: `${APP_KEY_PREFIX}.tts_openai_usage_characters` },
  elevenlabs: { requests: `${APP_KEY_PREFIX}.tts_elevenlabs_usage_requests`, characters: `${APP_KEY_PREFIX}.tts_elevenlabs_usage_characters` },
  deepgram: { requests: `${APP_KEY_PREFIX}.tts_deepgram_usage_requests`, characters: `${APP_KEY_PREFIX}.tts_deepgram_usage_characters` },
  google: { requests: `${APP_KEY_PREFIX}.tts_google_usage_requests`, characters: `${APP_KEY_PREFIX}.tts_google_usage_characters` },
}

/** Where "Open Provider Usage" links to per cloud TTS provider — real billing/usage dashboards,
 * same role as PROVIDER_META_DATA's usageUrl for AI generation providers. */
export const AUDIO_PROVIDER_USAGE_URL: Record<CloudAudioProviderName, string> = {
  openai: 'https://platform.openai.com/usage',
  elevenlabs: 'https://elevenlabs.io/app/usage',
  deepgram: 'https://console.deepgram.com/project/usage',
  google: 'https://console.cloud.google.com/billing',
}

/** The voice/model actually used when the user hasn't picked one — single source of truth so the
 * picker's displayed default, the Test/Validate calls, and real playback all agree. `storedVoice`
 * wins whenever it's set; this only fills the gap before a user has ever chosen one. */
export function getDefaultCloudVoice(provider: CloudAudioProviderName, targetLanguage: LanguageCode, storedVoice: string): string {
  const trimmed = storedVoice.trim()
  if (trimmed !== '') return trimmed
  if (provider === 'openai') return 'marin'
  if (provider === 'elevenlabs') return ELEVENLABS_DEFAULT_VOICE_ID
  if (provider === 'google') return GOOGLE_TTS_VOICES_BY_LANGUAGE[targetLanguage].neural2
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
  google: null, // Curated per-language list (GOOGLE_TTS_VOICES_BY_LANGUAGE) — no live catalog call needed.
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
  /** ElevenLabs' model_id (see ELEVENLABS_MODELS) — ignored by every other provider. Empty/absent
   * falls back to ELEVENLABS_DEFAULT_MODEL. */
  model?: string
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

async function synthesizeOpenAI(req: CloudTtsRequest, fetchFn: typeof fetch): Promise<ArrayBuffer> {
  const response = await fetchFn('https://api.openai.com/v1/audio/speech', {
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

async function synthesizeElevenLabs(req: CloudTtsRequest, fetchFn: typeof fetch): Promise<ArrayBuffer> {
  // Callers resolve a language-aware default before reaching here (see getDefaultCloudVoice
  // above) — this fallback is just a safety net.
  const voiceId = req.voice.trim() || ELEVENLABS_DEFAULT_VOICE_ID
  const response = await fetchFn(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: 'POST',
    headers: {
      'xi-api-key': req.apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: req.text,
      model_id: req.model?.trim() || ELEVENLABS_DEFAULT_MODEL,
      voice_settings: { speed: clamp(req.speed ?? DEFAULT_AUDIO_SPEED, 0.7, 1.2) },
    }),
  })
  if (!response.ok) {
    const body = await readErrorBody(response)
    throw new CloudTtsError(`ElevenLabs text-to-speech request failed (${response.status}): ${body}`, response.status, body)
  }
  return response.arrayBuffer()
}

async function synthesizeDeepgram(req: CloudTtsRequest, fetchFn: typeof fetch): Promise<ArrayBuffer> {
  // Callers resolve a per-target-language default before reaching here (see
  // getDefaultCloudVoice above) — DEEPGRAM_EXAMPLE_MODEL here is just a safety net.
  const model = req.voice.trim() || DEEPGRAM_EXAMPLE_MODEL
  const response = await fetchFn(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}`, {
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

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Dependency-free base64 decode — Google Cloud TTS returns audio as a base64 string in a JSON
 * body (unlike every other provider here, which streams raw audio/mpeg bytes directly), and this
 * package deliberately has zero platform APIs (no `atob`, no Node `Buffer`) so it behaves
 * identically on Hermes (mobile) and the browser/Tauri WebView (desktop). */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '')
  const byteLength = Math.floor((clean.length * 3) / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0)
  const bytes = new Uint8Array(byteLength)
  let byteIndex = 0
  for (let i = 0; i < clean.length; i += 4) {
    const a = BASE64_ALPHABET.indexOf(clean[i]!)
    const b = BASE64_ALPHABET.indexOf(clean[i + 1] ?? 'A')
    const c = BASE64_ALPHABET.indexOf(clean[i + 2] ?? 'A')
    const d = BASE64_ALPHABET.indexOf(clean[i + 3] ?? 'A')
    const chunk = (a << 18) | (b << 12) | (c << 6) | d
    if (byteIndex < byteLength) bytes[byteIndex++] = (chunk >> 16) & 0xff
    if (byteIndex < byteLength) bytes[byteIndex++] = (chunk >> 8) & 0xff
    if (byteIndex < byteLength) bytes[byteIndex++] = chunk & 0xff
  }
  return bytes.buffer
}

/** Google Cloud Text-to-Speech's REST API — a plain restricted API key (`?key=`), not the OAuth2
 * service-account flow GCP APIs often use server-side; safe for the same BYOK/on-device-only key
 * storage every other provider here uses (see this module's own doc comment). `req.voice` holds a
 * full voice name (e.g. "en-US-Neural2-F"); its BCP-47 language code is the first two hyphenated
 * segments, required as a separate field in the request body. */
async function synthesizeGoogle(req: CloudTtsRequest, fetchFn: typeof fetch): Promise<ArrayBuffer> {
  const voiceName = req.voice.trim() || GOOGLE_TTS_DEFAULT_VOICE
  const languageCode = voiceName.split('-').slice(0, 2).join('-')
  const response = await fetchFn(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(req.apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text: req.text },
      voice: { languageCode, name: voiceName },
      audioConfig: { audioEncoding: 'MP3', speakingRate: clamp(req.speed ?? DEFAULT_AUDIO_SPEED, 0.25, 4.0) },
    }),
  })
  if (!response.ok) {
    const body = await readErrorBody(response)
    throw new CloudTtsError(`Google Cloud TTS request failed (${response.status}): ${body}`, response.status, body)
  }
  const payload = (await response.json()) as { audioContent?: string }
  if (!payload.audioContent) {
    throw new CloudTtsError('Google Cloud TTS response had no audioContent', response.status, '')
  }
  return base64ToArrayBuffer(payload.audioContent)
}

const SYNTHESIZERS: Record<CloudAudioProviderName, (req: CloudTtsRequest, fetchFn: typeof fetch) => Promise<ArrayBuffer>> = {
  openai: synthesizeOpenAI,
  elevenlabs: synthesizeElevenLabs,
  deepgram: synthesizeDeepgram,
  google: synthesizeGoogle,
}

export async function synthesizeSpeech(provider: CloudAudioProviderName, req: CloudTtsRequest, fetchFn: typeof fetch = fetch): Promise<ArrayBuffer> {
  return SYNTHESIZERS[provider](req, fetchFn)
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
