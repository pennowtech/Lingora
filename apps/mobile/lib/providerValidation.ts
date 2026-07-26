import { AIProviderError, AnthropicProvider, GeminiProvider, MistralProvider, OpenAIProvider } from '@lingora/ai'
import { logger } from '@lingora/observability'

const log = logger.child({ feature: 'settings', component: 'providerValidation' })

export interface ValidationResult {
  ok: boolean
  message: string
  networkUnavailable?: boolean
}

const PROVIDER_HOSTS = {
  openai: 'https://api.openai.com/v1/models',
  mistral: 'https://api.mistral.ai/v1/models',
  gemini: 'https://generativelanguage.googleapis.com',
  anthropic: 'https://api.anthropic.com',
} as const

/**
 * DNS + TCP reachability only — any response (even 401/404) proves the host
 * is reachable, so a bad key still gets a "reached the provider, key was
 * rejected" message instead of a misleading "no internet" one.
 */
async function canReachProviderHost(url: string): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    await fetch(url, { method: 'GET', signal: controller.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

function offlineMessage(providerName: string): string {
  return `Couldn't reach ${providerName} — check the device's internet connection and try again.`
}

async function runValidation(
  providerName: string,
  hostUrl: string,
  probe: () => Promise<string>,
): Promise<ValidationResult> {
  const startedAt = Date.now()
  log.info('settings.provider_validation_started', {
    message: 'Provider key validation started',
    metadata: { provider: providerName },
  })
  if (!(await canReachProviderHost(hostUrl))) {
    log.warn('settings.provider_validation_failed', {
      message: 'Provider host unreachable — device appears offline',
      durationMs: Date.now() - startedAt,
      metadata: { provider: providerName, networkType: 'unavailable' },
    })
    return { ok: false, networkUnavailable: true, message: offlineMessage(providerName) }
  }
  try {
    const detail = await probe()
    log.info('settings.provider_validation_completed', {
      message: 'Provider key validated successfully',
      result: 'success',
      durationMs: Date.now() - startedAt,
      metadata: { provider: providerName },
    })
    return { ok: true, message: `Connected — ${detail}` }
  } catch (error) {
    const providerError = error instanceof AIProviderError ? error : undefined
    log.warn('settings.provider_validation_failed', {
      message: 'Provider key validation failed',
      durationMs: Date.now() - startedAt,
      metadata: {
        provider: providerName,
        ...(providerError?.status !== undefined ? { statusCode: providerError.status } : {}),
      },
    })
    if (providerError) {
      return { ok: false, message: providerError.message }
    }
    return { ok: false, message: `${providerName} validation failed: ${String(error)}` }
  }
}

export async function validateOpenAIKey(apiKey: string, model: string): Promise<ValidationResult> {
  return runValidation('OpenAI', PROVIDER_HOSTS.openai, async () => {
    const provider = new OpenAIProvider({ apiKey, model, timeoutMs: 15000 })
    await provider.translate('Guten Tag', 'de', 'en')
    return `${model} is ready for card generation and translation.`
  })
}

export async function validateMistralKey(apiKey: string, model: string): Promise<ValidationResult> {
  return runValidation('Mistral', PROVIDER_HOSTS.mistral, async () => {
    const provider = new MistralProvider({ apiKey, model, timeoutMs: 15000 })
    await provider.translate('Guten Tag', 'de', 'en')
    return `${model} is ready for card generation and translation.`
  })
}

export async function validateGeminiKey(apiKey: string, model: string): Promise<ValidationResult> {
  return runValidation('Gemini', PROVIDER_HOSTS.gemini, async () => {
    const provider = new GeminiProvider({ apiKey, model, timeoutMs: 15000 })
    await provider.translate('Guten Tag', 'de', 'en')
    return `${model} is ready for card generation and translation.`
  })
}

export async function validateClaudeKey(apiKey: string, model: string): Promise<ValidationResult> {
  return runValidation('Claude', PROVIDER_HOSTS.anthropic, async () => {
    const provider = new AnthropicProvider({ apiKey, model, timeoutMs: 15000 })
    await provider.translate('Guten Tag', 'de', 'en')
    return `${model} is ready for card generation and translation.`
  })
}
