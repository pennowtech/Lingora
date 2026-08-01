import {
  DEEPGRAM_EXAMPLE_MODEL,
  ELEVENLABS_DEFAULT_MODEL,
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
    }),
  })
  if (!response.ok) {
    throw new Error(`OpenAI text-to-speech request failed (${response.status}): ${await readErrorBody(response)}`)
  }
  return response.arrayBuffer()
}

async function synthesizeElevenLabs(req: CloudTtsRequest): Promise<ArrayBuffer> {
  const voiceId = req.voice.trim()
  if (!voiceId) throw new Error('No ElevenLabs voice ID set — paste one from your ElevenLabs voice library in Audio Settings.')
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: 'POST',
    headers: {
      'xi-api-key': req.apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({ text: req.text, model_id: ELEVENLABS_DEFAULT_MODEL }),
  })
  if (!response.ok) {
    throw new Error(`ElevenLabs text-to-speech request failed (${response.status}): ${await readErrorBody(response)}`)
  }
  return response.arrayBuffer()
}

async function synthesizeDeepgram(req: CloudTtsRequest): Promise<ArrayBuffer> {
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
    throw new Error(`Deepgram text-to-speech request failed (${response.status}): ${await readErrorBody(response)}`)
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
