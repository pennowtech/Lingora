import type { WordGenerationPayload } from '@lingora/types'

/**
 * A fully valid generation payload for 'ausgehen' — the fixture tests mutate.
 * Mirrors the Phase 2 seed data (one social cluster, davon-ausgehen phrase).
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
          { translation: 'to go out', explanation: 'to leave home for fun', cefrLevel: 'A2' },
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
