import type { DatabaseAdapter } from '@lingora/database'
import {
  getInstalledWordGuideChunkIds,
  installWordGuideChunk,
  uninstallWordGuideChunk,
} from '@lingora/database'
import type { LanguageCode, WordGuideEntry } from '@lingora/types'
import deManifestJson from '../assets/word-guides/manifest.json'
import frManifestJson from '../assets/word-guides/fr/manifest.json'
import hiManifestJson from '../assets/word-guides/hi/manifest.json'

/**
 * Bundled Word Guide chunks — the app-side half of the pipeline documented in
 * LingoraDocs/6_word_guides_plan.md. Chunk content is generated/reviewed
 * outside the app (`tools/word-guides/` at the repo root, one subfolder per
 * non-German language — German stays at `tools/word-guides/`'s own root for
 * historical reasons, see generate-chunks.mjs's baseDir logic) and copied
 * into `assets/word-guides/` (mirroring that same de-at-root, others-in-a-
 * subfolder layout) as the "what's actually shipped in this build" copy —
 * same `require()`-bundled-asset precedent Shelfie's own dictionary packs
 * already use, not a runtime download for v1.
 */

interface BundledChunkFile {
  chunkIndex: number
  language: LanguageCode
  entries: Omit<WordGuideEntry, 'language' | 'chunkId'>[]
}

type ChunkSourceMap = Record<number, () => BundledChunkFile>

/**
 * Only chunks actually copied into assets/word-guides/ belong here — see
 * each language's own manifest entries for what "done" means upstream (done
 * upstream can still be ahead of what this build bundles). Lazy `require()`
 * (not a static `import`) deliberately, so adding a later chunk here doesn't
 * force every earlier chunk's content into memory too.
 */
const DE_CHUNK_SOURCES: ChunkSourceMap = {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  1: () => require('../assets/word-guides/chunks/chunk-0001.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  2: () => require('../assets/word-guides/chunks/chunk-0002.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  3: () => require('../assets/word-guides/chunks/chunk-0003.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  4: () => require('../assets/word-guides/chunks/chunk-0004.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  5: () => require('../assets/word-guides/chunks/chunk-0005.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  6: () => require('../assets/word-guides/chunks/chunk-0006.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  7: () => require('../assets/word-guides/chunks/chunk-0007.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  8: () => require('../assets/word-guides/chunks/chunk-0008.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  9: () => require('../assets/word-guides/chunks/chunk-0009.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  10: () => require('../assets/word-guides/chunks/chunk-0010.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  11: () => require('../assets/word-guides/chunks/chunk-0011.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  12: () => require('../assets/word-guides/chunks/chunk-0012.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  13: () => require('../assets/word-guides/chunks/chunk-0013.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  14: () => require('../assets/word-guides/chunks/chunk-0014.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  15: () => require('../assets/word-guides/chunks/chunk-0015.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  16: () => require('../assets/word-guides/chunks/chunk-0016.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  17: () => require('../assets/word-guides/chunks/chunk-0017.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  18: () => require('../assets/word-guides/chunks/chunk-0018.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  19: () => require('../assets/word-guides/chunks/chunk-0019.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  20: () => require('../assets/word-guides/chunks/chunk-0020.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  21: () => require('../assets/word-guides/chunks/chunk-0021.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  22: () => require('../assets/word-guides/chunks/chunk-0022.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  23: () => require('../assets/word-guides/chunks/chunk-0023.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  24: () => require('../assets/word-guides/chunks/chunk-0024.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  25: () => require('../assets/word-guides/chunks/chunk-0025.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  26: () => require('../assets/word-guides/chunks/chunk-0026.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  27: () => require('../assets/word-guides/chunks/chunk-0027.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  28: () => require('../assets/word-guides/chunks/chunk-0028.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  29: () => require('../assets/word-guides/chunks/chunk-0029.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  30: () => require('../assets/word-guides/chunks/chunk-0030.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  31: () => require('../assets/word-guides/chunks/chunk-0031.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  32: () => require('../assets/word-guides/chunks/chunk-0032.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  33: () => require('../assets/word-guides/chunks/chunk-0033.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  34: () => require('../assets/word-guides/chunks/chunk-0034.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  35: () => require('../assets/word-guides/chunks/chunk-0035.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  36: () => require('../assets/word-guides/chunks/chunk-0036.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  37: () => require('../assets/word-guides/chunks/chunk-0037.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  38: () => require('../assets/word-guides/chunks/chunk-0038.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  39: () => require('../assets/word-guides/chunks/chunk-0039.json') as BundledChunkFile,
}

const FR_CHUNK_SOURCES: ChunkSourceMap = {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  1: () => require('../assets/word-guides/fr/chunks/chunk-0001.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  2: () => require('../assets/word-guides/fr/chunks/chunk-0002.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  3: () => require('../assets/word-guides/fr/chunks/chunk-0003.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  4: () => require('../assets/word-guides/fr/chunks/chunk-0004.json') as BundledChunkFile,
}

const HI_CHUNK_SOURCES: ChunkSourceMap = {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  1: () => require('../assets/word-guides/hi/chunks/chunk-0001.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  2: () => require('../assets/word-guides/hi/chunks/chunk-0002.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  3: () => require('../assets/word-guides/hi/chunks/chunk-0003.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  4: () => require('../assets/word-guides/hi/chunks/chunk-0004.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  5: () => require('../assets/word-guides/hi/chunks/chunk-0005.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  6: () => require('../assets/word-guides/hi/chunks/chunk-0006.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  7: () => require('../assets/word-guides/hi/chunks/chunk-0007.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  8: () => require('../assets/word-guides/hi/chunks/chunk-0008.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  9: () => require('../assets/word-guides/hi/chunks/chunk-0009.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  10: () => require('../assets/word-guides/hi/chunks/chunk-0010.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  11: () => require('../assets/word-guides/hi/chunks/chunk-0011.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  12: () => require('../assets/word-guides/hi/chunks/chunk-0012.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  13: () => require('../assets/word-guides/hi/chunks/chunk-0013.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  14: () => require('../assets/word-guides/hi/chunks/chunk-0014.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  15: () => require('../assets/word-guides/hi/chunks/chunk-0015.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  16: () => require('../assets/word-guides/hi/chunks/chunk-0016.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  17: () => require('../assets/word-guides/hi/chunks/chunk-0017.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  18: () => require('../assets/word-guides/hi/chunks/chunk-0018.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  19: () => require('../assets/word-guides/hi/chunks/chunk-0019.json') as BundledChunkFile,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  20: () => require('../assets/word-guides/hi/chunks/chunk-0020.json') as BundledChunkFile,
}

export interface WordGuideManifestChunk {
  index: number
  wordCount: number
  rankStart: number
  rankEnd: number
  status: 'done' | 'pending'
}

export interface WordGuideManifest {
  language: LanguageCode
  totalWords: number
  totalChunks: number
  chunks: WordGuideManifestChunk[]
}

/**
 * One bundled dictionary, fully describing which language pair it covers. Every word-guide entry
 * has its headword in `language` and its translation/explanation written in `nativeLanguage` (see
 * word-guides.ts's WordGuideEntry) — every dictionary bundled so far happens to explain into
 * English, but that's a fact about today's content, not an assumption baked into this file, so a
 * future dictionary that explains into a different language (e.g. a German headword pack aimed at
 * French speakers) is just another entry below, nothing else changes.
 */
export interface BundledDictionary {
  language: LanguageCode
  nativeLanguage: LanguageCode
  manifest: WordGuideManifest
}

/**
 * Every dictionary bundled into this build. To add one: generate its manifest/chunks the same way
 * as the others (see `tools/word-guides/`), copy them into `assets/word-guides/`, give it its own
 * `<LANG>_CHUNK_SOURCES` map above, then add one entry here — `getDictionariesForLanguagePair`
 * below picks it up automatically, no other code needs to know it exists.
 */
const BUNDLED_DICTIONARIES: readonly { dictionary: BundledDictionary; chunkSources: ChunkSourceMap }[] = [
  { dictionary: { language: 'de', nativeLanguage: 'en', manifest: deManifestJson as WordGuideManifest }, chunkSources: DE_CHUNK_SOURCES },
  { dictionary: { language: 'fr', nativeLanguage: 'en', manifest: frManifestJson as WordGuideManifest }, chunkSources: FR_CHUNK_SOURCES },
  { dictionary: { language: 'hi', nativeLanguage: 'en', manifest: hiManifestJson as WordGuideManifest }, chunkSources: HI_CHUNK_SOURCES },
]

function chunkSourcesFor(language: LanguageCode): ChunkSourceMap | undefined {
  return BUNDLED_DICTIONARIES.find((entry) => entry.dictionary.language === language)?.chunkSources
}

function manifestFor(language: LanguageCode): WordGuideManifest | undefined {
  return BUNDLED_DICTIONARIES.find((entry) => entry.dictionary.language === language)?.dictionary.manifest
}

/** True if `a` and `b` are the same two languages, regardless of which one is listed first — a
 * German dictionary (language: 'de', nativeLanguage: 'en') should match a learner whose pair is
 * English->German just as much as one whose pair is German->English. */
function isSameLanguagePair(a: readonly [LanguageCode, LanguageCode], b: readonly [LanguageCode, LanguageCode]): boolean {
  return (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0])
}

/**
 * Every bundled dictionary that covers the learner's current native/target language pair, in
 * either direction. Normally at most one (today's dictionaries each cover a distinct language, so
 * only one can match a given pair), but a list rather than a single result so a future pair with
 * more than one relevant dictionary — e.g. two independently-sourced packs for the same
 * languages — just works, showing both, instead of silently picking one. Empty means nothing is
 * bundled for this pair yet; the Settings screen shows a "coming soon" message in that case.
 */
export function getDictionariesForLanguagePair(nativeLanguage: LanguageCode, targetLanguage: LanguageCode): BundledDictionary[] {
  return BUNDLED_DICTIONARIES.filter(({ dictionary }) =>
    isSameLanguagePair([dictionary.language, dictionary.nativeLanguage], [nativeLanguage, targetLanguage]),
  ).map((entry) => entry.dictionary)
}

/** The rank-list manifest (chunk boundaries, totals) for one language — for the Settings chunk browser. */
export function getWordGuideManifest(language: LanguageCode): WordGuideManifest {
  const manifest = manifestFor(language)
  if (!manifest) throw new Error(`No word guide manifest bundled for language '${language}'.`)
  return manifest
}

/** Chunks whose content actually shipped with this build for `language` — a subset of that language's manifest's `'done'` chunks (upstream can generate faster than the app re-bundles). Empty for a language with no bundled content at all. */
export function getBundledChunkIndexes(language: LanguageCode): number[] {
  const sources = chunkSourcesFor(language)
  if (!sources) return []
  return Object.keys(sources)
    .map(Number)
    .sort((a, b) => a - b)
}

/** Installs a bundled chunk into the on-device `word_guides` table. Throws if this build doesn't carry that chunk's content for that language. */
export async function installBundledChunk(
  db: DatabaseAdapter,
  language: LanguageCode,
  chunkIndex: number,
): Promise<void> {
  const source = chunkSourcesFor(language)?.[chunkIndex]
  if (!source) throw new Error(`Chunk ${chunkIndex} isn't bundled for '${language}' in this app version yet.`)
  const file = source()
  await installWordGuideChunk(db, chunkIndex, language, file.entries)
}

export async function uninstallChunk(
  db: DatabaseAdapter,
  chunkIndex: number,
  language: LanguageCode,
): Promise<void> {
  await uninstallWordGuideChunk(db, chunkIndex, language)
}

export async function getInstalledChunkIndexes(
  db: DatabaseAdapter,
  language: LanguageCode,
): Promise<number[]> {
  return getInstalledWordGuideChunkIds(db, language)
}

/** Installs every bundled chunk for `language` not already installed. Returns how many were newly installed. */
export async function installAllAvailable(
  db: DatabaseAdapter,
  language: LanguageCode,
): Promise<number> {
  const installed = new Set(await getInstalledChunkIndexes(db, language))
  const toInstall = getBundledChunkIndexes(language).filter((i) => !installed.has(i))
  for (const chunkIndex of toInstall) {
    await installBundledChunk(db, language, chunkIndex)
  }
  return toInstall.length
}

/** Uninstalls every currently-installed chunk for `language`. Returns how many were removed. */
export async function uninstallAllInstalled(
  db: DatabaseAdapter,
  language: LanguageCode,
): Promise<number> {
  const installed = await getInstalledChunkIndexes(db, language)
  for (const chunkIndex of installed) {
    await uninstallChunk(db, chunkIndex, language)
  }
  return installed.length
}
