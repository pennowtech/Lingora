import type { CardSource } from '@lingora/types'

/** Human-readable label per CardSource — shared between apps/mobile's CardSourceIcon component
 * and (once wired in) any equivalent desktop badge. Icon glyphs/logos are NOT here: they're tied
 * to each app's own icon library and asset pipeline, so each app supplies those itself. */
export const SOURCE_LABELS: Record<CardSource, string> = {
  openai: 'Generated with OpenAI',
  mistral: 'Generated with Mistral',
  gemini: 'Generated with Gemini',
  anthropic: 'Generated with Claude',
  deepseek: 'Generated with DeepSeek',
  groq: 'Generated with Groq',
  local: 'Generated locally',
  google: 'Google Translate',
  deepl: 'DeepL',
  word_guide: 'From your installed dictionary',
  manual: 'Added manually',
}

/** A card whose source is one of these came entirely from an AI provider's own generation (full
 * word package, not just a dictionary hint) — used to distinguish "fully AI-generated" cards from
 * ones sourced from a dictionary lookup, local word guide, or manual entry. Previously duplicated
 * as an inline literal in three separate apps/mobile files (review/[deckId].tsx, word/[form].tsx,
 * (tabs)/search.tsx x2); consolidated here so a new generation provider only needs adding once. */
export const AI_GENERATED_SOURCES: readonly CardSource[] = ['openai', 'mistral', 'gemini', 'anthropic', 'deepseek', 'groq', 'local']

/** Maps a `DictionaryProvider`/`AIProvider`'s own `.name` (e.g. `dictionary.name` from
 * `useServices()`) to the `CardSource` it corresponds to. Only Google Translate's provider name
 * ('google-translate') doesn't match its CardSource ('google') directly. */
export function dictionaryNameToCardSource(name: string): Exclude<CardSource, 'word_guide'> {
  return name === 'google-translate' ? 'google' : (name as Exclude<CardSource, 'word_guide'>)
}
