import type { DatabaseAdapter } from './adapter'
import { getExportableCards } from './export-shared'

/**
 * CSV export — the mirror of `csv-import.ts`. Same header names as
 * `CsvField`, so a file exported here re-imports through `buildCsvImportPreview`
 * with zero manual column remapping. One row per card, using its primary
 * meaning/selected example (a card with several meanings/examples is
 * exported with just the one — see `packages/database/src/export-shared.ts`
 * for why this is lossy relative to the JSON `.lin` backup, which is the
 * only full-fidelity format).
 */

const CSV_HEADER = ['word', 'meaning', 'example', 'exampleTranslation', 'synonyms', 'partOfSpeech', 'cefrLevel', 'tags']

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
  const cards = await getExportableCards(db, options)
  const lines = [csvRow(CSV_HEADER)]

  for (const card of cards) {
    lines.push(
      csvRow([
        card.word,
        card.meaning,
        card.example ?? '',
        card.exampleTranslation ?? '',
        card.synonyms.join('; '),
        card.partOfSpeech,
        card.cefrLevel,
        card.tags.join('; '),
      ]),
    )
  }

  return lines.join('\r\n') + '\r\n'
}
