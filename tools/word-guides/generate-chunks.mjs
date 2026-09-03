/**
 * AI Word Guides Generator Script
 * 
 * Automatically generates 100-word vocabulary guide chunks for any language
 * (e.g., French, Hindi, German) using an AI model.
 * 
 * Configuration:
 * 1. Create a `.env` file in the project root or in `packages/ai/.env` containing:
 *    GEMINI_API_KEY=your_gemini_api_key
 *    OR
 *    OPENAI_API_KEY=your_openai_api_key
 *    OR
 *    MISTRAL_API_KEY=your_mistral_api_key
 * 
 * Usage:
 *   # Generate 1 chunk (automatically starts at next pending chunk in manifest)
 *   node tools/word-guides/generate-chunks.mjs --language fr
 * 
 *   # Generate 5 chunks for Hindi
 *   node tools/word-guides/generate-chunks.mjs --language hi --chunks 5
 * 
 *   # Generate 3 chunks for German starting at chunk index 4
 *   node tools/word-guides/generate-chunks.mjs --language de --chunks 3 --start 4
 * 
 *   # Explicitly choose AI provider
 *   node tools/word-guides/generate-chunks.mjs --language fr --provider mistral --chunks 2
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env files manually to avoid external dependencies
function loadEnv(envPath) {
  console.log(`Loading .env file from: ${envPath}`)
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      let val = match[2].trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      process.env[key] = val
    }
  }
}

// Try loading env files
loadEnv(path.join(__dirname, '..', '..', '.env'))
loadEnv(path.join(__dirname, '..', '..', 'packages', 'ai', '.env'))
loadEnv(path.join(__dirname, '..', '..', 'packages', 'ai', '.env.local'))

// Parse Command Line Arguments
const args = process.argv.slice(2)

// SSL/TLS Bypassing for corporate proxies
const isInsecure = args.includes('--insecure') || args.includes('--skip-ssl')
if (isInsecure || process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const getArgVal = (flag) => {
  const index = args.indexOf(flag)
  return index !== -1 ? args[index + 1] : null
}

const language = getArgVal('--language')
const chunksToGenerate = parseInt(getArgVal('--chunks') || '1', 10)
const startChunkOverride = getArgVal('--start') ? parseInt(getArgVal('--start'), 10) : null
const providerOverride = getArgVal('--provider')
const throttleDelay = parseInt(getArgVal('--delay') || '1500', 10)

if (!language) {
  console.error("Error: --language flag is required (e.g. --language fr, --language hi, --language de)")
  process.exit(1)
}

// Validate directories
const baseDir = language !== 'de' ? path.join(__dirname, language) : __dirname
const chunksDir = path.join(baseDir, 'chunks')
const manifestPath = path.join(baseDir, 'manifest.json')
const wordListPath = path.join(baseDir, 'word-list.json')

if (!fs.existsSync(manifestPath) || !fs.existsSync(wordListPath)) {
  console.error(`Error: Manifest or word list not found in target directory: ${baseDir}`)
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const wordList = JSON.parse(fs.readFileSync(wordListPath, 'utf8'))

// Determine AI Provider & API Key
let provider = providerOverride
let apiKey = null

if (!provider) {
  if (process.env.GEMINI_API_KEY) {
    provider = 'gemini'
    apiKey = process.env.GEMINI_API_KEY
  } else if (process.env.OPENAI_API_KEY) {
    provider = 'openai'
    apiKey = process.env.OPENAI_API_KEY
  } else if (process.env.MISTRAL_API_KEY) {
    provider = 'mistral'
    apiKey = process.env.MISTRAL_API_KEY
  }
} else {
  if (provider === 'gemini') {
    apiKey = process.env.GEMINI_API_KEY
  } else if (provider === 'openai') {
    apiKey = process.env.OPENAI_API_KEY
  } else if (provider === 'mistral') {
    apiKey = process.env.MISTRAL_API_KEY
  }
}

if (!provider || !apiKey) {
  console.error("Error: AI Provider credentials not found. Please set GEMINI_API_KEY, OPENAI_API_KEY, or MISTRAL_API_KEY in your env.")
  process.exit(1)
}

console.log(`Starting generator using provider '${provider}' for language '${language}'...`)

// Collect already generated words to prevent duplicate companion entries
const generatedWordsPath = path.join(baseDir, 'generated-words.json')
const generatedWordsSet = new Set()

if (fs.existsSync(generatedWordsPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(generatedWordsPath, 'utf8'))
    if (data && Array.isArray(data.words)) {
      for (const w of data.words) {
        generatedWordsSet.add(w.word.toLowerCase())
      }
    }
  } catch (e) {
    console.warn(`Warning: Could not parse generated-words.json: ${e.message}`)
  }
}

// Call AI API to generate a single dictionary entry
async function generateEntry(word, lang, apiProvider, key, isCompanion = false) {
  const languageNames = {
    de: 'German',
    hi: 'Hindi',
    fr: 'French'
  }
  const langName = languageNames[lang] || lang

  const prompt = `You are an expert lexicographer and language teacher. Your task is to generate a comprehensive dictionary entry for the target word in ${langName}.

Word: "${word}"
Is Companion: ${isCompanion ? "Yes (this is the dictionary infinitive/lemma form added because a conjugated form was used)" : "No"}

Generate a JSON object matching this schema:
{
  "headword": "${word}",
  "partOfSpeech": "noun | verb | pronoun | adjective | adverb | preposition | conjunction | postposition | particle | determiner",
  "gender": "masculine | feminine (only specify if partOfSpeech is noun and the language has grammatical gender like French, German, Hindi)",
  "translation": "English translation of the word",
  "intro": "A concise paragraph explaining the word, its meaning, and its role. Cross-reference sibling inflections, synonyms, or polar opposites if they are common words.",
  "usage": "Grammar, conjugation pattern, or usage notes (e.g. conjugation class, principal forms, particle triggers).",
  "synonyms": [
    { "word": "synonym in ${langName}", "gloss": "English translation/gloss of this synonym" }
  ],
  "examples": [
    { "sentence": "Example sentence in ${langName}", "translation": "English translation", "type": "indicative | konjunktivII | passive" }
  ],
  "infinitiveOfInflectedVerb": "If this word is an inflected/conjugated form of a verb, what is its infinitive/lemma form? (e.g. if the word is 'suis' or 'est' return 'être'. If the word is not an inflected verb, return null)"
}

Strict requirements:
1. The examples array MUST contain exactly 4 examples:
   - Two (2) of type "indicative" (standard statement in active voice/standard tenses).
   - One (1) of type "konjunktivII" (hypothetical, subjunctive, conditional, or polite suggestion depending on what fits the language best: in French conditionnel, in German Konjunktiv II, in Hindi conditional संभाव्य/संकेतवाचक).
   - One (1) of type "passive" (passive voice construction or passive equivalent).
2. All nouns must have their gender correctly specified.
3. The response must be a single valid JSON object. Do not wrap it in markdown code blocks.`

  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      let resultText = ''
      if (apiProvider === 'gemini') {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
              }
            })
          }
        )
        if (!response.ok) {
          const err = new Error(`API error: ${response.status} ${response.statusText}`)
          err.status = response.status
          const retryAfter = response.headers.get('retry-after')
          if (retryAfter) err.retryAfter = parseInt(retryAfter, 10)
          throw err
        }
        const data = await response.json()
        resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      } else if (apiProvider === 'mistral') {
        const response = await fetch(
          'https://api.mistral.ai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
              model: 'mistral-small-latest',
              messages: [{ role: 'user', content: prompt }],
              response_format: { type: 'json_object' }
            })
          }
        )
        if (!response.ok) {
          const err = new Error(`API error: ${response.status} ${response.statusText}`)
          err.status = response.status
          const retryAfter = response.headers.get('retry-after')
          if (retryAfter) err.retryAfter = parseInt(retryAfter, 10)
          throw err
        }
        const data = await response.json()
        resultText = data.choices?.[0]?.message?.content || ''
      } else {
        const response = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: prompt }],
              response_format: { type: 'json_object' }
            })
          }
        )
        if (!response.ok) {
          const err = new Error(`API error: ${response.status} ${response.statusText}`)
          err.status = response.status
          const retryAfter = response.headers.get('retry-after')
          if (retryAfter) err.retryAfter = parseInt(retryAfter, 10)
          throw err
        }
        const data = await response.json()
        resultText = data.choices?.[0]?.message?.content || ''
      }

      if (resultText.includes('```')) {
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim()
      }

      const parsed = JSON.parse(resultText)
      if (!parsed.headword || !parsed.partOfSpeech || !parsed.translation || !parsed.intro || !Array.isArray(parsed.examples)) {
        throw new Error('Missing required JSON schema fields')
      }
      if (parsed.examples.length !== 4) {
        throw new Error(`Expected exactly 4 examples, got ${parsed.examples.length}`)
      }
      return parsed
    } catch (e) {
      const isRateLimit = e.status === 429 || (e.message && e.message.includes('429'))
      let backoffMs = 1000 * attempt
      
      if (isRateLimit) {
        const customRetry = e.retryAfter ? e.retryAfter * 1000 : null
        backoffMs = customRetry || (Math.pow(2, attempt) * 5000)
        console.warn(`[429 Too Many Requests] Rate limit hit on word "${word}". Waiting ${backoffMs / 1000}s before retrying (Attempt ${attempt}/6)...`)
      } else {
        console.warn(`Attempt ${attempt} failed for word "${word}":`, e)
      }
      
      if (attempt === 6) throw e
      await new Promise((r) => setTimeout(r, backoffMs))
    }
  }
}

// Generate Chunks sequentially
async function run() {
  let chunksGenerated = 0
  let currentChunkIndex = startChunkOverride

  if (currentChunkIndex === null) {
    // Find first pending chunk
    const pendingChunk = manifest.chunks.find((c) => c.status === 'pending')
    if (!pendingChunk) {
      console.log("All chunks are already marked as done in manifest.json!")
      return
    }
    currentChunkIndex = pendingChunk.index
  }

  while (chunksGenerated < chunksToGenerate) {
    const chunkEntry = manifest.chunks.find((c) => c.index === currentChunkIndex)
    if (!chunkEntry) {
      console.log(`Chunk index ${currentChunkIndex} not defined in manifest.`)
      break
    }

    console.log(`\n===========================================`)
    console.log(`GENERATING CHUNK ${currentChunkIndex} (${chunkEntry.rankStart} to ${chunkEntry.rankEnd})`)
    console.log(`===========================================`)

    const primaryWords = wordList.filter(
      (w) => w.rank >= chunkEntry.rankStart && w.rank <= chunkEntry.rankEnd
    )

    const chunkEntries = []
    const companionQueue = []
    const currentChunkWords = new Set()

    for (const pw of primaryWords) {
      currentChunkWords.add(pw.word.toLowerCase())
    }

    for (let i = 0; i < primaryWords.length; i++) {
      const pw = primaryWords[i]
      console.log(`[${i + 1}/${primaryWords.length}] Generating primary entry: "${pw.word}" (Rank ${pw.rank})...`)
      
      try {
        const entryData = await generateEntry(pw.word, language, provider, apiKey, false)
        const companionInfinitive = entryData.infinitiveOfInflectedVerb
        delete entryData.infinitiveOfInflectedVerb

        chunkEntries.push(entryData)
        generatedWordsSet.add(pw.word.toLowerCase())

        if (
          companionInfinitive &&
          typeof companionInfinitive === 'string' &&
          companionInfinitive.toLowerCase() !== pw.word.toLowerCase()
        ) {
          const companionLower = companionInfinitive.toLowerCase()
          if (
            !generatedWordsSet.has(companionLower) &&
            !currentChunkWords.has(companionLower) &&
            !companionQueue.includes(companionInfinitive)
          ) {
            console.log(`  -> Queued companion infinitive: "${companionInfinitive}" (derived from "${pw.word}")`)
            companionQueue.push(companionInfinitive)
          }
        }
        if (throttleDelay > 0 && i < primaryWords.length - 1) {
          await new Promise((r) => setTimeout(r, throttleDelay))
        }
      } catch (e) {
        console.error(`Fatal: Failed to generate word "${pw.word}" after all retries: ${e.message}`)
        process.exit(1)
      }
    }

    // Process companion queue
    for (let i = 0; i < companionQueue.length; i++) {
      const companionWord = companionQueue[i]
      console.log(`[Companion ${i + 1}/${companionQueue.length}] Generating companion entry: "${companionWord}"...`)
      try {
        const companionData = await generateEntry(companionWord, language, provider, apiKey, true)
        delete companionData.infinitiveOfInflectedVerb
        chunkEntries.push(companionData)
        generatedWordsSet.add(companionWord.toLowerCase())
        if (throttleDelay > 0 && i < companionQueue.length - 1) {
          await new Promise((r) => setTimeout(r, throttleDelay))
        }
      } catch (e) {
        console.error(`Fatal: Failed to generate companion "${companionWord}": ${e.message}`)
        process.exit(1)
      }
    }

    // Write chunk file
    const paddedIndex = String(currentChunkIndex).padStart(4, '0')
    const chunkFilename = `chunk-${paddedIndex}.json`
    const chunkOutPath = path.join(chunksDir, chunkFilename)

    const chunkOutput = {
      chunkIndex: currentChunkIndex,
      language: language,
      explanationLanguage: "en",
      generatedBy: `${provider}-ai-pipeline (automated script)`,
      generatedAt: new Date().toISOString().slice(0, 10),
      note: `Automated word guide chunk ${currentChunkIndex} for ${language}. Contains ${primaryWords.length} primary entries and ${companionQueue.length} companion entries.`,
      entries: chunkEntries
    }

    fs.mkdirSync(chunksDir, { recursive: true })
    fs.writeFileSync(chunkOutPath, JSON.stringify(chunkOutput, null, 2) + '\n')
    console.log(`Wrote ${chunkOutPath}`)

    // Update manifest
    chunkEntry.status = 'done'
    chunkEntry.generatedAt = Date.now()
    chunkEntry.wordCount = primaryWords.length

    // Append primary words to manifest doneWords
    if (!Array.isArray(manifest.doneWords)) {
      manifest.doneWords = []
    }
    for (const pw of primaryWords) {
      if (!manifest.doneWords.includes(pw.word)) {
        manifest.doneWords.push(pw.word)
      }
    }

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
    console.log(`Updated manifest.json`)

    // Regenerate generated-words.json using the helper script
    try {
      execSync(`node tools/word-guides/list-generated-words.mjs --language ${language}`, { stdio: 'inherit' })
    } catch (e) {
      console.warn(`Warning: Could not regenerate generated-words.json automatically: ${e.message}`)
    }

    chunksGenerated++
    currentChunkIndex++
  }

  console.log(`\nSuccessfully generated ${chunksGenerated} chunk(s) for '${language}'!`)
}

run().catch((e) => {
  console.error("Generator execution failed:", e)
})
