import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

/**
 * Derives the ranked German headword list Word Guide generation (WP2+) works
 * through, from Shelfie's `freedict-en-de.json` (English-keyed, frequency-
 * ranked, 1-12 German translations per entry — see
 * `Totorials_and_AppsDocs/LingoraDocs/6_word_guides_plan.md` §4).
 *
 * Deliberately does NOT read that file from inside this repo and does NOT
 * commit it here: `freedict-en-de.json` is derived from FreeDict `eng-deu`,
 * which is GPL-2.0-or-later (see `shelfie/assets/dict/LICENSE-FreeDict-GPL-2.0.txt`).
 * Bundling that data file into a differently-licensed repo would raise real
 * distribution questions this script sidesteps entirely by only ever writing
 * out a bare, unadorned list of German words + ranks — not FreeDict's actual
 * copyrightable expression (definitions, translations, examples). A list of
 * common German words is not itself the kind of "expression" copyleft
 * licensing protects; the German words don't stop being German words because
 * of which dictionary happened to list them. The AI-generated content built
 * from this list in WP2 is wholly new text, not reproduced/adapted FreeDict
 * content, so it carries no GPL obligation either.
 *
 * Usage:
 *   node tools/word-guides/derive-word-list.mjs <path-to-freedict-en-de.json>
 *
 * Algorithm (validated by hand against the real file before this script
 * existed — see the plan doc §4 for the exploratory run's findings):
 *   1. Walk EN entries in frequency order (array index = EN rank).
 *   2. Take only each entry's first 3 listed German translations — taking
 *      all up to 12 pulls in too many rare/tail senses.
 *   3. Strip bracketed/braced annotations and a leading article, lowercase
 *      for dedup (same normalization LicensedEnDePack.ts#reverseHeadword
 *      already uses).
 *   4. Keep one entry per distinct German word: whichever EN rank first
 *      produced it wins.
 *   5. Drop anything in EXCLUDED_WORDS (homograph-contamination cases found
 *      by hand review — see the doc comment below).
 *   6. Sort by best rank.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const sourcePath = process.argv[2]
if (!sourcePath) {
  console.error('Usage: node derive-word-list.mjs <path-to-freedict-en-de.json>')
  process.exit(1)
}

/**
 * Homograph-contamination cases confirmed by hand review of the first 100
 * derived words (see 6_word_guides_plan.md §4): the English source entry is
 * genuinely polysemous (a common modal/function word plus an unrelated noun
 * sense), FreeDict lists both senses' translations under one EN entry with
 * no sense tagging, and the noun-sense translation lands in the first 3 and
 * outranks words that are actually more common. Add to this list by hand as
 * later chunks surface more cases — this is not meant to be exhaustive on
 * the first pass.
 */
const EXCLUDED_WORDS = new Set([
  'kanister', // 'can' (noun: a can) — the modal sense 'kann' is correctly kept
  'kanne', // 'can' (noun)
  'konserve', // 'can' (noun: canned food)
  'konservenbüchse', // 'can' (noun: tin can)
  'berechtigung', // 'may' (permission/authorization sense, not the modal)
  'wille', // 'will' (noun: willpower) — the modal sense is 'wollen', not yet mis-derived so nothing to keep here
  'brunnen', // 'well' (noun: a water well) — the adverb sense ('gut', etc.) is what's actually high-frequency
])

function stripAnnotations(value) {
  return value
    .replace(/\[[^\]]*]/g, '')
    .replace(/\{[^}]*}/g, '')
    .replace(/^\s*\((?:der|die|das|ein|eine)\)\s*/i, '')
    .trim()
}

const entries = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
if (!Array.isArray(entries) || entries.length === 0) {
  console.error(`No entries found in ${sourcePath}`)
  process.exit(1)
}

const bestRank = new Map() // lowercased German word -> { rank, word }
entries.forEach((entry, index) => {
  const definitions = (entry.definitions ?? []).slice(0, 3)
  for (const raw of definitions) {
    const cleaned = stripAnnotations(raw)
    if (!cleaned || cleaned.includes(' ') || cleaned.length > 40) continue
    if (!/^[A-Za-zÄÖÜäöüß-]+$/.test(cleaned)) continue
    const key = cleaned.toLocaleLowerCase('de-DE')
    if (EXCLUDED_WORDS.has(key)) continue
    const existing = bestRank.get(key)
    if (!existing || index < existing.rank) {
      bestRank.set(key, { rank: index, word: cleaned })
    }
  }
})

const ranked = [...bestRank.values()].sort((a, b) => a.rank - b.rank)
const wordList = ranked.map((entry, i) => ({ rank: i + 1, word: entry.word, sourceEnRank: entry.rank + 1 }))

const outPath = path.join(__dirname, 'word-list.json')
fs.writeFileSync(outPath, `${JSON.stringify(wordList, null, 2)}\n`)

const wordListVersion = crypto.createHash('sha256').update(JSON.stringify(wordList)).digest('hex').slice(0, 16)
const wordsPerChunk = 100
const totalWords = wordList.length
const totalChunks = Math.ceil(totalWords / wordsPerChunk)
const manifest = {
  language: 'de',
  wordListVersion,
  wordsPerChunk,
  totalWords,
  totalChunks,
  chunks: Array.from({ length: totalChunks }, (_, i) => {
    const rankStart = i * wordsPerChunk + 1
    const rankEnd = Math.min(totalWords, rankStart + wordsPerChunk - 1)
    return {
      index: i + 1,
      wordCount: rankEnd - rankStart + 1,
      rankStart,
      rankEnd,
      status: 'pending',
    }
  }),
  doneWords: [],
}
fs.writeFileSync(path.join(__dirname, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)

console.log(`Derived ${totalWords} German headwords (excluded ${EXCLUDED_WORDS.size} known homograph cases) at ${outPath}`)
console.log(`Manifest: ${totalChunks} chunks of up to ${wordsPerChunk} words, wordListVersion=${wordListVersion}`)
console.log('First 20:', wordList.slice(0, 20).map((e) => e.word).join(', '))
