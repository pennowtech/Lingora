import { Ionicons } from '@expo/vector-icons'
import type { CefrLevel } from '@lingora/types'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useState, type JSX } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button, Card, CefrBadge, Chip, EvalBar, IconButton, SectionHeader } from '../../components/ui'
import { dummyDecks, dummyWord, type DummyCluster } from '../../lib/dummy'
import { cefrColors, colors, radius, spacing, type } from '../../lib/theme'

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const CONTEXT_TABS = ['all', 'casual', 'business', 'travel', 'daily_life'] as const

/**
 * Grammar options panel groups, straight from the roadmap's Phase 4 spec.
 * TODO(phase3): these selections become parameters of the AI example
 * generation call; tags on results come from examples.grammar_tags.
 */
const GRAMMAR_GROUPS: Array<{ title: string; options: string[] }> = [
  { title: 'Tense & mood', options: ['Konjunktiv II', 'Präteritum', 'Perfekt', 'Futur I', 'Plusquamperfekt'] },
  { title: 'Sentence structure', options: ['Passive voice', 'Relative clause', 'Indirect speech', 'Question form'] },
  { title: 'Conjunctions', options: ['als ob / als hätte', 'obwohl', 'damit', 'weil / da', 'nicht nur … sondern auch'] },
  { title: 'Focus words', options: ['selbst / sogar', 'jemals', 'Modalpartikeln (doch, ja, halt)'] },
]

/**
 * Word detail — the core lookup experience: semantic cluster tabs, meanings,
 * CEFR-controlled examples with the grammar panel, synonyms, phrases, cloze.
 *
 * TODO(phase4): everything below renders dummyWord. Replace with repository
 * calls keyed by the route param: findLemmaBySurfaceForm/getLemmaByForm →
 * getClustersForLemma → getMeaningsForCluster/getExamplesForCard/… via
 * React Query. Regenerate/thumbs actions wire to Phase 3 AI + evaluations.
 */
export default function WordDetailScreen(): JSX.Element {
  const { form } = useLocalSearchParams<{ form: string }>()
  const word = dummyWord // TODO(phase4): look up by `form` in the database

  const [clusterId, setClusterId] = useState(word.clusters[0]?.id ?? '')
  const [cefr, setCefr] = useState<CefrLevel>('A2')
  const [contextTab, setContextTab] = useState<(typeof CONTEXT_TABS)[number]>('all')
  const [grammarOpen, setGrammarOpen] = useState(false)
  const [grammarSelection, setGrammarSelection] = useState<string[]>([])
  const [deckPickerOpen, setDeckPickerOpen] = useState(false)

  const cluster: DummyCluster | undefined = word.clusters.find((c) => c.id === clusterId)

  const toggleGrammar = (option: string): void => {
    setGrammarSelection((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option],
    )
  }

  const noop = (): void => undefined

  return (
    <>
      <Stack.Screen options={{ title: form ?? word.form }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        {/* ── Word header ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.wordForm}>{word.form}</Text>
            <Text style={styles.wordMeta}>
              {word.partOfSpeech} · {word.inflections.join(' · ')}
            </Text>
          </View>
          {/* TODO(post-v1): play pronunciation from the audio table */}
          <IconButton icon="volume-high" size={26} color={colors.primary} onPress={noop} />
        </View>

        {/* ── Cluster tabs (one per semantic context) ── */}
        <View style={styles.clusterTabs}>
          {word.clusters.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setClusterId(c.id)}
              style={[styles.clusterTab, c.id === clusterId && styles.clusterTabActive]}
            >
              <Text style={[styles.clusterTabLabel, c.id === clusterId && styles.clusterTabLabelActive]}>
                {c.label}
              </Text>
              <CefrBadge level={c.cefr} />
            </Pressable>
          ))}
        </View>

        {cluster ? (
          <>
            {/* ── Meanings ── */}
            <Card style={styles.meaningCard}>
              <Text style={styles.primaryMeaning}>{cluster.primaryMeaning}</Text>
              <Text style={styles.explanation}>{cluster.explanation}</Text>
              <View style={styles.secondaryRow}>
                {cluster.secondaryMeanings.map((m) => (
                  <Chip key={m} label={m} />
                ))}
              </View>
            </Card>

            {/* ── Examples ── */}
            <SectionHeader title="Examples" />

            {/* CEFR selector — regenerates examples at that level (Phase 3) */}
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

            {cluster.examples
              .filter((ex) => contextTab === 'all' || ex.context === contextTab)
              .map((ex) => (
                <Card key={ex.id} style={styles.exampleCard}>
                  {ex.selected ? (
                    <View style={styles.selectedBanner}>
                      <Ionicons name="star" size={11} color={colors.primary} />
                      <Text style={styles.selectedBannerLabel}>shown on flashcard</Text>
                    </View>
                  ) : null}
                  <Text style={styles.exampleSentence}>{ex.sentence}</Text>
                  <Text style={styles.exampleTranslation}>{ex.translation}</Text>
                  <View style={styles.exampleFooter}>
                    <View style={styles.tagRow}>
                      <CefrBadge level={ex.cefr} />
                      {ex.grammarTags.map((tag) => (
                        <Chip key={tag} label={tag} />
                      ))}
                    </View>
                    {/* TODO(phase4): wire to evaluations repo + AI regenerate */}
                    <EvalBar />
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
                {/* TODO(phase3): calls generateExamples({ cefr, grammar: grammarSelection }) */}
                <Button label="Generate examples" icon="sparkles" onPress={noop} />
              </Card>
            ) : null}

            {/* ── Synonyms ── */}
            <SectionHeader title="Synonyms" />
            <Card>
              {cluster.synonyms.map((syn, i) => (
                <View key={syn.id} style={[styles.synRow, i > 0 && styles.rowDivider]}>
                  <View style={styles.synText}>
                    <Text style={styles.synWord}>{syn.word}</Text>
                    <Text style={styles.synNuance}>
                      {syn.formality} · {syn.nuance}
                    </Text>
                  </View>
                  <CefrBadge level={syn.cefr} />
                </View>
              ))}
            </Card>

            {/* ── Phrases ── */}
            <SectionHeader title="Phrases & collocations" />
            {cluster.phrases.map((phrase) => (
              <Card key={phrase.id} style={styles.phraseCard}>
                <View style={styles.phraseHeader}>
                  <Text style={styles.phraseExpression}>{phrase.expression}</Text>
                  <CefrBadge level={phrase.cefr} />
                </View>
                <Text style={styles.phraseMeaning}>{phrase.meaning}</Text>
                <Text style={styles.phraseExample}>„{phrase.example}"</Text>
                <Text style={styles.phraseExampleTranslation}>{phrase.exampleTranslation}</Text>
              </Card>
            ))}

            {/* ── Cloze preview ── */}
            <SectionHeader title="Cloze card" />
            <Card style={styles.clozeCard}>
              <Text style={styles.clozeSentence}>{cluster.cloze.sentence}</Text>
              <Text style={styles.clozeTranslation}>{cluster.cloze.translation}</Text>
              <View style={styles.clozeAnswerPill}>
                <Text style={styles.clozeAnswerLabel}>{cluster.cloze.answer}</Text>
              </View>
            </Card>
          </>
        ) : null}

        <View style={{ height: 96 }} />
      </ScrollView>

      {/* ── Sticky add-to-deck bar ── */}
      <View style={styles.bottomBar}>
        <Button label="Add to deck" icon="add-circle" onPress={() => setDeckPickerOpen(true)} style={styles.addButton} />
      </View>

      {/* ── Deck picker modal ── */}
      <Modal visible={deckPickerOpen} animationType="slide" transparent onRequestClose={() => setDeckPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDeckPickerOpen(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add "{word.form}" to…</Text>
          {/* TODO(phase4): getAllDecks() + createCardWithState + addCardToDeck */}
          {dummyDecks.map((deck) => (
            <Pressable key={deck.id} style={styles.deckRow} onPress={() => setDeckPickerOpen(false)}>
              <Text style={styles.deckEmoji}>{deck.emoji}</Text>
              <Text style={styles.deckName}>{deck.name}</Text>
              <Text style={styles.deckCount}>{deck.cardCount} cards</Text>
            </Pressable>
          ))}
          <Button label="New deck" icon="add" variant="secondary" onPress={noop} />
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
  clusterTabs: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
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
  clozeCard: { alignItems: 'center' },
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
  deckEmoji: { fontSize: 20 },
  deckName: { flex: 1, fontSize: type.body, fontWeight: '600', color: colors.text },
  deckCount: { fontSize: type.micro, color: colors.textMuted },
})
