import { logger } from '@lingora/observability'
import type { CloudAudioProviderName } from './audioProviderMeta'
import { CloudTtsError, synthesizeSpeech } from './cloudTtsProviders'
import { formatUserFriendlyProviderError } from './providerValidation'

const log = logger.child({ feature: 'settings', component: 'audioProviderValidation' })

export interface AudioValidationResult {
  ok: boolean
  message: string
  networkUnavailable?: boolean
}

const PROVIDER_LABELS: Record<CloudAudioProviderName, string> = {
  openai: 'OpenAI',
  elevenlabs: 'ElevenLabs',
  deepgram: 'Deepgram',
}

/**
 * Validates by making the exact same synthesis call lib/cloudTts.ts#playCloudSpeech makes (a
 * one-word request) rather than probing a separate "account info" endpoint. Two reasons: some
 * providers (ElevenLabs in particular) support scoped API keys that are valid for text-to-speech
 * but rejected by account/user-info endpoints with a 403, which read as "key invalid" even though
 * playback would work fine — and running the real call means Validate surfaces the same errors a
 * user would otherwise only see as a silent fallback-to-device during actual playback.
 */
export async function validateAudioProviderKey(
  provider: CloudAudioProviderName,
  apiKey: string,
  voice: string,
  speed?: number,
): Promise<AudioValidationResult> {
  const label = PROVIDER_LABELS[provider]
  const startedAt = Date.now()
  log.info('settings.audio_provider_validation_started', {
    message: 'Audio provider key validation started',
    metadata: { provider },
  })
  try {
    const bytes = await synthesizeSpeech(provider, { text: 'Hallo', apiKey, voice, ...(speed !== undefined && { speed }) })
    if (bytes.byteLength === 0) throw new Error('Provider returned an empty audio response.')
    log.info('settings.audio_provider_validation_completed', {
      message: 'Audio provider key validated successfully',
      result: 'success',
      durationMs: Date.now() - startedAt,
      metadata: { provider },
    })
    return { ok: true, message: `Connected — ${label} is ready to speak.` }
  } catch (error) {
    if (error instanceof CloudTtsError) {
      log.warn('settings.audio_provider_validation_failed', {
        message: 'Audio provider key rejected',
        durationMs: Date.now() - startedAt,
        metadata: { provider, statusCode: error.status },
      })
      return { ok: false, message: formatUserFriendlyProviderError(label, error) }
    }
    if (error instanceof Error) {
      // A thrown validation-input error (e.g. ElevenLabs' "no voice ID set") rather than a network
      // failure — surface it as-is, it's already a clear, actionable message.
      log.warn('settings.audio_provider_validation_failed', {
        message: 'Audio provider validation failed before reaching the network',
        durationMs: Date.now() - startedAt,
        metadata: { provider },
      })
      return { ok: false, message: error.message }
    }
    log.warn('settings.audio_provider_validation_failed', {
      message: 'Audio provider host unreachable — device appears offline',
      durationMs: Date.now() - startedAt,
      metadata: { provider, networkType: 'unavailable' },
    })
    return { ok: false, networkUnavailable: true, message: `Couldn't reach ${label} — check the device's internet connection and try again.` }
  }
}
