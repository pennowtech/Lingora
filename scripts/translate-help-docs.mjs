#!/usr/bin/env node
/**
 * scripts/translate-help-docs.mjs
 *
 * Translates all docs/help/**\/INDEX.md + docs/help/screens/*.md
 * into multiple languages and saves them under docs/help/locales/{lang}/.
 *
 * Usage:
 *   node scripts/translate-help-docs.mjs            → translate all
 *   node scripts/translate-help-docs.mjs --force    → re-translate even if file exists
 *   node scripts/translate-help-docs.mjs --lang de  → only German
 *
 * After running, execute:
 *   node scripts/sync-help-docs.mjs
 * to bundle everything into rawDocs.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir  = path.resolve(__dirname, '..')
const helpDir  = path.join(rootDir, 'docs/help')
const screensDir = path.join(helpDir, 'screens')
const localesDir = path.join(helpDir, 'locales')

// ─── Target languages ────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'de', name: 'German'  },
  { code: 'hi', name: 'Hindi'   },
]

// ─── Technical terms that must NOT be translated ─────────────────────────────
const PROTECTED = [
  'FSRS', 'SM-2', 'SM2', 'CEFR', 'API', 'FTS5', 'SQLite', 'TTS', 'BYOK',
  'WOTD', 'Lemmory', 'Anki', 'DeepL', 'OpenAI', 'Gemini', 'Groq',
  'Mistral', 'ElevenLabs', 'Deepgram', 'Aura-2', 'Ollama', 'DeepSeek',
  'Claude', 'Google Cloud', 'GitHub',
  // file extensions / formats
  'apkg', '.apkg', '.lem', 'CSV', 'JSON',
]

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const langFilter = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : null
const LANGS = langFilter
  ? LANGUAGES.filter(l => l.code === langFilter)
  : LANGUAGES

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

/**
 * Protect technical terms by replacing them with unique tokens before
 * sending to the translation API, then restore after.
 */
function applyProtections(text) {
  const map = {}
  let out = text
  PROTECTED.forEach((term, i) => {
    const token = `ZPROTECTEDZ${i}Z`
    // word-boundary aware (handles both standalone and inside markdown **)
    const re = new RegExp(`(?<![\\w])${escapeRe(term)}(?![\\w])`, 'g')
    if (re.test(out)) {
      out = out.replace(re, token)
      map[token] = term
    }
  })
  return { protected: out, map }
}

function restoreProtections(text, map) {
  let out = text
  for (const [token, term] of Object.entries(map)) {
    // Token may have been altered by translator (spaces, case) — be lenient
    out = out.replace(new RegExp(escapeRe(token), 'gi'), term)
  }
  return out
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

/**
 * Single translation request to Google Translate's free public endpoint.
 * Max safe payload: ~4000 chars.
 */
async function gtranslate(text, targetLang, retries = 3) {
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      let result = ''
      if (Array.isArray(data?.[0])) {
        for (const seg of data[0]) result += seg?.[0] ?? ''
      }
      return result
    } catch (err) {
      if (attempt < retries - 1) {
        await sleep(1000 * (attempt + 1))
        continue
      }
      return null // signal failure → keep original
    }
  }
  return null
}

/**
 * Translate a single chunk of plain text (≤ MAX_CHUNK chars), preserving
 * protected tokens and returning the original if translation fails.
 */
const MAX_CHUNK = 3500

async function translateChunk(raw, targetLang) {
  if (!raw.trim()) return raw

  const { protected: safe, map } = applyProtections(raw)

  // Split into sub-chunks if still too large
  if (safe.length > MAX_CHUNK) {
    const lines = safe.split('\n')
    const batches = []
    let current = ''
    for (const line of lines) {
      if ((current + '\n' + line).length > MAX_CHUNK && current) {
        batches.push(current)
        current = line
      } else {
        current = current ? current + '\n' + line : line
      }
    }
    if (current) batches.push(current)

    const translated = []
    for (const batch of batches) {
      const t = await gtranslate(batch, targetLang)
      await sleep(250)
      translated.push(t !== null ? t : batch)
    }
    return restoreProtections(translated.join('\n'), map)
  }

  const result = await gtranslate(safe, targetLang)
  await sleep(250)
  return restoreProtections(result !== null ? result : safe, map)
}

/**
 * Translate an entire markdown document.
 *
 * Strategy:
 *  1. Split out fenced code blocks (``` ... ```) → kept verbatim (ASCII art).
 *  2. For each remaining text section, split by blank lines (paragraphs).
 *  3. Translate each paragraph as a unit so context is preserved.
 */
async function translateMarkdown(content, targetLang) {
  // Step 1: isolate code blocks
  const CODE_RE = /^```[\s\S]*?^```[ \t]*$/gm
  const segments = []
  let last = 0

  for (const m of content.matchAll(CODE_RE)) {
    if (m.index > last) segments.push({ kind: 'text', src: content.slice(last, m.index) })
    segments.push({ kind: 'code', src: m[0] })
    last = m.index + m[0].length
  }
  if (last < content.length) segments.push({ kind: 'text', src: content.slice(last) })

  // Step 2 & 3: translate text segments paragraph by paragraph
  const out = []
  for (const seg of segments) {
    if (seg.kind === 'code') {
      out.push(seg.src)
      continue
    }

    // Split on ≥2 consecutive newlines, keeping the separators
    const parts = seg.src.split(/((?:\r?\n){2,})/)
    const translated = []
    for (const part of parts) {
      if (/^[\r\n]+$/.test(part) || part === '') {
        translated.push(part)
        continue
      }
      const t = await translateChunk(part, targetLang)
      translated.push(t)
    }
    out.push(translated.join(''))
  }

  return out.join('')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Collect source files
  const sources = [
    { id: 'INDEX', file: path.join(helpDir, 'INDEX.md') },
    ...readdirSync(screensDir)
      .filter(f => f.endsWith('.md'))
      .sort()
      .map(f => ({ id: f.replace(/\.md$/, ''), file: path.join(screensDir, f) })),
  ]

  console.log(`\n📚 Translating ${sources.length} help docs → ${LANGS.map(l => l.code).join(', ')}`)
  console.log(`   FORCE=${FORCE}  MAX_CHUNK=${MAX_CHUNK}  RATE=250ms/paragraph\n`)

  for (const lang of LANGS) {
    const outDir = path.join(localesDir, lang.code)
    mkdirSync(outDir, { recursive: true })

    console.log(`🌍  ${lang.name} (${lang.code})\n${'─'.repeat(50)}`)

    for (const src of sources) {
      const outFile = path.join(outDir, `${src.id}.md`)

      if (!FORCE && existsSync(outFile)) {
        console.log(`  ✅  ${src.id}.md  (already exists — use --force to re-translate)`)
        continue
      }

      process.stdout.write(`  🔄  ${src.id}.md … `)
      const content = readFileSync(src.file, 'utf8')

      try {
        const translated = await translateMarkdown(content, lang.code)
        writeFileSync(outFile, translated, 'utf8')
        console.log(`done  (${translated.length} chars)`)
      } catch (err) {
        console.log(`ERROR: ${err.message}`)
        console.log(`       Copying original as fallback.`)
        writeFileSync(outFile, content, 'utf8')
      }
    }
    console.log()
  }

  console.log('✅  Translation complete.')
  console.log('    Run:  node scripts/sync-help-docs.mjs')
  console.log('    to bundle all locales into rawDocs.ts\n')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
