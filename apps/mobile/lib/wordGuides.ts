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

const CHUNK_SOURCES_BY_LANGUAGE: Partial<Record<LanguageCode, ChunkSourceMap>> = {
  de: DE_CHUNK_SOURCES,
  fr: FR_CHUNK_SOURCES,
  hi: HI_CHUNK_SOURCES,
}

const MANIFESTS_BY_LANGUAGE: Partial<Record<LanguageCode, WordGuideManifest>> = {
  de: deManifestJson as WordGuideManifest,
  fr: frManifestJson as WordGuideManifest,
  hi: hiManifestJson as WordGuideManifest,
}

/** Every language with any word-guide content bundled into this build, in a stable display order. */
export function getWordGuideLanguages(): LanguageCode[] {
  return (Object.keys(MANIFESTS_BY_LANGUAGE) as LanguageCode[]).sort(
    (a, b) => Object.keys(MANIFESTS_BY_LANGUAGE).indexOf(a) - Object.keys(MANIFESTS_BY_LANGUAGE).indexOf(b),
  )
}

/** The rank-list manifest (chunk boundaries, totals) for one language — for the Settings chunk browser. */
export function getWordGuideManifest(language: LanguageCode): WordGuideManifest {
  const manifest = MANIFESTS_BY_LANGUAGE[language]
  if (!manifest) throw new Error(`No word guide manifest bundled for language '${language}'.`)
  return manifest
}

/** Chunks whose content actually shipped with this build for `language` — a subset of that language's manifest's `'done'` chunks (upstream can generate faster than the app re-bundles). Empty for a language with no bundled content at all. */
export function getBundledChunkIndexes(language: LanguageCode): number[] {
  const sources = CHUNK_SOURCES_BY_LANGUAGE[language]
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
  const source = CHUNK_SOURCES_BY_LANGUAGE[language]?.[chunkIndex]
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
