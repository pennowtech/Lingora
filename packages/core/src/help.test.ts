import { describe, expect, it } from 'vitest'
import { extractYouTubeVideoId, getHelpChapters, isYouTubeUrl, parseHelpMarkdown, resolveRawDoc, sanitizeVideoTitle } from './help'

describe('extractYouTubeVideoId', () => {
  it('extracts the id from a youtu.be short link', () => {
    expect(extractYouTubeVideoId('https://youtu.be/YEpT1116Xo4?si=abc123')).toBe('YEpT1116Xo4')
  })

  it('extracts the id from a youtube.com/watch link', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=YEpT1116Xo4&t=10s')).toBe('YEpT1116Xo4')
  })

  it('extracts the id from a youtube.com/embed link', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/embed/YEpT1116Xo4')).toBe('YEpT1116Xo4')
  })

  it('accepts a bare id directly', () => {
    expect(extractYouTubeVideoId('YEpT1116Xo4')).toBe('YEpT1116Xo4')
  })

  // The previous implementation returned the raw input unchanged when nothing was extractable -
  // silently embedding arbitrary text (a chapter title, a markdown snippet) as if it were a valid
  // video id, producing a broken player. Callers now fall back to DEFAULT_HELP_VIDEO_ID on null.
  it('returns null for text with nothing extractable, instead of passing it through', () => {
    expect(extractYouTubeVideoId('🎬 Video Walkthrough')).toBeNull()
    expect(extractYouTubeVideoId('')).toBeNull()
    expect(extractYouTubeVideoId('   ')).toBeNull()
  })
})

describe('isYouTubeUrl', () => {
  it('recognizes both youtu.be and youtube.com links', () => {
    expect(isYouTubeUrl('https://youtu.be/abc123')).toBe(true)
    expect(isYouTubeUrl('https://www.youtube.com/watch?v=abc123')).toBe(true)
  })

  it('rejects an unrelated link', () => {
    expect(isYouTubeUrl('https://example.com/watch?v=abc123')).toBe(false)
  })
})

describe('sanitizeVideoTitle', () => {
  it('falls back to a generic label for a raw link', () => {
    expect(sanitizeVideoTitle('https://youtu.be/abc123')).toBe('🎬 Video Walkthrough')
  })

  it('falls back to a generic label when nothing was given', () => {
    expect(sanitizeVideoTitle(undefined)).toBe('🎬 Video Walkthrough')
  })

  it('keeps a real title as-is', () => {
    expect(sanitizeVideoTitle('Mining Studio Walkthrough')).toBe('Mining Studio Walkthrough')
  })
})

describe('parseHelpMarkdown - video section detection', () => {
  // The sync script and this parser used to treat the bare word "Video" anywhere in a line as a
  // video signal, so a plain nav-link bullet like "Explore Help & Video Guides" was misdetected -
  // a chapter with zero real video content showed a video badge/section for a mention of the word.
  it('does not treat a bullet merely containing the word "Video" as a video section', () => {
    const doc = parseHelpMarkdown('01-home-dashboard', '# Home\n\n- Explore Help & Video Guides', 'en', false)
    const videoSections = doc.sections.filter((s) => s.type === 'video')
    expect(videoSections).toHaveLength(0)
    expect(doc.sections.some((s) => s.type === 'bullet' && s.content.includes('Video Guides'))).toBe(true)
  })

  it('recognizes a genuine YouTube link bullet as a video section', () => {
    const doc = parseHelpMarkdown(
      '00-overview',
      '# Overview\n\n- [🎬 Watch on YouTube](https://youtu.be/YEpT1116Xo4)',
      'en',
      false,
    )
    const videoSections = doc.sections.filter((s) => s.type === 'video')
    expect(videoSections).toHaveLength(1)
  })
})

describe('getHelpChapters - localized titles', () => {
  // The chapter directory list used to always read HELP_CHAPTERS' baked-in English title, even
  // when the user's app language was German/Hindi and the chapter body itself rendered translated
  // - reported as "help section under settings still shown in english" despite switching languages.
  it('overlays a German title when a German chapter file exists', () => {
    const enChapters = getHelpChapters('en')
    const deChapters = getHelpChapters('de')
    const enTitle = enChapters.find((c) => c.id === '02-search-dictionary')?.title
    const deTitle = deChapters.find((c) => c.id === '02-search-dictionary')?.title
    expect(deTitle).toBeDefined()
    expect(deTitle).not.toBe(enTitle)
  })

  it('falls back to the English title for a locale with no translation', () => {
    const chapters = getHelpChapters('fr')
    expect(chapters).toEqual(getHelpChapters('en'))
  })
})

describe('parseHelpMarkdown - table detection', () => {
  // Markdown tables (used throughout the help docs for the chapter directory) used to fall through
  // to the plain-paragraph branch, rendering the |---|---| separator row and every |-delimited data
  // row as one literal, unparsed line of pipe characters instead of an actual table.
  it('parses a table into a single table section with header and rows', () => {
    const markdown = [
      '# Overview',
      '',
      '| Screen | Description |',
      '| :--- | :--- |',
      '| **[Home](01-home.md)** | The home screen |',
      '| **[Search](02-search.md)** | The search screen |',
    ].join('\n')
    const doc = parseHelpMarkdown('00-overview', markdown, 'en', false)
    const tableSections = doc.sections.filter((s) => s.type === 'table')
    expect(tableSections).toHaveLength(1)
    const table = tableSections[0]!
    expect(table.tableHeader).toEqual(['Screen', 'Description'])
    expect(table.tableRows).toEqual([
      ['**[Home](01-home.md)**', 'The home screen'],
      ['**[Search](02-search.md)**', 'The search screen'],
    ])
  })

  it('does not treat a line starting with | as a table without a following separator row', () => {
    const doc = parseHelpMarkdown('00-overview', '# Overview\n\n| Not a table, just a line starting with a pipe', 'en', false)
    expect(doc.sections.some((s) => s.type === 'table')).toBe(false)
  })
})

describe('resolveRawDoc - 00-overview locale alias', () => {
  // docs/help/locales/{lang}/INDEX.md is keyed 'INDEX' on disk but the chapter id used everywhere
  // else is '00-overview' - without aliasing the two, resolveRawDoc('00-overview', 'de') silently
  // fell back to the English overview body even when a German INDEX.md existed.
  it('resolves the overview chapter to the localized INDEX.md, not the English fallback', () => {
    const { language, isFallback } = resolveRawDoc('00-overview', 'de')
    expect(language).toBe('de')
    expect(isFallback).toBe(false)
  })
})
