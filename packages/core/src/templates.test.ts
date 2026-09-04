import { describe, expect, it } from 'vitest'
import { highlightWord } from './templates'

describe('highlightWord formatting', () => {
  it('preserves a manually selected example highlight', () => {
    expect(highlightWord('Wir gehen <mark class="dc-hl">heute</mark> aus.', 'ausgehen')).toContain(
      '<mark class="dc-hl">heute</mark>',
    )
  })
})
