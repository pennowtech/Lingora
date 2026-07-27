import type { DatabaseAdapter } from './adapter'
import { revealClozeMarkup } from './cloze-parse'
import { getExportableCards, mergeCardsByWord } from './export-shared'

/**
 * Markdown/plain-text export — a "read it in Notes/a doc" convenience, not
 * a round-trip format (no importer reads this back). One `###` block per
 * *word* (`mergeCardsByWord` — a word with both a basic and cloze card
 * gets one block, not two): heading, meaning, and the sentence — a cloze
 * card's `cloze` field is shown fully revealed (`revealClozeMarkup` strips
 * the raw `{{c1::...}}` syntax down to plain text), since a reader
 * studying from the file wants the readable sentence, not Anki markup.
 */
export async function buildMarkdownExport(
  db: DatabaseAdapter,
  options: { deckId?: string; title?: string } = {},
): Promise<string> {
  const cards = mergeCardsByWord(await getExportableCards(db, options))
  const lines: string[] = [`# ${options.title ?? 'Lingora vocabulary'}`, '']

  for (const card of cards) {
    lines.push(`### ${card.word}`, '', `**Meaning:** ${card.meaning}`)
    const sentence = card.cloze ? revealClozeMarkup(card.cloze) : card.example
    if (sentence) lines.push('', `*${sentence}*`)
    if (card.exampleTranslation) lines.push('', card.exampleTranslation)
    if (card.synonyms.length > 0) lines.push('', `**Synonyms:** ${card.synonyms.join(', ')}`)
    if (card.tags.length > 0) lines.push('', `**Tags:** ${card.tags.join(', ')}`)
    lines.push('')
  }

  return lines.join('\n')
}
