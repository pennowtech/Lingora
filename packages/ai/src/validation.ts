import { AIError, AIProviderError, AIResponseParseError, AIValidationError } from './errors'
import { isNetworkError } from './networkError'
import { AnthropicProvider } from './providers/anthropic'
import { DeepLProvider } from './providers/deepl'
import { DeepSeekProvider } from './providers/deepseek'
import { GeminiProvider } from './providers/gemini'
import { GroqProvider } from './providers/groq'
import { MistralProvider } from './providers/mistral'
import { OpenAIProvider } from './providers/openai'
import { logger } from '@lingora/observability'

const log = logger.child({ feature: 'ai', component: 'validation' })

/**
 * AI-provider key validation and user-friendly error formatting — shared between apps/mobile's
 * and the desktop app's Settings screens. Lives in packages/ai (not packages/core) because it
 * needs the concrete provider classes and error types below; @lingora/database already depends
 * on @lingora/core, and this package depends on @lingora/database, so a dependency the other way
 * would be circular.
 */

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
  deepseek: 'https://api.deepseek.com/v1/models',
  groq: 'https://api.groq.com/openai/v1/models',
  deepl: 'https://api-free.deepl.com',
} as const

/**
 * DNS + TCP reachability only — any response (even 401/404) proves the host
 * is reachable, so a bad key still gets a "reached the provider, key was
 * rejected" message instead of a misleading "no internet" one.
 */
async function canReachProviderHost(url: string, fetchFn: typeof fetch): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    await fetchFn(url, { method: 'GET', signal: controller.signal })
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
 * Duck-typed fallback for `instanceof AIError`/`AIProviderError`/etc. — `@lingora/ai`'s own doc
 * comment on `AIError` warns that instanceof chains "survive bundling less reliably" than its
 * literal `code` discriminator, and recommends switching on `.code` instead. Confirmed in the
 * wild: a Google Translate 429 rate-limit error reached this function but fell through the
 * `instanceof AIError` gate below, showing the raw truncated HTML error body to the user instead
 * of "rate limit reached, try again" - exactly the failure mode this comment predicts. `instanceof`
 * is still tried first (cheap, no behavior change in the common case); this is only a fallback for
 * when the thrown error's prototype chain doesn't resolve to the same class reference this module
 * imported (a duplicated/mismatched module instance of `@lingora/ai` somewhere in the bundle).
 */
interface AIErrorLike {
  message: string
  code: 'provider' | 'parse' | 'validation'
  status?: number
}

function asAIErrorLike(error: unknown): AIErrorLike | undefined {
  if (error instanceof AIError) return error
  if (
    error instanceof Error &&
    'code' in error &&
    (error.code === 'provider' || error.code === 'parse' || error.code === 'validation')
  ) {
    return error as Error & AIErrorLike
  }
  return undefined
}

/**
 * Formats technical raw API errors (JSON strings, HTTP status dumps, stack traces)
 * into clean, user-friendly, actionable messages for settings & error alerts.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- must accept i18next's TFunction, whose options type is not a plain Record
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

  const aiError = asAIErrorLike(error)
  const status = aiError?.code === 'provider' ? aiError.status : undefined
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
  // key. Only genuine AI-package errors (AIError and its subclasses, or a duck-typed equivalent —
  // see asAIErrorLike) get the heuristics below — anything else shows its own real message instead
  // of a guessed-at, possibly-misleading one.
  if (!aiError) {
    return rawMsg
  }

  // 0. The AI's response for this specific generation didn't match our expected structure — a
  // content/schema issue, not a key/auth/network problem. Checked first and by type, not by
  // message text, since neither error carries any of the keywords the checks below look for —
  // they'd otherwise fall all the way through to the generic "check your key and settings"
  // fallback at the bottom, which is actively misleading here. Model responses are
  // non-deterministic, so a retry of the exact same word can succeed with nothing else changed.
  if (aiError.code === 'validation') {
    return tr(
      "{{providerName}}'s response for this word wasn't in the expected format. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.",
      { providerName },
    )
  }
  if (aiError.code === 'parse') {
    return tr(
      '{{providerName}} returned a response that could not be read. This can happen occasionally - try again, or try a different AI provider in Settings > AI Providers.',
      { providerName },
    )
  }

  // The provider's own structured-output endpoint (strict json_schema) can reject a request
  // outright with an HTTP 400 when whatever the model tried to generate doesn't fit their schema
  // constraints for that particular content — a provider-side rejection, still not a key/auth
  // problem (401/403 are handled separately below).
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

  // 5. Network / Timeout / Reachability — `isConnectivity` is the authoritative signal (every
  // provider sets it explicitly when a request never reached the server at all, see e.g.
  // openai.ts's performChat catch block), checked before the keyword fallback below. Matters in
  // practice: a browser's fetch() failure reads "Failed to fetch", Node's reads "fetch failed" —
  // opposite word order — so keyword matching alone silently misses one runtime's phrasing.
  if (
    isNetworkError(error) ||
    lower.includes('timed out') ||
    lower.includes('timeout') ||
    lower.includes('econnrefused') ||
    lower.includes('fetch failed') ||
    lower.includes('failed to fetch') ||
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
      const parsed = JSON.parse(jsonMatch[0]) as { error?: { message?: string; detail?: string }; message?: string }
      const extracted = parsed?.error?.message ?? parsed?.error?.detail ?? parsed?.message
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
  fetchFn: typeof fetch,
  probe: () => Promise<string>,
): Promise<ValidationResult> {
  const startedAt = Date.now()
  log.info('ai.provider_validation_started', {
    message: 'Provider key validation started',
    metadata: { provider: providerName },
  })
  if (!(await canReachProviderHost(hostUrl, fetchFn))) {
    log.warn('ai.provider_validation_failed', {
      message: 'Provider host unreachable - device appears offline',
      durationMs: Date.now() - startedAt,
      metadata: { provider: providerName, networkType: 'unavailable' },
    })
    return { ok: false, networkUnavailable: true, message: offlineMessage(providerName) }
  }
  try {
    const detail = await probe()
    log.info('ai.provider_validation_completed', {
      message: 'Provider key validated successfully',
      result: 'success',
      durationMs: Date.now() - startedAt,
      metadata: { provider: providerName },
    })
    return { ok: true, message: `Connected - ${detail}` }
  } catch (error) {
    const aiError = asAIErrorLike(error)
    const status = aiError?.code === 'provider' ? aiError.status : undefined
    log.warn('ai.provider_validation_failed', {
      message: 'Provider key validation failed',
      durationMs: Date.now() - startedAt,
      metadata: {
        provider: providerName,
        ...(status !== undefined ? { statusCode: status } : {}),
      },
    })
    return { ok: false, message: formatUserFriendlyProviderError(providerName, error) }
  }
}

/**
 * @param fetchFn Defaults to the global `fetch` (fine for Node and React Native). The desktop app
 *        must pass its own Tauri-HTTP-plugin-backed fetch instead — the WebView's own `fetch` is
 *        subject to browser CORS, and none of these providers send Access-Control-Allow-Origin for
 *        a page origin, so a plain WebView request would be blocked outright. See
 *        apps/desktop/src/services/desktopFetch.ts.
 */
export async function validateOpenAIKey(apiKey: string, model: string, fetchFn: typeof fetch = fetch): Promise<ValidationResult> {
  return runValidation('OpenAI', PROVIDER_HOSTS.openai, fetchFn, async () => {
    const provider = new OpenAIProvider({ apiKey, model, timeoutMs: 15000, fetchFn })
    await provider.translate('Guten Tag', 'de', 'en')
    return `${model} is ready for card generation and translation.`
  })
}

export async function validateMistralKey(apiKey: string, model: string, fetchFn: typeof fetch = fetch): Promise<ValidationResult> {
  return runValidation('Mistral', PROVIDER_HOSTS.mistral, fetchFn, async () => {
    const provider = new MistralProvider({ apiKey, model, timeoutMs: 15000, fetchFn })
    await provider.translate('Guten Tag', 'de', 'en')
    return `${model} is ready for card generation and translation.`
  })
}

export async function validateGeminiKey(apiKey: string, model: string, fetchFn: typeof fetch = fetch): Promise<ValidationResult> {
  return runValidation('Gemini', PROVIDER_HOSTS.gemini, fetchFn, async () => {
    const provider = new GeminiProvider({ apiKey, model, timeoutMs: 15000, fetchFn })
    await provider.translate('Guten Tag', 'de', 'en')
    return `${model} is ready for card generation and translation.`
  })
}

export async function validateClaudeKey(apiKey: string, model: string, fetchFn: typeof fetch = fetch): Promise<ValidationResult> {
  return runValidation('Claude', PROVIDER_HOSTS.anthropic, fetchFn, async () => {
    const provider = new AnthropicProvider({ apiKey, model, timeoutMs: 15000, fetchFn })
    await provider.translate('Guten Tag', 'de', 'en')
    return `${model} is ready for card generation and translation.`
  })
}

// DeepSeek/Groq get a longer probe timeout than the other four providers (15000ms) — confirmed
// against a live key that DeepSeek's chat completions endpoint can take longer than 15s to
// respond even once reachability (canReachProviderHost, a separate 5s check) already succeeded,
// unlike every other provider's real-world observed latency. Groq gets the same longer budget
// preemptively, same reasoning as its json_object response_format fallback in groq.ts.
const SLOWER_PROVIDER_TIMEOUT_MS = 30000

export async function validateDeepSeekKey(apiKey: string, model: string, fetchFn: typeof fetch = fetch): Promise<ValidationResult> {
  return runValidation('DeepSeek', PROVIDER_HOSTS.deepseek, fetchFn, async () => {
    const provider = new DeepSeekProvider({ apiKey, model, timeoutMs: SLOWER_PROVIDER_TIMEOUT_MS, fetchFn })
    await provider.translate('Guten Tag', 'de', 'en')
    return `${model} is ready for card generation and translation.`
  })
}

export async function validateGroqKey(apiKey: string, model: string, fetchFn: typeof fetch = fetch): Promise<ValidationResult> {
  return runValidation('Groq', PROVIDER_HOSTS.groq, fetchFn, async () => {
    const provider = new GroqProvider({ apiKey, model, timeoutMs: SLOWER_PROVIDER_TIMEOUT_MS, fetchFn })
    await provider.translate('Guten Tag', 'de', 'en')
    return `${model} is ready for card generation and translation.`
  })
}

export async function validateDeepLKey(apiKey: string, fetchFn: typeof fetch = fetch): Promise<ValidationResult> {
  // DeepL splits free/pro keys across two hosts (DeepLProvider picks the right one from the
  // key's ':fx' suffix) — reachability only needs one of them to prove the network is up.
  return runValidation('DeepL', PROVIDER_HOSTS.deepl, fetchFn, async () => {
    const provider = new DeepLProvider({ apiKey, timeoutMs: 15000, fetchFn })
    await provider.translate('Guten Tag', 'de', 'en')
    return 'Ready for translation.'
  })
}
