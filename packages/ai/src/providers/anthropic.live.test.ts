import { describe, expect, it } from 'vitest'
import { wordGenerationSchema } from '../schemas/generation'
import { AnthropicProvider } from './anthropic'

/**
 * Opt-in live smoke test against the real Anthropic (Claude) API. Skipped unless
 * ANTHROPIC_API_KEY is set — see packages/ai/.env.example for how to set it locally without ever
 * committing it.
 */
const apiKey = process.env['ANTHROPIC_API_KEY']

describe.skipIf(!apiKey)('AnthropicProvider live', () => {
  it(
    'generates a valid word package for ausgehen at B1',
    { timeout: 120_000 },
    async () => {
      const provider = new AnthropicProvider({ apiKey: apiKey! })
      const result = await provider.generateWordPackage('ausgehen', {
        cefrLevel: 'B1',
        language: 'de',
      })

      expect(result.kind).toBe('complete')
      if (result.kind === 'complete') {
        expect(wordGenerationSchema.safeParse(result.data).success).toBe(true)
        expect(result.data.lemma.form.toLowerCase()).toBe('ausgehen')
        expect(result.data.clusters.length).toBeGreaterThanOrEqual(1)
        expect(result.usage.tokensUsed).toBeGreaterThan(0)
        expect(result.usage.latencyMs).toBeGreaterThan(0)
      }
    },
  )
})
