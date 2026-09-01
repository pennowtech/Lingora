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

/**
 * The reverse of `parseClozeMarkup`: re-embeds `{{c1::answer}}` markup into
 * a blanked sentence, for export (CSV/Anki) — round-tripping a stored
 * `Cloze` row (`sentence` = blanked, `answer` = every answer joined with
 * "; ", see cloze-parse.test.ts) back into the same syntax a re-import (or
 * real Anki) understands. Every blank gets cloze number `c1` — this
 * importer never distinguished cloze numbers on the way in either (see the
 * module doc comment), so there's no original numbering to restore.
 */
export function buildClozeMarkup(blankedSentence: string, answerJoined: string): string {
  const answers = answerJoined
    // Semicolon is the canonical mobile/database separator. Desktop's token editor historically
    // stored multiple answers with " / ", so accept both when revealing/editing existing cards.
    .split(/\s*(?:;|\/)\s*/)
    .map((a) => a.trim())
    .filter((a) => a.length > 0)
  const parts = blankedSentence.split(CLOZE_BLANK)
  return parts.reduce((result, part, i) => {
    if (i === 0) return part
    const answer = answers[i - 1] ?? ''
    return `${result}{{c1::${answer}}}${part}`
  }, '')
}

/**
 * Strips `{{cN::answer}}`/`{{cN::answer::hint}}` markup down to just
 * `answer`, inline — a plain, fully "revealed" sentence for a human-facing
 * export (Markdown) where showing raw Anki cloze syntax would be
 * confusing. Not used for CSV/Anki export, which keep the real markup so a
 * re-import (or real Anki) round-trips correctly.
 */
export function revealClozeMarkup(text: string): string {
  return text.replace(new RegExp(CLOZE_TOKEN.source, 'g'), (_full, answer: string) => answer.trim())
}

/**
 * Wraps the substring `text[start:end]` in the next `{{cN::...}}` cloze marker — the building block
 * for a manual cloze editor (select a word/phrase, tap "Mark as cloze"). `N` auto-increments from
 * however many `{{cN::...}}` markers are already in `text`, matching Anki's own numbering.
 *
 * Deliberately manual rather than auto-detecting the target word in the sentence: an earlier
 * attempt at that (matching the lemma's own form or a known inflection as a literal substring)
 * fails for German separable verbs, where the prefix splits from the stem across the sentence in
 * normal word order ("Der Laden verkauft alles aus.") — there's no reliable way to find "the word"
 * automatically, so the user marks it instead.
 *
 * Returns `text` unchanged if `start >= end` (nothing selected).
 */
export function markSelectionAsCloze(text: string, start: number, end: number): string {
  if (start >= end) return text
  const existingCount = (text.match(/\{\{\s*c\d*\s*:{1,2}/gi) ?? []).length
  const nextNumber = existingCount + 1
  const selected = text.slice(start, end)
  return `${text.slice(0, start)}{{c${nextNumber}::${selected}}}${text.slice(end)}`
}

function isWordChar(char: string | undefined): boolean {
  return char !== undefined && /[\p{L}\p{N}]/u.test(char)
}

/**
 * Convenience default for the manual cloze editor: if `word` appears as a genuine whole-word,
 * case-insensitive match in `text` (checked with `\p{L}`/`\p{N}` rather than regex `\b`, since `\b`
 * only recognizes ASCII word characters and would misfire around a word starting/ending in a
 * German umlaut or ß), pre-mark that first occurrence so the editor opens already blanking the
 * word being carded, instead of an empty selection every time.
 *
 * Deliberately narrower than full auto-detection (see markSelectionAsCloze's doc comment for why
 * that was reverted): this only ever marks an exact literal substring match, never guesses at an
 * inflected form or a split separable-verb prefix ("Der Laden verkauft alles aus." for
 * "ausverkaufen") — returns null in every case it can't be sure about, so the caller falls back to
 * the plain unmarked sentence and the existing manual select-and-mark flow, exactly as before this
 * existed. Never silently marks the wrong thing.
 */
export function markWordAsCloze(text: string, word: string): string | null {
  const trimmedWord = word.trim()
  if (trimmedWord === '') return null
  const lowerText = text.toLowerCase()
  const lowerWord = trimmedWord.toLowerCase()

  let searchFrom = 0
  for (;;) {
    const index = lowerText.indexOf(lowerWord, searchFrom)
    if (index === -1) return null
    const before = index > 0 ? text[index - 1] : undefined
    const after = index + trimmedWord.length < text.length ? text[index + trimmedWord.length] : undefined
    if (!isWordChar(before) && !isWordChar(after)) {
      return markSelectionAsCloze(text, index, index + trimmedWord.length)
    }
    searchFrom = index + 1
  }
}

/**
 * The equivalent of `revealClozeMarkup`, but starting from an already-persisted `Cloze` row
 * (`sentence` = blanked with `CLOZE_BLANK`, `answer` = every answer joined with "; ", the same
 * shape `buildClozeMarkup` reads) instead of raw `{{cN::answer}}` markup — reconstructs the
 * complete, natural sentence a cloze card is testing, e.g. for text-to-speech.
 */
export function revealClozeSentence(blankedSentence: string, answerJoined: string): string {
  const answers = answerJoined
    // Semicolon is canonical; accept the desktop editor's historical " / " separator too.
    .split(/\s*(?:;|\/)\s*/)
    .map((a) => a.trim())
    .filter((a) => a.length > 0)
  const parts = blankedSentence.split(CLOZE_BLANK)
  return parts.reduce((result, part, i) => (i === 0 ? part : `${result}${answers[i - 1] ?? ''}${part}`), '')
}
