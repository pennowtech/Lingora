import { Ionicons } from '@expo/vector-icons'
import {
  getWordGuide,
  persistTranslationAsCard,
  persistWordGuideAsCard,
  searchLemmasWithPreview,
  type LemmaSearchPreview,
} from '@lingora/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button, Card, Chip, EmptyState, ErrorState } from '../../components/ui'
import { WordGuideModal } from '../../components/WordGuideModal'
import { DEFAULT_DECK_ID, useServices } from '../../lib/services'
import { colors, radius, spacing, type } from '../../lib/theme'
import { getWordGuideManifest } from '../../lib/wordGuides'

const WORD_GUIDE_LANGUAGE = getWordGuideManifest().language

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
  const { db, dictionary, pipeline, tier, defaultCefr } = useServices()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [guideModalOpen, setGuideModalOpen] = useState(false)
  const term = useDebounced(query.trim(), 250)

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
    mutationFn: () => {
      if (!wordGuide.data) throw new Error(t('No dictionary entry to add.'))
      return persistWordGuideAsCard(db, wordGuide.data, DEFAULT_DECK_ID)
    },
    onSuccess: async ({ lemma }) => {
      setGuideModalOpen(false)
      await queryClient.invalidateQueries()
      router.push({ pathname: '/word/[form]', params: { form: lemma.form } })
    },
  })

  // A plain dictionary lookup (Google Translate/DeepL/whichever is active in
  // Settings → Translation) for an unrecognized word — independent of
  // `pipeline`/`tier`, so it works even in Limited mode with no generation
  // key, and shows alongside "Generate with AI" when one is configured.
  const quickTranslate = useQuery({
    queryKey: ['quick-translate', term, dictionary.name],
    queryFn: async () => {
      const detected = await dictionary.detectLanguage(term)
      const source = detected.data
      const target = source === 'de' ? 'en' : 'de'
      const translated = await dictionary.translate(term, source, target)
      return { source, target, text: translated.data }
    },
    enabled: term !== '' && (search.data?.length ?? 0) === 0,
    staleTime: 5 * 60 * 1000,
  })

  // Only offered when the term is already German (source === 'de') — the
  // repository needs the German form as the lemma, and when the user typed
  // English instead, `quickTranslate.data.text` is the German translation,
  // not `term` itself, and could ambiguously map to more than one German
  // word, so there's no single correct lemma.form to create in that
  // direction.
  const addFromTranslation = useMutation({
    mutationFn: () => {
      if (!quickTranslate.data || quickTranslate.data.source !== 'de') {
        throw new Error(t('No translation to add.'))
      }
      return persistTranslationAsCard(
        db,
        { form: term, language: 'de', translation: quickTranslate.data.text },
        DEFAULT_DECK_ID,
        defaultCefr,
      )
    },
    onSuccess: async ({ lemma }) => {
      await queryClient.invalidateQueries()
      router.push({ pathname: '/word/[form]', params: { form: lemma.form } })
    },
  })

  const generate = useMutation({
    mutationFn: async (word: string) => {
      if (!pipeline) throw new Error('Add your OpenAI key in Settings to generate words.')
      return pipeline.lookupOrGenerate(word, { cefrLevel: defaultCefr, deckId: DEFAULT_DECK_ID })
    },
    onSuccess: async (outcome) => {
      if (outcome.kind === 'existing' || outcome.kind === 'generated') {
        await queryClient.invalidateQueries()
        router.push({ pathname: '/word/[form]', params: { form: outcome.lemma.form } })
      }
    },
  })

  const results = search.data ?? []
  const partial = generate.data?.kind === 'partial' ? generate.data : null

  return (
    <View style={styles.container}>
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
            setGuideModalOpen(false)
          }}
          autoCorrect={false}
          autoCapitalize="none"
          autoFocus
        />
        {query !== '' ? (
          <Ionicons name="close-circle" size={18} color={colors.textMuted} onPress={() => setQuery('')} />
        ) : null}
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
          <EmptyState
            icon="sparkles"
            title={t('"{{term}}" is new', { term })}
            message={t("This word isn't in your library yet. Generate meanings, examples, and synonyms with AI.")}
          />
          <View style={styles.newWordCards}>
          {wordGuide.data ? (
            <Card style={styles.guideCard}>
              <View style={styles.guideHeaderRow}>
                <Text style={styles.guideHeadword}>{wordGuide.data.headword}</Text>
                {wordGuide.data.partOfSpeech ? (
                  <Text style={styles.guideMeta}>
                    {wordGuide.data.partOfSpeech}
                    {wordGuide.data.gender ? ` · ${wordGuide.data.gender}` : ''}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.guideTranslation}>{wordGuide.data.translation}</Text>
              <Chip label={t('More info')} onPress={() => setGuideModalOpen(true)} />
            </Card>
          ) : null}

          {/* ── Word guide detail modal ── */}
          <WordGuideModal
            visible={guideModalOpen}
            guide={wordGuide.data ?? null}
            onClose={() => setGuideModalOpen(false)}
            footer={
              <>
                <Button
                  label={addFromGuide.isPending ? t('Adding…') : t('Add to deck')}
                  icon="add-circle"
                  onPress={() => addFromGuide.mutate()}
                  disabled={addFromGuide.isPending}
                />
                {addFromGuide.isError ? (
                  <Text style={styles.generateError}>{String(addFromGuide.error)}</Text>
                ) : null}
              </>
            }
          />
          {quickTranslate.isPending ? (
            <Card style={styles.translateCard}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
              <Text style={styles.translateLabel}>{t('Translating…')}</Text>
            </Card>
          ) : quickTranslate.data ? (
            <Card style={styles.translateCard}>
              <Text style={styles.translateDirection}>
                {quickTranslate.data.source.toUpperCase()} → {quickTranslate.data.target.toUpperCase()} · {dictionary.name}
              </Text>
              <Text style={styles.translateText}>{quickTranslate.data.text}</Text>
              {quickTranslate.data.source === 'de' ? (
                <Button
                  label={addFromTranslation.isPending ? t('Adding…') : t('Add to deck')}
                  icon="add-circle"
                  variant="secondary"
                  small
                  onPress={() => addFromTranslation.mutate()}
                  disabled={addFromTranslation.isPending}
                />
              ) : null}
              {addFromTranslation.isError ? (
                <Text style={styles.generateError}>{String(addFromTranslation.error)}</Text>
              ) : null}
            </Card>
          ) : null}
          {generate.isPending ? (
            <Card style={styles.generateCard}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.generateLabel}>{t('Generating…')}</Text>
            </Card>
          ) : tier === 'full' ? (
            <Card style={styles.generateCard} onPress={() => generate.mutate(term)}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={styles.generateLabel}>{t('Generate with AI')}</Text>
            </Card>
          ) : (
            <Pressable onPress={() => router.push('/settings')}>
              <Card style={styles.limitedCard}>
                <Ionicons name="key-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.limitedLabel}>
                  {t('Add your OpenAI key in Settings to generate new words')}
                </Text>
              </Card>
            </Pressable>
          )}
          {generate.isError ? (
            <Text style={styles.generateError}>{String(generate.error)}</Text>
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
                  {item.inDeck ? <Ionicons name="checkmark-circle" size={18} color={colors.success} /> : null}
                  {item.hasDetail ? <Chip label={t('Details')} onPress={openDetail} /> : null}
                </View>
              </Card>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  searchBox: {
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
  newWordCards: { marginTop: -spacing.xl },
  guideCard: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  guideHeaderRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  guideHeadword: { fontSize: type.heading, fontWeight: '700', color: colors.text },
  guideMeta: { fontSize: type.micro, color: colors.textMuted },
  guideTranslation: { fontSize: type.heading, fontWeight: '700', color: colors.text },
  translateCard: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
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
  translateText: { fontSize: type.heading, fontWeight: '700', color: colors.text },
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
