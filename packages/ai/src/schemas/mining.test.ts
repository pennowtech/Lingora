import { describe, expect, it } from 'vitest'
import { minedPassageSchema } from './mining'
import { PROMPTS, renderPrompt } from '../prompts/templates'

describe('minedPassageSchema', () => {
  it('validates a complete passage analysis response', () => {
    const raw = {
      translation: 'Although artificial intelligence is advancing rapidly, ethical questions must be carefully weighed.',
      grammarPoints: [
        {
          title: "Konzessivsatz mit 'Obwohl'",
          explanation: "Subordinate clause sending the verb 'voranschreitet' to the end.",
          ruleOrPattern: 'Obwohl + Nebensatz (Verb am Ende)',
        },
        {
          title: 'Passiv mit Modalverb',
          explanation: "Expresses necessity with 'müssen ... abgewogen werden'.",
        },
      ],
      vocabulary: [
        {
          form: 'voranschreiten',
          partOfSpeech: 'verb',
          meaning: 'to advance, to progress rapidly',
          contextSentence: 'Obwohl die künstliche Intelligenz rasant voranschreitet, müssen Fragen abgewogen werden.',
        },
        {
          form: 'abwägen',
          partOfSpeech: 'verb',
          meaning: 'to weigh, to balance carefully',
          contextSentence: 'Ethische Fragen müssen sorgfältig abgewogen werden.',
        },
      ],
    }

    const parsed = minedPassageSchema.parse(raw)
    expect(parsed.translation).toContain('artificial intelligence')
    expect(parsed.grammarPoints).toHaveLength(2)
    expect(parsed.vocabulary).toHaveLength(2)
    expect(parsed.vocabulary[0]?.form).toBe('voranschreiten')
  })

  it('renders passageMining prompt with CEFR level and language variables', () => {
    const rendered = renderPrompt(PROMPTS.passageMining.template, {
      passage: 'Ein kleiner Beispielsatz.',
      cefrLevel: 'B2',
      targetLanguage: 'German',
      nativeLanguage: 'English',
    })

    expect(rendered).toContain('Ein kleiner Beispielsatz.')
    expect(rendered).toContain('B2')
    expect(rendered).toContain('German')
    expect(rendered).toContain('English')
    expect(rendered).toContain('grammarPoints')
  })
})
