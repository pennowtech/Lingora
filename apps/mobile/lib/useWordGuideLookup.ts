import type { DatabaseAdapter } from '@lingora/database'
import { getWordGuide, searchWordGuidesByTranslation, type WordGuideTranslationMatch } from '@lingora/database'
import type { LanguageCode, WordGuideEntry } from '@lingora/types'
import { useEffect, useState } from 'react'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { getDictionariesForLanguagePair, type BundledDictionary } from './wordGuides'

/** Which of the two lookups actually found the active entry: `forward` means the typed word was
 * matched directly as a headword; `reverse` means it was matched via a translation/intro search
 * instead, and the entry's headword is in the *other* language from what was typed. */
export type WordGuideLookupDirection = 'forward' | 'reverse'

export interface WordGuideLookupResult {
  /** The dictionary covering the current language pair, if any is installed — undefined disables
   * both queries below entirely rather than running them against a language nothing is bundled
   * for (mirrors Settings -> Local Dictionaries' own "coming soon" gate). */
  dictionary: BundledDictionary | undefined
  /** Exact forward match — the typed word is the dictionary's own headword language. */
  forward: UseQueryResult<WordGuideEntry | null>
  /** Candidates found by searching translation glosses/intros instead — only meaningful once
   * `forward` has resolved empty; see the `active` field below for what to actually render. */
  reverse: UseQueryResult<WordGuideTranslationMatch[]>
  /** What a caller should actually display or persist: the forward match if there is one,
   * otherwise whichever reverse candidate was selected via `selectReverseMatch` — paired with
   * which direction it was found in, so presentation (e.g. WordGuideModal's example ordering) can
   * adapt without the caller re-deriving that itself. */
  active: { entry: WordGuideEntry; direction: WordGuideLookupDirection } | null
  /** Call with a candidate from `reverse.data` to make it `active` (e.g. the user tapped it);
   * call with `null` to go back to relying on `forward` alone. */
  selectReverseMatch: (entry: WordGuideEntry | null) => void
}

/**
 * Looks up `term` against the installed word-guides dictionary for the learner's current
 * language pair, trying both directions: first as an exact headword (forward), then — only once
 * that comes back empty — as a translation/intro match (reverse). Consolidates what would
 * otherwise be scattered `useQuery` calls, dictionary-resolution, and selection state at every
 * call site into one hook with one clear result shape, so a screen just reads `active`/`direction`
 * instead of re-deriving them from several independent pieces of state.
 *
 * Both queries key off the *dictionary's* own language (e.g. always 'de' for the bundled German
 * dictionary), not `targetLanguage` directly — those differ once the pair is flipped (a DE->EN
 * pair has `targetLanguage: 'en'`, but the installed dictionary's rows are still all
 * `language: 'de'`), which is what silently broke lookup in both directions before this existed.
 */
export function useWordGuideLookup(
  db: DatabaseAdapter,
  term: string,
  nativeLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  enabled: boolean,
): WordGuideLookupResult {
  const dictionary = getDictionariesForLanguagePair(nativeLanguage, targetLanguage)[0]
  const [selected, setSelected] = useState<WordGuideEntry | null>(null)

  // A selection from a previous term must never leak into the next lookup's "Add to deck"/modal
  // flow once the user types something new.
  useEffect(() => {
    setSelected(null)
  }, [term])

  const forward = useQuery({
    queryKey: ['word-guide-forward', term, dictionary?.language],
    queryFn: () => getWordGuide(db, term, dictionary!.language),
    enabled: enabled && term !== '' && dictionary !== undefined,
  })

  const reverse = useQuery({
    queryKey: ['word-guide-reverse', term, dictionary?.language],
    queryFn: () => searchWordGuidesByTranslation(db, term, dictionary!.language),
    enabled: enabled && term !== '' && dictionary !== undefined,
  })

  const active: WordGuideLookupResult['active'] = selected
    ? { entry: selected, direction: 'reverse' }
    : forward.data
      ? { entry: forward.data, direction: 'forward' }
      : null

  return { dictionary, forward, reverse, active, selectReverseMatch: setSelected }
}
