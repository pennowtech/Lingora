import { describe, expect, it } from 'vitest'
import { buildClozeMarkup, hasClozeMarkup, markWordAsCloze, parseClozeMarkup, revealClozeMarkup, revealClozeSentence } from './cloze-parse'

describe('hasClozeMarkup', () => {
  it('detects real Anki cloze syntax', () => {
    expect(hasClozeMarkup('Wir gehen heute {{c1::aus}}.')).toBe(true)
  })

  it('detects the single-colon variant', () => {
    expect(hasClozeMarkup('Wir gehen heute {{x1:aus}}.')).toBe(true)
  })

  it('returns false for plain text and for Liquid-style {{ word }} placeholders', () => {
    expect(hasClozeMarkup('Wir gehen heute Abend aus.')).toBe(false)
    expect(hasClozeMarkup('{{ word }}')).toBe(false)
  })
})

describe('parseClozeMarkup', () => {
  it('returns null when there is no cloze markup', () => {
    expect(parseClozeMarkup('Wir gehen heute Abend aus.')).toBeNull()
  })

  it('blanks a single cloze and extracts its answer', () => {
    const result = parseClozeMarkup('Wir gehen heute Abend {{c1::aus}}.')
    expect(result).toEqual({ blanked: 'Wir gehen heute Abend [...].', answers: ['aus'] })
  })

  it('blanks every cloze token regardless of number, in order of appearance', () => {
    const result = parseClozeMarkup('Der {{c1::Wettbewerb}} und der {{c2::Wettstreit}} sind ähnlich.')
    expect(result).toEqual({
      blanked: 'Der [...] und der [...] sind ähnlich.',
      answers: ['Wettbewerb', 'Wettstreit'],
    })
  })

  it('ignores a cloze hint after a second "::"', () => {
    const result = parseClozeMarkup('Wir gehen heute Abend {{c1::aus::separable verb}}.')
    expect(result).toEqual({ blanked: 'Wir gehen heute Abend [...].', answers: ['aus'] })
  })

  it('supports the single-colon variant', () => {
    const result = parseClozeMarkup('Wir gehen heute Abend {{x1:aus}}.')
    expect(result).toEqual({ blanked: 'Wir gehen heute Abend [...].', answers: ['aus'] })
  })
})

describe('buildClozeMarkup', () => {
  it('re-embeds a single answer as {{c1::answer}}', () => {
    expect(buildClozeMarkup('Wir gehen heute Abend [...].', 'aus')).toBe('Wir gehen heute Abend {{c1::aus}}.')
  })

  it('re-embeds multiple answers in order, each as its own {{c1::...}}', () => {
    const result = buildClozeMarkup('Der [...] und der [...] sind ähnlich.', 'Wettbewerb; Wettstreit')
    expect(result).toBe('Der {{c1::Wettbewerb}} und der {{c1::Wettstreit}} sind ähnlich.')
  })

  it('round-trips through parseClozeMarkup back to the same blanked sentence', () => {
    const original = 'Wir gehen heute Abend {{c1::aus}}.'
    const parsed = parseClozeMarkup(original)!
    const rebuilt = buildClozeMarkup(parsed.blanked, parsed.answers.join('; '))
    expect(parseClozeMarkup(rebuilt)).toEqual(parsed)
  })
})

describe('revealClozeMarkup', () => {
  it('strips {{c1::answer}} down to just the answer, inline', () => {
    expect(revealClozeMarkup('Wir gehen heute Abend {{c1::aus}}.')).toBe('Wir gehen heute Abend aus.')
  })

  it('reveals multiple answers in one sentence', () => {
    expect(revealClozeMarkup('Der {{c1::Wettbewerb}} und der {{c1::Wettstreit}} sind ähnlich.')).toBe(
      'Der Wettbewerb und der Wettstreit sind ähnlich.',
    )
  })

  it('ignores a hint after a second "::"', () => {
    expect(revealClozeMarkup('Wir gehen heute Abend {{c1::aus::separable verb}}.')).toBe('Wir gehen heute Abend aus.')
  })

  it('returns plain text unchanged', () => {
    expect(revealClozeMarkup('Wir gehen heute Abend aus.')).toBe('Wir gehen heute Abend aus.')
  })
})

describe('revealClozeSentence', () => {
  it('fills a single blank from the stored answer', () => {
    expect(revealClozeSentence('Wir gehen heute Abend [...].', 'aus')).toBe('Wir gehen heute Abend aus.')
  })

  it('fills multiple blanks in order from the "; "-joined answers', () => {
    expect(revealClozeSentence('Der [...] und der [...] sind ähnlich.', 'Wettbewerb; Wettstreit')).toBe(
      'Der Wettbewerb und der Wettstreit sind ähnlich.',
    )
  })

  it('reveals legacy desktop multi-blank answers joined with slashes', () => {
    expect(revealClozeSentence('Der [...] und der [...] sind ähnlich.', 'Wettbewerb / Wettstreit')).toBe(
      'Der Wettbewerb und der Wettstreit sind ähnlich.',
    )
  })

  it('round-trips a real Cloze row (sentence = blanked, answer = joined) the same way buildClozeMarkup does', () => {
    const original = 'Wir gehen heute Abend {{c1::aus}}.'
    const parsed = parseClozeMarkup(original)!
    expect(revealClozeSentence(parsed.blanked, parsed.answers.join('; '))).toBe('Wir gehen heute Abend aus.')
  })
})

describe('markWordAsCloze', () => {
  it('marks the first whole-word, case-insensitive match', () => {
    expect(markWordAsCloze('Die Wand ist weiss.', 'wand')).toBe('Die {{c1::Wand}} ist weiss.')
  })

  it('only marks the first occurrence, not every one', () => {
    expect(markWordAsCloze('Das Haus neben dem Haus ist rot.', 'Haus')).toBe(
      'Das {{c1::Haus}} neben dem Haus ist rot.',
    )
  })

  it('does not match a word as a substring of a longer word', () => {
    // "Wand" must not match inside "Wandern" - a whole-word boundary check, not a plain substring one.
    expect(markWordAsCloze('Wir gehen heute wandern.', 'wand')).toBeNull()
  })

  it('returns null when the word is a German umlaut/ß boundary case that a plain \\b regex would miss', () => {
    // A regex \b before/after "Ü" or "ß" is unreliable (\b only recognizes ASCII word chars) -
    // confirms the \p{L}/\p{N} boundary check handles this correctly either way.
    expect(markWordAsCloze('Ich mag diese Übung sehr.', 'Übung')).toBe('Ich mag diese {{c1::Übung}} sehr.')
    expect(markWordAsCloze('Der Fluss ist groß.', 'groß')).toBe('Der Fluss ist {{c1::groß}}.')
  })

  it('returns null for a separable-verb prefix split across the sentence, never a wrong guess', () => {
    // "ausverkaufen" never appears as one literal substring here - the prefix "aus" splits from
    // the stem "verkauft" in normal word order. Must fall back to null, not a wrong partial mark.
    expect(markWordAsCloze('Der Laden verkauft alles aus.', 'ausverkaufen')).toBeNull()
  })

  it('returns null when the word does not appear in the sentence at all', () => {
    expect(markWordAsCloze('Die Sonne scheint heute.', 'Regen')).toBeNull()
  })

  it('returns null for an empty word', () => {
    expect(markWordAsCloze('Die Sonne scheint heute.', '  ')).toBeNull()
  })

  it('numbers after any cloze markup the sentence already has', () => {
    expect(markWordAsCloze('Wir gehen heute {{c1::aus}} und sehen ein Haus.', 'Haus')).toBe(
      'Wir gehen heute {{c1::aus}} und sehen ein {{c2::Haus}}.',
    )
  })
})
