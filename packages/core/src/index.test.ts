import { describe, expect, it } from 'vitest'
import {
  ALL_QUESTION_TYPES,
  buildGitHubIssueUrl,
  formatIssueBody,
  formatIssueTitle,
  guessPartOfSpeechFromCasing,
  pickEligibleTypes,
  shuffleArray,
  worstRating,
} from './index'

describe('pickEligibleTypes', () => {
  it('returns only enabled types the card is eligible for', () => {
    const card = { cardId: 'c1', hasClozeVariant: false }
    const distractorPool = [{ cardId: 'c2' }, { cardId: 'c3' }, { cardId: 'c4' }]
    const types = pickEligibleTypes(card, ['vocab', 'cloze', 'mcq'], distractorPool)
    expect(types.sort()).toEqual(['mcq', 'vocab'].sort())
  })

  it('excludes mcq below the 3-distractor threshold', () => {
    const card = { cardId: 'c1', hasClozeVariant: false }
    const distractorPool = [{ cardId: 'c2' }, { cardId: 'c3' }]
    expect(pickEligibleTypes(card, ['mcq'], distractorPool)).toEqual(['vocab'])
  })

  it('excludes the card itself from its own distractor count', () => {
    const card = { cardId: 'c1', hasClozeVariant: false }
    // Same card id appearing in the pool (e.g. as a distractor for a different card in the same
    // session) must not count toward its own eligibility.
    const distractorPool = [{ cardId: 'c1' }, { cardId: 'c1' }, { cardId: 'c1' }, { cardId: 'c2' }]
    expect(pickEligibleTypes(card, ['mcq'], distractorPool)).toEqual(['vocab'])
  })

  it('falls back to vocab when nothing else is eligible', () => {
    const card = { cardId: 'c1', hasClozeVariant: false }
    expect(pickEligibleTypes(card, ['cloze', 'mcq', 'trueFalse'], [])).toEqual(['vocab'])
  })

  it('includes cloze only when the card has a cloze variant', () => {
    expect(pickEligibleTypes({ cardId: 'c1', hasClozeVariant: true }, ['cloze'], [])).toEqual(['cloze'])
    expect(pickEligibleTypes({ cardId: 'c1', hasClozeVariant: false }, ['cloze'], [])).toEqual(['vocab'])
  })
})

describe('shuffleArray', () => {
  it('preserves every element (same multiset, order may change)', () => {
    const items = [1, 2, 3, 4, 5]
    const shuffled = shuffleArray(items)
    expect(shuffled.sort()).toEqual(items.sort())
  })

  it('does not mutate the input array', () => {
    const items = [1, 2, 3]
    const copy = [...items]
    shuffleArray(items)
    expect(items).toEqual(copy)
  })
})

describe('worstRating', () => {
  it('again beats every other rating', () => {
    expect(worstRating('again', 'easy')).toBe('again')
    expect(worstRating('easy', 'again')).toBe('again')
  })

  it('ranks hard < good < easy', () => {
    expect(worstRating('hard', 'good')).toBe('hard')
    expect(worstRating('good', 'easy')).toBe('good')
    expect(worstRating('easy', 'good')).toBe('good')
  })

  it('is stable when both ratings are equal', () => {
    expect(worstRating('good', 'good')).toBe('good')
  })
})

describe('ALL_QUESTION_TYPES', () => {
  it('contains exactly the five known formats', () => {
    expect([...ALL_QUESTION_TYPES].sort()).toEqual(['cloze', 'mcq', 'reverse', 'trueFalse', 'vocab'].sort())
  })
})

describe('guessPartOfSpeechFromCasing', () => {
  it('guesses noun for a capitalized German word', () => {
    expect(guessPartOfSpeechFromCasing('Ausreden', 'de')).toBe('noun')
    expect(guessPartOfSpeechFromCasing('Schweigen', 'de')).toBe('noun')
  })

  it('guesses verb for a lowercase German word - the exact noun/verb minimal pairs this exists for', () => {
    expect(guessPartOfSpeechFromCasing('ausreden', 'de')).toBe('verb')
    expect(guessPartOfSpeechFromCasing('schweigen', 'de')).toBe('verb')
  })

  it('returns unknown for a language that does not capitalize common nouns, regardless of casing', () => {
    expect(guessPartOfSpeechFromCasing('House', 'en')).toBe('unknown')
    expect(guessPartOfSpeechFromCasing('house', 'en')).toBe('unknown')
    expect(guessPartOfSpeechFromCasing('Maison', 'fr')).toBe('unknown')
  })

  it('returns unknown for an empty or whitespace-only word', () => {
    expect(guessPartOfSpeechFromCasing('', 'de')).toBe('unknown')
    expect(guessPartOfSpeechFromCasing('   ', 'de')).toBe('unknown')
  })

  it('is not fooled by leading whitespace when checking the first real character', () => {
    expect(guessPartOfSpeechFromCasing('  Wand', 'de')).toBe('noun')
    expect(guessPartOfSpeechFromCasing('  wandern', 'de')).toBe('verb')
  })

  it('treats a word with no case distinction (leading digit/symbol) as lowercase, not capitalized', () => {
    expect(guessPartOfSpeechFromCasing('123', 'de')).toBe('verb')
  })
})

describe('Feedback helpers', () => {
  it('formats issue title with category prefix', () => {
    expect(formatIssueTitle('bug', 'App crashes on start')).toBe('[Bug] App crashes on start')
    expect(formatIssueTitle('feature', '[Feature] Already prefixed')).toBe('[Feature] Already prefixed')
  })

  it('formats issue body with diagnostics and message', () => {
    const body = formatIssueBody({
      category: 'bug',
      title: 'Crash',
      message: 'Here is what happened',
      contactEmail: 'user@example.com',
      diagnostics: {
        appVersion: '0.2.0',
        buildNumber: '15',
        platform: 'macOS',
        tier: 'full',
      },
    })
    expect(body).toContain('### 💬 User Message')
    expect(body).toContain('Here is what happened')
    expect(body).toContain('`user@example.com`')
    expect(body).toContain('`0.2.0`')
    expect(body).toContain('`macOS`')
  })

  it('builds a prefilled GitHub issue URL with custom repo and app target', () => {
    const url = buildGitHubIssueUrl({
      category: 'bug',
      title: 'Window resize glitch',
      message: 'Sidebar collapses incorrectly',
      targetOwner: 'custom-org',
      targetRepo: 'custom-repo',
      app: 'desktop-lemony',
    })
    expect(url).toContain('https://github.com/custom-org/custom-repo/issues/new?')
    expect(url).toContain('title=%5BBug%5D+Window+resize+glitch')
    expect(url).toContain('labels=user-feedback%2Cfeedback%3Abug%2Cbug%2Capp%3Adesktop-lemony')
  })
})


