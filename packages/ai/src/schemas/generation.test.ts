import type { WordGenerationPayload } from '@lingora/types'
import { describe, expect, it } from 'vitest'
import { salvagePartial, wordGenerationSchema } from './generation'

/** A fully valid payload — the fixture other tests mutate. */
export function validPayload(): WordGenerationPayload {
  return {
    lemma: {
      form: 'ausgehen',
      language: 'de',
      partOfSpeech: 'verb',
      gender: null,
      plural: null,
    },
    inflections: ['geht aus', 'ging aus', 'ausgegangen'],
    clusters: [
      {
        label: 'social',
        description: 'going out for social activities',
        cefrLevel: 'A2',
        meanings: [
          { translation: 'to go out', explanation: 'to leave home for fun', cefrLevel: 'A2' },
        ],
        examples: [
          {
            sentence: 'Wir gehen heute Abend aus.',
            translation: 'We are going out tonight.',
            context: 'casual',
            cefrLevel: 'A2',
          },
        ],
        synonyms: [{ word: 'weggehen', cefrLevel: 'B1', formality: 'colloquial', nuance: null }],
      },
    ],
    phrases: [
      {
        expression: 'davon ausgehen',
        meaning: 'to assume',
        exampleSentence: 'Ich gehe davon aus, dass du kommst.',
        exampleTranslation: 'I assume you are coming.',
        cefrLevel: 'B1',
      },
    ],
    clozes: [
      {
        sentence: 'Wir gehen heute Abend [...].',
        answer: 'aus',
        translation: 'We are going out tonight.',
        difficulty: 'easy',
        cefrLevel: 'A2',
      },
    ],
  }
}

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

  it("rejects a cloze whose sentence has no '[...]' gap", () => {
    const payload = validPayload()
    payload.clozes[0]!.sentence = 'Wir gehen heute Abend aus.'
    expect(wordGenerationSchema.safeParse(payload).success).toBe(false)
  })
})

describe('salvagePartial', () => {
  it('keeps valid items and drops broken ones', () => {
    const payload = validPayload() as unknown as Record<string, unknown>
    const clusters = payload['clusters'] as Record<string, unknown>[]
    const cluster = clusters[0] as { examples: unknown[]; synonyms: unknown[] }
    cluster.examples.push({ sentence: 'kaputt' }) // malformed example
    cluster.synonyms.push({ word: '', cefrLevel: 'B1', formality: 'neutral', nuance: null })
    const brokenPhrases = [
      ...(payload['phrases'] as unknown[]),
      { expression: 'missing everything else' },
    ]

    const partial = salvagePartial({ ...payload, phrases: brokenPhrases })

    expect(partial.complete).toBe(false)
    expect(partial.lemma?.form).toBe('ausgehen')
    expect(partial.clusters).toHaveLength(1)
    expect(partial.clusters[0]!.examples).toHaveLength(1) // broken one dropped
    expect(partial.clusters[0]!.synonyms).toHaveLength(1) // empty word dropped
    expect(partial.phrases).toHaveLength(1) // broken phrase dropped
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
    expect(partial.phrases).toHaveLength(0)
    expect(partial.clozes).toHaveLength(0)
  })
})
