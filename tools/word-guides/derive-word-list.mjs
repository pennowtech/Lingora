import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

/**
 * Derives a ranked headword list Word Guide generation (WP2+) works through,
 * from a FreeDict-style bilingual JSON source (English-keyed, frequency-
 * ranked by array order, 1-N translations per entry — see
 * `Totorials_and_AppsDocs/LingoraDocs/6_word_guides_plan.md` §4).
 *
 * Deliberately does NOT read the source file from a path inside this repo
 * and does NOT commit it here: `freedict-en-de.json` (the only such source
 * that exists locally, in the sibling Shelfie repo) is derived from FreeDict
 * `eng-deu`, which is GPL-2.0-or-later (see
 * `shelfie/assets/dict/LICENSE-FreeDict-GPL-2.0.txt`). Bundling that data
 * file into a differently-licensed repo would raise real distribution
 * questions this script sidesteps entirely by only ever writing out a bare,
 * unadorned list of target-language words + ranks — not FreeDict's actual
 * copyrightable expression (definitions, translations, examples). A list of
 * common words is not itself the kind of "expression" copyleft licensing
 * protects; the words don't stop being ordinary words of that language
 * because of which dictionary happened to list them. The AI-generated
 * content built from this list in WP2 is wholly new text, not
 * reproduced/adapted source-dictionary content, so it carries no GPL
 * obligation either. Whatever source is used for a *new* language should be
 * checked against this same reasoning before being pointed at by
 * `--source`, not assumed to be fine by analogy.
 *
 * Usage:
 *   node tools/word-guides/derive-word-list.mjs <path-to-source.json> [--language de] [--out-dir DIR]
 *
 * `--language` (default `de`, matching the one language this has actually
 * been run for) selects which per-language exclusion list (below) applies
 * and is written into the output manifest. `--out-dir` (default: this
 * script's own directory, matching the original German run's committed
 * output layout) is where `word-list.json`/`manifest.json` land — a second
 * language should point this at its own subdirectory
 * (`tools/word-guides/<language>/`) rather than overwriting German's files.
 *
 * Algorithm (validated by hand against the real German file before this
 * script existed — see the plan doc §4 for the exploratory run's findings):
 *   1. Walk source entries in frequency order (array index = source rank).
 *   2. Take only each entry's first 3 listed translations — taking all up
 *      to however many a source lists pulls in too many rare/tail senses.
 *   3. Strip bracketed/braced annotations and a leading article, lowercase
 *      for dedup (same normalization LicensedEnDePack.ts#reverseHeadword
 *      already uses for German — the article-stripping regex is
 *      German-specific (`der|die|das|ein|eine`); a language with different
 *      articles would need its own pattern here, not silently reuse
 *      German's).
 *   4. Keep one entry per distinct word: whichever source rank first
 *      produced it wins.
 *   5. Drop anything in that language's exclusion list (homograph-
 *      contamination cases found by hand review — see the doc comment
 *      below). Every new language starts with an empty list; populate it
 *      the same way German's was, by reviewing the derived top 100 twice.
 *   6. Sort by best rank.
 *
 * Chunk-authoring convention (as of chunk 3, German): because this list is
 * derived from English-source translations rather than hand-picked lemmas
 * (step 2 above), a meaningful fraction of ranked headwords in any chunk
 * turn out to be a conjugated verb form or participle (e.g. "muss",
 * "gesiegt", "dachte") rather than the dictionary/infinitive form. When
 * authoring a chunk's content and a ranked headword is such a form, ALSO
 * author a companion entry for its lemma/infinitive (e.g. "muss" → also add
 * "müssen") and append it after that chunk's primary ranked entries — don't
 * silently gloss over the missing base form. Before adding a companion,
 * check `tools/word-guides/generated-words.json` (regenerate first via
 * `node tools/word-guides/list-generated-words.mjs` if it might be stale)
 * to confirm the lemma isn't already covered by an earlier or later chunk;
 * skip the companion and just note the existing coverage in the inflected
 * entry's `intro` instead if it's already there. Scope this to verb
 * conjugations/participles specifically — a German infinitive is an
 * unambiguous, universally-recognized lemma, which is what makes a
 * companion entry well-defined. Adjective/pronoun case-and-gender
 * inflections (e.g. "andere"/"anderer"/"anderes") don't have an equivalent
 * single uninflected citation form, so don't manufacture one; if every
 * sibling inflection already has its own ranked headword in the same
 * chunk, just cross-reference them in each other's `intro` instead. See
 * `chunks/chunk-0003.json`'s own `note` field for a worked example of both
 * halves of this convention.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const args = process.argv.slice(2)
const sourcePath = args[0]
if (!sourcePath || sourcePath.startsWith('--')) {
  console.error('Usage: node derive-word-list.mjs <path-to-source.json> [--language de] [--out-dir DIR]')
  process.exit(1)
}
const languageFlagIndex = args.indexOf('--language')
const language = languageFlagIndex !== -1 ? args[languageFlagIndex + 1] : 'de'
const outDirFlagIndex = args.indexOf('--out-dir')
const outDir = outDirFlagIndex !== -1 ? args[outDirFlagIndex + 1] : __dirname

/**
 * Homograph-contamination cases confirmed by hand review of German's first
 * 100 derived words (see 6_word_guides_plan.md §4): the English source
 * entry is genuinely polysemous (a common modal/function word plus an
 * unrelated noun sense), the source lists both senses' translations under
 * one entry with no sense tagging, and the noun-sense translation lands in
 * the first 3 and outranks words that are actually more common. Add to a
 * language's list by hand as later chunks surface more cases — not meant to
 * be exhaustive on the first pass, and NOT meant to be reused verbatim for
 * a different language (these are specific German words).
 */
const EXCLUDED_WORDS_BY_LANGUAGE = {
  de: new Set([
    'kanister', // 'can' (noun: a can) — the modal sense 'kann' is correctly kept
    'kanne', // 'can' (noun)
    'konserve', // 'can' (noun: canned food)
    'konservenbüchse', // 'can' (noun: tin can)
    'berechtigung', // 'may' (permission/authorization sense, not the modal)
    'wille', // 'will' (noun: willpower) — the modal sense is 'wollen', not yet mis-derived so nothing to keep here
    'brunnen', // 'well' (noun: a water well) — the adverb sense ('gut', etc.) is what's actually high-frequency
  ]),
}

/** German-specific: der/die/das/ein/eine. A new language needs its own leading-article pattern here, not this one reused. */
const LEADING_ARTICLE_BY_LANGUAGE = {
  de: /^\s*\((?:der|die|das|ein|eine)\)\s*/i,
}

const excludedWords = EXCLUDED_WORDS_BY_LANGUAGE[language] ?? new Set()
const leadingArticle = LEADING_ARTICLE_BY_LANGUAGE[language]

function stripAnnotations(value) {
  let result = value.replace(/\[[^\]]*]/g, '').replace(/\{[^}]*}/g, '')
  if (leadingArticle) result = result.replace(leadingArticle, '')
  return result.trim()
}

const entries = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
if (!Array.isArray(entries) || entries.length === 0) {
  console.error(`No entries found in ${sourcePath}`)
  process.exit(1)
}

const bestRank = new Map() // lowercased word -> { rank, word }
entries.forEach((entry, index) => {
  const definitions = (entry.definitions ?? []).slice(0, 3)
  for (const raw of definitions) {
    const cleaned = stripAnnotations(raw)
    // \p{L} (Unicode "letter" category) rather than a hand-picked A-Za-z +
    // German-diacritics set — matches ordinary words in any Latin-script
    // language (French/Spanish accents included) without a per-language
    // character-class table to maintain.
    if (!cleaned || cleaned.includes(' ') || cleaned.length > 40) continue
    if (!/^[\p{L}-]+$/u.test(cleaned)) continue
    const key = cleaned.toLocaleLowerCase(language)
    if (excludedWords.has(key)) continue
    const existing = bestRank.get(key)
    if (!existing || index < existing.rank) {
      bestRank.set(key, { rank: index, word: cleaned })
    }
  }
})

const ranked = [...bestRank.values()].sort((a, b) => a.rank - b.rank)
const wordList = ranked.map((entry, i) => ({ rank: i + 1, word: entry.word, sourceEnRank: entry.rank + 1 }))

fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, 'word-list.json')
fs.writeFileSync(outPath, `${JSON.stringify(wordList, null, 2)}\n`)

const wordListVersion = crypto.createHash('sha256').update(JSON.stringify(wordList)).digest('hex').slice(0, 16)
const wordsPerChunk = 100
const totalWords = wordList.length
const totalChunks = Math.ceil(totalWords / wordsPerChunk)
const manifest = {
  language,
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
fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)

console.log(`Derived ${totalWords} '${language}' headwords (excluded ${excludedWords.size} known homograph cases) at ${outPath}`)
console.log(`Manifest: ${totalChunks} chunks of up to ${wordsPerChunk} words, wordListVersion=${wordListVersion}`)
console.log('First 20:', wordList.slice(0, 20).map((e) => e.word).join(', '))
