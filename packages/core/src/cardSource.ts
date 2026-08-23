import type { CardSource } from '@lingora/types'

/** Human-readable label per CardSource — shared between apps/mobile's CardSourceIcon component
 * and (once wired in) any equivalent desktop badge. Icon glyphs/logos are NOT here: they're tied
 * to each app's own icon library and asset pipeline, so each app supplies those itself. */
export const SOURCE_LABELS: Record<CardSource, string> = {
  openai: 'Generated with OpenAI',
  mistral: 'Generated with Mistral',
  gemini: 'Generated with Gemini',
  anthropic: 'Generated with Claude',
  local: 'Generated locally',
  google: 'Google Translate',
  deepl: 'DeepL',
  word_guide: 'From your installed dictionary',
  manual: 'Added manually',
}

/** Maps a `DictionaryProvider`/`AIProvider`'s own `.name` (e.g. `dictionary.name` from
 * `useServices()`) to the `CardSource` it corresponds to. Only Google Translate's provider name
 * ('google-translate') doesn't match its CardSource ('google') directly. */
export function dictionaryNameToCardSource(name: string): Exclude<CardSource, 'word_guide'> {
  return name === 'google-translate' ? 'google' : (name as Exclude<CardSource, 'word_guide'>)
}
