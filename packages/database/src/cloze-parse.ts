/**
 * Anki-style cloze markup detection/parsing — `{{c1::word}}`,
 * `{{c1::word::hint}}` (the real Anki syntax, and what a genuine Anki
 * "Cloze"/"ClozeAdjective" note type's Text field contains), loosely also
 * accepting a single-colon variant like `{{x1:word}}`. Used by the CSV/
 * apkg importers to auto-route a sentence into a cloze practice card
 * instead of a plain example sentence.
 *
 * Deliberately simpler than Anki's own per-cloze-number card splitting
 * (where `{{c1::a}}...{{c2::b}}` in one field becomes two separate cards,
 * each blanking only its own number): every `{{cN::...}}` token in the
 * sentence is blanked together on one card, regardless of N — one card,
 * as many blanks as the sentence has cloze tokens.
 */

const CLOZE_TOKEN = /\{\{\s*[a-zA-Z]?\d*\s*:{1,2}\s*([^:{}]+?)(?:::[^}]*)?\s*\}\}/g

/** The visual placeholder a blanked cloze token is replaced with on the front. */
export const CLOZE_BLANK = '[...]'

export function hasClozeMarkup(text: string): boolean {
  return new RegExp(CLOZE_TOKEN.source).test(text)
}

export interface ParsedCloze {
  /** The sentence with every cloze token replaced by `CLOZE_BLANK`. */
  blanked: string
  /** The answers, in the order their cloze tokens appeared in the sentence. */
  answers: string[]
}

/** Returns null if `text` has no cloze markup at all. */
export function parseClozeMarkup(text: string): ParsedCloze | null {
  const answers: string[] = []
  const re = new RegExp(CLOZE_TOKEN.source, 'g')
  const blanked = text.replace(re, (_full, answer: string) => {
    answers.push(answer.trim())
    return CLOZE_BLANK
  })
  if (answers.length === 0) return null
  return { blanked, answers }
}
