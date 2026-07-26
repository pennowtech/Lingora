import type { LanguageCode } from '@lingora/types'
import { logger } from '@lingora/observability'
import { AIProviderError } from '../errors'
import { startRequestTimeout } from './http'
import type { AIResult, DictionaryProvider } from './types'

const log = logger.child({ feature: 'dictionary', component: 'DeepLProvider' })

/**
 * DeepL adapter for the DictionaryProvider slot — the higher-quality,
 * BYOK translator the Settings screen has advertised since Phase 4 UI
 * landed ("Best German↔English quality").
 *
 * DeepL's language codes aren't quite ISO: English needs a region suffix
 * on the *target* side only ('EN-US'/'EN-GB'; plain 'EN' still works as a
 * source code). Free-tier keys are suffixed ':fx' and live on a separate
 * host (api-free.deepl.com) from paid keys (api.deepl.com) — detected from
 * the key itself so the caller never has to know which tier they're on.
 */

export interface DeepLProviderConfig {
  apiKey: string
  timeoutMs?: number
  /** Injectable for tests. */
  fetchFn?: typeof fetch
}

interface DeepLTranslateResponse {
  translations?: { text?: string; detected_source_language?: string }[]
  message?: string
}

const SOURCE_LANG: Record<LanguageCode, string> = { de: 'DE', en: 'EN', ja: 'JA', es: 'ES', fr: 'FR' }
const TARGET_LANG: Record<LanguageCode, string> = { de: 'DE', en: 'EN-US', ja: 'JA', es: 'ES', fr: 'FR' }
const SUPPORTED_LANGUAGES: readonly LanguageCode[] = ['de', 'en', 'ja', 'es', 'fr']

/** DeepL's detected_source_language comes back as a plain ISO-ish code (e.g. "DE", "EN"). */
function fromDeepLLanguage(code: string): LanguageCode | undefined {
  const normalized = code.trim().toUpperCase()
  return SUPPORTED_LANGUAGES.find((lang) => SOURCE_LANG[lang] === normalized)
}

export class DeepLProvider implements DictionaryProvider {
  readonly name = 'deepl'

  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly fetchFn: typeof fetch

  constructor(config: DeepLProviderConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.apiKey.trim().endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com'
    this.timeoutMs = config.timeoutMs ?? 15_000
    this.fetchFn = config.fetchFn ?? fetch
  }

  async translate(text: string, source: LanguageCode, target: LanguageCode): Promise<AIResult<string>> {
    const { payload, latencyMs } = await this.request(text, SOURCE_LANG[source], TARGET_LANG[target])
    const translation = payload.translations?.[0]?.text?.trim()
    if (!translation) {
      throw new AIProviderError('DeepL returned no translation', this.name, false)
    }
    return { data: translation, usage: { tokensUsed: 0, latencyMs } }
  }

  async detectLanguage(text: string): Promise<AIResult<LanguageCode>> {
    // DeepL has no dedicated detection endpoint; a translate call with no
    // source_lang returns detected_source_language. Target is arbitrary —
    // English is the safest default for widest language-pair support.
    const { payload, latencyMs } = await this.request(text, undefined, TARGET_LANG.en)
    const detected = payload.translations?.[0]?.detected_source_language
    const language = detected ? fromDeepLLanguage(detected) : undefined
    if (!language) {
      throw new AIProviderError(
        detected ? `DeepL detected unsupported language '${detected}'` : 'DeepL response carried no detected language',
        this.name,
        false,
      )
    }
    return { data: language, usage: { tokensUsed: 0, latencyMs } }
  }

  private async request(
    text: string,
    sourceLang: string | undefined,
    targetLang: string,
  ): Promise<{ payload: DeepLTranslateResponse; latencyMs: number }> {
    const startedAt = Date.now()
    const meta = { provider: this.name, sourceLanguage: sourceLang ?? 'auto', targetLanguage: targetLang }
    log.debug('dictionary.request_started', { message: 'DeepL request started', metadata: meta })

    try {
      const result = await this.performRequest(text, sourceLang, targetLang, startedAt)
      log.info('dictionary.request_completed', {
        message: 'DeepL request succeeded',
        result: 'success',
        durationMs: result.latencyMs,
        metadata: meta,
      })
      return result
    } catch (error) {
      const providerError = error instanceof AIProviderError ? error : undefined
      log.error('dictionary.request_failed', error, {
        message: 'DeepL request failed',
        durationMs: Date.now() - startedAt,
        ...(providerError?.status !== undefined ? { errorCode: String(providerError.status) } : {}),
        metadata: {
          ...meta,
          ...(providerError?.status !== undefined ? { statusCode: providerError.status } : {}),
        },
      })
      throw error
    }
  }

  private async performRequest(
    text: string,
    sourceLang: string | undefined,
    targetLang: string,
    startedAt: number,
  ): Promise<{ payload: DeepLTranslateResponse; latencyMs: number }> {
    const timeout = startRequestTimeout(this.timeoutMs)
    let response: Response

    try {
      response = await this.fetchFn(`${this.baseUrl}/v2/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `DeepL-Auth-Key ${this.apiKey}`,
        },
        body: JSON.stringify({
          text: [text],
          target_lang: targetLang,
          ...(sourceLang ? { source_lang: sourceLang } : {}),
        }),
        signal: timeout.signal,
      })
    } catch (error) {
      throw new AIProviderError(
        timeout.didTimeout()
          ? `DeepL request timed out after ${this.timeoutMs}ms`
          : `DeepL request failed: ${String(error)}`,
        this.name,
        true,
      )
    } finally {
      timeout.clear()
    }

    const payload = (await response.json().catch(() => ({}))) as DeepLTranslateResponse

    if (!response.ok) {
      throw new AIProviderError(
        `DeepL returned ${response.status}: ${(payload.message ?? '').slice(0, 300)}`,
        this.name,
        response.status === 429 || response.status >= 500,
        response.status,
      )
    }

    return { payload, latencyMs: Date.now() - startedAt }
  }
}
