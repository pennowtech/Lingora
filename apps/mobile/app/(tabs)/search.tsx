import {
  createDeck,
  findLemmaBySurfaceForm,
  getCardByLemmaAndNativeLanguage,
  getWordGuide,
  persistTranslationAsCard,
  persistWordGuideAsCard,
  searchLemmasWithPreview,
  setCloze,
  type LemmaSearchPreview,
} from '@lingora/database'
import { logger } from '@lingora/observability'
import type { LanguageCode, QuestionType } from '@lingora/types'

const log = logger.child({ feature: 'search', component: 'search-screen' })
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Icon } from '../../components/Icon'
import { Button, Card, Chip, EmptyState, ErrorState, IconButton, SpeakerButton } from '../../components/ui'
import { DeckPickerModal } from '../../components/DeckPickerModal'
import type { ClozeEditorResult } from '../../components/ClozeMarkupEditor'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { InlineMarkdown } from '../../components/InlineMarkdown'
import { ProgressOverlay } from '../../components/ProgressOverlay'
import { WordGuideModal } from '../../components/WordGuideModal'
import { CardSourceIcon, dictionaryNameToCardSource } from '../../lib/cardSource'
import { PROVIDER_META } from '../../lib/aiProviderMeta'
import { detectSearchLanguage, formatUserFriendlyProviderError, isNetworkError, networkErrorMessage } from '@lingora/ai'
import { AI_GENERATED_SOURCES } from '@lingora/core'
import { DEFAULT_DECK_ID, useServices, type GenerationProviderName } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useCyclingIndex } from '../../lib/useCyclingIndex'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

/** Vocabulary languages (what's being looked up/learned), duplicated intentionally per-screen —
 * see settings/learning.tsx's VOCAB_LANGUAGE_LABELS, the source of this convention. */
const VOCAB_LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  de: 'German',
  ja: 'Japanese',
  es: 'Spanish',
  fr: 'French',
  vi: 'Vietnamese',
  hi: 'Hindi',
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'lookup',
    title: 'Instant lookup',
    icon: 'Search',
    paragraphs: [
      'Type a word in either language you\'ve set up under Learning - your own vocabulary is searched instantly as you type.',
      'Inflected or conjugated forms work too, not just the base/dictionary form of a word.',
    ],
  },
  {
    id: 'new-word',
    title: 'When a word is new to you',
    icon: 'Sparkles',
    paragraphs: [
      'If a word isn\'t in your library yet, you may see a quick built-in dictionary entry and/or a translation preview - both are read-only until you choose to add one to a deck.',
      'The "AI Insights" preview gives a short, direct explanation of what the word means and where or why it\'s used - tap it any time to generate the full flashcard.',
      '"Generate with AI" generates a full explanation card with meanings, examples, grammar, and more, using whichever AI provider you\'ve set up in Settings.',
    ],
  },
  {
    id: 'add',
    title: 'Adding to a deck',
    icon: 'Layers',
    paragraphs: [
      'Tapping "Add to deck" always asks which deck to add the word to, and lets you create a brand-new deck on the spot.',
      'A green checkmark means the word is already in one of your decks.',
    ],
  },
  {
    id: 'from-outside',
    title: 'Search from anywhere',
    icon: 'Share2',
    paragraphs: [
      'Long-press a word in any app - your browser, messages, anywhere - and pick "Search in Lemmory." It opens right here with that word ready to go.',
      'You can also share text to Lemmory, the same way you\'d share a link or a photo to any other app.',
      'Want it to work a bit differently? There\'s a setting for that in Settings, under "Share & Search."',
    ],
  },
]

/** Module-level, not component state — this screen sits behind a plain Stack (see
 * (tabs)/_layout.tsx's doc comment), not a persistent Tabs navigator, so navigating to a search
 * result and back unmounts and remounts SearchScreen from scratch. Without this, the query (and
 * with it the whole results list, since search.data is keyed off `term`) would reset to blank
 * every time — this survives remounts for the rest of the app session, resetting only on a full
 * app restart, which is the expected "last search" lifetime. */
let lastSearchQuery = ''

/** A dictionary provider's `.name` ('google-translate', 'deepl', or one of the AI providers
 * when it fills this slot too) isn't a label fit for an error message — reused for the quick-
 * translate error card so a technical exception doesn't leak provider internals to the user. */
function dictionaryProviderLabel(name: string): string {
  if (name === 'google-translate') return 'Google Translate'
  if (name === 'deepl') return 'DeepL'
  return PROVIDER_META[name as GenerationProviderName]?.label ?? name
}

/** Debounce the raw input so FTS5 runs per pause, not per keystroke. */
function useDebounced(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

/**
 * Same idea as useDebounced, but much slower and flushable — for the quick-explain AI call, which
 * (unlike FTS search or the free Google Translate preview) costs real tokens per distinct word, so
 * it shouldn't fire on every short typing pause. `flush` lets the keyboard's search/submit action
 * skip the wait entirely once the user clearly means "this word, now."
 */
function useSlowDebounced(value: string, delayMs: number): [string, () => void] {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  const flush = (): void => setDebounced(value)
  return [debounced, flush]
}

/**
 * Word search with results-as-you-type: FTS5 over lemma forms and meaning
 * translations. Unknown words hand off to the Phase 3 generation pipeline.
 */
export default function SearchScreen(): JSX.Element {
  const { db, ai, dictionary, pipeline, tier, defaultCefr, nativeLanguage, targetLanguage } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const queryClient = useQueryClient()
  // `q` — an incoming word/phrase from outside the app (Android's Process Text toolbar entry or
  // the share sheet, see components/CaptureIntentHandler.tsx) routed here as a route param. Wins
  // over the remembered lastSearchQuery on the render that carries it; a plain tab-to-tab-and-back
  // remount (no `q` param) still falls back to lastSearchQuery as before.
  const params = useLocalSearchParams<{ q?: string }>()
  const [query, setQueryState] = useState(params.q ?? lastSearchQuery)
  const [guideModalOpen, setGuideModalOpen] = useState(false)
  // Which "Add to deck" button opened the picker — decides which persist call the picker's
  // onSelectDeck/onCreateDeck reach for once the user actually picks or creates a deck.
  const [deckPickerFor, setDeckPickerFor] = useState<'guide' | 'translation' | null>(null)
  const help = useHelpAccordion('lookup')
  const term = useDebounced(query.trim(), 250)
  const [explainTerm, flushExplainTerm] = useSlowDebounced(query.trim(), 2500)

  const setQuery = (value: string): void => {
    lastSearchQuery = value
    setQueryState(value)
  }

  // Keeps lastSearchQuery in sync with an incoming `q` too — otherwise navigating away and back
  // without a fresh capture would revert to whatever was remembered before this one.
  useEffect(() => {
    if (params.q) setQuery(params.q)
  }, [params.q])

  const search = useQuery({
    queryKey: ['search', term, targetLanguage, nativeLanguage],
    queryFn: () => searchLemmasWithPreview(db, term, targetLanguage, nativeLanguage),
    enabled: term !== '',
  })

  // "Any results at all" (the old `(search.data?.length ?? 0) === 0` gate below) is the wrong
  // question — search results are prefix matches (see packages/database's searchLemmas), so
  // typing "zauber" legitimately also matches the unrelated, longer, already-existing word
  // "zauberstab". That match existing was silently blocking "Generate with AI" for "zauber"
  // itself, since the whole new-word section (wordGuide/quickTranslate/quickExplain/Generate) only
  // rendered when results were completely empty. What actually matters is whether *this exact
  // word* already has a card — a longer word merely starting with it doesn't.
  const hasExactSearchMatch = (word: string): boolean => {
    const target = word.trim().toLowerCase()
    return (search.data ?? []).some((r) => r.lemma.form.toLowerCase() === target)
  }

  // A free, offline lookup against the installed word-guides dictionary (see
  // LingoraDocs/6_word_guides_plan.md) for an unrecognized word — shown as a
  // read-only preview by default, with an explicit "Add to deck" action
  // (addFromGuide below) for the user to opt into turning it into a real
  // card. Independent of `pipeline`/`tier`/an internet connection, unlike
  // quickTranslate/generate below.
  const wordGuide = useQuery({
    queryKey: ['word-guide-preview', term, targetLanguage],
    queryFn: () => getWordGuide(db, term, targetLanguage),
    enabled: term !== '' && !hasExactSearchMatch(term),
  })

  useFocusEffect(
    useCallback(() => {
      void search.refetch()
      void wordGuide.refetch()
    }, [search, wordGuide]),
  )

  // A short (~50-word) AI gist of a not-yet-generated word, shown by default in place of the bare
  // "Generate with AI" button once it's ready — tapping it (like the plain button) generates the
  // full card. Unlike quickTranslate/wordGuide below, this costs real tokens per distinct word, so
  // it's gated behind explainTerm's own much slower debounce (2500ms, or immediately on keyboard
  // submit — see flushExplainTerm) rather than the fast 250ms `term` used for search-as-you-type,
  // and skipped entirely when the free installed dictionary (wordGuide) already has a gloss.
  // staleTime is a full day: the explanation of a word doesn't change, so a session that revisits
  // the same word (e.g. backspacing and retyping it) shouldn't pay for it twice.
  const quickExplain = useQuery({
    queryKey: ['quick-explain', explainTerm, targetLanguage, nativeLanguage, defaultCefr, ai?.name, ai?.model],
    queryFn: async () =>
      (await ai!.explainWord(explainTerm, { cefrLevel: defaultCefr, language: targetLanguage, nativeLanguage })).data,
    enabled:
      explainTerm !== '' &&
      explainTerm === term &&
      !hasExactSearchMatch(explainTerm) &&
      tier === 'full' &&
      !!ai &&
      !wordGuide.data,
    staleTime: 24 * 60 * 60 * 1000,
  })

  const addFromGuide = useMutation({
    mutationFn: async ({ deckId, cloze }: { deckId: string; cloze?: ClozeEditorResult }) => {
      if (!wordGuide.data) throw new Error(t('No dictionary entry to add.'))
      const result = await persistWordGuideAsCard(db, wordGuide.data, deckId, nativeLanguage)
      if (cloze) {
        await setCloze(db, result.cardId, { ...cloze, difficulty: 'contextual', cefrLevel: defaultCefr })
      }
      return result
    },
    onSuccess: async ({ lemma }) => {
      setDeckPickerFor(null)
      setGuideModalOpen(false)
      await queryClient.invalidateQueries()
      router.push({ pathname: '/word/[form]', params: { form: lemma.form } })
    },
  })

  // A plain dictionary lookup (Google Translate/DeepL/whichever is active in
  // Settings → Translation) for an unrecognized word — independent of
  // `pipeline`/`tier`, so it works even in Limited mode with no generation
  // key, and shows alongside "Generate with AI" when one is configured.
  // Always translate TOWARD whichever of the pair the input isn't — if the typed word is already
  // the target (learning) language, show its native-language meaning, and vice versa. Detection
  // (not the raw `term`) decides the direction so a native-language search still works even
  // though the app's vocabulary is stored in the target language.
  // Google specifically (not DeepL/LLM dictionary providers) stays useful as a quick reference
  // even once a card already exists for the word — it's free, instant, and a learner checking a
  // translation doesn't necessarily also want the full card. Every other provider keeps the old
  // "only for a genuinely new word" gating, since those calls aren't free.
  const alwaysShowTranslation = dictionary.name === 'google-translate'
  const quickTranslate = useQuery({
    queryKey: ['quick-translate', term, dictionary.name, nativeLanguage, targetLanguage],
    queryFn: async () => {
      const source = await detectSearchLanguage(dictionary, term, nativeLanguage, targetLanguage)
      const target = source === targetLanguage ? nativeLanguage : targetLanguage
      const translated = await dictionary.translate(term, source, target)
      return { source, target, text: translated.data }
    },
    enabled: term !== '' && (!hasExactSearchMatch(term) || alwaysShowTranslation),
    staleTime: 5 * 60 * 1000,
  })

  // Ambiguous words ("foundation") have several distinct target-language meanings — `translate`
  // above only ever returns the single best guess. `translateAlternatives` is optional on
  // DictionaryProvider (only Google Translate's dt=bd dictionary section implements it), so this
  // query is a no-op (and renders nothing) for DeepL/LLM-backed dictionary providers.
  const translateAlternatives = useQuery({
    queryKey: ['quick-translate-alternatives', term, dictionary.name, nativeLanguage, targetLanguage],
    queryFn: async () => {
      const source = await detectSearchLanguage(dictionary, term, nativeLanguage, targetLanguage)
      const target = source === targetLanguage ? nativeLanguage : targetLanguage
      const result = await dictionary.translateAlternatives!(term, source, target)
      return result.data
    },
    enabled:
      term !== '' &&
      (!hasExactSearchMatch(term) || alwaysShowTranslation) &&
      dictionary.translateAlternatives !== undefined,
    staleTime: 5 * 60 * 1000,
  })

  // The repository needs the target-language spelling as the lemma. Whichever side of
  // `quickTranslate.data` is actually in the target language becomes the lemma form; the other
  // side (the native-language text) becomes the stored translation — so this works whether the
  // user typed the target-language word (term → lemma, text → translation) or their native-
  // language word (text → lemma, term → translation, since `text` is the target-language result
  // in that direction).
  const translationAsCardArgs = () => {
    if (!quickTranslate.data) return null
    const { source, text } = quickTranslate.data
    const isNativeInput = source !== targetLanguage
    return {
      form: isNativeInput ? text : term,
      language: targetLanguage,
      translation: isNativeInput ? term : text,
      provider: dictionaryNameToCardSource(dictionary.name),
    } as const
  }

  const addFromTranslation = useMutation({
    mutationFn: (deckId: string) => {
      const args = translationAsCardArgs()
      if (!args) throw new Error(t('No translation to add.'))
      return persistTranslationAsCard(db, args, deckId, nativeLanguage)
    },
    onSuccess: async ({ lemma }) => {
      setDeckPickerFor(null)
      await queryClient.invalidateQueries()
      router.push({ pathname: '/word/[form]', params: { form: lemma.form } })
    },
  })

  // Creating a brand-new deck from this screen has no existing card to attach yet — creates the
  // deck, then runs whichever of the two persist calls above `deckPickerFor` points at with the
  // new deck's id.
  const createDeckAndAdd = useMutation({
    mutationFn: async ({ name, questionTypes, cloze }: { name: string; questionTypes: QuestionType[]; cloze?: ClozeEditorResult }) => {
      const id = crypto.randomUUID()
      const now = Date.now()
      await createDeck(db, { id, name, enabledQuestionTypes: questionTypes, createdAt: now, updatedAt: now })
      if (deckPickerFor === 'guide') {
        if (!wordGuide.data) throw new Error(t('No dictionary entry to add.'))
        const result = await persistWordGuideAsCard(db, wordGuide.data, id, nativeLanguage)
        if (cloze) {
          await setCloze(db, result.cardId, { ...cloze, difficulty: 'contextual', cefrLevel: defaultCefr })
        }
        return result
      }
      if (deckPickerFor === 'translation') {
        const args = translationAsCardArgs()
        if (!args) throw new Error(t('No translation to add.'))
        return persistTranslationAsCard(db, args, id, nativeLanguage)
      }
      throw new Error(t('Nothing to add.'))
    },
    onSuccess: async ({ lemma }) => {
      setDeckPickerFor(null)
      setGuideModalOpen(false)
      await queryClient.invalidateQueries()
      router.push({ pathname: '/word/[form]', params: { form: lemma.form } })
    },
  })

  // Reverse-direction auto-detect: if the typed word is in the learner's native language (not the
  // target language), generate the target-language equivalent instead of trying to treat the
  // native-language spelling itself as a target-language word.
  //
  // Deliberately redoes detectLanguage/translate here instead of reading quickTranslate.data —
  // that's a separately-fetched query for the preview card, and tapping "Generate with AI" can
  // easily win the race against it (the button appears as soon as the FTS search resolves, which
  // is fast local SQLite; quickTranslate is a network call). Reading quickTranslate.data while
  // it's still undefined silently fell through to reverseDirection=false, sending the raw
  // native-language spelling straight to German-word generation, which the AI then hallucinated
  // unrelated content for (confirmed: Google Translate itself has always translated correctly —
  // "exaggerate" → "übertreiben" — the bug was never the translation, it was skipping it).
  //
  // addToDeck: false — the word is still fully generated and persisted (meanings, examples,
  // everything works immediately on the word page, exactly as before), it's just not added to "My
  // Vocabulary" (or any deck) yet. That's the word detail screen's own "Add to deck" picker's job
  // — the same explicit-confirm shape as a plain dictionary lookup's "Add to deck" button.
  // Bumped on every generate.mutate() call and on Cancel — onSuccess only acts on a result whose
  // id still matches the current one, so a cancelled (or superseded) generation's eventual
  // response is silently dropped instead of navigating the user somewhere they didn't ask for.
  // There's no network-level abort here (see ProgressOverlay's doc comment) — this just stops the
  // app from acting on the response once it arrives.
  const generateRequestId = useRef(0)
  const generate = useMutation({
    mutationFn: async () => {
      if (!pipeline) throw new Error(t('No AI provider is active. Add and enable one in Settings to generate words.'))
      const myRequestId = ++generateRequestId.current
      const requestTerm = term
      const flowStart = Date.now()
      // quickExplain is keyed by explainTerm (search.tsx's useSlowDebounced, up to 2500ms behind
      // `term` — see its own doc comment), not by requestTerm directly. If the user searched a
      // different word moments ago and taps Generate before explainTerm has caught up,
      // quickExplain.data still belongs to that earlier word — captured once here, at the same
      // instant requestTerm is, so it can never be read again later (mutationFn's persist call and
      // onSuccess's navigation both use this captured value, never the live quickExplain object,
      // which could reflect a later render's word by the time either of those run).
      const safeExplanation = explainTerm === requestTerm ? quickExplain.data : undefined

      log.info('search.ai_generation_button_tapped', {
        message: `User tapped "Generate with AI" for "${requestTerm}"`,
      })

      const existingLemma = await findLemmaBySurfaceForm(db, requestTerm)
      if (existingLemma) {
        const matchingCard = await getCardByLemmaAndNativeLanguage(db, existingLemma.id, nativeLanguage)
        const isFullAiCard = !!matchingCard?.source && AI_GENERATED_SOURCES.includes(matchingCard.source)
        log.info('search.ai_generation_instant_existing', {
          message: `Word "${requestTerm}" resolved to existing lemma "${existingLemma.form}" in ${Date.now() - flowStart}ms (isFullAiCard: ${isFullAiCard})`,
        })
        return {
          form: existingLemma.form,
          nativeTerm: undefined,
          requestTerm,
          myRequestId,
          flowStart,
          autoEnrich: !isFullAiCard,
          safeExplanation,
        }
      }

      const detectedSource = await detectSearchLanguage(dictionary, requestTerm, nativeLanguage, targetLanguage)
      const reverseDirection = detectedSource === nativeLanguage
      const targetWord = reverseDirection
        ? (await dictionary.translate(requestTerm, detectedSource, targetLanguage)).data
        : requestTerm

      // A word that's a legitimate spelling in BOTH configured languages (e.g. lowercase "wand" is
      // real English, while German capitalizes the unrelated noun "Wand" — detectSearchLanguage has
      // no way to fully disambiguate that) can resolve to a *different* targetWord than requestTerm
      // itself already covers via the existingLemma check above. Without this, a targetWord that
      // already has a lemma (created by an earlier attempt, or independently) made
      // persistTranslationAsCard below throw a plain "already exists" Error — not an AI/provider
      // error at all, but every retry hit the exact same throw, and it read (via
      // formatUserFriendlyProviderError, which only knows how to format AI/provider errors) as a
      // misleading "check your key and settings" message with nothing to do with the real cause.
      if (reverseDirection) {
        const existingTargetLemma = await findLemmaBySurfaceForm(db, targetWord)
        if (existingTargetLemma) {
          const matchingCard = await getCardByLemmaAndNativeLanguage(db, existingTargetLemma.id, nativeLanguage)
          const isFullAiCard = !!matchingCard?.source && AI_GENERATED_SOURCES.includes(matchingCard.source)
          log.info('search.ai_generation_instant_existing', {
            message: `Word "${requestTerm}" resolved to existing lemma "${existingTargetLemma.form}" (via reverse-direction translation) in ${Date.now() - flowStart}ms (isFullAiCard: ${isFullAiCard})`,
          })
          return {
            form: existingTargetLemma.form,
            nativeTerm: requestTerm,
            requestTerm,
            myRequestId,
            flowStart,
            autoEnrich: !isFullAiCard,
            safeExplanation,
          }
        }
      }

      const translation = (await dictionary.translate(targetWord, targetLanguage, nativeLanguage)).data

      // addToDeck: false — this optimistic card exists purely so navigation can happen instantly;
      // it must not silently add the word to "My Vocabulary" before the user has actually chosen
      // to (see autoEnrichMutation below, which enriches this same card in place and also passes
      // addToDeck: false so it stays un-added). Matches persistWordGeneration's addToDeck contract.
      const { lemma } = await persistTranslationAsCard(
        db,
        {
          form: targetWord,
          language: targetLanguage,
          translation,
          ...(safeExplanation && { explanation: safeExplanation }),
          provider: dictionaryNameToCardSource(dictionary.name),
        },
        DEFAULT_DECK_ID,
        nativeLanguage,
        'unknown',
        { addToDeck: false },
      )

      const totalFlowDurationMs = Date.now() - flowStart
      log.info('search.ai_generation_optimistic_created', {
        message: `Optimistic card created in ${totalFlowDurationMs}ms for "${lemma.form}" - navigating instantly!`,
        durationMs: totalFlowDurationMs,
      })

      return {
        form: lemma.form,
        nativeTerm: reverseDirection ? requestTerm : undefined,
        requestTerm,
        myRequestId,
        flowStart,
        autoEnrich: true,
        safeExplanation,
      }
    },
    onSuccess: async ({ form, nativeTerm, requestTerm, myRequestId, flowStart, autoEnrich, safeExplanation }) => {
      if (myRequestId !== generateRequestId.current) return
      if (requestTerm !== term) return
      await queryClient.invalidateQueries({ queryKey: ['search-lemmas'] })
      log.info('search.ai_generation_navigating', {
        message: `Navigating to word detail page for "${form}" (Total flow to nav: ${Date.now() - flowStart}ms)`,
        durationMs: Date.now() - flowStart,
      })
      router.push({
        pathname: '/word/[form]',
        params: {
          form,
          ...(nativeTerm && { nativeTerm }),
          ...(autoEnrich && { autoEnrich: 'true' }),
          ...(safeExplanation && { initialExplanation: safeExplanation }),
        },
      })
    },
  })

  const cancelGenerate = (): void => {
    generateRequestId.current += 1
    generate.reset()
  }

  // A single generation call builds the whole word package (meanings, examples, synonyms,
  // phrases) in one AI round-trip with no real partial-progress signal — cycling the overlay's
  // message is purely about making the wait feel legible, not reporting actual progress.
  const generatingMessages = [
    t('Looking up "{{word}}"...', { word: term }),
    t('Writing meanings and examples...'),
    t('Almost done...'),
  ]
  const generatingMessageIndex = useCyclingIndex(generate.isPending, generatingMessages.length)

  const results = search.data ?? []
  const partial = null

  // Guards quickExplain's card against showing a previous word's cached explanation while the
  // user is still mid-typing the next one — explainTerm only catches up to term (and to the AI
  // response) after the user pauses, so the two must match before quickExplain.data is trusted.
  const explainReady = explainTerm === term && explainTerm !== ''

  // Only meaningful when alwaysShowTranslation (Google) shows the translate card above existing
  // results — the "Add to deck" button there would otherwise offer to add a word that's already
  // in the library. `addFromTranslation` creates the new lemma as whichever side of
  // `quickTranslate.data` is in the target language (see `translationAsCardArgs` above), so that's
  // what has to match here too — not always `term` itself. Deliberately just a yes/no flag, not
  // which deck(s) — that breakdown belongs on the word detail screen once a card is actually open,
  // not in this preview card.
  const resolvedTargetForm =
    quickTranslate.data && quickTranslate.data.source !== targetLanguage ? quickTranslate.data.text : term
  const existingResult = results.find(
    (r) => r.lemma.form.toLowerCase() === resolvedTargetForm.trim().toLowerCase(),
  )

  // Shared between the "new word" empty state and, when alwaysShowTranslation, the results list
  // above the FlatList — same card either way.
  const quickTranslatePreview = quickTranslate.isPending ? (
    <Card style={styles.translateCard}>
      <ActivityIndicator size="small" color={colors.textSecondary} />
      <Text style={styles.translateLabel}>{t('Translating...')}</Text>
    </Card>
  ) : quickTranslate.data ? (
    <Card style={styles.translateCard}>
      <View style={styles.guideHeaderRow}>
        <View style={styles.guideTitleGroup}>
          <Text style={styles.guideHeadword}>{term}</Text>
          <Text style={styles.guidePosText}>
            {quickTranslate.data.source.toUpperCase()}
            {' > '}
            {quickTranslate.data.target.toUpperCase()}
          </Text>
        </View>
        <View style={styles.guideActionIcons}>
          <SpeakerButton text={term} language={quickTranslate.data.source} size={18} />
          <CardSourceIcon source={dictionaryNameToCardSource(dictionary.name)} size={16} />
        </View>
      </View>

      <Text style={styles.guideTranslationText}>
        {quickTranslate.data.text}
        {(() => {
          const primaryNorm = quickTranslate.data.text.trim().toLowerCase()
          const rest = translateAlternatives.data?.filter((alt) => alt.trim().toLowerCase() !== primaryNorm) ?? []
          return rest.length > 0 ? `, ${rest.join(', ')}` : ''
        })()}
      </Text>

      {existingResult?.inDeck ? (
        <View style={styles.inDeckBadgeRow}>
          <Icon name="CircleCheck" size={16} color={colors.success} />
          <Text style={styles.inDeckBadgeText}>{t('Already in your library')}</Text>
        </View>
      ) : (
        <View style={styles.guideFooterRow}>
          <Button
            label={t('Add to deck')}
            icon="CirclePlus"
            variant="primary"
            small
            onPress={() => setDeckPickerFor('translation')}
          />
        </View>
      )}

      {addFromTranslation.isError ? (
        <Text style={styles.generateError}>{String(addFromTranslation.error)}</Text>
      ) : null}
    </Card>
  ) : quickTranslate.isError ? (
    <Card style={styles.translateCard}>
      <View style={styles.translateErrorRow}>
        <Icon name="CloudOff" size={16} color={colors.textMuted} />
        <Text style={styles.translateErrorText}>
          {isNetworkError(quickTranslate.error)
            ? networkErrorMessage(t)
            : formatUserFriendlyProviderError(dictionaryProviderLabel(dictionary.name), quickTranslate.error, t)}
        </Text>
      </View>
      <Button
        label={t('Retry')}
        icon="RefreshCw"
        variant="secondary"
        small
        onPress={() => void quickTranslate.refetch()}
      />
    </Card>
  ) : null

  return (
    <View style={styles.container}>
      {/* Help lives in the native header, next to the "Search" title, not inline in the body —
          see the header-right pattern shared with Mine, word/[form], and the Settings screens
          that have a help sheet. */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton icon="CircleQuestionMark" size={24} color={colors.primary} onPress={() => help.openSection('lookup')} />
          ),
        }}
      />
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Icon name="Search" size={18} color={colors.textMuted} />
          <TextInput
            testID="search-input"
            style={styles.input}
            placeholder={t('Type a {{target}} or {{native}} word...', {
              target: t(VOCAB_LANGUAGE_LABELS[targetLanguage]),
              native: t(VOCAB_LANGUAGE_LABELS[nativeLanguage]),
            })}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={(text) => {
              setQuery(text)
              generate.reset()
              addFromGuide.reset()
              addFromTranslation.reset()
              createDeckAndAdd.reset()
              setGuideModalOpen(false)
              setDeckPickerFor(null)
            }}
            autoCorrect={false}
            autoCapitalize="none"
            autoFocus
            returnKeyType="search"
            onSubmitEditing={flushExplainTerm}
          />
          {query !== '' ? (
            <Pressable onPress={() => setQuery('')}>
              <Icon name="CircleX" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {term === '' ? (
        <EmptyState
          icon="Search"
          title={t('Instant lookup')}
          message={t('Search in {{target}} or {{native}}.\nInflected or conjugated forms work too.', {
            target: t(VOCAB_LANGUAGE_LABELS[targetLanguage]),
            native: t(VOCAB_LANGUAGE_LABELS[nativeLanguage]),
          })}
        />
      ) : search.isPending ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : search.isError ? (
        <ErrorState message={String(search.error)} onRetry={() => void search.refetch()} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item: LemmaSearchPreview) => item.lemma.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          // Search results are prefix matches (see packages/database's searchLemmas), so typing
          // "zauber" legitimately also matches the unrelated, longer, already-existing word
          // "zauberstab" — that must not silently hide "Generate with AI" for "zauber" itself.
          // Showing the new-word section (wordGuide/quickTranslate/quickExplain/Generate) whenever
          // there's no EXACT match for the typed word — regardless of whether prefix-related
          // results exist — is what actually lets you still generate it; those related results
          // still show in the list below. When an exact match DOES exist, Google Translate still
          // shows above the results as a quick reference, same as before this fix.
          ListHeaderComponent={
            !hasExactSearchMatch(term) ? (
              <View style={styles.newWordCards}>
                {wordGuide.data ? (
                  <Card style={styles.guideCard}>
                    <View style={styles.guideHeaderRow}>
                      <View style={styles.guideTitleGroup}>
                        <Text style={styles.guideHeadword}>{wordGuide.data.headword}</Text>
                        {wordGuide.data.partOfSpeech ? (
                          <Text style={styles.guidePosText}>
                            {wordGuide.data.partOfSpeech}
                            {wordGuide.data.gender ? ` · ${wordGuide.data.gender}` : ''}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.guideActionIcons}>
                        <SpeakerButton text={wordGuide.data.headword} language={wordGuide.data.language} size={18} />
                        <CardSourceIcon source="word_guide" size={16} />
                      </View>
                    </View>

                    <Text style={styles.guideTranslationText}>{wordGuide.data.translation}</Text>

                    {wordGuide.data.intro ? (
                      <Text style={styles.guideSnippet} numberOfLines={2}>{wordGuide.data.intro}</Text>
                    ) : null}

                    <View style={styles.guideFooterRow}>
                      <Button
                        label={t('Add to deck')}
                        icon="CirclePlus"
                        variant="primary"
                        small
                        onPress={() => setDeckPickerFor('guide')}
                      />
                      <Button
                        label={t('More info')}
                        icon="BookOpen"
                        variant="secondary"
                        small
                        onPress={() => setGuideModalOpen(true)}
                      />
                    </View>
                  </Card>
                ) : null}

                {/* ── Word guide detail modal ── */}
                <WordGuideModal
                  visible={guideModalOpen}
                  guide={wordGuide.data ?? null}
                  onClose={() => setGuideModalOpen(false)}
                  footer={
                    <Button label={t('Add to deck')} icon="CirclePlus" onPress={() => setDeckPickerFor('guide')} />
                  }
                />
                {quickTranslatePreview}
                {generate.isPending ? (
                  <Card style={styles.generateCard}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.generateLabel}>{t('Generating...')}</Text>
                  </Card>
                ) : tier === 'full' ? (
                  explainReady && quickExplain.data ? (
                    <Pressable onPress={() => generate.mutate()} accessibilityRole="button">
                      {({ pressed }) => (
                        <Card style={[styles.explainCard, pressed && styles.explainCardPressed]}>
                          <View style={styles.explainHeaderRow}>
                            <Text style={styles.explainWord} numberOfLines={1}>
                              {term}
                            </Text>
                            <View style={styles.explainBadgePill}>
                              <CardSourceIcon source={ai?.name} size={14} />
                              <Text style={styles.explainBadgeText}>
                                {t('AI Insights')}
                              </Text>
                            </View>
                          </View>
                          <InlineMarkdown
                            text={quickExplain.data}
                            style={styles.explainText}
                            boldStyle={styles.explainTextBold}
                            italicStyle={styles.explainTextItalic}
                            codeStyle={styles.explainTextCode}
                            numberOfLines={5}
                          />
                          <View style={styles.explainFooterRow}>
                            <View style={styles.explainCtaBtn}>
                              <Text style={styles.explainFooterText}>{t('Explore Full AI Flashcard')}</Text>
                              <Icon name="ArrowRight" size={14} color={colors.primary} />
                            </View>
                          </View>
                        </Card>
                      )}
                    </Pressable>
                  ) : explainReady && quickExplain.isPending ? (
                    <Pressable onPress={() => generate.mutate()} accessibilityRole="button">
                      <Card style={styles.explainCard}>
                        <View style={styles.explainHeaderRow}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text style={styles.explainLoadingLabel} numberOfLines={1}>
                            {t('Getting AI insights for "{{word}}"...', { word: term })}
                          </Text>
                        </View>
                      </Card>
                    </Pressable>
                  ) : (
                    <Card style={styles.generateCard} onPress={() => generate.mutate()}>
                      <CardSourceIcon source={ai?.name} size={18} />
                      <Text style={styles.generateLabel}>{t('Generate Full AI Flashcard')}</Text>
                    </Card>
                  )
                ) : (
                  <Pressable onPress={() => router.push('/settings/ai-providers')}>
                    <Card style={styles.limitedCard}>
                      <Icon name="Key" size={18} color={colors.textSecondary} />
                      <Text style={styles.limitedLabel}>
                        {t('No AI provider is active - add and enable one in Settings to generate new words')}
                      </Text>
                    </Card>
                  </Pressable>
                )}
                {generate.isError ? (
                  <Text style={styles.generateError}>
                    {isNetworkError(generate.error)
                      ? networkErrorMessage(t)
                      : formatUserFriendlyProviderError(
                          ai?.name ? (PROVIDER_META[ai.name as GenerationProviderName]?.label ?? ai.name) : 'AI',
                          generate.error,
                          t,
                        )}
                  </Text>
                ) : null}
              </View>
            ) : alwaysShowTranslation ? (
              <>{quickTranslatePreview}</>
            ) : null
          }
          renderItem={({ item }) => {
            const openDetail = (): void =>
              router.push({ pathname: '/word/[form]', params: { form: item.lemma.form } })
            return (
              <Card style={styles.row} onPress={openDetail}>
                <View style={styles.rowText}>
                  <Text style={styles.form}>{item.lemma.form}</Text>
                  {item.translation ? <Text style={styles.meaning}>{item.translation}</Text> : null}
                </View>
                <View style={styles.rowRight}>
                  <CardSourceIcon source={item.source} />
                  {item.inDeck ? <Icon name="CircleCheck" size={18} color={colors.success} /> : null}
                  {item.hasDetail ? <Chip label={t('Details')} onPress={openDetail} /> : null}
                </View>
              </Card>
            )
          }}
        />
      )}

      {/* ── Deck picker — shared by the dictionary-preview and translation-preview "Add to deck"
          buttons above, whichever last set deckPickerFor. Neither preview has a real card yet, so
          picking (or creating) a deck here is what actually creates it. ── */}
      <DeckPickerModal
        db={db}
        visible={deckPickerFor !== null}
        onClose={() => setDeckPickerFor(null)}
        title={t('Add "{{term}}" to...', { term })}
        {...(deckPickerFor === 'guide' && wordGuide.data ? {
          word: wordGuide.data.headword,
          ...(wordGuide.data.examples[0]?.sentence && { exampleSentence: wordGuide.data.examples[0].sentence }),
          ...(wordGuide.data.examples[0]?.translation && { exampleTranslation: wordGuide.data.examples[0].translation }),
        } : {})}
        onSelectDeck={(deck, cloze) => {
          if (deckPickerFor === 'guide') addFromGuide.mutate({ deckId: deck.id, ...(cloze && { cloze }) })
          else if (deckPickerFor === 'translation') addFromTranslation.mutate(deck.id)
        }}
        selecting={addFromGuide.isPending || addFromTranslation.isPending}
        onCreateDeck={(name, questionTypes, cloze) =>
          createDeckAndAdd.mutate({ name, questionTypes, ...(cloze && { cloze }) })
        }
        creating={createDeckAndAdd.isPending}
        {...((addFromGuide.isError || addFromTranslation.isError) && {
          selectError: String(addFromGuide.error ?? addFromTranslation.error),
        })}
        {...(createDeckAndAdd.isError && { createError: String(createDeckAndAdd.error) })}
      />

      <HelpAccordionSheet
        visible={help.visible}
        onClose={help.close}
        title={t('Search help')}
        sections={HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={(id) => help.setSectionId(help.sectionId === id ? null : id)}
        translate={t}
      />

      <ProgressOverlay
        visible={generate.isPending}
        message={generatingMessages[generatingMessageIndex] ?? t('Generating your card...')}
        onCancel={cancelGenerate}
      />
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: 2,
    },
    input: { flex: 1, fontSize: type.body, color: colors.text, paddingVertical: spacing.md },
    centered: { paddingTop: spacing.xxl, alignItems: 'center' },
    list: { paddingTop: spacing.lg },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      paddingVertical: spacing.md,
    },
    rowText: { flex: 1, marginRight: spacing.md },
    form: { fontSize: type.body, fontWeight: '700', color: colors.text },
    meaning: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    // Was a negative offset that pulled these cards up into an old "is new" EmptyState's own
    // bottom padding, since removed — this can now sit as a FlatList ListHeaderComponent (see
    // hasExactSearchMatch above) above unrelated prefix-matched results, so it needs its own real
    // breathing room under the search bar instead.
    newWordCards: { marginTop: spacing.lg },
    guideCard: {
      marginTop: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.sm,
      backgroundColor: colors.surface,
    },
    guideHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    guideTitleGroup: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.sm,
      flexWrap: 'wrap',
      flex: 1,
    },
    guideActionIcons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    guideHeadword: {
      fontSize: type.heading,
      fontWeight: '800',
      color: colors.text,
    },
    guidePosText: {
      fontSize: type.caption,
      fontWeight: '600',
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    guideTranslationText: {
      fontSize: type.body,
      fontWeight: '700',
      color: colors.text,
    },
    guideSnippet: {
      fontSize: type.caption,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    guideFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    translateCard: {
      marginTop: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.sm,
      backgroundColor: colors.surface,
    },
    inDeckBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    inDeckBadgeText: {
      fontSize: type.caption,
      fontWeight: '600',
      color: colors.success,
    },
    translateDirectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    translateDirection: {
      fontSize: type.micro,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    translateLabel: { fontSize: type.body, color: colors.textSecondary },
    translateErrorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    translateErrorText: { flex: 1, fontSize: type.caption, color: colors.textMuted },
    inDeckRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    translationsLine: { flexShrink: 1, fontSize: type.body, fontWeight: '400', color: colors.textSecondary },
    translationPrimary: { fontWeight: '700', color: colors.text },
    guideTranslationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    generateCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      backgroundColor: colors.primarySoft,
      borderColor: colors.primarySoft,
    },
    generateLabel: { fontSize: type.body, fontWeight: '700', color: colors.primary },
    // The AI quick-explanation card (search-result-inline preview, tap to build the full card) —
    // primarySoft-tinted like generateCard so it reads as the same "AI, actionable" affordance,
    // just richer once content has loaded instead of a bare CTA pill.
    explainCard: {
      marginTop: spacing.md,
      gap: spacing.sm,
      backgroundColor: colors.primarySoft,
      borderColor: colors.primarySoft,
    },
    explainCardPressed: { opacity: 0.85 },
    explainHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    explainBadgePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: radius.full,
    },
    explainBadgeText: {
      fontSize: type.micro,
      fontWeight: '700',
      color: colors.primary,
    },
    explainWord: { flex: 1, fontSize: type.body, fontWeight: '800', color: colors.text, textAlign: 'left' },
    explainText: { fontSize: type.body, color: colors.textSecondary, lineHeight: 21 },
    explainTextBold: { fontWeight: '800', color: colors.text },
    explainTextItalic: { fontStyle: 'italic' },
    explainTextCode: {
      fontFamily: 'monospace',
      backgroundColor: colors.surfaceMuted,
      color: colors.text,
      fontSize: type.caption,
    },
    explainFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: spacing.xs },
    explainCtaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.full,
    },
    explainFooterText: {
      fontSize: type.caption,
      fontWeight: '700',
      color: colors.primary,
    },
    explainLoadingLabel: { flex: 1, fontSize: type.body, fontWeight: '600', color: colors.primary },
    limitedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
    },
    limitedLabel: {
      flex: 1,
      fontSize: type.caption,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    generateError: {
      marginTop: spacing.md,
      fontSize: type.caption,
      color: colors.danger,
      textAlign: 'center',
    },
    partialCard: {
      marginTop: spacing.lg,
      backgroundColor: colors.warningSoft,
      borderColor: colors.warningSoft,
      gap: spacing.sm,
    },
    partialTitle: { fontSize: type.body, fontWeight: '700', color: colors.text },
    partialBody: { fontSize: type.caption, color: colors.textSecondary },
    partialHint: { fontSize: type.caption, fontWeight: '600', color: colors.textSecondary },
  })
