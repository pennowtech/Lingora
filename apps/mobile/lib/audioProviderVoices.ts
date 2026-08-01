import type { CloudAudioProviderName } from './audioProviderMeta'

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
  openai: null, // OpenAI's voice set is small and fixed — audioProviderMeta.ts#OPENAI_TTS_VOICES already lists it, no API call needed.
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
