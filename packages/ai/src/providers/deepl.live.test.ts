import { describe, expect, it } from 'vitest'
import { DeepLProvider } from './deepl'

/**
 * Opt-in live smoke test against the real DeepL API. Skipped unless DEEPL_API_KEY is set — see
 * packages/ai/.env.example for how to set it locally without ever committing it.
 *
 * DeepL is a DictionaryProvider only (translate/detectLanguage), not an AIProvider — no word
 * package to generate, so this just exercises translate() directly.
 */
const apiKey = process.env['DEEPL_API_KEY']

describe.skipIf(!apiKey)('DeepLProvider live', () => {
  it('translates ausgehen to English', { timeout: 30_000 }, async () => {
    const provider = new DeepLProvider({ apiKey: apiKey! })
    const result = await provider.translate('ausgehen', 'de', 'en')

    expect(result.data.toLowerCase()).toContain('go out')
    expect(result.usage.latencyMs).toBeGreaterThan(0)
  })

  it('detects German as the source language', { timeout: 30_000 }, async () => {
    const provider = new DeepLProvider({ apiKey: apiKey! })
    const result = await provider.detectLanguage('Ich gehe heute Abend aus.')

    expect(result.data).toBe('de')
  })
})
