import type { LanguageCode } from '@lingora/types'
import { AIProviderError } from '../errors'
import { startRequestTimeout } from './http'
import type { AIResult, DictionaryProvider } from './types'

/**
 * Google Translate adapter for the DictionaryProvider slot — the free-tier
 * fallback for users who have configured no API key at all.
 *
 * Uses the public `translate_a/single` endpoint (the one translate.google.com
 * itself calls): no key, no billing, but also no SLA — it is rate-limited and
 * its response shape is unofficial. That's acceptable for this slot because
 * the pipeline already degrades gracefully: a dictionary failure only costs
 * the baseline-translation hint, never the generation itself. Users with a
 * DeepL or OpenAI key get a better translator in this slot.
 *
 * The response is a nested array; index [0] holds the translated segments,
 * index [2] the detected source language.
 */

export interface GoogleTranslateProviderConfig {
  baseUrl?: string
  timeoutMs?: number
  /** Injectable for tests. */
  fetchFn?: typeof fetch
}

const SUPPORTED_LANGUAGES: readonly LanguageCode[] = ['de', 'en', 'ja', 'es', 'fr']

function isSupportedLanguage(value: string): value is LanguageCode {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

export class GoogleTranslateProvider implements DictionaryProvider {
  readonly name = 'google-translate'

  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly fetchFn: typeof fetch

  constructor(config: GoogleTranslateProviderConfig = {}) {
    this.baseUrl = (config.baseUrl ?? 'https://translate.googleapis.com').replace(/\/$/, '')
    this.timeoutMs = config.timeoutMs ?? 15_000
    this.fetchFn = config.fetchFn ?? fetch
  }

  async translate(
    text: string,
    source: LanguageCode,
    target: LanguageCode,
  ): Promise<AIResult<string>> {
    const { payload, latencyMs } = await this.request(text, source, target)

    const translation = readTranslation(payload)
    if (translation === '') {
      throw new AIProviderError('Google Translate returned no translation', this.name, false)
    }

    return { data: translation, usage: { tokensUsed: 0, latencyMs } }
  }

  async detectLanguage(text: string): Promise<AIResult<LanguageCode>> {
    // 'auto' asks the endpoint to detect; the result rides on index [2].
    const { payload, latencyMs } = await this.request(text, 'auto', 'en')

    const detected = Array.isArray(payload) && typeof payload[2] === 'string' ? payload[2] : ''
    if (!isSupportedLanguage(detected)) {
      throw new AIProviderError(
        detected === ''
          ? 'Google Translate response carried no detected language'
          : `Google Translate detected unsupported language '${detected}'`,
        this.name,
        false,
      )
    }

    return { data: detected, usage: { tokensUsed: 0, latencyMs } }
  }

  private async request(
    text: string,
    source: string,
    target: string,
  ): Promise<{ payload: unknown; latencyMs: number }> {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: source,
      tl: target,
      dt: 't',
      q: text,
    })
    const url = `${this.baseUrl}/translate_a/single?${params.toString()}`
    const startedAt = Date.now()
    const timeout = startRequestTimeout(this.timeoutMs)
    let response: Response

    try {
      response = await this.fetchFn(url, { signal: timeout.signal })
    } catch (error) {
      throw new AIProviderError(
        timeout.didTimeout()
          ? `Google Translate request timed out after ${this.timeoutMs}ms`
          : `Google Translate request failed: ${String(error)}`,
        this.name,
        true,
      )
    } finally {
      timeout.clear()
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new AIProviderError(
        `Google Translate returned ${response.status}: ${body.slice(0, 300)}`,
        this.name,
        response.status === 429 || response.status >= 500,
        response.status,
      )
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new AIProviderError('Google Translate response was not JSON', this.name, false)
    }

    return { payload, latencyMs: Date.now() - startedAt }
  }
}

/**
 * Long inputs come back split into segments: [[["seg1", …], ["seg2", …]], …].
 * The translation is the concatenation of every segment's first element.
 */
function readTranslation(payload: unknown): string {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) return ''

  let translation = ''
  for (const segment of payload[0] as unknown[]) {
    if (Array.isArray(segment) && typeof segment[0] === 'string') {
      translation += segment[0]
    }
  }
  return translation.trim()
}
