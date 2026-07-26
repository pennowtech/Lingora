import { Ionicons } from '@expo/vector-icons'
import type {
  Card as CardRow,
  CefrLevel,
  Cloze,
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
  createEvaluation,
  findLemmaBySurfaceForm,
  getAllDecks,
  getActivePromptVersion,
  getCardsByLemma,
  getClozesForCard,
  getClustersForLemma,
  getExamplesForCard,
  getInflectionsForLemma,
  getLemmaByForm,
  getMeaningsForCluster,
  getPhrasesForCard,
  getSynonymsForCard,
  persistRegeneratedExamples,
  type DatabaseAdapter,
} from '@lingora/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useState, type JSX } from 'react'
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  Button,
  Card,
  CefrBadge,
  Chip,
  ErrorState,
  EvalBar,
  IconButton,
  SectionHeader,
  Spinner,
} from '../../components/ui'
import { useServices } from '../../lib/services'
import { cefrColors, colors, radius, spacing, type } from '../../lib/theme'

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
  const queryClient = useQueryClient()

  const [clusterId, setClusterId] = useState<string | null>(null)
  const [cefr, setCefr] = useState<CefrLevel>(defaultCefr)
  const [contextTab, setContextTab] = useState<(typeof CONTEXT_TABS)[number]>('all')
  const [grammarOpen, setGrammarOpen] = useState(false)
  const [grammarSelection, setGrammarSelection] = useState<string[]>([])
  const [deckPickerOpen, setDeckPickerOpen] = useState(false)
  const [addedToDeck, setAddedToDeck] = useState<string | null>(null)

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

  const generateExamples = useMutation({
    mutationFn: async () => {
      if (!ai) throw new Error('Add your OpenAI key in Settings to generate examples.')
      if (!word || !active || !word.card) throw new Error('This word has no card yet.')
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
    mutationFn: (args: { targetId: string; rating: 'up' | 'down' }) =>
      createEvaluation(db, {
        id: crypto.randomUUID(),
        targetType: 'example',
        targetId: args.targetId,
        rating: args.rating,
        createdAt: Date.now(),
      }),
    onError: (error: unknown) => Alert.alert('Could not save your feedback', String(error)),
  })

  const addToDeck = useMutation({
    mutationFn: async (deckId: string) => {
      if (!word?.card) throw new Error('This word has no card yet.')
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

  const noop = (): void => undefined

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
              : `"${form ?? ''}" isn't in your library yet. Look it up from the Search tab to generate it.`
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
          {/* TODO(post-v1): play pronunciation from the audio table */}
          <IconButton icon="volume-high" size={26} color={colors.primary} onPress={noop} />
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
            {active.meanings.length > 0 ? (
              <Card style={styles.meaningCard}>
                <Text style={styles.primaryMeaning}>
                  {(active.meanings.find((m) => m.isPrimary) ?? active.meanings[0])!.translation}
                </Text>
                <Text style={styles.explanation}>
                  {(active.meanings.find((m) => m.isPrimary) ?? active.meanings[0])!.explanation}
                </Text>
                <View style={styles.secondaryRow}>
                  {active.meanings
                    .filter((m) => !m.isPrimary)
                    .map((m) => (
                      <Chip key={m.id} label={m.translation} />
                    ))}
                </View>
              </Card>
            ) : null}

            {/* ── Examples ── */}
            <SectionHeader title="Examples" />

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
                      <Text style={styles.selectedBannerLabel}>shown on flashcard</Text>
                    </View>
                  ) : null}
                  <Text style={styles.exampleSentence}>{ex.sentence}</Text>
                  <Text style={styles.exampleTranslation}>{ex.translation}</Text>
                  <View style={styles.exampleFooter}>
                    <View style={styles.tagRow}>
                      <CefrBadge level={ex.cefrLevel} />
                      {(ex.grammarTags ?? []).map((tag) => (
                        <Chip key={tag} label={tag} />
                      ))}
                    </View>
                    <EvalBar
                      onUp={() => evaluate.mutate({ targetId: ex.id, rating: 'up' })}
                      onDown={() => evaluate.mutate({ targetId: ex.id, rating: 'down' })}
                      {...(tier === 'full' && { onRegen: () => generateExamples.mutate() })}
                    />
                  </View>
                </Card>
              ))}

            {/* ── Grammar controls panel (advanced, collapsible) ── */}
            <Pressable style={styles.grammarToggle} onPress={() => setGrammarOpen((v) => !v)}>
              <Ionicons name="options" size={16} color={colors.primary} />
              <Text style={styles.grammarToggleLabel}>
                Advanced grammar options{grammarSelection.length > 0 ? ` (${grammarSelection.length})` : ''}
              </Text>
              <Ionicons name={grammarOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
            </Pressable>

            {grammarOpen ? (
              <Card style={styles.grammarPanel}>
                {GRAMMAR_GROUPS.map((group) => (
                  <View key={group.title} style={styles.grammarGroup}>
                    <Text style={styles.grammarGroupTitle}>{group.title}</Text>
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
                  <Text style={styles.grammarSummary}>Active: {grammarSelection.join(' + ')}</Text>
                ) : null}
                {tier === 'full' ? (
                  <Button
                    label={generateExamples.isPending ? 'Generating…' : 'Generate examples'}
                    icon="sparkles"
                    disabled={generateExamples.isPending}
                    onPress={() => generateExamples.mutate()}
                  />
                ) : (
                  <Text style={styles.limitedHint}>
                    Add your OpenAI key in Settings to generate targeted examples.
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
                <SectionHeader title="Synonyms" />
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
            <SectionHeader title="Phrases & collocations" />
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
            <SectionHeader title={word.clozes.length === 1 ? 'Cloze card' : 'Cloze cards'} />
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
            label={addedToDeck ? 'Added ✓ — add to another deck' : 'Add to deck'}
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
          <Text style={styles.modalTitle}>Add "{word.lemma.form}" to…</Text>
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
  exampleSentence: { fontSize: type.body, fontWeight: '600', color: colors.text, lineHeight: 22 },
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
  synRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
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
