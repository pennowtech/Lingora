import { Ionicons } from '@expo/vector-icons'
import type {
  Card as CardRow,
  CefrLevel,
  Cloze,
  EvaluationReportReason,
  EvaluationTarget,
  Example,
  Inflection,
  Lemma,
  Meaning,
  MeaningCluster,
  Phrase,
  Synonym,
} from '@lingora/types'
import {
  addCardToDeck,
  findLemmaBySurfaceForm,
  getAllDecks,
  getActivePromptVersion,
  getCardsByLemma,
  getClozesForCard,
  getClustersForLemma,
  getExamplesForCard,
  getInflectionsForLemma,
  getLatestEvaluationsForTargets,
  getLemmaByForm,
  getMeaningsForCluster,
  getPhrasesForCard,
  getSynonymsForCard,
  getWordGuide,
  persistRegeneratedExamples,
  setEvaluation,
  updateExampleText,
  updateMeaningText,
  updatePrimaryMeaning,
  updateSelectedExample,
  type DatabaseAdapter,
} from '@lingora/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  Button,
  Card,
  CardActionBar,
  CefrBadge,
  Chip,
  ErrorState,
  EvalBar,
  SectionHeader,
  SpeakerButton,
  Spinner,
} from '../../components/ui'
import { WordGuideModal } from '../../components/WordGuideModal'
import { useServices } from '../../lib/services'
import { cefrColors, colors, radius, spacing, type } from '../../lib/theme'

const REPORT_REASONS: Array<{ value: EvaluationReportReason; label: string }> = [
  { value: 'inaccurate_translation', label: 'Inaccurate translation' },
  { value: 'unnatural_phrasing', label: 'Unnatural phrasing' },
  { value: 'wrong_cefr_level', label: 'Wrong CEFR level' },
  { value: 'grammar_error', label: 'Grammar error' },
  { value: 'other', label: 'Other' },
]

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const CONTEXT_TABS = [
  'all',
  'casual',
  'formal',
  'business',
  'travel',
  'daily_life',
  'slang',
] as const

/** Grammar options panel groups, straight from the roadmap's Phase 4 spec. */
const GRAMMAR_GROUPS: Array<{ title: string; options: string[] }> = [
  { title: 'Tense & mood', options: ['Konjunktiv II', 'Präteritum', 'Perfekt', 'Futur I', 'Plusquamperfekt'] },
  { title: 'Sentence structure', options: ['Passive voice', 'Relative clause', 'Indirect speech', 'Question form'] },
  { title: 'Conjunctions', options: ['als ob / als hätte', 'obwohl', 'damit', 'weil / da', 'nicht nur … sondern auch'] },
  { title: 'Focus words', options: ['selbst / sogar', 'jemals', 'Modalpartikeln (doch, ja, halt)'] },
]

/** Everything the screen renders for one word, assembled from the repositories. */
interface WordView {
  lemma: Lemma
  inflections: Inflection[]
  card: CardRow | null
  clusters: Array<{
    cluster: MeaningCluster
    meanings: Meaning[]
    examples: Example[]
    synonyms: Synonym[]
  }>
  phrases: Phrase[]
  clozes: Cloze[]
}

async function loadWord(db: DatabaseAdapter, form: string): Promise<WordView | null> {
  const lemma = (await findLemmaBySurfaceForm(db, form)) ?? (await getLemmaByForm(db, form))
  if (!lemma) return null

  const [inflections, cards, clusterRows] = await Promise.all([
    getInflectionsForLemma(db, lemma.id),
    getCardsByLemma(db, lemma.id),
    getClustersForLemma(db, lemma.id),
  ])
  const card = cards[0] ?? null

  const clusters = await Promise.all(
    clusterRows.map(async (cluster) => ({
      cluster,
      meanings: card ? await getMeaningsForCluster(db, card.id, cluster.id) : [],
      examples: card ? await getExamplesForCard(db, card.id, cluster.id) : [],
      synonyms: card ? await getSynonymsForCard(db, card.id, cluster.id) : [],
    })),
  )

  return {
    lemma,
    inflections,
    card,
    clusters,
    phrases: card ? await getPhrasesForCard(db, card.id) : [],
    clozes: card ? await getClozesForCard(db, card.id) : [],
  }
}

/**
 * Word detail — the core lookup experience: semantic cluster tabs, meanings,
 * CEFR-controlled examples with the grammar panel, synonyms, phrases, cloze.
 */
export default function WordDetailScreen(): JSX.Element {
  const { form } = useLocalSearchParams<{ form: string }>()
  const { db, ai, tier, defaultCefr } = useServices()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [clusterId, setClusterId] = useState<string | null>(null)
  const [cefr, setCefr] = useState<CefrLevel>(defaultCefr)
  const [contextTab, setContextTab] = useState<(typeof CONTEXT_TABS)[number]>('all')
  const [grammarOpen, setGrammarOpen] = useState(false)
  const [grammarSelection, setGrammarSelection] = useState<string[]>([])
  const [deckPickerOpen, setDeckPickerOpen] = useState(false)
  const [addedToDeck, setAddedToDeck] = useState<string | null>(null)
  const [reportTarget, setReportTarget] = useState<{ targetType: EvaluationTarget; targetId: string } | null>(null)
  const [reportReason, setReportReason] = useState<EvaluationReportReason | null>(null)
  const [reportNote, setReportNote] = useState('')

  // Card action bar state — explanation visibility/generation, translation
  // hiding (a recall-practice toggle: blanks the meaning + example
  // translations without touching the stored data), and the edit modal.
  const [explainVisible, setExplainVisible] = useState(false)
  const [guideModalOpen, setGuideModalOpen] = useState(false)
  const [translationHidden, setTranslationHidden] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editMeaning, setEditMeaning] = useState('')
  const [editExample, setEditExample] = useState('')
  const [editTranslation, setEditTranslation] = useState('')

  const wordQuery = useQuery({
    queryKey: ['word', form],
    queryFn: () => loadWord(db, form ?? ''),
    enabled: (form ?? '') !== '',
  })

  const decksQuery = useQuery({
    queryKey: ['decks'],
    queryFn: () => getAllDecks(db),
    enabled: deckPickerOpen,
  })

  const word = wordQuery.data
  const activeClusterId = clusterId ?? word?.clusters[0]?.cluster.id ?? null
  const active = word?.clusters.find((c) => c.cluster.id === activeClusterId)
  const headlineMeaning = active?.meanings.find((m) => m.isPrimary) ?? active?.meanings[0]
  const selectedExample = active?.examples.find((ex) => ex.isSelected) ?? active?.examples[0]

  const evaluationTargetIds = (word?.clusters ?? []).flatMap((c) => [
    ...c.examples.map((ex) => ex.id),
    ...c.synonyms.map((syn) => syn.id),
  ])
  const evaluationsQuery = useQuery({
    queryKey: ['evaluations', form],
    queryFn: () => getLatestEvaluationsForTargets(db, evaluationTargetIds),
    enabled: !!word,
  })
  const ratingFor = (targetId: string): 'up' | 'down' | undefined =>
    evaluationsQuery.data?.get(targetId)?.rating

  const generateExamples = useMutation({
    mutationFn: async () => {
      if (!ai) throw new Error(t('Add your OpenAI key in Settings to generate examples.'))
      if (!word || !active || !word.card) throw new Error(t('This word has no card yet.'))
      const result = await ai.generateExamples(
        word.lemma.form,
        { label: active.cluster.label, description: active.cluster.description },
        { cefrLevel: cefr, language: word.lemma.language },
        { grammar: grammarSelection },
      )
      const promptVersion = await getActivePromptVersion(db, 'examples')
      if (!promptVersion) throw new Error('Prompt versions are not seeded yet.')
      await persistRegeneratedExamples(db, {
        cardId: word.card.id,
        clusterId: active.cluster.id,
        examples: result.data,
        usage: {
          provider: ai.name,
          model: ai.model,
          promptVersionId: promptVersion.id,
          generatedAt: Date.now(),
          tokensUsed: result.usage.tokensUsed,
          latencyMs: result.usage.latencyMs,
        },
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['word', form] }),
  })

  const evaluate = useMutation({
    mutationFn: (args: { targetType: EvaluationTarget; targetId: string; rating: 'up' | 'down' }) =>
      setEvaluation(db, args),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['evaluations', form] }),
    onError: (error: unknown) => Alert.alert(t('Could not save your feedback'), String(error)),
  })

  const report = useMutation({
    mutationFn: (args: { targetType: EvaluationTarget; targetId: string; reason: EvaluationReportReason; note: string }) =>
      setEvaluation(db, {
        targetType: args.targetType,
        targetId: args.targetId,
        rating: 'down',
        reason: args.reason,
        ...(args.note.trim() !== '' && { note: args.note.trim() }),
      }),
    onSuccess: async () => {
      setReportTarget(null)
      setReportReason(null)
      setReportNote('')
      await queryClient.invalidateQueries({ queryKey: ['evaluations', form] })
    },
    onError: (error: unknown) => Alert.alert(t('Could not save your report'), String(error)),
  })

  const setPrimaryMeaning = useMutation({
    mutationFn: (meaningId: string) => {
      if (!word?.card) throw new Error(t('This word has no card yet.'))
      return updatePrimaryMeaning(db, word.card.id, meaningId)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['word', form] }),
    onError: (error: unknown) => Alert.alert(t('Could not change the primary meaning'), String(error)),
  })

  const selectExample = useMutation({
    mutationFn: (exampleId: string) => {
      if (!word?.card) throw new Error(t('This word has no card yet.'))
      return updateSelectedExample(db, word.card.id, exampleId)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['word', form] }),
    onError: (error: unknown) => Alert.alert(t('Could not update the flashcard example'), String(error)),
  })

  const addToDeck = useMutation({
    mutationFn: async (deckId: string) => {
      if (!word?.card) throw new Error(t('This word has no card yet.'))
      await addCardToDeck(db, deckId, word.card.id)
      return deckId
    },
    onSuccess: async (deckId) => {
      setAddedToDeck(deckId)
      setDeckPickerOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['decks'] })
      await queryClient.invalidateQueries({ queryKey: ['deck-counts'] })
    },
  })

  const toggleGrammar = (option: string): void => {
    setGrammarSelection((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option],
    )
  }

  // Book icon: reveal a stored explanation, or generate one on demand
  // (persisted so it's stored next time — see updateMeaningText) if this
  // meaning has none yet and an AI provider is configured.
  const generateExplanation = useMutation({
    mutationFn: async () => {
      if (!ai) throw new Error(t('Add your AI provider key in Settings to generate an explanation.'))
      if (!word || !active || !headlineMeaning) throw new Error(t('This word has no meaning yet.'))
      const result = await ai.generateMeaning(
        word.lemma.form,
        { label: active.cluster.label, description: active.cluster.description },
        { cefrLevel: cefr, language: word.lemma.language },
      )
      const explanation = result.data[0]?.explanation ?? ''
      await updateMeaningText(db, headlineMeaning.id, headlineMeaning.translation, explanation)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['word', form] }),
    onError: (error: unknown) => Alert.alert(t('Could not generate an explanation'), String(error)),
  })

  // Checked before AI generation, and on EVERY tap (not just when nothing is
  // stored yet): a bulk-installed, pre-generated dictionary (see
  // LingoraDocs/6_word_guides_plan.md) that's free and works even without an
  // AI key configured. Priority order: stored explanation that isn't just
  // the dictionary's own intro text (plain text) → this installed
  // dictionary (the rich WordGuideModal — see components/WordGuideModal.tsx)
  // → live AI (plain text) → "AI not configured". The `stored === intro`
  // check is what upgrades a word whose explanation was persisted by an
  // older build of this screen (which used to copy guide.intro into
  // meanings.explanation) to the rich card instead of being stuck showing
  // that intro as plain text forever — a genuinely AI-written or
  // user-edited explanation never matches, so it's always left as plain
  // text, per the explicit intent this priority order was designed around.
  const lookupWordGuide = useMutation({
    mutationFn: () => {
      if (!word || !headlineMeaning) throw new Error(t('This word has no meaning yet.'))
      return getWordGuide(db, word.lemma.form, word.lemma.language)
    },
    onSuccess: (guide) => {
      const stored = headlineMeaning?.explanation.trim() ?? ''
      if (guide && (stored === '' || stored === guide.intro.trim())) {
        setExplainVisible(false)
        setGuideModalOpen(true)
        return
      }
      if (stored !== '') {
        setExplainVisible(true)
        return
      }
      if (tier !== 'full') {
        setExplainVisible(false)
        Alert.alert(
          t('AI not configured'),
          t('Add an OpenAI, Mistral, Gemini, or Claude key in Settings to generate an explanation for this meaning.'),
        )
        return
      }
      setExplainVisible(true)
      generateExplanation.mutate()
    },
    onError: (error: unknown) => Alert.alert(t('Could not look up an explanation'), String(error)),
  })

  const handleExplain = (): void => {
    if (!headlineMeaning) return
    if (explainVisible || guideModalOpen) {
      setExplainVisible(false)
      setGuideModalOpen(false)
      return
    }
    setExplainVisible(true)
    lookupWordGuide.mutate()
  }

  const openEdit = (): void => {
    if (!headlineMeaning) return
    setEditMeaning(headlineMeaning.translation)
    setEditExample(selectedExample?.sentence ?? '')
    setEditTranslation(selectedExample?.translation ?? '')
    setEditOpen(true)
  }

  const saveEdit = useMutation({
    mutationFn: async () => {
      if (!headlineMeaning) throw new Error(t('This word has no meaning yet.'))
      await Promise.all([
        updateMeaningText(db, headlineMeaning.id, editMeaning, headlineMeaning.explanation),
        selectedExample ? updateExampleText(db, selectedExample.id, editExample, editTranslation) : Promise.resolve(),
      ])
    },
    onSuccess: async () => {
      setEditOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['word', form] })
    },
    onError: (error: unknown) => Alert.alert(t('Could not save your changes'), String(error)),
  })

  const handleLookup = (): void => {
    if (!word) return
    void Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(word.lemma.form)}`)
  }

  if (wordQuery.isPending) {
    return (
      <>
        <Stack.Screen options={{ title: form ?? '' }} />
        <Spinner />
      </>
    )
  }

  if (wordQuery.isError || !word) {
    return (
      <>
        <Stack.Screen options={{ title: form ?? '' }} />
        <ErrorState
          message={
            wordQuery.isError
              ? String(wordQuery.error)
              : t('"{{form}}" isn\'t in your library yet. Look it up from the Search tab to generate it.', { form: form ?? '' })
          }
          {...(wordQuery.isError && { onRetry: () => void wordQuery.refetch() })}
        />
      </>
    )
  }

  const lemmaMeta = [
    word.lemma.partOfSpeech,
    word.lemma.gender,
    word.lemma.plural ? `pl. ${word.lemma.plural}` : undefined,
  ]
    .filter(Boolean)
    .join(' · ')
  const inflectionMeta = word.inflections
    .filter((inf) => inf.surface !== word.lemma.form)
    .map((inf) => inf.surface)
    .join(' · ')

  return (
    <>
      <Stack.Screen options={{ title: word.lemma.form }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        {/* ── Word header ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.wordForm}>{word.lemma.form}</Text>
            <Text style={styles.wordMeta}>
              {lemmaMeta}
              {inflectionMeta ? ` · ${inflectionMeta}` : ''}
            </Text>
          </View>
          <SpeakerButton text={word.lemma.form} language={word.lemma.language} size={26} />
        </View>

        {/* ── Cluster tabs (one per semantic context) ── */}
        <View style={styles.clusterTabs}>
          {word.clusters.map(({ cluster }) => (
            <Pressable
              key={cluster.id}
              onPress={() => setClusterId(cluster.id)}
              style={[styles.clusterTab, cluster.id === activeClusterId && styles.clusterTabActive]}
            >
              <Text
                style={[
                  styles.clusterTabLabel,
                  cluster.id === activeClusterId && styles.clusterTabLabelActive,
                ]}
              >
                {cluster.label}
              </Text>
              <CefrBadge level={cluster.cefrLevel} />
            </Pressable>
          ))}
        </View>

        {active ? (
          <>
            {/* ── Meanings ── */}
            {active.meanings.length > 0 && headlineMeaning ? (
              <>
                <Card style={styles.meaningCard}>
                  <Text style={styles.primaryMeaning}>
                    {translationHidden ? '•••' : headlineMeaning.translation}
                  </Text>
                  {explainVisible ? (
                    <Text style={styles.explanation}>
                      {lookupWordGuide.isPending || generateExplanation.isPending
                        ? t('Generating…')
                        : headlineMeaning.explanation || t('No explanation yet.')}
                    </Text>
                  ) : null}
                  {/* Only OTHER meanings in this cluster get a "make primary" chip —
                      offering one for the meaning already shown as the headline is a
                      no-op that reads as a confusing duplicate. */}
                  {active.meanings.filter((m) => m.id !== headlineMeaning.id).length > 0 ? (
                    <View style={styles.secondaryRow}>
                      {active.meanings
                        .filter((m) => m.id !== headlineMeaning.id)
                        .map((m) => (
                          <Chip
                            key={m.id}
                            label={m.isPrimary ? m.translation : t('Make primary: {{translation}}', { translation: m.translation })}
                            {...(!m.isPrimary && { onPress: () => setPrimaryMeaning.mutate(m.id) })}
                          />
                        ))}
                    </View>
                  ) : null}
                </Card>
                <CardActionBar
                  onExplain={handleExplain}
                  explainVisible={explainVisible}
                  explainLoading={lookupWordGuide.isPending || generateExplanation.isPending}
                  onToggleTranslation={() => setTranslationHidden((hidden) => !hidden)}
                  translationHidden={translationHidden}
                  onEdit={openEdit}
                  onLookup={handleLookup}
                />
              </>
            ) : null}

            {/* ── Examples ── */}
            <SectionHeader title={t('Examples')} />

            {/* CEFR selector — the level new generations target */}
            <View style={styles.chipRow}>
              {CEFR_LEVELS.map((level) => (
                <Chip
                  key={level}
                  label={level}
                  selected={level === cefr}
                  color={cefrColors[level]}
                  onPress={() => setCefr(level)}
                />
              ))}
            </View>

            {/* Context category tabs */}
            <View style={styles.chipRow}>
              {CONTEXT_TABS.map((tab) => (
                <Chip
                  key={tab}
                  label={tab.replace('_', ' ')}
                  selected={tab === contextTab}
                  onPress={() => setContextTab(tab)}
                />
              ))}
            </View>

            {active.examples
              .filter((ex) => contextTab === 'all' || ex.context === contextTab)
              .map((ex) => (
                <Card key={ex.id} style={styles.exampleCard}>
                  {ex.isSelected ? (
                    <View style={styles.selectedBanner}>
                      <Ionicons name="star" size={11} color={colors.primary} />
                      <Text style={styles.selectedBannerLabel}>{t('shown on flashcard')}</Text>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.selectedBanner}
                      onPress={() => selectExample.mutate(ex.id)}
                      disabled={selectExample.isPending}
                    >
                      <Ionicons name="star-outline" size={11} color={colors.textMuted} />
                      <Text style={styles.useOnFlashcardLabel}>{t('use on flashcard')}</Text>
                    </Pressable>
                  )}
                  <View style={styles.exampleSentenceRow}>
                    <Text style={styles.exampleSentence}>{ex.sentence}</Text>
                    <SpeakerButton text={ex.sentence} language={word.lemma.language} size={16} />
                  </View>
                  <Text style={styles.exampleTranslation}>{translationHidden ? '•••' : ex.translation}</Text>
                  <View style={styles.exampleFooter}>
                    <View style={styles.tagRow}>
                      <CefrBadge level={ex.cefrLevel} />
                      {(ex.grammarTags ?? []).map((tag) => (
                        <Chip key={tag} label={tag} />
                      ))}
                    </View>
                    <EvalBar
                      activeRating={ratingFor(ex.id)}
                      onUp={() => evaluate.mutate({ targetType: 'example', targetId: ex.id, rating: 'up' })}
                      onDown={() => evaluate.mutate({ targetType: 'example', targetId: ex.id, rating: 'down' })}
                      onReport={() => setReportTarget({ targetType: 'example', targetId: ex.id })}
                      {...(tier === 'full' && { onRegen: () => generateExamples.mutate() })}
                    />
                  </View>
                </Card>
              ))}

            {/* ── Grammar controls panel (advanced, collapsible) ── */}
            <Pressable style={styles.grammarToggle} onPress={() => setGrammarOpen((v) => !v)}>
              <Ionicons name="options" size={16} color={colors.primary} />
              <Text style={styles.grammarToggleLabel}>
                {t('Advanced grammar options')}{grammarSelection.length > 0 ? ` (${grammarSelection.length})` : ''}
              </Text>
              <Ionicons name={grammarOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
            </Pressable>

            {grammarOpen ? (
              <Card style={styles.grammarPanel}>
                {GRAMMAR_GROUPS.map((group) => (
                  <View key={group.title} style={styles.grammarGroup}>
                    <Text style={styles.grammarGroupTitle}>{t(group.title)}</Text>
                    <View style={styles.chipRow}>
                      {group.options.map((option) => (
                        <Chip
                          key={option}
                          label={option}
                          selected={grammarSelection.includes(option)}
                          onPress={() => toggleGrammar(option)}
                        />
                      ))}
                    </View>
                  </View>
                ))}
                {grammarSelection.length > 0 ? (
                  <Text style={styles.grammarSummary}>{t('Active: {{selection}}', { selection: grammarSelection.join(' + ') })}</Text>
                ) : null}
                {tier === 'full' ? (
                  <Button
                    label={generateExamples.isPending ? t('Generating…') : t('Generate examples')}
                    icon="sparkles"
                    disabled={generateExamples.isPending}
                    onPress={() => generateExamples.mutate()}
                  />
                ) : (
                  <Text style={styles.limitedHint}>
                    {t('Add your OpenAI key in Settings to generate targeted examples.')}
                  </Text>
                )}
                {generateExamples.isError ? (
                  <Text style={styles.generateError}>{String(generateExamples.error)}</Text>
                ) : null}
              </Card>
            ) : null}

            {/* ── Synonyms ── */}
            {active.synonyms.length > 0 ? (
              <>
                <SectionHeader title={t('Synonyms')} />
                <Card>
                  {active.synonyms.map((syn, i) => (
                    <View key={syn.id} style={[styles.synRow, i > 0 && styles.rowDivider]}>
                      <View style={styles.synText}>
                        <Text style={styles.synWord}>{syn.word}</Text>
                        <Text style={styles.synNuance}>
                          {syn.formality}
                          {syn.nuance ? ` · ${syn.nuance}` : ''}
                        </Text>
                      </View>
                      <CefrBadge level={syn.cefrLevel} />
                      <EvalBar
                        activeRating={ratingFor(syn.id)}
                        onUp={() => evaluate.mutate({ targetType: 'synonym', targetId: syn.id, rating: 'up' })}
                        onDown={() => evaluate.mutate({ targetType: 'synonym', targetId: syn.id, rating: 'down' })}
                        onReport={() => setReportTarget({ targetType: 'synonym', targetId: syn.id })}
                      />
                    </View>
                  ))}
                </Card>
              </>
            ) : null}
          </>
        ) : null}

        {/* ── Phrases (card-scoped, shown for every cluster) ── */}
        {word.phrases.length > 0 ? (
          <>
            <SectionHeader title={t('Phrases & collocations')} />
            {word.phrases.map((phrase) => (
              <Card key={phrase.id} style={styles.phraseCard}>
                <View style={styles.phraseHeader}>
                  <Text style={styles.phraseExpression}>{phrase.expression}</Text>
                  <CefrBadge level={phrase.cefrLevel} />
                </View>
                <Text style={styles.phraseMeaning}>{phrase.meaning}</Text>
                <Text style={styles.phraseExample}>„{phrase.exampleSentence}"</Text>
                <Text style={styles.phraseExampleTranslation}>{phrase.exampleTranslation}</Text>
              </Card>
            ))}
          </>
        ) : null}

        {/* ── Cloze preview ── */}
        {word.clozes.length > 0 ? (
          <>
            <SectionHeader title={word.clozes.length === 1 ? t('Cloze card') : t('Cloze cards')} />
            {word.clozes.map((cloze) => (
              <Card key={cloze.id} style={styles.clozeCard}>
                <Text style={styles.clozeSentence}>{cloze.sentence}</Text>
                <Text style={styles.clozeTranslation}>{cloze.translation}</Text>
                <View style={styles.clozeAnswerPill}>
                  <Text style={styles.clozeAnswerLabel}>{cloze.answer}</Text>
                </View>
              </Card>
            ))}
          </>
        ) : null}

        <View style={{ height: 96 }} />
      </ScrollView>

      {/* ── Sticky add-to-deck bar ── */}
      {word.card ? (
        <View style={styles.bottomBar}>
          <Button
            label={addedToDeck ? t('Added ✓ — add to another deck') : t('Add to deck')}
            icon="add-circle"
            onPress={() => setDeckPickerOpen(true)}
            style={styles.addButton}
          />
        </View>
      ) : null}

      {/* ── Deck picker modal ── */}
      <Modal visible={deckPickerOpen} animationType="slide" transparent onRequestClose={() => setDeckPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDeckPickerOpen(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{t('Add "{{form}}" to…', { form: word.lemma.form })}</Text>
          {decksQuery.isPending ? (
            <Spinner />
          ) : decksQuery.isError ? (
            <ErrorState message={String(decksQuery.error)} onRetry={() => void decksQuery.refetch()} />
          ) : (
            (decksQuery.data ?? []).map((deck) => (
              <Pressable
                key={deck.id}
                style={[styles.deckRow, addToDeck.isPending && styles.deckRowDisabled]}
                onPress={() => addToDeck.mutate(deck.id)}
                disabled={addToDeck.isPending}
              >
                <Text style={styles.deckEmoji}>{deck.emoji ?? '📚'}</Text>
                <Text style={styles.deckName}>{deck.name}</Text>
                {addedToDeck === deck.id ? (
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                ) : null}
              </Pressable>
            ))
          )}
          {addToDeck.isError ? (
            <Text style={styles.generateError}>{String(addToDeck.error)}</Text>
          ) : null}
        </View>
      </Modal>

      {/* ── Edit this card — the CardActionBar's pencil icon ── */}
      <Modal visible={editOpen} animationType="slide" transparent onRequestClose={() => setEditOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditOpen(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{t('Edit this card')}</Text>
          <Text style={styles.editLabel}>{t('Meaning')}</Text>
          <TextInput
            style={styles.editInput}
            value={editMeaning}
            onChangeText={setEditMeaning}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.editLabel}>{t('Example sentence')}</Text>
          <TextInput
            style={styles.editInput}
            value={editExample}
            onChangeText={setEditExample}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.editLabel}>{t('Example translation')}</Text>
          <TextInput
            style={styles.editInput}
            value={editTranslation}
            onChangeText={setEditTranslation}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
          {saveEdit.isError ? <Text style={styles.generateError}>{String(saveEdit.error)}</Text> : null}
          <View style={styles.reportActions}>
            <Button label={t('Cancel')} variant="ghost" onPress={() => setEditOpen(false)} />
            <Button
              label={saveEdit.isPending ? t('Saving…') : t('Save changes')}
              icon="save"
              onPress={() => saveEdit.mutate()}
              disabled={saveEdit.isPending}
            />
          </View>
        </View>
      </Modal>

      {/* ── Report modal ── */}
      <Modal
        visible={reportTarget !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setReportTarget(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setReportTarget(null)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{t("What's wrong with this?")}</Text>
          <View style={styles.chipRow}>
            {REPORT_REASONS.map((r) => (
              <Chip
                key={r.value}
                label={t(r.label)}
                selected={reportReason === r.value}
                onPress={() => setReportReason(r.value)}
              />
            ))}
          </View>
          <TextInput
            style={styles.reportNoteInput}
            placeholder={t('Optional details…')}
            placeholderTextColor={colors.textMuted}
            multiline
            value={reportNote}
            onChangeText={setReportNote}
          />
          {report.isError ? <Text style={styles.generateError}>{String(report.error)}</Text> : null}
          <View style={styles.reportActions}>
            <Button label={t('Cancel')} variant="ghost" onPress={() => setReportTarget(null)} />
            <Button
              label={report.isPending ? t('Sending…') : t('Send report')}
              disabled={reportReason === null || report.isPending}
              onPress={() =>
                reportTarget &&
                reportReason &&
                report.mutate({ ...reportTarget, reason: reportReason, note: reportNote })
              }
            />
          </View>
        </View>
      </Modal>

      <WordGuideModal
        visible={guideModalOpen}
        guide={lookupWordGuide.data ?? null}
        onClose={() => setGuideModalOpen(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerText: { flex: 1, marginRight: spacing.md },
  wordForm: { fontSize: type.title, fontWeight: '800', color: colors.text },
  wordMeta: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
  clusterTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  clusterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  clusterTabActive: { backgroundColor: colors.primary },
  clusterTabLabel: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary },
  clusterTabLabelActive: { color: colors.textOnPrimary },
  meaningCard: { marginTop: spacing.lg },
  primaryMeaning: { fontSize: type.heading, fontWeight: '800', color: colors.text },
  explanation: { fontSize: type.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 21 },
  secondaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  exampleCard: { marginBottom: spacing.sm },
  selectedBanner: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm },
  selectedBannerLabel: { fontSize: type.micro, fontWeight: '700', color: colors.primary },
  useOnFlashcardLabel: { fontSize: type.micro, fontWeight: '600', color: colors.textMuted },
  reportNoteInput: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: type.body,
    color: colors.text,
    textAlignVertical: 'top',
  },
  reportActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.sm },
  editLabel: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.sm },
  editInput: {
    fontSize: type.body,
    color: colors.text,
    minHeight: 44,
    textAlignVertical: 'top',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  exampleSentenceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  exampleSentence: { flex: 1, fontSize: type.body, fontWeight: '600', color: colors.text, lineHeight: 22 },
  exampleTranslation: { fontSize: type.caption, color: colors.textSecondary, marginTop: 4 },
  exampleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center', flex: 1 },
  grammarToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  grammarToggleLabel: { fontSize: type.caption, fontWeight: '700', color: colors.primary },
  grammarPanel: { gap: spacing.md, marginBottom: spacing.md },
  grammarGroup: {},
  grammarGroupTitle: { fontSize: type.caption, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  grammarSummary: { fontSize: type.micro, color: colors.textSecondary, fontStyle: 'italic' },
  limitedHint: { fontSize: type.caption, color: colors.textSecondary, textAlign: 'center' },
  generateError: { fontSize: type.caption, color: colors.danger },
  synRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  synText: { flex: 1, marginRight: spacing.md },
  synWord: { fontSize: type.body, fontWeight: '700', color: colors.text },
  synNuance: { fontSize: type.caption, color: colors.textSecondary, marginTop: 1 },
  phraseCard: { marginBottom: spacing.sm },
  phraseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phraseExpression: { fontSize: type.body, fontWeight: '700', color: colors.primary },
  phraseMeaning: { fontSize: type.caption, color: colors.text, marginTop: 2 },
  phraseExample: { fontSize: type.caption, color: colors.textSecondary, marginTop: spacing.sm, fontStyle: 'italic' },
  phraseExampleTranslation: { fontSize: type.micro, color: colors.textMuted, marginTop: 1 },
  clozeCard: { alignItems: 'center', marginBottom: spacing.sm },
  clozeSentence: { fontSize: type.subheading, fontWeight: '700', color: colors.text, textAlign: 'center' },
  clozeTranslation: { fontSize: type.caption, color: colors.textSecondary, marginTop: spacing.sm },
  clozeAnswerPill: {
    marginTop: spacing.md,
    backgroundColor: colors.successSoft,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
  },
  clozeAnswerLabel: { fontSize: type.body, fontWeight: '700', color: colors.success },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addButton: {},
  modalBackdrop: { flex: 1, backgroundColor: '#00000066' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  modalTitle: { fontSize: type.subheading, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  deckRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  deckRowDisabled: { opacity: 0.5 },
  deckEmoji: { fontSize: 20 },
  deckName: { flex: 1, fontSize: type.body, fontWeight: '600', color: colors.text },
})
