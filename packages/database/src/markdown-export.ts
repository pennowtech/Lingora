import type { DatabaseAdapter } from './adapter'
import { getExportableCards } from './export-shared'

/**
 * Markdown/plain-text export — a "read it in Notes/a doc" convenience, not
 * a round-trip format (no importer reads this back). One `###` block per
 * card: word heading, meaning, and the example (cloze cards show the
 * blanked sentence, matching what a reader studying from the file would
 * want to see, not the raw `{{c1::...}}` markup).
 */
export async function buildMarkdownExport(
  db: DatabaseAdapter,
  options: { deckId?: string; title?: string } = {},
): Promise<string> {
  const cards = await getExportableCards(db, options)
  const lines: string[] = [`# ${options.title ?? 'Lingora vocabulary'}`, '']

  for (const card of cards) {
    lines.push(`### ${card.word}`, '', `**Meaning:** ${card.meaning}`)
    if (card.example) lines.push('', `*${card.example}*`)
    if (card.exampleTranslation) lines.push('', card.exampleTranslation)
    if (card.synonyms.length > 0) lines.push('', `**Synonyms:** ${card.synonyms.join(', ')}`)
    if (card.tags.length > 0) lines.push('', `**Tags:** ${card.tags.join(', ')}`)
    lines.push('')
  }

  return lines.join('\n')
}
