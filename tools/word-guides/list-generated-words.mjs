import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Derives `generated-words.json` — the running list of every headword
 * already authored across all `chunks/chunk-*.json` files, so a future
 * chunk-generation pass (in this repo or a fresh conversation) can check
 * "has this lemma/word already been done?" in one file read instead of
 * loading and scanning every chunk file by hand.
 *
 * Not hand-maintained: always regenerate this by rerunning this script
 * after adding/editing a chunk file, rather than editing
 * `generated-words.json` directly — it's a derived artifact, and a stale
 * hand-edit is worse than no file at all.
 *
 * A chunk's first `manifest.chunks[i].wordCount` entries are its "primary"
 * ranked headwords (the word-list.json rank range that chunk covers); any
 * entries beyond that are "companion" entries — lemma/base-word entries
 * added alongside an inflected/conjugated form in that chunk (see chunk 3's
 * own `note` field for why/when those get added). Both count as "already
 * generated" for duplication-checking purposes, but are tagged separately
 * since only primary entries have a `rank` in word-list.json.
 *
 * Usage: node tools/word-guides/list-generated-words.mjs
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const args = process.argv.slice(2)
const languageFlagIndex = args.indexOf('--language')
const language = languageFlagIndex !== -1 ? args[languageFlagIndex + 1] : null

const baseDir = language && language !== 'de' ? path.join(__dirname, language) : __dirname
const chunksDir = path.join(baseDir, 'chunks')
const manifest = JSON.parse(fs.readFileSync(path.join(baseDir, 'manifest.json'), 'utf8'))

const chunkFiles = fs
  .readdirSync(chunksDir)
  .filter((f) => /^chunk-\d+\.json$/.test(f))
  .sort()

const words = []
for (const file of chunkFiles) {
  const chunk = JSON.parse(fs.readFileSync(path.join(chunksDir, file), 'utf8'))
  const manifestEntry = manifest.chunks.find((c) => c.index === chunk.chunkIndex)
  const primaryCount = manifestEntry ? manifestEntry.wordCount : chunk.entries.length
  chunk.entries.forEach((entry, i) => {
    words.push({
      word: entry.headword,
      chunkIndex: chunk.chunkIndex,
      kind: i < primaryCount ? 'primary' : 'companion',
    })
  })
}

const byWordLower = new Map()
for (const w of words) {
  const key = w.word.toLocaleLowerCase(language ?? 'de')
  if (!byWordLower.has(key)) byWordLower.set(key, [])
  byWordLower.get(key).push(w)
}

const duplicates = [...byWordLower.entries()].filter(([, entries]) => entries.length > 1)
if (duplicates.length > 0) {
  console.error(`Found ${duplicates.length} duplicate headword(s) across chunks:`)
  for (const [key, entries] of duplicates) {
    console.error(`  ${key}: ${entries.map((e) => `chunk ${e.chunkIndex} (${e.kind})`).join(', ')}`)
  }
}

const sortedWords = [...words].sort((a, b) => a.word.localeCompare(b.word, language ?? 'de'))

const output = {
  generatedAt: new Date().toISOString().slice(0, 10),
  totalWords: sortedWords.length,
  chunksCovered: chunkFiles.length,
  duplicateCount: duplicates.length,
  words: sortedWords,
}

fs.writeFileSync(
  path.join(baseDir, 'generated-words.json'),
  `${JSON.stringify(output, null, 2)}\n`,
)

console.log(
  `Wrote generated-words.json: ${sortedWords.length} words across ${chunkFiles.length} chunk(s) for language '${language ?? 'de'}'.`,
)

