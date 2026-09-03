import { HELP_CHAPTERS, LOCALIZED_CHAPTER_TITLES, RAW_HELP_DOCS, type ChapterMeta } from './helpDocsData'

/**
 * The in-app Help Hub's markdown parsing/search/video-link logic - platform-agnostic (pure string
 * processing over the generated `helpDocsData.ts` bundle, no React Native/Expo/DOM), so it lives
 * here rather than in apps/mobile's own lib/ - the desktop app's own Help Hub UI (once it exists)
 * reads the exact same parsed structure instead of re-implementing markdown parsing a second time.
 */

export interface HelpDocSection {
  type: 'heading' | 'paragraph' | 'bullet' | 'callout' | 'video' | 'image' | 'code' | 'divider' | 'table'
  level?: number
  content: string
  calloutType?: 'note' | 'tip' | 'warning' | 'important'
  mediaUrl?: string | undefined
  mediaCaption?: string | undefined
  sectionIndex?: number
  /** 'table' sections only - the header row and body rows, each cell's raw markdown left intact
   * (bold/links) for the renderer's own inline-markdown pass, same as any other section's content. */
  tableHeader?: string[]
  tableRows?: string[][]
}

export interface TableOfContentsItem {
  id: string
  title: string
  level: number
  sectionIndex: number
}

export interface ParsedHelpDoc {
  id: string
  title: string
  language: string
  isFallback: boolean
  sections: HelpDocSection[]
  tableOfContents: TableOfContentsItem[]
  rawContent: string
}

export interface ChapterSearchResult extends ChapterMeta {
  matchedSnippet?: string | undefined
}

/**
 * Returns list of chapters with metadata. HELP_CHAPTERS itself always carries the English title
 * (extracted once at sync time from the canonical docs/help/ source) - this overlays each
 * chapter's title with the preferredLanguage's own translated H1 when one exists, so the chapter
 * directory list matches the app language instead of always reading English.
 */
export function getHelpChapters(preferredLanguage?: string): ChapterMeta[] {
  const lang = (preferredLanguage ?? 'en').toLowerCase()
  const localizedTitles = LOCALIZED_CHAPTER_TITLES[lang]
  if (!localizedTitles) return HELP_CHAPTERS

  return HELP_CHAPTERS.map((chapter) => {
    const localizedTitle = localizedTitles[chapter.id]
    return localizedTitle ? { ...chapter, title: localizedTitle } : chapter
  })
}

/**
 * Searches across all help chapters AND deep full-text inside chapter markdown bodies.
 */
export function searchHelpDocs(query: string, preferredLanguage?: string): ChapterSearchResult[] {
  const q = query.trim().toLowerCase()
  const chapters = getHelpChapters(preferredLanguage)
  if (!q) return chapters

  const results: ChapterSearchResult[] = []

  for (const chapter of chapters) {
    const titleMatch = chapter.title.toLowerCase().includes(q) || chapter.number.includes(q)
    const { content } = resolveRawDoc(chapter.id, preferredLanguage)
    const contentLower = content.toLowerCase()
    const contentMatchIndex = contentLower.indexOf(q)

    if (titleMatch || contentMatchIndex !== -1) {
      let matchedSnippet: string | undefined
      if (contentMatchIndex !== -1 && !titleMatch) {
        // Extract ~80 characters around match for contextual preview
        const start = Math.max(0, contentMatchIndex - 25)
        const end = Math.min(content.length, contentMatchIndex + q.length + 50)
        const rawSnippet = content
          .slice(start, end)
          .replace(/[#*`_>[\]]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        matchedSnippet = (start > 0 ? '...' : '') + rawSnippet + (end < content.length ? '...' : '')
      }

      results.push({
        ...chapter,
        matchedSnippet,
      })
    }
  }

  return results
}

/**
 * Resolves raw markdown content for a given chapter ID and language code.
 * Falls back to English ('en') if localized content does not exist.
 */
export function resolveRawDoc(
  chapterId: string,
  preferredLanguage?: string,
): { content: string; language: string; isFallback: boolean } {
  const lang = (preferredLanguage ?? 'en').toLowerCase()
  const localizedDocs = RAW_HELP_DOCS[lang]

  if (localizedDocs?.[chapterId]) {
    return {
      content: localizedDocs[chapterId],
      language: lang,
      isFallback: false,
    }
  }

  // Fallback to English
  const englishDocs = RAW_HELP_DOCS['en'] ?? {}
  const fallbackContent = englishDocs[chapterId] ?? ''
  return {
    content: fallbackContent,
    language: 'en',
    isFallback: lang !== 'en',
  }
}

/**
 * Normalizes latex arrows and other symbols.
 */
function normalizeMarkdownText(text: string): string {
  return text
    .replace(/\$\\rightarrow\$/g, '➔')
    .replace(/\\rightarrow/g, '➔')
    .replace(/\$\\leftarrow\$/g, '⬅')
    .replace(/\\leftarrow/g, '⬅')
}

/** A genuine video reference - an actual YouTube link, or a 🎬-tagged line - not just the bare
 * word "video" appearing somewhere in a sentence (e.g. "Explore Help & Video Guides", a plain nav
 * label). Shared with the video-count heuristic in scripts/sync-help-docs.mjs's own doc comment as
 * the canonical definition, even though that script can't import this directly (a plain Node
 * script, no TS build step for this package) - keep the two in sync by hand if either changes. */
const VIDEO_LINE_PATTERN = /youtu\.be\/|youtube\.com\/(?:watch|embed)|\[🎬|^video:/i

/**
 * Parses markdown into structured UI blocks and extracts table of contents.
 */
export function parseHelpMarkdown(
  chapterId: string,
  rawContent: string,
  language: string,
  isFallback: boolean,
): ParsedHelpDoc {
  const lines = rawContent.split('\n')
  const sections: HelpDocSection[] = []
  const tableOfContents: TableOfContentsItem[] = []
  let title = chapterId

  let inCodeBlock = false
  let codeBuffer: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === undefined) continue
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        sections.push({
          type: 'code',
          content: codeBuffer.join('\n'),
          sectionIndex: sections.length,
        })
        codeBuffer = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBuffer.push(line)
      continue
    }

    if (!trimmed) continue

    // Horizontal Rule / Divider (---, ***, ___)
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      sections.push({
        type: 'divider',
        content: '',
        sectionIndex: sections.length,
      })
      continue
    }

    // Headings (1 to 6 hashes: #, ##, ###, ####, #####, ######)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch?.[1] && headingMatch[2]) {
      const level = headingMatch[1].length
      const headingText = normalizeMarkdownText(headingMatch[2].trim())

      if (level === 1) {
        // Strip leading emojis/numbers from main title
        title = headingText
          .replace(/^\d+\.\s*/, '')
          .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+/u, '')
          .trim()
      }

      const currentIdx = sections.length
      sections.push({
        type: 'heading',
        level,
        content: headingText,
        sectionIndex: currentIdx,
      })

      if (level >= 2 && level <= 4) {
        tableOfContents.push({
          id: `section-${currentIdx}`,
          title: headingText
            .replace(/^\d+\.\s*/, '')
            .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+/u, '')
            .trim(),
          level,
          sectionIndex: currentIdx,
        })
      }
      continue
    }

    // Callouts / Alerts (> [!TIP], > [!NOTE], etc.)
    if (trimmed.startsWith('> [!')) {
      const match = trimmed.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i)
      const calloutType = (match ? match[1]!.toLowerCase() : 'note') as 'note' | 'tip' | 'warning' | 'important'

      // Grab subsequent lines starting with >
      const calloutLines: string[] = []
      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        if (nextLine?.trim().startsWith('>')) {
          i++
          calloutLines.push(normalizeMarkdownText(nextLine.trim().replace(/^>\s*/, '')))
        } else {
          break
        }
      }
      sections.push({
        type: 'callout',
        calloutType,
        content: calloutLines.join(' ') || normalizeMarkdownText(trimmed.replace(/^>\s*\[!.*?\]\s*/, '')),
        sectionIndex: sections.length,
      })
      continue
    }

    // Standard blockquotes (> text)
    if (trimmed.startsWith('>')) {
      sections.push({
        type: 'callout',
        calloutType: 'tip',
        content: normalizeMarkdownText(trimmed.replace(/^>\s*/, '')),
        sectionIndex: sections.length,
      })
      continue
    }

    // Image tags ![alt](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)/)
    if (imgMatch) {
      sections.push({
        type: 'image',
        mediaCaption: imgMatch[1],
        mediaUrl: imgMatch[2],
        content: imgMatch[1] ?? 'Screenshot reference',
        sectionIndex: sections.length,
      })
      continue
    }

    // Video tags or links - a genuine YouTube link or 🎬 tag, not just the bare word "video"
    // appearing in unrelated prose (see VIDEO_LINE_PATTERN's own doc comment).
    if (VIDEO_LINE_PATTERN.test(trimmed) && (trimmed.startsWith('- [') || trimmed.startsWith('• [') || trimmed.startsWith('[🎬'))) {
      sections.push({
        type: 'video',
        content: normalizeMarkdownText(trimmed.replace(/^[-•*]\s*/, '')),
        sectionIndex: sections.length,
      })
      continue
    }

    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      sections.push({
        type: 'bullet',
        content: normalizeMarkdownText(trimmed.replace(/^[-*•]\s*/, '')),
        sectionIndex: sections.length,
      })
      continue
    }

    // Numbered steps
    if (/^\d+\.\s+/.test(trimmed)) {
      sections.push({
        type: 'bullet',
        content: normalizeMarkdownText(trimmed),
        sectionIndex: sections.length,
      })
      continue
    }

    // Markdown tables (| Col | Col |, a |---|---| separator row, then |-prefixed body rows) - used
    // throughout the help docs for the chapter directory table. Previously fell through to the
    // "regular paragraph" branch below, rendering the separator row and every `|`-delimited row as
    // one literal, unparsed line of pipe characters instead of an actual table.
    if (trimmed.startsWith('|')) {
      const nextLine = lines[i + 1]?.trim()
      const isTableSeparator = nextLine !== undefined && /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(nextLine)
      if (isTableSeparator) {
        const splitRow = (row: string): string[] =>
          row
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((cell) => normalizeMarkdownText(cell.trim()))

        const tableHeader = splitRow(trimmed)
        const tableRows: string[][] = []
        i += 1 // consume the separator row already peeked at above

        while (i + 1 < lines.length) {
          const bodyLine = lines[i + 1]?.trim()
          if (!bodyLine?.startsWith('|')) break
          i++
          tableRows.push(splitRow(bodyLine))
        }

        sections.push({
          type: 'table',
          content: '',
          tableHeader,
          tableRows,
          sectionIndex: sections.length,
        })
        continue
      }
    }

    // Regular paragraph
    sections.push({
      type: 'paragraph',
      content: normalizeMarkdownText(trimmed),
      sectionIndex: sections.length,
    })
  }

  return {
    id: chapterId,
    title,
    language,
    isFallback,
    sections,
    tableOfContents,
    rawContent,
  }
}

/**
 * Convenience function to resolve and parse a document.
 */
export function getHelpDoc(chapterId: string, preferredLanguage?: string): ParsedHelpDoc {
  const { content, language, isFallback } = resolveRawDoc(chapterId, preferredLanguage)
  return parseHelpMarkdown(chapterId, content, language, isFallback)
}

// ─── Help videos ────────────────────────────────────────────────────────────────

/** The one tutorial video that exists today (the Help Hub's "2-Minute Quickstart Tour") - shared
 * as a single constant rather than hardcoded separately in the Help Hub hero card, the per-chapter
 * video modal, and the player's own default, so there's exactly one place to update if it ever
 * changes. */
export const DEFAULT_HELP_VIDEO_ID = 'ZmxOaj0c7Zc'

/** Whether a string looks like a YouTube link - shared by the markdown link handler (deciding
 * whether to open the in-app player vs. a normal external link) and anywhere else that needs the
 * same check. */
export function isYouTubeUrl(url: string): boolean {
  return url.includes('youtu.be/') || url.includes('youtube.com/')
}

/**
 * Pulls a YouTube video ID out of a `youtu.be/...` or `youtube.com/watch?v=...` URL, or accepts a
 * bare ID directly. Returns `null` (not the raw input) when nothing extractable - passing arbitrary
 * text straight through as if it were a valid ID used to be the previous behavior and would embed
 * a broken player; callers should fall back to `DEFAULT_HELP_VIDEO_ID` on `null` instead.
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const shortMatch = trimmed.match(/youtu\.be\/([\w-]{6,})/)
  if (shortMatch?.[1]) return shortMatch[1]

  const watchMatch = trimmed.match(/[?&]v=([\w-]{6,})/)
  if (watchMatch?.[1]) return watchMatch[1]

  const embedMatch = trimmed.match(/youtube\.com\/embed\/([\w-]{6,})/)
  if (embedMatch?.[1]) return embedMatch[1]

  // A bare ID, not a URL at all (e.g. already extracted upstream).
  if (/^[\w-]{6,}$/.test(trimmed)) return trimmed

  return null
}

/** A markdown link/URL isn't a presentable modal title - falls back to a generic label instead of
 * showing a raw link string as the video player's header. */
export function sanitizeVideoTitle(raw: string | undefined): string {
  if (!raw) return '🎬 Video Walkthrough'
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.includes('youtu')) {
    return '🎬 Video Walkthrough'
  }
  return raw
}
