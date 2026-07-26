import type { CefrLevel, LanguageCode, PartOfSpeech } from '@lingora/types'
import { logger } from '@lingora/observability'
import type { DatabaseAdapter } from './adapter'
import { addTagToCard, getOrCreateTag } from './repositories/tags'
import { createCluster, createMeaning } from './repositories/clusters'
import { createExample } from './repositories/examples'
import { createInflections, createLemma, getLemmaByForm } from './repositories/lemmas'

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

/** The card fields a CSV column can be mapped onto. word and meaning are required. */
export type CsvField = 'word' | 'meaning' | 'example' | 'partOfSpeech' | 'cefrLevel' | 'tags'

export type CsvColumnMapping = Partial<Record<CsvField, number>>

export interface CsvImportOptions {
  mapping: CsvColumnMapping
  language: LanguageCode
  /** Used when the row has no mapped/valid part-of-speech column. */
  defaultPartOfSpeech: PartOfSpeech
  /** Used when the row has no mapped/valid CEFR column. */
  defaultCefrLevel: CefrLevel
}

export interface CsvRowPreview {
  rowIndex: number
  word: string
  meaning: string
  example: string | null
  partOfSpeech: PartOfSpeech
  cefrLevel: CefrLevel
  tags: string[]
  status: 'ok' | 'duplicate' | 'error'
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
  const { mapping } = options
  const previews: CsvRowPreview[] = []

  for (const [rowIndex, row] of rows.entries()) {
    const errors: string[] = []
    const word = cell(row, mapping.word)
    const meaning = cell(row, mapping.meaning)
    if (!word) errors.push('Word is empty.')
    if (!meaning) errors.push('Meaning is empty.')

    const exampleRaw = cell(row, mapping.example)
    const example = exampleRaw.length > 0 ? exampleRaw : null

    const posRaw = cell(row, mapping.partOfSpeech)
    const partOfSpeech = isPartOfSpeech(posRaw) ? (posRaw.toLowerCase() as PartOfSpeech) : options.defaultPartOfSpeech

    const cefrRaw = cell(row, mapping.cefrLevel)
    const cefrLevel = isCefrLevel(cefrRaw) ? (cefrRaw.toUpperCase() as CefrLevel) : options.defaultCefrLevel

    const tagsRaw = cell(row, mapping.tags)
    const tags = tagsRaw
      .split(/[,;|]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    let status: CsvRowPreview['status'] = errors.length > 0 ? 'error' : 'ok'
    if (status === 'ok' && word) {
      const existing = await getLemmaByForm(db, word, options.language)
      if (existing) {
        status = 'duplicate'
        errors.push(`"${word}" already exists in your library.`)
      }
    }

    previews.push({ rowIndex, word, meaning, example, partOfSpeech, cefrLevel, tags, status, errors })
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
 * Imports every 'ok' row from a preview, all in one transaction. 'duplicate'
 * rows count as skipped, 'error' rows count as failed — neither is attempted,
 * so a malformed row never partially writes or aborts the rows around it.
 *
 * Each imported row becomes: lemma + its own surface-form inflection, a card
 * with initial FSRS state in the target deck, one 'General' cluster holding
 * one primary meaning (+ a selected example, if the row had one), and any
 * mapped tags.
 */
export async function importCsvRows(
  db: DatabaseAdapter,
  previews: CsvRowPreview[],
  deckId: string,
  language: LanguageCode,
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
      if (preview.status === 'duplicate') {
        skipped += 1
        continue
      }
      if (preview.status === 'error') {
        failed += 1
        continue
      }

      try {
        const now = Date.now()
        const lemmaId = crypto.randomUUID()
        await createLemma(tx, {
          id: lemmaId,
          form: preview.word,
          language,
          partOfSpeech: preview.partOfSpeech,
          createdAt: now,
          updatedAt: now,
        })
        await createInflections(tx, lemmaId, [preview.word])

        const cardId = crypto.randomUUID()
        await tx.execute(
          `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at)
           VALUES (?, ?, ?, 'basic', NULL, ?, ?, NULL)`,
          [cardId, lemmaId, deckId, now, now],
        )
        await tx.execute(
          `INSERT INTO card_states
           (card_id, state, stability, difficulty, retrievability, lapses, last_reviewed_at, next_review_date)
           VALUES (?, 'new', 0, 0, 0, 0, NULL, ?)`,
          [cardId, now],
        )
        await tx.execute(`INSERT INTO deck_cards (id, deck_id, card_id, added_at) VALUES (?, ?, ?, ?)`, [
          crypto.randomUUID(),
          deckId,
          cardId,
          now,
        ])

        const clusterId = crypto.randomUUID()
        await createCluster(tx, {
          id: clusterId,
          lemmaId,
          label: 'General',
          description: 'Imported from CSV',
          cefrLevel: preview.cefrLevel,
          orderIndex: 0,
        })

        const meaningId = crypto.randomUUID()
        await createMeaning(tx, {
          id: meaningId,
          cardId,
          clusterId,
          translation: preview.meaning,
          explanation: '',
          cefrLevel: preview.cefrLevel,
          isPrimary: true,
          orderIndex: 0,
        })
        await tx.execute(`UPDATE cards SET primary_meaning_id = ?, updated_at = ? WHERE id = ?`, [
          meaningId,
          now,
          cardId,
        ])

        if (preview.example) {
          await createExample(tx, {
            id: crypto.randomUUID(),
            cardId,
            clusterId,
            sentence: preview.example,
            translation: preview.meaning,
            context: 'casual',
            cefrLevel: preview.cefrLevel,
            isSelected: true,
          })
        }

        for (const tagName of preview.tags) {
          const tag = await getOrCreateTag(tx, tagName)
          await addTagToCard(tx, cardId, tag.id)
        }

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
