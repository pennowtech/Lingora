import type { Deck, LanguageCode, QuestionType } from '@lingora/types'
import { getAllDecks, type DatabaseAdapter } from '@lingora/database'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Icon } from './Icon'
import { Button, ErrorState, IconButton, Spinner } from './ui'
import { ReviewModeBadges, ReviewModesPicker } from './ReviewModesPicker'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'
import { DEFAULT_ENABLED_QUESTION_TYPES, toggleQuestionType } from '../lib/reviewTypes'
import { CLOZE_EDITOR_HELP_SECTIONS, formatClozePreview, type ClozeEditorResult } from './ClozeMarkupEditor'
import { HelpAccordionSheet, useHelpAccordion } from './HelpAccordion'

function tokenizeSentence(sentence: string): string[] {
  return sentence.split(/(\s+)/).filter((token) => token.length > 0)
}

function guessBlankIndex(tokens: string[], word: string): number {
  const lowerWord = word.toLowerCase()
  let bestIndex = -1
  let bestLength = 0
  tokens.forEach((token, index) => {
    if (/^\s+$/.test(token)) return
    const core = token.replace(/[.,!?;:"'()]+$/, '').replace(/^[.,!?;:"'()]+/, '')
    if (core.length === 0) return
    if (bestIndex === -1) bestIndex = index
    if ((lowerWord.includes(core.toLowerCase()) || core.toLowerCase().includes(lowerWord)) && core.length > bestLength) {
      bestIndex = index
      bestLength = core.length
    }
  })
  return bestIndex
}

function splitTrailingPunctuation(token: string): { core: string; trailing: string } {
  const match = token.match(/^(.*?)([.,!?;:"']*)$/)
  return { core: match?.[1] ?? token, trailing: match?.[2] ?? '' }
}

/**
 * The "which deck?" centered dialog — a list of every deck (checkmarked where the card already
 * is, and disabled there so a re-tap can't no-op-add it again) plus an inline "Create new deck"
 * row so a brand-new deck doesn't require leaving the current screen. Used everywhere a card
 * needs a deck decision: the word detail screen's "Add to deck" button, the search screen's "Add
 * to deck" on a dictionary/translation preview (where the card doesn't exist yet — the deck
 * choice happens before creation, not after), AI-generated cards, and the Decks screen's "+" menu.
 *
 * Deliberately owns only the picker UI and its own decks query, not the add/create logic itself —
 * `onSelectDeck`/`onCreateDeck` do the actual work (adding an existing card, or creating a new
 * card+deck together), which differs by caller. This keeps the component reusable across both
 * shapes of flow without baking in either one.
 */
export function DeckPickerModal(props: {
  db: DatabaseAdapter
  visible: boolean
  onClose: () => void
  title: string
  targetLanguage?: LanguageCode
  nativeLanguage?: LanguageCode
  /** Deck ids the card is already in — shown with a checkmark and not tappable again. Omit (or
   * pass an empty array) for a card that doesn't exist yet. */
  existingDeckIds?: string[]
  onSelectDeck: (deck: Deck, cloze?: ClozeEditorResult) => void
  selecting?: boolean
  selectError?: string
  onCreateDeck: (name: string, questionTypes: QuestionType[], cloze?: ClozeEditorResult) => void
  creating?: boolean
  createError?: string
  /** When supplied, choosing a deck with Cloze enabled automatically opens the same token-based
   * blank editor as desktop before the card is added. */
  word?: string
  exampleSentence?: string
  exampleTranslation?: string
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const clozeHelp = useHelpAccordion('blank')
  const [newDeckMode, setNewDeckMode] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  // Which review formats the new deck practices with - defaults to the same starting point as
  // Settings -> Learning's global picker, overridable per deck right here at creation time.
  const [newDeckQuestionTypes, setNewDeckQuestionTypes] = useState<QuestionType[]>([...DEFAULT_ENABLED_QUESTION_TYPES])
  const [view, setView] = useState<'list' | 'create' | 'cloze'>('list')
  const [pendingDeck, setPendingDeck] = useState<Deck | null>(null)
  const [pendingNewDeck, setPendingNewDeck] = useState(false)
  const [clozeTokens, setClozeTokens] = useState<string[]>([])
  const [clozeBlankIndices, setClozeBlankIndices] = useState<Set<number>>(new Set())

  const decksQuery = useQuery({
    queryKey: ['decks', props.targetLanguage, props.nativeLanguage],
    queryFn: () => getAllDecks(props.db, props.targetLanguage, props.nativeLanguage),
    enabled: props.visible,
  })

  const existingDeckIds = props.existingDeckIds ?? []
  const selecting = props.selecting ?? false
  const creating = props.creating ?? false

  // Callers close this modal by changing `visible` after a successful mutation; reset the wizard
  // here too so the next Add to Deck flow never reopens on a stale cloze step.
  useEffect(() => {
    if (props.visible) return
    setView('list')
    setNewDeckMode(false)
    setNewDeckName('')
    setNewDeckQuestionTypes([...DEFAULT_ENABLED_QUESTION_TYPES])
    setPendingDeck(null)
    setPendingNewDeck(false)
    setClozeTokens([])
    setClozeBlankIndices(new Set())
  }, [props.visible])

  const close = (): void => {
    setView('list')
    setNewDeckMode(false)
    setNewDeckName('')
    setNewDeckQuestionTypes([...DEFAULT_ENABLED_QUESTION_TYPES])
    props.onClose()
  }

  const openClozeEditor = (deck: Deck | null, isNew: boolean): void => {
    const sentence = props.exampleSentence
    if (!sentence || !props.word) return
    const tokens = tokenizeSentence(sentence)
    const guessed = guessBlankIndex(tokens, props.word)
    setClozeTokens(tokens)
    setClozeBlankIndices(guessed >= 0 ? new Set([guessed]) : new Set())
    setPendingDeck(deck)
    setPendingNewDeck(isNew)
    setView('cloze')
  }

  const supportsCloze = (types: QuestionType[] | null | undefined): boolean => types?.includes('cloze') === true

  const selectDeck = (deck: Deck): void => {
    if (props.exampleSentence && props.word && supportsCloze(deck.enabledQuestionTypes)) {
      openClozeEditor(deck, false)
      return
    }
    props.onSelectDeck(deck)
  }

  const submitNewDeck = (): void => {
    if (newDeckName.trim() === '' || creating) return
    if (props.exampleSentence && props.word && supportsCloze(newDeckQuestionTypes)) {
      openClozeEditor(null, true)
      return
    }
    props.onCreateDeck(newDeckName.trim(), newDeckQuestionTypes)
  }

  const toggleBlank = (index: number): void => {
    setClozeBlankIndices((current) => {
      const next = new Set(current)
      if (next.has(index)) {
        if (next.size === 1) return next
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const composeCloze = (): ClozeEditorResult | null => {
    if (clozeBlankIndices.size === 0) return null
    const answers: string[] = []
    const sentence = clozeTokens.map((token, index) => {
      if (!clozeBlankIndices.has(index)) return token
      const { core, trailing } = splitTrailingPunctuation(token)
      answers.push(core)
      return `[...]${trailing}`
    }).join('')
    return {
      sentence,
      answer: answers.join('; '),
      translation: props.exampleTranslation ?? '',
    }
  }

  const confirmCloze = (): void => {
    const cloze = composeCloze()
    if (!cloze) return
    if (pendingNewDeck) {
      props.onCreateDeck(newDeckName.trim(), newDeckQuestionTypes, cloze)
    } else if (pendingDeck) {
      props.onSelectDeck(pendingDeck, cloze)
    }
  }

  const backFromCloze = (): void => {
    setView(pendingNewDeck ? 'create' : 'list')
    setPendingDeck(null)
    setPendingNewDeck(false)
  }

  const clozePreview = composeCloze()

  return (
    <Modal visible={props.visible} animationType="fade" transparent onRequestClose={close}>
      <KeyboardAvoidingView style={styles.keyboardAvoider} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            {view === 'cloze' ? <IconButton icon="ArrowLeft" size={20} onPress={backFromCloze} /> : null}
            <Text style={styles.title}>{view === 'cloze' ? t('Edit the Blank') : props.title}</Text>
            {view === 'cloze' ? (
              <>
                <IconButton icon="CircleQuestionMark" size={20} onPress={() => clozeHelp.openSection('blank')} />
                <IconButton icon="X" size={20} onPress={close} />
              </>
            ) : null}
          </View>

          {view === 'cloze' ? (
            <ScrollView style={styles.clozeScroll} contentContainerStyle={styles.clozeContent}>
              <View style={styles.clozeBadge}>
                <Text style={styles.clozeBadgeText}>{t('This deck reviews Cloze (fill in the blanks)')}</Text>
              </View>
              <Text style={styles.clozeLabel}>{t('Which word(s) should be hidden?')}</Text>
              <View style={styles.clozeSentenceCard}>
                <View style={styles.clozeTokens}>
                  {clozeTokens.map((token, index) => {
                    if (/^\s+$/.test(token)) return null
                    const selected = clozeBlankIndices.has(index)
                    return (
                      <Pressable
                        key={index}
                        onPress={() => toggleBlank(index)}
                        style={[styles.clozeToken, selected && styles.clozeTokenSelected]}
                      >
                        <Text style={[styles.clozeTokenText, selected && styles.clozeTokenTextSelected]}>{token}</Text>
                      </Pressable>
                    )
                  })}
                </View>
                {props.exampleTranslation ? <Text style={styles.clozeTranslation}>{props.exampleTranslation}</Text> : null}
              </View>
              <Text style={styles.clozeHint}>
                {t('Tap a word to hide it, tap it again to un-hide it - you can pick more than one.')}
              </Text>
              <Text style={styles.clozeLabel}>{t('Preview')}</Text>
              <View style={styles.clozePreviewCard}>
                <Text style={styles.clozePreviewText}>
                  {clozePreview?.sentence
                    ? formatClozePreview(clozePreview.sentence)
                    : props.exampleSentence ?? ''}
                </Text>
              </View>
              <View style={styles.clozeActions}>
                <Button
                  label={t('Add to Deck')}
                  icon="CirclePlus"
                  onPress={confirmCloze}
                  disabled={clozeBlankIndices.size === 0 || selecting || creating}
                />
              </View>
            </ScrollView>
          ) : newDeckMode ? (
            <View style={styles.newDeckForm}>
              <View style={styles.formHeaderRow}>
                <Text style={styles.formTitle}>{t('Create New Study Deck')}</Text>
                <IconButton icon="X" size={20} onPress={() => setNewDeckMode(false)} disabled={creating} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('DECK TITLE')}</Text>
                <TextInput
                  testID="deck-picker-new-name-input"
                  style={styles.newDeckInput}
                  placeholder={t('e.g. German Verbs')}
                  placeholderTextColor={colors.textMuted}
                  value={newDeckName}
                  onChangeText={setNewDeckName}
                  autoFocus
                  onSubmitEditing={submitNewDeck}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('REVIEW MODES')}</Text>
                <ReviewModesPicker
                  value={newDeckQuestionTypes}
                  onToggle={(qt) => setNewDeckQuestionTypes((prev) => toggleQuestionType(prev, qt))}
                />
                <Text style={styles.formHelperText}>
                  {t('Only cards matching these types can be saved into this deck.')}
                </Text>
              </View>

              <View style={styles.formActions}>
                <Button label={t('Cancel')} variant="ghost" onPress={() => setNewDeckMode(false)} disabled={creating} />
                <Button
                  label={creating ? t('Creating...') : t('Create Deck')}
                  icon="Plus"
                  onPress={submitNewDeck}
                  disabled={creating || newDeckName.trim() === ''}
                />
              </View>
            </View>
          ) : (
            <Pressable testID="deck-picker-new-toggle" style={styles.newDeckButton} onPress={() => setNewDeckMode(true)}>
              <Icon name="CirclePlus" size={20} color={colors.primary} />
              <Text style={styles.newDeckButtonLabel}>{t('Create new deck')}</Text>
            </Pressable>
          )}
          {view !== 'cloze' ? (
            <>
              {props.createError ? <Text style={styles.errorText}>{props.createError}</Text> : null}
              {decksQuery.isPending ? (
                <Spinner />
              ) : decksQuery.isError ? (
                <ErrorState message={String(decksQuery.error)} onRetry={() => void decksQuery.refetch()} />
              ) : decksQuery.data && decksQuery.data.length > 0 ? (
                <ScrollView style={styles.list}>
                  {decksQuery.data.map((deck) => {
                    const already = existingDeckIds.includes(deck.id)
                    return (
                      <Pressable
                        key={deck.id}
                        testID={`deck-picker-row-${deck.id}`}
                        style={[styles.row, selecting && styles.rowDisabled]}
                        onPress={() => selectDeck(deck)}
                        disabled={selecting || already}
                      >
                        <Icon name="BookOpen" size={18} color={colors.primary} />
                        <View style={styles.deckInfo}>
                          <Text style={styles.name}>{deck.name}</Text>
                          <ReviewModeBadges modes={deck.enabledQuestionTypes} size="sm" />
                        </View>
                        {already ? <Icon name="CircleCheck" size={18} color={colors.success} /> : null}
                      </Pressable>
                    )
                  })}
                </ScrollView>
              ) : (
                <Text style={styles.hint}>{t('No decks yet - create one above.')}</Text>
              )}
              {props.selectError ? <Text style={styles.errorText}>{props.selectError}</Text> : null}
            </>
          ) : null}
          <HelpAccordionSheet
            visible={clozeHelp.visible}
            onClose={clozeHelp.close}
            title={t('Cloze editor help')}
            sections={CLOZE_EDITOR_HELP_SECTIONS}
            activeSectionId={clozeHelp.sectionId}
            onSectionPress={(id) => clozeHelp.setSectionId(clozeHelp.sectionId === id ? null : id)}
            translate={t}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    keyboardAvoider: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00000066' },
    sheet: {
      width: '100%',
      maxWidth: 440,
      maxHeight: '85%',
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      gap: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    title: { flex: 1, fontSize: type.subheading, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    list: { maxHeight: 280 },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    rowDisabled: { opacity: 0.5 },
    emoji: { fontSize: 20 },
    deckInfo: { flex: 1, gap: 4 },
    name: { fontSize: type.body, fontWeight: '700', color: colors.text },
    newDeckForm: { gap: spacing.md, paddingVertical: spacing.xs },
    formHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
    formTitle: { flex: 1, fontSize: type.subheading, fontWeight: '800', color: colors.text },
    formGroup: { gap: spacing.xs },
    formLabel: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
    formHelperText: { fontSize: type.micro, color: colors.textMuted, marginTop: 2 },
    formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
    newDeckRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    newDeckInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      fontSize: type.body,
      color: colors.text,
      backgroundColor: colors.surfaceMuted,
    },
    newDeckButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    newDeckButtonLabel: { fontSize: type.body, fontWeight: '700', color: colors.primary },
    hint: { fontSize: type.micro, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
    clozeScroll: { maxHeight: 560 },
    clozeContent: { gap: spacing.md },
    clozeBadge: { alignSelf: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.full, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
    clozeBadgeText: { fontSize: type.micro, fontWeight: '700', color: colors.primary },
    clozeLabel: { fontSize: type.micro, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
    clozeSentenceCard: { padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
    clozeTokens: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    clozeToken: { paddingVertical: 3, paddingHorizontal: spacing.xs, borderRadius: radius.sm },
    clozeTokenSelected: { backgroundColor: colors.primary },
    clozeTokenText: { fontSize: type.body, lineHeight: 24, color: colors.text },
    clozeTokenTextSelected: { color: colors.textOnPrimary, fontWeight: '800' },
    clozeTranslation: { fontSize: type.caption, color: colors.textSecondary, marginTop: spacing.sm },
    clozeHint: { fontSize: type.caption, color: colors.textMuted, lineHeight: 18 },
    clozePreviewCard: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.primarySoft },
    clozePreviewText: { fontSize: type.body, fontWeight: '700', color: colors.text, lineHeight: 24 },
    clozeActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.sm },
    errorText: { fontSize: type.caption, color: colors.danger, textAlign: 'center', marginTop: spacing.xs },
  })
