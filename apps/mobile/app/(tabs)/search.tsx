import { Ionicons } from '@expo/vector-icons'
import {
  createDeck,
  getWordGuide,
  persistTranslationAsCard,
  persistWordGuideAsCard,
  searchLemmasWithPreview,
  type LemmaSearchPreview,
} from '@lingora/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button, Card, Chip, EmptyState, ErrorState, IconButton } from '../../components/ui'
import { DeckPickerModal } from '../../components/DeckPickerModal'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { ProgressOverlay } from '../../components/ProgressOverlay'
import { WordGuideModal } from '../../components/WordGuideModal'
import { CardSourceIcon, dictionaryNameToCardSource } from '../../lib/cardSource'
import { detectSearchLanguage } from '../../lib/languageDetection'
import { isNetworkError, networkErrorMessage } from '../../lib/networkError'
import { DEFAULT_DECK_ID, useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'
import { getWordGuideManifest } from '../../lib/wordGuides'

const WORD_GUIDE_LANGUAGE = getWordGuideManifest().language

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'lookup',
    title: 'Instant lookup',
    icon: 'search-outline',
    paragraphs: [
      'Type a word in either language you\'ve set up under Learning — your own vocabulary is searched instantly as you type.',
      'Inflected or conjugated forms work too, not just the base/dictionary form of a word.',
    ],
  },
  {
    id: 'new-word',
    title: 'When a word is new to you',
    icon: 'sparkles-outline',
    paragraphs: [
      'If a word isn\'t in your library yet, you may see a quick built-in dictionary entry and/or a translation preview — both are read-only until you choose to add one to a deck.',
      '"Generate with AI" generates a full explanation card with meanings, examples, grammar, and more, using whichever AI provider you\'ve set up in Settings.',
    ],
  },
  {
    id: 'add',
    title: 'Adding to a deck',
    icon: 'albums-outline',
    paragraphs: [
      'Tapping "Add to deck" always asks which deck to add the word to, and lets you create a brand-new deck on the spot.',
      'A green checkmark means the word is already in one of your decks.',
    ],
  },
  {
    id: 'from-outside',
    title: 'Search from anywhere',
    icon: 'share-outline',
    paragraphs: [
      'Long-press a word in any app — your browser, messages, anywhere — and pick "Search in Lingora." It opens right here with that word ready to go.',
      'You can also share text to Lingora, the same way you\'d share a link or a photo to any other app.',
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
 * Word search with results-as-you-type: FTS5 over lemma forms and meaning
 * translations. Unknown words hand off to the Phase 3 generation pipeline.
 */
export default function SearchScreen(): JSX.Element {
  const { db, dictionary, pipeline, tier, defaultCefr, nativeLanguage, targetLanguage } = useServices()
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

  const setQuery = (value: string): void => {
    lastSearchQuery = value
    setQueryState(value)
  }

  // Keeps lastSearchQuery in sync with an incoming `q` too — otherwise navigating away and back
  // without a fresh capture would revert to whatever was remembered before this one.
  useEffect(() => {
    if (params.q) setQuery(params.q)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setQuery is a plain function recreated every render; only params.q should re-trigger this
  }, [params.q])

  const search = useQuery({
    queryKey: ['search', term],
    queryFn: () => searchLemmasWithPreview(db, term),
    enabled: term !== '',
  })

  // A free, offline lookup against the installed word-guides dictionary (see
  // LingoraDocs/6_word_guides_plan.md) for an unrecognized word — shown as a
  // read-only preview by default, with an explicit "Add to deck" action
  // (addFromGuide below) for the user to opt into turning it into a real
  // card. Independent of `pipeline`/`tier`/an internet connection, unlike
  // quickTranslate/generate below.
  const wordGuide = useQuery({
    queryKey: ['word-guide-preview', term],
    queryFn: () => getWordGuide(db, term, WORD_GUIDE_LANGUAGE),
    enabled: term !== '' && (search.data?.length ?? 0) === 0,
  })

  const addFromGuide = useMutation({
    mutationFn: (deckId: string) => {
      if (!wordGuide.data) throw new Error(t('No dictionary entry to add.'))
      return persistWordGuideAsCard(db, wordGuide.data, deckId)
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
    enabled: term !== '' && ((search.data?.length ?? 0) === 0 || alwaysShowTranslation),
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
      ((search.data?.length ?? 0) === 0 || alwaysShowTranslation) &&
      dictionary.translateAlternatives !== undefined,
    staleTime: 5 * 60 * 1000,
  })

  // Only offered when the term is already the target (learning) language — the repository needs
  // the target-language form as the lemma, and when the user typed the native language instead,
  // `quickTranslate.data.text` is the target-language translation, not `term` itself, and could
  // ambiguously map to more than one target-language word, so there's no single correct
  // lemma.form to create in that direction (that's what "Generate with AI" below is for).
  const addFromTranslation = useMutation({
    mutationFn: (deckId: string) => {
      if (!quickTranslate.data || quickTranslate.data.source !== targetLanguage) {
        throw new Error(t('No translation to add.'))
      }
      return persistTranslationAsCard(
        db,
        {
          form: term,
          language: targetLanguage,
          translation: quickTranslate.data.text,
          provider: dictionaryNameToCardSource(dictionary.name),
        },
        deckId,
        defaultCefr,
      )
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
    mutationFn: async (name: string) => {
      const id = crypto.randomUUID()
      const now = Date.now()
      await createDeck(db, { id, name, createdAt: now, updatedAt: now })
      if (deckPickerFor === 'guide') {
        if (!wordGuide.data) throw new Error(t('No dictionary entry to add.'))
        return persistWordGuideAsCard(db, wordGuide.data, id)
      }
      if (deckPickerFor === 'translation') {
        if (!quickTranslate.data || quickTranslate.data.source !== targetLanguage) {
          throw new Error(t('No translation to add.'))
        }
        return persistTranslationAsCard(
          db,
          {
            form: term,
            language: targetLanguage,
            translation: quickTranslate.data.text,
            provider: dictionaryNameToCardSource(dictionary.name),
          },
          id,
          defaultCefr,
        )
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
      // Captured at mutation start, not in onSuccess — term could have moved on by the time
      // generation finishes if the user kept typing.
      const requestTerm = term
      const detectedSource = await detectSearchLanguage(dictionary, requestTerm, nativeLanguage, targetLanguage)
      const reverseDirection = detectedSource === nativeLanguage
      const word = reverseDirection
        ? (await dictionary.translate(requestTerm, detectedSource, targetLanguage)).data
        : requestTerm
      const outcome = await pipeline.lookupOrGenerate(word, {
        cefrLevel: defaultCefr,
        deckId: DEFAULT_DECK_ID,
        language: targetLanguage,
        addToDeck: false,
      })
      return { outcome, nativeTerm: reverseDirection ? requestTerm : undefined, requestTerm, myRequestId }
    },
    // `term` here is read fresh when onSuccess actually fires, not when mutate() was called — a
    // React Query mutation isn't cancelled by generate.reset() (that only clears the UI-visible
    // state, letting the "Generate with AI" button reappear), so if the user changed the search
    // and fired a second generate() before a slow first one resolved, the first one's onSuccess
    // could still land later and silently navigate the user away from the word they're now
    // actually looking at. Comparing requestTerm to the live term drops that stale result instead.
    onSuccess: async ({ outcome, nativeTerm, requestTerm, myRequestId }) => {
      if (myRequestId !== generateRequestId.current) return
      if (requestTerm !== term) return
      if (outcome.kind === 'existing' || outcome.kind === 'generated') {
        await queryClient.invalidateQueries()
        router.push({
          pathname: '/word/[form]',
          params: { form: outcome.lemma.form, ...(nativeTerm && { nativeTerm }) },
        })
      }
    },
  })

  const cancelGenerate = (): void => {
    generateRequestId.current += 1
    generate.reset()
  }

  const results = search.data ?? []
  const partial = generate.data?.outcome.kind === 'partial' ? generate.data.outcome : null

  // Only meaningful when alwaysShowTranslation (Google) shows the translate card above existing
  // results — the "Add to deck" button there would otherwise offer to add a word that's already
  // in the library. `addFromTranslation` creates the new lemma as `term` itself (not the
  // translated text — see its mutationFn below), so that's what has to match here too.
  // Deliberately just a yes/no flag, not which deck(s) — that breakdown belongs on the word detail
  // screen once a card is actually open, not in this preview card.
  const existingResult = results.find((r) => r.lemma.form.toLowerCase() === term.trim().toLowerCase())

  // Shared between the "new word" empty state and, when alwaysShowTranslation, the results list
  // above the FlatList — same card either way.
  const quickTranslatePreview = quickTranslate.isPending ? (
    <Card style={styles.translateCard}>
      <ActivityIndicator size="small" color={colors.textSecondary} />
      <Text style={styles.translateLabel}>{t('Translating…')}</Text>
    </Card>
  ) : quickTranslate.data ? (
    <Card style={styles.translateCard}>
      {/* Centered direction indicator, generalized to whichever pair Settings → Learning
          has configured, straight or reverse — not hardcoded to DE/EN. */}
      <View style={styles.translateDirectionRow}>
        <Text style={styles.translateDirection}>
          {quickTranslate.data.source.toUpperCase()} → {quickTranslate.data.target.toUpperCase()}
        </Text>
        <CardSourceIcon source={dictionaryNameToCardSource(dictionary.name)} size={14} />
      </View>
      {/* No headword repeated here — the searched term is already visible in the search
          box above, self-evident in this context. Just the translation(s). */}
      <Text style={styles.translationsLine}>
        <Text style={styles.translationPrimary}>{quickTranslate.data.text}</Text>
        {(() => {
          const primary = quickTranslate.data.text
          const rest = translateAlternatives.data?.filter((alt) => alt !== primary) ?? []
          return rest.length > 0 ? `, ${rest.join(', ')}` : ''
        })()}
      </Text>
      {existingResult?.inDeck ? (
        <View style={styles.inDeckRow}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        </View>
      ) : quickTranslate.data.source === targetLanguage ? (
        <Button
          label={t('Add to deck')}
          icon="add-circle"
          variant="secondary"
          small
          onPress={() => setDeckPickerFor('translation')}
        />
      ) : null}
      {addFromTranslation.isError ? (
        <Text style={styles.generateError}>{String(addFromTranslation.error)}</Text>
      ) : null}
    </Card>
  ) : quickTranslate.isError ? (
    <Card style={styles.translateCard}>
      <View style={styles.translateErrorRow}>
        <Ionicons name="cloud-offline-outline" size={16} color={colors.textMuted} />
        <Text style={styles.translateErrorText}>
          {isNetworkError(quickTranslate.error) ? networkErrorMessage(t) : String(quickTranslate.error)}
        </Text>
      </View>
      <Button
        label={t('Retry')}
        icon="refresh"
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
            <IconButton icon="help-circle-outline" size={24} color={colors.primary} onPress={() => help.openSection('lookup')} />
          ),
        }}
      />
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            testID="search-input"
            style={styles.input}
            placeholder={t('Type a German or English word…')}
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
          />
          {query !== '' ? (
            <Ionicons name="close-circle" size={18} color={colors.textMuted} onPress={() => setQuery('')} />
          ) : null}
        </View>
      </View>

      {term === '' ? (
        <EmptyState
          icon="search"
          title={t('Instant lookup')}
          message={t('Search in German ("ausgeh…") or English ("go out").\nInflected forms like "ging aus" work too.')}
        />
      ) : search.isPending ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : search.isError ? (
        <ErrorState message={String(search.error)} onRetry={() => void search.refetch()} />
      ) : results.length === 0 ? (
        <View>
          <View style={styles.newWordCards}>
          {wordGuide.data ? (
            // Same visual language as the quick-translate card below (centered meta row + source
            // icon, translation as the one bold normal-size line) — previously this repeated the
            // headword (already visible in the search box) at the same giant size as the
            // translation, two competing headlines with no hierarchy between them.
            <Card style={styles.translateCard}>
              <View style={styles.translateDirectionRow}>
                {wordGuide.data.partOfSpeech ? (
                  <Text style={styles.translateDirection}>
                    {wordGuide.data.partOfSpeech}
                    {wordGuide.data.gender ? ` · ${wordGuide.data.gender}` : ''}
                  </Text>
                ) : null}
                <CardSourceIcon source="word_guide" size={14} />
              </View>
              <View style={styles.guideTranslationRow}>
                <Text style={styles.translationsLine}>
                  <Text style={styles.translationPrimary}>{wordGuide.data.translation}</Text>
                </Text>
                <Chip label={t('More info')} onPress={() => setGuideModalOpen(true)} />
              </View>
              <Button
                label={t('Add to deck')}
                icon="add-circle"
                variant="secondary"
                small
                onPress={() => setDeckPickerFor('guide')}
              />
            </Card>
          ) : null}

          {/* ── Word guide detail modal ── */}
          <WordGuideModal
            visible={guideModalOpen}
            guide={wordGuide.data ?? null}
            onClose={() => setGuideModalOpen(false)}
            footer={
              <Button label={t('Add to deck')} icon="add-circle" onPress={() => setDeckPickerFor('guide')} />
            }
          />
          {quickTranslatePreview}
          {generate.isPending ? (
            <Card style={styles.generateCard}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.generateLabel}>{t('Generating…')}</Text>
            </Card>
          ) : tier === 'full' ? (
            <Card style={styles.generateCard} onPress={() => generate.mutate()}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={styles.generateLabel}>{t('Generate with AI')}</Text>
            </Card>
          ) : (
            <Pressable onPress={() => router.push('/settings')}>
              <Card style={styles.limitedCard}>
                <Ionicons name="key-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.limitedLabel}>
                  {t('No AI provider is active — add and enable one in Settings to generate new words')}
                </Text>
              </Card>
            </Pressable>
          )}
          {generate.isError ? (
            <Text style={styles.generateError}>
              {isNetworkError(generate.error)
                ? networkErrorMessage(t)
                : String(generate.error)}
            </Text>
          ) : null}
          {partial ? (
            <Card style={styles.partialCard}>
              <Text style={styles.partialTitle}>{t('Generation came back incomplete')}</Text>
              <Text style={styles.partialBody}>
                {partial.issues.slice(0, 3).join('\n')}
              </Text>
              <Text style={styles.partialHint}>{t('Nothing was saved — try again.')}</Text>
            </Card>
          ) : null}
          </View>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item: LemmaSearchPreview) => item.lemma.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          // Google Translate stays a useful quick reference even once the word already has a
          // card — shown above the existing results, not instead of them.
          ListHeaderComponent={alwaysShowTranslation ? <>{quickTranslatePreview}</> : null}
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
                  {item.inDeck ? <Ionicons name="checkmark-circle" size={18} color={colors.success} /> : null}
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
        title={t('Add "{{term}}" to…', { term })}
        onSelectDeck={(deck) => {
          if (deckPickerFor === 'guide') addFromGuide.mutate(deck.id)
          else if (deckPickerFor === 'translation') addFromTranslation.mutate(deck.id)
        }}
        selecting={addFromGuide.isPending || addFromTranslation.isPending}
        onCreateDeck={(name) => createDeckAndAdd.mutate(name)}
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

      <ProgressOverlay visible={generate.isPending} message={t('Generating your card…')} onCancel={cancelGenerate} />
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
  // Was a negative offset that pulled these cards up into the old "is new" EmptyState's own
  // bottom padding — now that block is gone (see the `results.length === 0` branch above), so
  // this is the top of the whole panel and needs real breathing room under the search bar instead.
  newWordCards: { marginTop: spacing.lg },
  translateCard: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
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
