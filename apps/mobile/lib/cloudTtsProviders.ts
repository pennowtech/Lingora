import {
  DEEPGRAM_EXAMPLE_MODEL,
  DEFAULT_AUDIO_SPEED,
  ELEVENLABS_DEFAULT_MODEL,
  ELEVENLABS_DEFAULT_VOICE_ID,
  OPENAI_DEFAULT_MODEL,
  type CloudAudioProviderName,
} from './audioProviderMeta'

/**
 * One HTTP call per cloud TTS provider, each returning raw audio bytes for lib/cloudTts.ts to
 * write to a temp file and play. Every provider is BYOK — the key never leaves this device except
 * as that provider's own Authorization header, same trust model as packages/ai.
 */

export interface CloudTtsRequest {
  text: string
  apiKey: string
  /** The stored voice/model choice for this provider — provider-specific meaning (an OpenAI voice
   * name, an ElevenLabs voice ID, a Deepgram model string). Empty falls back to a sane default. */
  voice: string
  /** Speaking speed, 1.0 = normal. Only OpenAI and ElevenLabs support this (see
   * audioProviderMeta.ts#SPEED_CAPABLE_PROVIDERS) — synthesizeDeepgram ignores it, Aura-2's
   * /v1/speak endpoint has no documented equivalent. */
  speed?: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Carries the HTTP status + response body separately from the message, so callers (Audio
 * Settings' Validate button) can show the provider's own error text to the user in an Alert —
 * that's fine (a modal dialog, not a structured log line) — while lib/speech.ts's log call can
 * still report just the numeric statusCode, keeping free text out of the observability pipeline. */
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
  // Callers resolve a language-aware default before reaching here (see
  // audioProviderMeta.ts#getDefaultCloudVoice) — this fallback is just a safety net.
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
  // audioProviderMeta.ts#getDefaultCloudVoice) — DEEPGRAM_EXAMPLE_MODEL here is just a safety net.
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
