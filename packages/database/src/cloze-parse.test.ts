import { describe, expect, it } from 'vitest'
import { hasClozeMarkup, parseClozeMarkup } from './cloze-parse'

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
