import { describe, expect, it } from 'vitest'
import { validPayload } from '../testing/fixtures'
import { salvagePartial, wordGenerationSchema, wordGenerationSchemaForLanguage } from './generation'

describe('wordGenerationSchema', () => {
  it('accepts a fully valid payload', () => {
    const result = wordGenerationSchema.safeParse(validPayload())
    expect(result.success).toBe(true)
  })

  it('rejects a missing required field', () => {
    const payload: Record<string, unknown> = { ...validPayload() }
    delete payload['inflections']
    expect(wordGenerationSchema.safeParse(payload).success).toBe(false)
  })

  it('rejects an invalid CEFR level', () => {
    const payload = validPayload()
    ;(payload.clusters[0] as { cefrLevel: string }).cefrLevel = 'Z9'
    expect(wordGenerationSchema.safeParse(payload).success).toBe(false)
  })

  it('rejects an empty clusters array', () => {
    const payload = { ...validPayload(), clusters: [] }
    expect(wordGenerationSchema.safeParse(payload).success).toBe(false)
  })

  it('rejects a cluster without meanings', () => {
    const payload = validPayload()
    payload.clusters[0]!.meanings = []
    expect(wordGenerationSchema.safeParse(payload).success).toBe(false)
  })
})

describe('wordGenerationSchemaForLanguage', () => {
  it('accepts a payload whose lemma.language matches the expected target language', () => {
    const payload = validPayload() // fixture lemma.language is 'de'
    expect(wordGenerationSchemaForLanguage('de').safeParse(payload).success).toBe(true)
  })

  it('rejects a payload whose lemma.language does not match — the target/native inversion bug', () => {
    // Confirmed on-device: asked for target=English, a model returned the whole package with
    // lemma.language set to the native language instead (here simulated as German staying 'de'
    // while the caller actually requested 'en', matching the real ausgehen/German fixture).
    const payload = validPayload()
    const result = wordGenerationSchemaForLanguage('en').safeParse(payload)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'lemma.language')).toBe(true)
    }
  })
})

describe('salvagePartial', () => {
  it('keeps valid items and drops broken ones', () => {
    const payload = validPayload() as unknown as Record<string, unknown>
    const clusters = payload['clusters'] as Record<string, unknown>[]
    const cluster = clusters[0] as { examples: unknown[]; synonyms: unknown[] }
    cluster.examples.push({ sentence: 'kaputt' }) // malformed example
    cluster.synonyms.push({ word: '', cefrLevel: 'B1', formality: 'neutral', nuance: null })

    const partial = salvagePartial(payload)

    expect(partial.complete).toBe(false)
    expect(partial.lemma?.form).toBe('ausgehen')
    expect(partial.clusters).toHaveLength(1)
    expect(partial.clusters[0]!.examples).toHaveLength(1) // broken one dropped
    expect(partial.clusters[0]!.synonyms).toHaveLength(1) // empty word dropped
  })

  it('drops a cluster whose last example was invalid', () => {
    const payload = validPayload() as unknown as {
      clusters: { examples: unknown[] }[]
    }
    payload.clusters[0]!.examples = [{ sentence: 'kaputt' }]

    const partial = salvagePartial(payload)
    expect(partial.clusters).toHaveLength(0)
  })

  it('handles complete garbage without throwing', () => {
    const partial = salvagePartial('not even an object')
    expect(partial.lemma).toBeNull()
    expect(partial.clusters).toHaveLength(0)
  })
})
