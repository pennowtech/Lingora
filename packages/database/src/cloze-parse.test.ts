import { describe, expect, it } from 'vitest'
import { buildClozeMarkup, hasClozeMarkup, parseClozeMarkup } from './cloze-parse'

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
