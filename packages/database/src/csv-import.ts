import type { CefrLevel, LanguageCode, PartOfSpeech } from '@lingora/types'
import { logger } from '@lingora/observability'
import { guessPartOfSpeechFromCasing } from '@lingora/core'
import type { DatabaseAdapter } from './adapter'
import { importRow, parseListField, resolveWordAndMeaning, type DuplicatePolicy } from './import-shared'
import { getLemmaByForm } from './repositories/lemmas'

export type { DuplicatePolicy } from './import-shared'

const importLog = logger.child({ feature: 'import', component: 'csv-import' })

/**
 * CSV import with interactive column mapping — the Quizlet/Memrise/spreadsheet
 * on-ramp. Two phases, deliberately split so the UI can show a preview before
 * anything touches the database:
 *
 * 1. `parseCsv` — a small RFC4180 tokenizer (quoted fields, embedded
 *    delimiters/newlines, "" escaping) with delimiter auto-detection, so a
 *    comma-, semicolon-, or tab-separated export all just work.
 * 2. `buildCsvImportPreview` — maps user-chosen columns onto each row,
 *    validates required fields, and flags duplicates against the existing
 *    lemma table, without writing anything.
 * 3. `importCsvRows` — imports only the rows the preview marked 'ok', all in
 *    one transaction; a single malformed row is caught and counted as
 *    failed rather than aborting or corrupting the rest of the import.
 *
 * Every imported word becomes a minimal lemma + card + one 'General' cluster
 * + one primary meaning (+ optional example, deck membership, tags) — the
 * same row shapes persistWordGeneration writes, just without AI generation.
 */

export const CEFR_LEVELS: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
export const PARTS_OF_SPEECH: readonly PartOfSpeech[] = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'pronoun',
  'article',
  'phrase',
]

export function isCefrLevel(value: string): value is CefrLevel {
  return (CEFR_LEVELS as readonly string[]).includes(value.trim().toUpperCase())
}

export function isPartOfSpeech(value: string): value is PartOfSpeech {
  return (PARTS_OF_SPEECH as readonly string[]).includes(value.trim().toLowerCase())
}

// ─── CSV parsing ────────────────────────────────────────────────────────────

export interface CsvParseResult {
  headers: string[]
  rows: string[][]
  /** The delimiter auto-detected from the header line. */
  delimiter: string
}

const CANDIDATE_DELIMITERS = [',', ';', '\t'] as const

/** Picks whichever candidate delimiter appears most often in the header line. */
function detectDelimiter(headerLine: string): string {
  let best: string = ','
  let bestCount = -1
  for (const candidate of CANDIDATE_DELIMITERS) {
    const count = headerLine.split(candidate).length - 1
    if (count > bestCount) {
      best = candidate
      bestCount = count
    }
  }
  return best
}

/**
 * RFC4180-ish CSV tokenizer: quoted fields may contain the delimiter,
 * newlines, and `""` as an escaped quote. Strips a leading UTF-8 BOM and
 * normalizes CRLF/CR line endings before parsing.
 */
export function parseCsv(raw: string): CsvParseResult {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const firstLineEnd = text.indexOf('\n')
  const headerLine = firstLineEnd === -1 ? text : text.slice(0, firstLineEnd)
  const delimiter = detectDelimiter(headerLine)

  const table: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0

  const pushField = (): void => {
    row.push(field)
    field = ''
  }
  const pushRow = (): void => {
    pushField()
    table.push(row)
    row = []
  }

  while (i < text.length) {
    const char = text[i]!
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      field += char
      i += 1
      continue
    }
    if (char === '"') {
      inQuotes = true
      i += 1
      continue
    }
    if (char === delimiter) {
      pushField()
      i += 1
      continue
    }
    if (char === '\n') {
      pushRow()
      i += 1
      continue
    }
    field += char
    i += 1
  }
  // Last field/row, unless the file ended cleanly on a newline.
  if (field.length > 0 || row.length > 0) pushRow()

  const nonEmpty = table.filter((r) => !(r.length === 1 && r[0] === ''))
  const [headers, ...rows] = nonEmpty
  return { headers: headers ?? [], rows, delimiter }
}

// ─── Column mapping ─────────────────────────────────────────────────────────

/**
 * The card fields a CSV column can be mapped onto. Every field is optional
 * (see resolveWordAndMeaning's cloze-derived fallback). Part of speech,
 * CEFR level, and tags are deliberately not mappable — every imported row
 * gets the same fallback part of speech/CEFR level (below) and no tags;
 * mapping a column to something the user would set the same way for every
 * row anyway wasn't worth the extra mapping step.
 */
export type CsvField = 'word' | 'meaning' | 'cloze' | 'example' | 'exampleTranslation' | 'synonyms'

export type CsvColumnMapping = Partial<Record<CsvField, number>>

/** Every imported row's CEFR level — no per-row mapping for it, just a sane fallback (see
 * CsvField's doc comment). Part of speech has no per-row mapping either, but isn't a single fixed
 * fallback the way CEFR is — see guessPartOfSpeechFromCasing's call site below, which uses each
 * row's own word and casing instead of hardcoding every row to 'noun' regardless of content. */
const FALLBACK_CEFR_LEVEL: CefrLevel = 'A1'

export interface CsvImportOptions {
  mapping: CsvColumnMapping
  language: LanguageCode
  /** 'basic' by default — must match whatever's passed to `importCsvRows`, so the preview flags
   * exactly the rows that would actually fail (e.g. no cloze markup found) instead of a mismatched
   * guess. See `importRow` in import-shared.ts. */
  cardType?: 'basic' | 'cloze'
}

export interface CsvRowPreview {
  rowIndex: number
  word: string
  meaning: string
  /** True when word/meaning are genuine mapped content, not the cloze-derived fallback — see ImportableRow. */
  hasOwnVocab: boolean
  /** Cloze-sentence field (`{{c1::word}}` markup), mapped separately from `example` — see ImportableRow. */
  cloze: string | null
  example: string | null
  exampleTranslation: string | null
  synonyms: string[]
  partOfSpeech: PartOfSpeech
  cefrLevel: CefrLevel
  tags: string[]
  status: 'ok' | 'duplicate' | 'error'
  /** The existing lemma this row's word already matches, if `status === 'duplicate'`. */
  existingLemmaId: string | null
  errors: string[]
}

function cell(row: string[], index: number | undefined): string {
  if (index === undefined) return ''
  return (row[index] ?? '').trim()
}

/**
 * Maps the chosen columns onto every parsed row, validates required fields,
 * and flags rows whose word already exists as a lemma — without writing
 * anything. The UI renders this before the user confirms the import.
 */
export async function buildCsvImportPreview(
  db: DatabaseAdapter,
  rows: string[][],
  options: CsvImportOptions,
): Promise<CsvRowPreview[]> {
  const { mapping, cardType = 'basic' } = options
  const previews: CsvRowPreview[] = []

  for (const [rowIndex, row] of rows.entries()) {
    const clozeRaw = cell(row, mapping.cloze)
    const cloze = clozeRaw.length > 0 ? clozeRaw : null

    const exampleRaw = cell(row, mapping.example)
    const example = exampleRaw.length > 0 ? exampleRaw : null

    const exampleTranslationRaw = cell(row, mapping.exampleTranslation)
    const exampleTranslation = exampleTranslationRaw.length > 0 ? exampleTranslationRaw : null

    const wordRaw = cell(row, mapping.word)
    const meaningRaw = cell(row, mapping.meaning)
    const hasOwnVocab = wordRaw.length > 0 && meaningRaw.length > 0

    const { word, meaning, errors } = resolveWordAndMeaning({
      word: wordRaw,
      meaning: meaningRaw,
      cloze,
      example,
      exampleTranslation,
      cardType,
    })

    const guessedPartOfSpeech = guessPartOfSpeechFromCasing(word, options.language)
    const partOfSpeech = guessedPartOfSpeech === 'unknown' ? 'noun' : guessedPartOfSpeech
    const cefrLevel = FALLBACK_CEFR_LEVEL
    const tags: string[] = []

    const synonymsRaw = cell(row, mapping.synonyms)
    const synonyms = parseListField(synonymsRaw)

    let status: CsvRowPreview['status'] = errors.length > 0 ? 'error' : 'ok'
    let existingLemmaId: string | null = null
    if (status === 'ok' && word) {
      const existing = await getLemmaByForm(db, word, options.language)
      if (existing) {
        status = 'duplicate'
        existingLemmaId = existing.id
        errors.push(`"${word}" already exists in your library.`)
      }
    }

    previews.push({
      rowIndex,
      word,
      meaning,
      hasOwnVocab,
      cloze,
      example,
      exampleTranslation,
      synonyms,
      partOfSpeech,
      cefrLevel,
      tags,
      status,
      existingLemmaId,
      errors,
    })
  }

  return previews
}

// ─── Import ─────────────────────────────────────────────────────────────────

export interface CsvImportResult {
  imported: number
  skipped: number
  failed: number
}

/**
 * Imports every 'ok' row from a preview, all in one transaction. 'error'
 * rows count as failed and are never attempted. 'duplicate' rows follow
 * `duplicatePolicy`: 'skip' (default, counts as skipped, matches the old
 * behavior), 'merge' (adds this row's content onto the existing lemma's
 * card), or 'duplicate' (a new card under the existing lemma — see
 * `DuplicatePolicy` in import-shared.ts for why not a second lemma). The
 * caller is expected to have already filtered `previews` down to whichever
 * rows the user checked/wants imported.
 *
 * Each imported row becomes exactly ONE card: lemma + its own surface-form
 * inflection, a card with initial FSRS state in the target deck, one
 * 'General' cluster holding one meaning (+ a selected example, if the row
 * had one, + any mapped synonyms), and any mapped tags. `cardType` ('basic'
 * by default) picks basic vs. cloze for a row that maps both real vocab
 * content and a Cloze sentence column — see `importRow` in import-shared.ts
 * for exactly how it applies (a row with no cloze markup at all is
 * unaffected either way). To get both card types for the same rich source,
 * import the file twice with `cardType: 'cloze'` on the second pass and
 * `duplicatePolicy: 'duplicate'` (or 'merge').
 */
export async function importCsvRows(
  db: DatabaseAdapter,
  previews: CsvRowPreview[],
  deckId: string,
  language: LanguageCode,
  nativeLanguage: LanguageCode,
  duplicatePolicy: DuplicatePolicy = 'skip',
  cardType: 'basic' | 'cloze' = 'basic',
): Promise<CsvImportResult> {
  const startedAt = Date.now()
  importLog.info('import.csv_import_started', {
    message: 'CSV import started',
    metadata: { itemCount: previews.length },
  })

  let imported = 0
  let skipped = 0
  let failed = 0

  await db.transaction(async (tx) => {
    for (const preview of previews) {
      if (preview.status === 'duplicate' && duplicatePolicy === 'skip') {
        skipped += 1
        continue
      }
      if (preview.status === 'error') {
        failed += 1
        continue
      }

      try {
        await importRow(
          tx,
          preview,
          deckId,
          language,
          nativeLanguage,
          preview.status === 'duplicate' ? preview.existingLemmaId : null,
          duplicatePolicy,
          'Imported from CSV',
          cardType,
        )
        imported += 1
      } catch (error) {
        failed += 1
        importLog.error('import.csv_row_failed', error, {
          message: 'CSV row failed to import and was skipped',
          metadata: { itemCount: preview.rowIndex },
        })
      }
    }
  })

  importLog.info('import.csv_import_completed', {
    message: 'CSV import completed',
    result: 'success',
    durationMs: Date.now() - startedAt,
    metadata: { itemCount: imported },
  })

  return { imported, skipped, failed }
}
