import {
  AIError,
  AIProviderError,
  AIResponseParseError,
  AIValidationError,
  AnthropicProvider,
  DeepLProvider,
  GeminiProvider,
  MistralProvider,
  OpenAIProvider,
} from '@lingora/ai'
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
  return `Couldn't reach ${providerName} - check the device's internet connection and try again.`
}

/**
 * Formats technical raw API errors (JSON strings, HTTP status dumps, stack traces)
 * into clean, user-friendly, actionable messages for settings & error alerts.
 */
export type TranslateFn = (key: string, options?: any) => string

export function formatUserFriendlyProviderError(
  providerName: string,
  error: unknown,
  t?: TranslateFn,
): string {
  const tr: TranslateFn = t ?? ((key, options) => {
    if (!options) return key
    return Object.entries(options).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
      key,
    )
  })

  const providerError = error instanceof AIProviderError ? error : undefined
  const status = providerError?.status
  const rawMsg = error instanceof Error ? error.message : String(error)
  const lower = rawMsg.toLowerCase()

  // -1. This function exists solely to translate *AI/provider* failures (bad key, rate limit,
  // quota, network, provider-side schema rejection) into friendly text — every check below is a
  // keyword/status heuristic tuned for that narrow purpose. A caller can end up passing it
  // literally any thrown value from a mutation, though (e.g. search.tsx's `generate.isError` runs
  // whatever `generate.error` holds through here regardless of what actually threw) — a plain
  // application error unrelated to any AI provider (confirmed in the wild: persistTranslationAsCard
  // throwing "Lemma 'X' already exists" when a word's resolved form collides with an existing one)
  // would otherwise coincidentally fall through every check below to the generic "check your key
  // and settings" fallback, which is actively wrong for an error that has nothing to do with the
  // key. Only genuine AI-package errors (AIError and its subclasses) get the heuristics below —
  // anything else shows its own real message instead of a guessed-at, possibly-misleading one.
  if (!(error instanceof AIError)) {
    return rawMsg
  }

  // 0. The AI's response for this specific generation didn't match our expected structure — a
  // content/schema issue (see packages/ai/src/generation/structured.ts), not a key/auth/network
  // problem. Checked first and by type, not by message text, since neither error carries any of
  // the keywords the checks below look for — they'd otherwise fall all the way through to the
  // generic "check your key and settings" fallback at the bottom, which is actively misleading
  // here (confirmed in the wild: a Mistral AIValidationError for one specific word surfaced as
  // "Mistral validation failed. Please check your key and settings.", even though the key was
  // fine — a schema mismatch in that one response is what actually failed). Model responses are
  // non-deterministic, so a retry of the exact same word can succeed with nothing else changed.
  if (error instanceof AIValidationError) {
    return tr(
      "{{providerName}}'s response for this word wasn't in the expected format. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.",
      { providerName },
    )
  }
  if (error instanceof AIResponseParseError) {
    return tr(
      '{{providerName}} returned a response that could not be read. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.',
      { providerName },
    )
  }

  // The provider's own structured-output endpoint (strict json_schema — see
  // packages/ai/src/providers/json-schema.ts) can reject a request outright with an HTTP 400 when
  // whatever the model tried to generate doesn't fit their schema constraints for that particular
  // content — a provider-side rejection, still not a key/auth problem (401/403 are handled
  // separately below). Confirmed in the wild: a Mistral 400 for one specific word fell through
  // every check below (400 isn't 401/403/404/429/5xx, and the response body is truncated to 500
  // chars in the raw error message — see providers/mistral.ts — which can cut a JSON error object
  // off mid-object, making check 7's JSON.parse below throw and silently skip it too) and landed
  // on the same misleading "check your key" fallback this whole block exists to avoid.
  if (status === 400) {
    return tr(
      "{{providerName}} could not generate a valid response for this word. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.",
      { providerName },
    )
  }

  // 1. Model Access / Project Permission Restriction (takes precedence over generic 403)
  if (
    status === 404 ||
    lower.includes('model_not_found') ||
    lower.includes('does not exist') ||
    lower.includes('does not have access') ||
    lower.includes('unsupported model')
  ) {
    return tr(
      'Selected model is not accessible with your {{providerName}} key/project. Try selecting a different model in Settings > AI Providers.',
      { providerName },
    )
  }

  // 2. Insufficient Quota / Billing Exceeded
  if (
    lower.includes('insufficient_quota') ||
    lower.includes('quota') ||
    lower.includes('credit_balance_too_low') ||
    lower.includes('exceeded your current quota') ||
    lower.includes('billing')
  ) {
    return tr(
      '{{providerName}} credit balance or quota exceeded. Please check your account plan and billing details.',
      { providerName },
    )
  }

  // 3. Rate Limited / Too Many Requests
  if (status === 429 || lower.includes('rate_limit') || lower.includes('too many requests')) {
    return tr('{{providerName}} rate limit reached. Please wait a few seconds and try again.', { providerName })
  }

  // 4. Invalid API Key / Authentication Failure
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
    return tr(
      'Invalid {{providerName}} API key or permission denied. Please check your key in Settings > AI Providers.',
      { providerName },
    )
  }

  // 5. Network / Timeout / Reachability
  if (
    lower.includes('timed out') ||
    lower.includes('timeout') ||
    lower.includes('econnrefused') ||
    lower.includes('fetch failed') ||
    lower.includes('network')
  ) {
    return tr("Couldn't reach {{providerName}} - check your device's internet connection and try again.", {
      providerName,
    })
  }

  // 6. Server Unavailable
  if ((status && status >= 500) || lower.includes('server_error') || lower.includes('internal server error')) {
    return tr('{{providerName}} servers are temporarily unavailable ({{status}}). Please try again shortly.', {
      providerName,
      status: status ?? 500,
    })
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
      message: 'Provider host unreachable - device appears offline',
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
    return { ok: true, message: `Connected - ${detail}` }
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
