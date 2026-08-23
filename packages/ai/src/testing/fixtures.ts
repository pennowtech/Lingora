import type { WordGenerationPayload } from '@lingora/types'

/**
 * A fully valid generation payload for 'ausgehen' — the fixture tests mutate.
 * Mirrors the Phase 2 seed data (one social cluster).
 */
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
          { translation: 'to go out', explanation: 'to leave home for fun', usage: null, cefrLevel: 'A2' },
        ],
        examples: [
          {
            sentence: 'Wir gehen heute Abend aus.',
            translation: 'We are going out tonight.',
            context: 'casual',
            cefrLevel: 'A2',
            grammarTags: null,
          },
        ],
        synonyms: [{ word: 'weggehen', cefrLevel: 'B1', formality: 'colloquial', nuance: null }],
      },
    ],
  }
}
