import type { LanguageCode } from '@lingora/types'
import type { DictionaryProvider } from '@lingora/ai'
import { isNetworkError } from './networkError'

/**
 * Lingora only ever cares about two configured languages (native/target) — but the dictionary's
 * `detectLanguage` does a blind guess across every language it knows, which can land on neither
 * one for a short or ambiguous word (e.g. "reden" is also a real Dutch word, so Google's auto-
 * detect sometimes returns 'nl' for a plain German search). Previously that made the whole
 * lookup fail outright. Since the search screen is overwhelmingly used to look up target-language
 * (learning) vocabulary, a detection that lands outside the configured pair is treated as target-
 * language rather than as a hard failure. A genuine connectivity failure still throws — there's
 * no reasonable language to fall back to when the request never reached the server at all.
 */
export async function detectSearchLanguage(
  dictionary: DictionaryProvider,
  term: string,
  nativeLanguage: LanguageCode,
  targetLanguage: LanguageCode,
): Promise<LanguageCode> {
  try {
    const detected = await dictionary.detectLanguage(term)
    return detected.data === nativeLanguage || detected.data === targetLanguage
      ? detected.data
      : targetLanguage
  } catch (error) {
    if (isNetworkError(error)) throw error
    return targetLanguage
  }
}
