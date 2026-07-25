import { describe, expect, it } from 'vitest'
import { wordGenerationSchema } from '../schemas/generation'
import { OpenAIProvider } from './openai'

/**
 * Opt-in live smoke test against the real OpenAI API. Skipped unless
 * OPENAI_API_KEY is set:
 *
 *   $env:OPENAI_API_KEY = '<key>'
 *   pnpm --filter @lingora/ai exec vitest run src/providers/openai.live.test.ts
 */
const apiKey = process.env['OPENAI_API_KEY']

describe.skipIf(!apiKey)('OpenAIProvider live', () => {
  it(
    'generates a valid word package for ausgehen at B1',
    { timeout: 120_000 },
    async () => {
      const provider = new OpenAIProvider({ apiKey: apiKey! })
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
