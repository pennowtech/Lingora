#!/usr/bin/env node
/**
 * Synchronizes and bundles markdown help documentation from `docs/help/` into
 * `packages/core/src/helpDocsData.ts` so both apps/mobile and (from Phase 6) the desktop app can
 * parse and display them natively at runtime with zero duplication - see packages/core/src/help.ts
 * for the platform-agnostic parsing/search logic that consumes this generated data.
 *
 * It parses:
 *  - `docs/help/INDEX.md` (Hub & directory overview)
 *  - `docs/help/screens/*.md` (All screen guides)
 *  - Optional localized overrides under `docs/help/locales/{langCode}/*.md`
 *
 * Usage: node scripts/sync-help-docs.mjs
 */
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docsHelpDir = path.join(repoRoot, 'docs', 'help')
const screensDir = path.join(docsHelpDir, 'screens')
const localesDir = path.join(docsHelpDir, 'locales')
const outputDir = path.join(repoRoot, 'packages', 'core', 'src')
const outputFile = path.join(outputDir, 'helpDocsData.ts')

// A genuine video reference - an actual YouTube link, or an explicit 🎬-tagged line - not just the
// bare word "video" appearing somewhere in unrelated prose (e.g. "Explore Help & Video Guides", a
// plain nav label, used to trip this and show a phantom video badge on a chapter with no video at
// all). Keep this in sync by hand with VIDEO_LINE_PATTERN in packages/core/src/help.ts - this
// plain Node script can't import that TS package directly.
const VIDEO_LINE_PATTERN = /\[🎬|youtu\.be\/|youtube\.com\/(?:watch|embed)|(?:^|\n)\s*video:/i

// Extracts and cleans the display title from a chapter's first H1/H2 (strips a leading "1. "
// numbering prefix and any leading emoji), shared by the English pass and the per-locale title
// pass below so both apply the exact same cleanup rules.
function extractCleanTitle(content, fallback) {
  const titleMatch = content.match(/^#+\s+(.+)$/m)
  const rawTitle = titleMatch ? titleMatch[1].trim() : fallback
  let cleanTitle = rawTitle.replace(/^\d+\.\s*/, '')
  cleanTitle = cleanTitle.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+/u, '').trim()
  return cleanTitle
}

if (!existsSync(docsHelpDir)) {
  console.error(`Help documentation directory not found at: ${docsHelpDir}`)
  process.exit(1)
}

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true })
}

// Icon mappings for screens
const ICON_MAP = {
  '01-home-dashboard': '🏠',
  '02-search-dictionary': '🔍',
  '03-word-detail': '📖',
  '04-decks-management': '🗂️',
  '05-srs-review': '🧠',
  '06-learning-statistics': '📊',
  '07-sentence-mining': '⛏️',
  '08-word-of-the-day': '🌟',
  '09-settings-engines': '⚙️',
}

const docsMap = {
  en: {},
}

const chapters = []

// 1. Read default English docs & index as Chapter 00
if (existsSync(path.join(docsHelpDir, 'INDEX.md'))) {
  const indexContent = readFileSync(path.join(docsHelpDir, 'INDEX.md'), 'utf8')
  docsMap.en['INDEX'] = indexContent
  docsMap.en['00-overview'] = indexContent

  const cleanTitle = extractCleanTitle(indexContent, 'Overview')

  const videoMatches = (indexContent.match(VIDEO_LINE_PATTERN) || []).length
  const imageMatches = (indexContent.match(/!\[|🖼️|Screenshot|Diagram/gi) || []).length
  const articleSections = (indexContent.match(/^###?\s+/gm) || []).length

  chapters.push({
    id: '00-overview',
    number: '00',
    title: cleanTitle || 'Overview & System Architecture',
    icon: '📚',
    subtitle: 'Full directory & feature index',
    articleCount: Math.max(1, articleSections),
    videoCount: videoMatches > 0 ? 1 : 0,
    imageCount: Math.max(1, imageMatches),
  })
}

if (existsSync(screensDir)) {
  const files = readdirSync(screensDir)
    .filter((f) => f.endsWith('.md'))
    .sort()

  for (const file of files) {
    const chapterId = file.replace(/\.md$/, '')
    const content = readFileSync(path.join(screensDir, file), 'utf8')
    docsMap.en[chapterId] = content

    // Extract number prefix e.g. "01"
    const numMatch = chapterId.match(/^(\d+)/)
    const num = numMatch ? numMatch[1] : '00'

    const cleanTitle = extractCleanTitle(content, chapterId)

    // Count media references
    const videoMatches = (content.match(VIDEO_LINE_PATTERN) || []).length
    const imageMatches = (content.match(/!\[|🖼️|Screenshot|Diagram/gi) || []).length
    const articleSections = (content.match(/^###?\s+/gm) || []).length

    chapters.push({
      id: chapterId,
      number: num,
      title: cleanTitle,
      icon: ICON_MAP[chapterId] || '📄',
      subtitle: `Screen guide & features`,
      articleCount: Math.max(1, articleSections),
      videoCount: videoMatches > 0 ? 1 : 0,
      imageCount: Math.max(1, imageMatches),
    })
  }
}

// 2. Scan optional localized docs in docs/help/locales/{lang}. Also extracts each locale's own H1
// title per chapter into localizedTitles, so the chapter directory list (help.tsx) can show
// translated titles instead of always falling back to the English HELP_CHAPTERS metadata - the
// directory listing/searchHelpDocs used to show English titles even when a full German/Hindi
// translation of the chapter body existed and rendered correctly once opened.
const localizedTitles = {}

if (existsSync(localesDir)) {
  const localeFolders = readdirSync(localesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  for (const locale of localeFolders) {
    docsMap[locale] = {}
    localizedTitles[locale] = {}
    const localePath = path.join(localesDir, locale)
    const localeFiles = readdirSync(localePath).filter((f) => f.endsWith('.md'))
    for (const f of localeFiles) {
      const docId = f.replace(/\.md$/, '')
      const content = readFileSync(path.join(localePath, f), 'utf8')
      docsMap[locale][docId] = content
      const chapterId = docId === 'INDEX' ? '00-overview' : docId
      // INDEX.md mirrors '00-overview' the same way the English pass keeps both keys ("Keep
      // Index") - without this alias, resolveRawDoc('00-overview', locale) would miss this
      // locale entirely and silently fall back to English for the overview chapter only.
      if (docId === 'INDEX') {
        docsMap[locale]['00-overview'] = content
      }
      localizedTitles[locale][chapterId] = extractCleanTitle(content, chapterId)
    }
  }
}

const tsContent = `// AUTO-GENERATED by scripts/sync-help-docs.mjs - DO NOT EDIT DIRECTLY
// Source: docs/help/

export interface ChapterMeta {
  id: string
  number: string
  title: string
  icon: string
  subtitle: string
  articleCount: number
  videoCount: number
  imageCount: number
}

export const HELP_CHAPTERS: ChapterMeta[] = ${JSON.stringify(chapters, null, 2)}

export const RAW_HELP_DOCS: Record<string, Record<string, string>> = ${JSON.stringify(docsMap, null, 2)}

// Per-locale chapter titles (extracted from each translated file's own H1) - HELP_CHAPTERS above
// always carries the English title; getHelpChapters()/searchHelpDocs() in help.ts overlay this on
// top of it for a given preferredLanguage so the chapter directory list matches the app language.
export const LOCALIZED_CHAPTER_TITLES: Record<string, Record<string, string>> = ${JSON.stringify(localizedTitles, null, 2)}
`

writeFileSync(outputFile, tsContent, 'utf8')
console.log(`Successfully synced ${chapters.length} help chapters and raw docs to ${outputFile}`)
