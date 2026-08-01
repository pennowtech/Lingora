import { logger } from '@lingora/observability'
import type { CloudAudioProviderName } from './audioProviderMeta'

const log = logger.child({ feature: 'settings', component: 'audioProviderValidation' })

export interface AudioValidationResult {
  ok: boolean
  message: string
  networkUnavailable?: boolean
}

/** Cheap, read-only endpoints — proves the key works without synthesizing (and paying for) audio. */
const VALIDATION_PROBES: Record<CloudAudioProviderName, (apiKey: string) => Promise<Response>> = {
  openai: (apiKey) => fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${apiKey}` } }),
  elevenlabs: (apiKey) => fetch('https://api.elevenlabs.io/v1/user', { headers: { 'xi-api-key': apiKey } }),
  deepgram: (apiKey) => fetch('https://api.deepgram.com/v1/projects', { headers: { Authorization: `Token ${apiKey}` } }),
}

const PROVIDER_LABELS: Record<CloudAudioProviderName, string> = {
  openai: 'OpenAI',
  elevenlabs: 'ElevenLabs',
  deepgram: 'Deepgram',
}

export async function validateAudioProviderKey(provider: CloudAudioProviderName, apiKey: string): Promise<AudioValidationResult> {
  const label = PROVIDER_LABELS[provider]
  const startedAt = Date.now()
  log.info('settings.audio_provider_validation_started', {
    message: 'Audio provider key validation started',
    metadata: { provider },
  })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await VALIDATION_PROBES[provider](apiKey)
    clearTimeout(timer)
    if (response.status === 401 || response.status === 403) {
      log.warn('settings.audio_provider_validation_failed', {
        message: 'Audio provider key rejected',
        durationMs: Date.now() - startedAt,
        metadata: { provider, statusCode: response.status },
      })
      return { ok: false, message: `${label} rejected this key (${response.status}).` }
    }
    if (!response.ok) {
      log.warn('settings.audio_provider_validation_failed', {
        message: 'Audio provider validation request failed',
        durationMs: Date.now() - startedAt,
        metadata: { provider, statusCode: response.status },
      })
      return { ok: false, message: `${label} returned an unexpected response (${response.status}).` }
    }
    log.info('settings.audio_provider_validation_completed', {
      message: 'Audio provider key validated successfully',
      result: 'success',
      durationMs: Date.now() - startedAt,
      metadata: { provider },
    })
    return { ok: true, message: `Connected — ${label} key is valid.` }
  } catch {
    clearTimeout(timer)
    log.warn('settings.audio_provider_validation_failed', {
      message: 'Audio provider host unreachable — device appears offline',
      durationMs: Date.now() - startedAt,
      metadata: { provider, networkType: 'unavailable' },
    })
    return { ok: false, networkUnavailable: true, message: `Couldn't reach ${label} — check the device's internet connection and try again.` }
  }
}
