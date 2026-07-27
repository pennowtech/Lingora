import type { DatabaseAdapter } from './adapter'
import { getExportableCards, mergeCardsByWord, type ExportableCard } from './export-shared'

/**
 * CSV export — the mirror of `csv-import.ts`. Same column names as
 * `CsvField`, so a file exported here re-imports through `buildCsvImportPreview`
 * with zero manual column remapping. One row per *word*, using its primary
 * meaning/selected example (a card with several meanings/examples is
 * exported with just the one — see `packages/database/src/export-shared.ts`
 * for why this is lossy relative to the JSON `.lin` backup, which is the
 * only full-fidelity format); a word with both a basic and a cloze card is
 * merged into one row via `mergeCardsByWord`, not exported twice.
 *
 * `word`/`meaning` are always present; every other column is included only
 * if at least one exported card actually has a value for it — an unused
 * column (e.g. no card has synonyms) doesn't clutter the file. Part of
 * speech/CEFR level are never included at all: `csv-import.ts#CsvField`
 * dropped them as mappable columns (every import gets the same fallback),
 * so they wouldn't round-trip onto anything meaningful anyway.
 */

interface OptionalColumn {
  header: string
  value: (card: ExportableCard) => string
}

const OPTIONAL_COLUMNS: OptionalColumn[] = [
  { header: 'cloze', value: (c) => c.cloze ?? '' },
  { header: 'example', value: (c) => c.example ?? '' },
  { header: 'exampleTranslation', value: (c) => c.exampleTranslation ?? '' },
  { header: 'synonyms', value: (c) => c.synonyms.join('; ') },
  { header: 'tags', value: (c) => c.tags.join('; ') },
]

/** RFC4180 field escaping — wraps in quotes (doubling embedded quotes) only when needed. */
function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function csvRow(values: string[]): string {
  return values.map(csvField).join(',')
}

/**
 * Builds CSV text for every card, optionally narrowed to one deck. `\r\n`
 * line endings match the CSV spec and what most spreadsheet tools expect.
 */
export async function buildCsvExport(db: DatabaseAdapter, options: { deckId?: string } = {}): Promise<string> {
  const cards = mergeCardsByWord(await getExportableCards(db, options))
  const activeColumns = OPTIONAL_COLUMNS.filter((column) => cards.some((card) => column.value(card).length > 0))

  const lines = [csvRow(['word', 'meaning', ...activeColumns.map((c) => c.header)])]
  for (const card of cards) {
    lines.push(csvRow([card.word, card.meaning, ...activeColumns.map((column) => column.value(card))]))
  }

  return lines.join('\r\n') + '\r\n'
}
