import type { MinedPassageAnalysis, QuestionType } from '@lingora/types'
import {
  addCardToDeck,
  createDeck,
  findLemmaBySurfaceForm,
  getCardByLemmaAndNativeLanguage,
  isCardInDeck,
  updateMineEntryProcessed,
  updateMineEntryStatus,
} from '@lingora/database'
import { AI_GENERATED_SOURCES } from '@lingora/core'
import { logger } from '@lingora/observability'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams, Stack } from 'expo-router'
import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { DeckPickerModal } from '../../components/DeckPickerModal'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { Icon } from '../../components/Icon'
import { ProgressOverlay } from '../../components/ProgressOverlay'
import { AlertModal, Button, Card, CefrBadge, EmptyState, IconButton } from '../../components/ui'
import { clearCachedAnalysis, getCachedAnalysis, setCachedAnalysis } from '../../lib/miningCache'
import { useServices } from '../../lib/services'
import { speak } from '../../lib/speech'
import { useToast } from '../../lib/ToastContext'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'mining', screen: 'MiningStudioScreen' })

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'studio-overview',
    title: 'How Passage Mining works',
    icon: 'Sparkles',
    paragraphs: [
      '**Passage Mining** analyzes the whole passage at once: a fluent translation, a grammar breakdown, and a shortlist of key vocabulary.',
      'Grammar explanations and word difficulty are automatically tailored to *your CEFR level* from Settings.',
      'A **tinted green background** on the passage means at least one card has already been mined from it.',
    ],
  },
  {
    id: 'deck-export',
    title: 'Adding words to your decks',
    icon: 'Layers',
    paragraphs: [
      'Select any key words extracted from the passage and tap **Add to Deck**.',
      'Selected words are generated as full flashcards, with the source sentence saved as your example.',
      'A word you already have a card for is reported as **already present**, never as failed - nothing is duplicated or overwritten.',
    ],
  },
  {
    id: 'regenerate',
    title: 'Re-analyzing a passage',
    icon: 'RefreshCw',
    paragraphs: [
      'Tap the refresh icon next to the passage to *regenerate* its translation and grammar breakdown.',
      'Useful if the first analysis missed something, or after you change your CEFR level in Settings.',
    ],
  },
]

export default function MiningStudioScreen(): JSX.Element {
  const params = useLocalSearchParams<{ initialText?: string; sourceId?: string; mined?: string }>()
  const { db, ai, pipeline, defaultCefr, nativeLanguage, targetLanguage } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const text = (params.initialText ?? '').trim()
  // Cached and looked up per source passage - falls back to the raw text itself so a passage
  // opened without a queue entry (no sourceId) still gets a stable key for this session.
  const cacheKey = params.sourceId ?? text
  const [analysis, setAnalysis] = useState<MinedPassageAnalysis | null>(null)
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [deckPickerOpen, setDeckPickerOpen] = useState(false)
  const [errorNotice, setErrorNotice] = useState<{ title: string; message: string } | null>(null)
  // Seeded from the Mining Studio list's own processed flag (see mine.tsx's openStudioWithEntry),
  // then flipped locally the moment a card actually gets added here - so the passage highlights
  // immediately without needing to navigate back and re-open it.
  const [isMined, setIsMined] = useState(params.mined === '1')

  const help = useHelpAccordion('studio-overview')

  // Analyze passage mutation
  const analyzeMutation = useMutation({
    mutationFn: async (passageText: string) => {
      if (!ai) {
        throw new Error(t('No AI provider is active. Add and enable one in Settings to analyze passages.'))
      }
      const trimmed = passageText.trim()
      if (!trimmed) throw new Error(t('No passage text to analyze.'))

      log.info('mining.studio_analyze_started', {
        message: `Analyzing passage in Mining Studio (length: ${trimmed.length}, cefr: ${defaultCefr})`,
      })

      const res = await ai.analyzePassage(trimmed, {
        cefrLevel: defaultCefr,
        language: targetLanguage,
        nativeLanguage,
      })
      return res.data
    },
    onSuccess: (data) => {
      setCachedAnalysis(cacheKey, data)
      setAnalysis(data)
      // Pre-select all extracted vocabulary candidates by default
      setSelectedWords(data.vocabulary.map((w) => w.form))
    },
    onError: (error: unknown) => {
      log.error('mining.studio_analyze_failed', error, { message: 'Passage analysis failed' })
      setErrorNotice({
        title: t('Analysis failed'),
        message: error instanceof Error ? error.message : String(error),
      })
    },
  })

  // Serve a cached analysis for this passage first (kept for the life of the app process, wiped
  // on a real relaunch - see lib/miningCache.ts) instead of re-billing the AI provider on every
  // visit; only fall through to a fresh call on a genuine cache miss.
  useEffect(() => {
    if (!text || (analysis ?? analyzeMutation.isPending) || analyzeMutation.isError || analyzeMutation.isSuccess) {
      return
    }
    const cached = getCachedAnalysis(cacheKey)
    if (cached) {
      setAnalysis(cached)
      setSelectedWords(cached.vocabulary.map((w) => w.form))
      return
    }
    // No AI, no point firing the mutation just to have it throw into an "Analysis failed" error
    // popup - the render below shows a calm, AI-only setup prompt instead (Mining has no
    // dictionary fallback the way Search/Word of the Day do, so there's nothing else to offer).
    if (!ai) return
    analyzeMutation.mutate(text)
  }, [text, ai])

  const regenerate = (): void => {
    clearCachedAnalysis(cacheKey)
    setAnalysis(null)
    analyzeMutation.mutate(text)
  }

  // Batch add words to deck mutation. Every outcome is additive: `generated` already adds its
  // own deck_cards row (persistWordGeneration's addToDeck defaults true); `existing` short-circuits
  // before any persistence at all, so it needs an explicit addCardToDeck here or the word never
  // reaches the requested deck. Either way, deck_cards' UNIQUE(deck_id, card_id) + INSERT OR IGNORE
  // means re-adding an already-member card is a no-op, never a duplicate or overwrite.
  const addWordsMutation = useMutation({
    mutationFn: async ({ deckId, deckName }: { deckId: string; deckName: string }) => {
      if (!pipeline) {
        throw new Error(t('No AI provider is active. Add and enable one in Settings to generate cards.'))
      }
      if (!analysis) return

      const chosen = analysis.vocabulary.filter((w) => selectedWords.includes(w.form))
      if (chosen.length === 0) return

      let firstCardId: string | null = null
      const failed: string[] = []
      const alreadyPresent: string[] = []
      let succeeded = 0

      const resolveExistingCard = async (word: { form: string }) => {
        const lemma = await findLemmaBySurfaceForm(db, word.form)
        if (!lemma) return null
        const card = await getCardByLemmaAndNativeLanguage(db, lemma.id, nativeLanguage)
        const isFullAiCard = !!card?.source && AI_GENERATED_SOURCES.includes(card.source)
        return card && isFullAiCard ? card : null
      }

      for (const word of chosen) {
        try {
          // Check for a full AI card ourselves first, using the same criteria lookupOrGenerate
          // uses internally - this sidesteps it entirely for a word that's already fully mined
          // (no generation call, no risk of the upgrade-path lemma-mismatch throw further down),
          // and lets us tell "already a member of this deck" apart from a genuine append.
          const existingCard = await resolveExistingCard(word)
          if (existingCard) {
            if (await isCardInDeck(db, deckId, existingCard.id)) {
              alreadyPresent.push(word.form)
            } else {
              await addCardToDeck(db, deckId, existingCard.id)
              succeeded += 1
            }
            firstCardId ??= existingCard.id
            continue
          }

          const outcome = await pipeline.lookupOrGenerate(word.form, {
            cefrLevel: defaultCefr,
            deckId,
            nativeLanguage,
          })
          if (outcome.kind === 'generated') {
            succeeded += 1
            firstCardId ??= outcome.cardId
          } else if (outcome.kind === 'existing') {
            // Shouldn't normally happen (resolveExistingCard above already covers it), but handle
            // defensively rather than assuming it can't - same already-present-vs-append check.
            const card = await getCardByLemmaAndNativeLanguage(db, outcome.lemma.id, nativeLanguage)
            if (card) {
              if (await isCardInDeck(db, deckId, card.id)) {
                alreadyPresent.push(word.form)
              } else {
                await addCardToDeck(db, deckId, card.id)
                succeeded += 1
              }
              firstCardId ??= card.id
            } else {
              failed.push(word.form)
            }
          } else {
            failed.push(word.form)
          }
        } catch (err) {
          log.warn('mining.studio_word_add_failed', {
            message: `Failed adding word ${word.form} to deck: ${String(err)}`,
          })
          failed.push(word.form)
        }
      }

      // If opened from a queue entry, mark it done/processed
      if (params.sourceId) {
        if (firstCardId) {
          await updateMineEntryProcessed(db, params.sourceId, firstCardId)
        } else {
          await updateMineEntryStatus(db, params.sourceId, 'done')
        }
      }

      return { requested: chosen.length, succeeded, failed, alreadyPresent, deckName }
    },
    onSuccess: async (result) => {
      setDeckPickerOpen(false)
      await queryClient.invalidateQueries()
      if (!result) return

      if (result.succeeded > 0) setIsMined(true)

      const parts: string[] = []
      if (result.succeeded > 0) parts.push(t('added {{count}}', { count: result.succeeded }))
      if (result.alreadyPresent.length > 0) {
        parts.push(t('{{words}} already in deck', { words: result.alreadyPresent.join(', ') }))
      }
      if (result.failed.length > 0) {
        parts.push(t('{{words}} failed', { words: result.failed.join(', ') }))
      }

      const hasIssue = result.failed.length > 0 || result.alreadyPresent.length > 0
      showToast(
        t('{{summary}} - "{{deck}}"', { summary: parts.join(', '), deck: result.deckName }),
        hasIssue ? { icon: 'CircleAlert', durationMs: 6000 } : { icon: 'SquareCheck' },
      )
    },
    onError: (error: unknown) => {
      setErrorNotice({
        title: t('Could not add cards'),
        message: error instanceof Error ? error.message : String(error),
      })
    },
  })

  // Create new deck and add words
  const createDeckAndAdd = useMutation({
    mutationFn: async ({ name, questionTypes }: { name: string; questionTypes: QuestionType[] }) => {
      const now = Date.now()
      const deckId = crypto.randomUUID()
      await createDeck(db, {
        id: deckId,
        name,
        enabledQuestionTypes: questionTypes,
        targetLanguage,
        nativeLanguage,
        createdAt: now,
        updatedAt: now,
      })
      return { deckId, name }
    },
    onSuccess: ({ deckId, name }) => {
      setDeckPickerOpen(false)
      addWordsMutation.mutate({ deckId, deckName: name })
    },
  })

  const handleSpeech = (speechText: string): void => {
    if (!speechText.trim()) return
    speak(speechText, targetLanguage)
  }

  const toggleWord = (form: string): void => {
    setSelectedWords((prev) =>
      prev.includes(form) ? prev.filter((w) => w !== form) : [...prev, form],
    )
  }

  const toggleAllWords = (): void => {
    if (!analysis) return
    if (selectedWords.length === analysis.vocabulary.length) {
      setSelectedWords([])
    } else {
      setSelectedWords(analysis.vocabulary.map((w) => w.form))
    }
  }

  if (!text) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: t('Mining Studio') }} />
        <EmptyState
          icon="FileText"
          title={t('No passage selected')}
          message={t('Select a passage from the Mining Studio to analyze its structure and vocabulary.')}
        />
        <Button label={t('Go Back')} variant="primary" onPress={() => router.back()} style={styles.backBtn} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('Study & Mine'),
          headerRight: () => (
            <IconButton
              icon="CircleQuestionMark"
              size={24}
              color={colors.primary}
              onPress={() => help.openSection('studio-overview')}
            />
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Source Passage Card */}
        <Card style={[styles.passageCard, isMined && styles.passageCardMined]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.headerTitleGroup}>
              <Icon name="BookOpen" size={18} color={colors.primary} />
              <Text style={styles.resultCardTitle}>{t('Passage')}</Text>
              {isMined ? (
                <View style={styles.minedBadge}>
                  <Icon name="SquareCheck" size={12} color={colors.success} />
                  <Text style={styles.minedBadgeText}>{t('Mined')}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.headerActionRow}>
              <CefrBadge level={defaultCefr} />
              <IconButton
                icon="Volume2"
                size={20}
                color={colors.primary}
                onPress={() => handleSpeech(text)}
              />
              {analysis && !analyzeMutation.isPending ? (
                <View style={styles.refreshButtonSpacer}>
                  <IconButton
                    icon="RefreshCw"
                    size={20}
                    color={colors.primary}
                    onPress={regenerate}
                    accessibilityLabel={t('Regenerate analysis')}
                  />
                </View>
              ) : null}
            </View>
          </View>
          <Text style={styles.passageText}>„{text}"</Text>
        </Card>

        {/* AI Required State — Mining has no dictionary fallback the way Search/Word of the Day
            do (there's nothing offline that can translate+explain grammar+extract vocabulary for
            a whole passage), so this is deliberately AI-only messaging, not the generic dual
            AI-or-dictionary setup dialog those screens show. */}
        {!ai && !analysis && (
          <Card style={styles.errorCard}>
            <Icon name="Sparkles" size={24} color={colors.primary} />
            <Text style={styles.errorTitle}>{t('AI provider needed')}</Text>
            <Text style={styles.errorMessage}>
              {t('Mining Studio needs an AI provider to translate, explain grammar, and extract vocabulary from a passage. Add and enable one in Settings.')}
            </Text>
            <Button
              label={t('Set up AI Provider')}
              variant="secondary"
              icon="Sparkles"
              onPress={() => router.push('/settings/ai-providers')}
              style={styles.retryBtn}
            />
          </Card>
        )}

        {/* Analysis Loading State */}
        {analyzeMutation.isPending && (
          <Card style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTitle}>{t('Analyzing Passage...')}</Text>
            <Text style={styles.loadingSubtitle}>
              {t('Analyzing grammar structure and extracting vocabulary for Level {{level}}', {
                level: defaultCefr,
              })}
            </Text>
          </Card>
        )}

        {/* Analysis Error State */}
        {analyzeMutation.isError && !analyzeMutation.isPending && (
          <Card style={styles.errorCard}>
            <Icon name="CircleAlert" size={24} color={colors.danger} />
            <Text style={styles.errorTitle}>{t('Analysis Failed')}</Text>
            <Text style={styles.errorMessage}>
              {analyzeMutation.error instanceof Error
                ? analyzeMutation.error.message
                : String(analyzeMutation.error)}
            </Text>
            <Button
              label={t('Retry Analysis')}
              variant="secondary"
              icon="RefreshCw"
              onPress={regenerate}
              style={styles.retryBtn}
            />
          </Card>
        )}

        {/* Analysis Results View */}
        {analysis && !analyzeMutation.isPending && (
          <View style={styles.resultsContainer}>
            {/* 1. Fluent Translation Card */}
            <Card style={styles.resultCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.headerTitleGroup}>
                  <Icon name="Languages" size={18} color={colors.primary} />
                  <Text style={styles.resultCardTitle}>{t('Fluent Translation')}</Text>
                </View>
              </View>
              <Text style={styles.translationText}>{analysis.translation}</Text>
            </Card>

            {/* 2. Grammar Breakdown Card */}
            {analysis.grammarPoints && analysis.grammarPoints.length > 0 && (
              <Card style={styles.resultCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.headerTitleGroup}>
                    <Icon name="BookOpen" size={18} color={colors.warning} />
                    <Text style={styles.resultCardTitle}>{t('Grammar Breakdown')}</Text>
                  </View>
                  <CefrBadge level={defaultCefr} />
                </View>

                <View style={styles.grammarList}>
                  {analysis.grammarPoints.map((point, i) => (
                    <View key={i} style={styles.grammarItem}>
                      <Text style={styles.grammarTitle}>• {point.title}</Text>
                      {point.ruleOrPattern ? (
                        <View style={styles.patternBox}>
                          <Text style={styles.patternText}>{point.ruleOrPattern}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.grammarExplanation}>{point.explanation}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* 3. Extracted Vocabulary Cards */}
            {analysis.vocabulary && analysis.vocabulary.length > 0 && (
              <Card style={styles.resultCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.headerTitleGroup}>
                    <Icon name="Sparkles" size={18} color={colors.primary} />
                    <Text style={styles.resultCardTitle}>
                      {t('Key Vocabulary')} ({analysis.vocabulary.length})
                    </Text>
                  </View>
                  <TouchableOpacity onPress={toggleAllWords}>
                    <Text style={styles.toggleAllText}>
                      {selectedWords.length === analysis.vocabulary.length
                        ? t('Deselect All')
                        : t('Select All')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.vocabList}>
                  {analysis.vocabulary.map((vocab, idx) => {
                    const isSelected = selectedWords.includes(vocab.form)
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.vocabRow, isSelected && styles.vocabRowSelected]}
                        onPress={() => toggleWord(vocab.form)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.checkboxWrap}>
                          <Icon
                            name={isSelected ? 'SquareCheck' : 'Square'}
                            size={20}
                            color={isSelected ? colors.primary : colors.textMuted}
                          />
                        </View>
                        <View style={styles.vocabContent}>
                          <View style={styles.vocabTopRow}>
                            <Text style={styles.vocabForm}>{vocab.form}</Text>
                            <View style={styles.posBadge}>
                              <Text style={styles.posBadgeText}>{vocab.partOfSpeech}</Text>
                            </View>
                          </View>
                          <Text style={styles.vocabMeaning}>{vocab.meaning}</Text>
                          {vocab.contextSentence ? (
                            <Text style={styles.vocabSentence}>
                              "{vocab.contextSentence}"
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                <Button
                  label={
                    addWordsMutation.isPending
                      ? t('Adding Cards...')
                      : t('Add {{count}} Words to Deck', { count: selectedWords.length })
                  }
                  variant="primary"
                  icon="Layers"
                  disabled={selectedWords.length === 0 || addWordsMutation.isPending}
                  onPress={() => setDeckPickerOpen(true)}
                  style={styles.addDeckBtn}
                />
              </Card>
            )}
          </View>
        )}
      </ScrollView>

      {/* Deck Picker Modal */}
      <DeckPickerModal
        db={db}
        visible={deckPickerOpen}
        title={t('Add {{count}} words to...', { count: selectedWords.length })}
        targetLanguage={targetLanguage}
        nativeLanguage={nativeLanguage}
        onSelectDeck={(deck) => {
          setDeckPickerOpen(false)
          addWordsMutation.mutate({ deckId: deck.id, deckName: deck.name })
        }}
        onCreateDeck={(name, questionTypes) => createDeckAndAdd.mutate({ name, questionTypes })}
        onClose={() => setDeckPickerOpen(false)}
        selecting={addWordsMutation.isPending}
        creating={createDeckAndAdd.isPending}
      />

      {/* Adding-to-deck progress - the deck picker is already closed by this point (see
          onSelectDeck/createDeckAndAdd above), so this is the only visible feedback while the
          per-word loop runs. */}
      <ProgressOverlay
        visible={addWordsMutation.isPending}
        message={t('Adding {{count}} words to your deck...', { count: selectedWords.length })}
      />

      {/* Error Modal */}
      <AlertModal
        visible={errorNotice !== null}
        title={errorNotice?.title ?? ''}
        message={errorNotice?.message ?? ''}
        onClose={() => setErrorNotice(null)}
      />

      {/* Help Sheet */}
      <HelpAccordionSheet
        visible={help.visible}
        onClose={help.close}
        title={t('Mining Studio Help')}
        sections={HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={(id) => help.setSectionId(help.sectionId === id ? null : id)}
        translate={t}
      />
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    passageCard: {
      gap: spacing.sm,
      backgroundColor: colors.surface,
    },
    passageCardMined: {
      backgroundColor: colors.successSoft,
      borderWidth: 1,
      borderColor: colors.success,
    },
    minedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.surface,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.full,
    },
    minedBadgeText: {
      fontSize: type.micro,
      fontWeight: '700',
      color: colors.success,
    },
    passageText: {
      fontSize: type.body,
      color: colors.text,
      lineHeight: 24,
      fontWeight: '500',
      fontStyle: 'italic',
    },
    headerActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    refreshButtonSpacer: {
      marginLeft: spacing.sm,
    },
    loadingCard: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.sm,
    },
    loadingTitle: {
      fontSize: type.subheading,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.xs,
    },
    loadingSubtitle: {
      fontSize: type.caption,
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: 280,
    },
    errorCard: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.xs,
    },
    errorTitle: {
      fontSize: type.subheading,
      fontWeight: '700',
      color: colors.danger,
    },
    errorMessage: {
      fontSize: type.caption,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    retryBtn: {
      minWidth: 160,
    },
    backBtn: {
      marginHorizontal: spacing.xl,
      marginTop: spacing.md,
    },
    resultsContainer: {
      gap: spacing.md,
    },
    resultCard: {
      gap: spacing.sm,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    resultCardTitle: {
      fontSize: type.subheading,
      fontWeight: '700',
      color: colors.text,
    },
    translationText: {
      fontSize: type.body,
      color: colors.text,
      lineHeight: 22,
    },
    grammarList: {
      gap: spacing.sm,
    },
    grammarItem: {
      gap: 4,
      borderLeftWidth: 2,
      borderLeftColor: colors.warning,
      paddingLeft: spacing.sm,
    },
    grammarTitle: {
      fontSize: type.body,
      fontWeight: '700',
      color: colors.text,
    },
    patternBox: {
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.xs,
      paddingVertical: 3,
      alignSelf: 'flex-start',
    },
    patternText: {
      fontSize: type.caption,
      color: colors.warning,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontWeight: '600',
    },
    grammarExplanation: {
      fontSize: type.caption,
      color: colors.textMuted,
      lineHeight: 18,
    },
    toggleAllText: {
      fontSize: type.caption,
      color: colors.primary,
      fontWeight: '600',
    },
    vocabList: {
      gap: spacing.xs,
    },
    vocabRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    vocabRowSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    checkboxWrap: {
      paddingTop: 2,
    },
    vocabContent: {
      flex: 1,
      gap: 3,
    },
    vocabTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    vocabForm: {
      fontSize: type.body,
      fontWeight: '700',
      color: colors.text,
    },
    posBadge: {
      backgroundColor: colors.background,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    posBadgeText: {
      fontSize: type.micro,
      color: colors.textMuted,
      textTransform: 'lowercase',
    },
    vocabMeaning: {
      fontSize: type.caption,
      color: colors.text,
    },
    vocabSentence: {
      fontSize: type.micro,
      color: colors.textMuted,
      fontStyle: 'italic',
      marginTop: 2,
    },
    addDeckBtn: {
      marginTop: spacing.xs,
    },
  })
