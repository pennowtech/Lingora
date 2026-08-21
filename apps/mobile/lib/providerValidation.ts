import { AIProviderError, AnthropicProvider, DeepLProvider, GeminiProvider, MistralProvider, OpenAIProvider } from '@lingora/ai'
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
  deepl: 'https://api-free.deepl.com',
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

/**
 * Formats technical raw API errors (JSON strings, HTTP status dumps, stack traces)
 * into clean, user-friendly, actionable messages for settings & error alerts.
 */
export function formatUserFriendlyProviderError(providerName: string, error: unknown): string {
  const providerError = error instanceof AIProviderError ? error : undefined
  const status = providerError?.status
  const rawMsg = error instanceof Error ? error.message : String(error)
  const lower = rawMsg.toLowerCase()

  // 1. Invalid API Key / Authentication Failure
  if (
    status === 401 ||
    status === 403 ||
    lower.includes('invalid_api_key') ||
    lower.includes('incorrect api key') ||
    lower.includes('invalid api key') ||
    lower.includes('authentication_error') ||
    lower.includes('invalid x-api-key') ||
    lower.includes('authorization failed') ||
    lower.includes('api_key_invalid') ||
    lower.includes('unauthorized') ||
    lower.includes('forbidden')
  ) {
    return `Invalid ${providerName} API key. Please check your key in Settings.`
  }

  // 2. Insufficient Quota / Billing Exceeded
  if (
    lower.includes('insufficient_quota') ||
    lower.includes('quota') ||
    lower.includes('credit_balance_too_low') ||
    lower.includes('exceeded your current quota') ||
    lower.includes('billing')
  ) {
    return `${providerName} quota or credit balance exceeded. Please check your plan and billing details.`
  }

  // 3. Model Not Found / Restricted Access
  if (
    status === 404 ||
    lower.includes('model_not_found') ||
    lower.includes('does not exist') ||
    lower.includes('does not have access') ||
    lower.includes('unsupported model')
  ) {
    return `Selected model is unavailable or not accessible with your ${providerName} account.`
  }

  // 4. Rate Limited / Too Many Requests
  if (status === 429 || lower.includes('rate_limit') || lower.includes('too many requests')) {
    return `${providerName} rate limit reached. Please wait a few seconds and try again.`
  }

  // 5. Network / Timeout / Reachability
  if (
    lower.includes('timed out') ||
    lower.includes('timeout') ||
    lower.includes('econnrefused') ||
    lower.includes('fetch failed') ||
    lower.includes('network')
  ) {
    return `Couldn't reach ${providerName} — check your device's internet connection and try again.`
  }

  // 6. Server Unavailable
  if ((status && status >= 500) || lower.includes('server_error') || lower.includes('internal server error')) {
    return `${providerName} servers are temporarily unavailable (${status ?? 500}). Please try again shortly.`
  }

  // 7. Extract nested human message if raw JSON error response was captured
  try {
    const jsonMatch = rawMsg.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      const extracted = parsed?.error?.message || parsed?.error?.detail || parsed?.message
      if (typeof extracted === 'string' && extracted.trim().length > 0) {
        const cleanExtracted = extracted.replace(/https?:\/\/\S+/g, '').trim()
        return `${providerName}: ${cleanExtracted}`
      }
    }
  } catch {
    // Ignore JSON parse failure
  }

  return `${providerName} validation failed. Please check your key and settings.`
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
    return { ok: false, message: formatUserFriendlyProviderError(providerName, error) }
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

export async function validateDeepLKey(apiKey: string): Promise<ValidationResult> {
  // DeepL splits free/pro keys across two hosts (DeepLProvider picks the right one from the
  // key's ':fx' suffix) — reachability only needs one of them to prove the network is up.
  return runValidation('DeepL', PROVIDER_HOSTS.deepl, async () => {
    const provider = new DeepLProvider({ apiKey, timeoutMs: 15000 })
    await provider.translate('Guten Tag', 'de', 'en')
    return 'Ready for translation.'
  })
}
