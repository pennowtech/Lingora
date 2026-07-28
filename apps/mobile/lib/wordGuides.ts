import type { DatabaseAdapter } from '@lingora/database'
import { getInstalledWordGuideChunkIds, installWordGuideChunk, uninstallWordGuideChunk } from '@lingora/database'
import type { LanguageCode, WordGuideEntry } from '@lingora/types'
import manifestJson from '../assets/word-guides/manifest.json'

/**
 * Bundled Word Guide chunks — the app-side half of the pipeline documented in
 * LingoraDocs/6_word_guides_plan.md. Chunk content is generated/reviewed
 * outside the app (`tools/word-guides/` at the repo root) and copied into
 * `assets/word-guides/` as the "what's actually shipped in this build" copy
 * — same `require()`-bundled-asset precedent Shelfie's own dictionary packs
 * already use, not a runtime download for v1.
 */

interface BundledChunkFile {
  chunkIndex: number
  language: LanguageCode
  entries: Omit<WordGuideEntry, 'language' | 'chunkId'>[]
}

/**
 * Only chunks actually copied into assets/word-guides/chunks/ belong here —
 * see chunk 1's own manifest entry for what "done" means upstream. Lazy
 * `require()` (not a static `import`) deliberately, so adding chunk 50 here
 * later doesn't force chunks 2-49's content into memory too.
 */
const CHUNK_SOURCES: Record<number, () => BundledChunkFile> = {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  1: () => require('../assets/word-guides/chunks/chunk-0001.json') as BundledChunkFile,
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

const MANIFEST = manifestJson as WordGuideManifest

/** The full chunk list (rank ranges, generated/pending status) — for the Settings chunk browser. */
export function getWordGuideManifest(): WordGuideManifest {
  return MANIFEST
}

/** Chunks whose content actually shipped with this build — a subset of the manifest's `'done'` chunks (upstream can generate faster than the app re-bundles). */
export function getBundledChunkIndexes(): number[] {
  return Object.keys(CHUNK_SOURCES).map(Number).sort((a, b) => a - b)
}

/** Installs a bundled chunk into the on-device `word_guides` table. Throws if this build doesn't carry that chunk's content. */
export async function installBundledChunk(db: DatabaseAdapter, chunkIndex: number): Promise<void> {
  const source = CHUNK_SOURCES[chunkIndex]
  if (!source) throw new Error(`Chunk ${chunkIndex} isn't bundled with this app version yet.`)
  const file = source()
  await installWordGuideChunk(db, chunkIndex, file.language, file.entries)
}

export async function uninstallChunk(db: DatabaseAdapter, chunkIndex: number, language: LanguageCode): Promise<void> {
  await uninstallWordGuideChunk(db, chunkIndex, language)
}

export async function getInstalledChunkIndexes(db: DatabaseAdapter, language: LanguageCode): Promise<number[]> {
  return getInstalledWordGuideChunkIds(db, language)
}

/** Installs every bundled chunk not already installed. Returns how many were newly installed. */
export async function installAllAvailable(db: DatabaseAdapter, language: LanguageCode): Promise<number> {
  const installed = new Set(await getInstalledChunkIndexes(db, language))
  const toInstall = getBundledChunkIndexes().filter((i) => !installed.has(i))
  for (const chunkIndex of toInstall) {
    await installBundledChunk(db, chunkIndex)
  }
  return toInstall.length
}
