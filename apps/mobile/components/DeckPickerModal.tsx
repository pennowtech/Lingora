import type { Deck, QuestionType } from '@lingora/types'
import { getAllDecks, type DatabaseAdapter } from '@lingora/database'
import { useQuery } from '@tanstack/react-query'
import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Icon } from './Icon'
import { Button, ErrorState, IconButton, Spinner } from './ui'
import { ReviewModesPicker } from './ReviewModesPicker'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'
import { DEFAULT_ENABLED_QUESTION_TYPES, toggleQuestionType } from '../lib/reviewTypes'

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
  /** Deck ids the card is already in — shown with a checkmark and not tappable again. Omit (or
   * pass an empty array) for a card that doesn't exist yet. */
  existingDeckIds?: string[]
  onSelectDeck: (deck: Deck) => void
  selecting?: boolean
  selectError?: string
  onCreateDeck: (name: string, questionTypes: QuestionType[]) => void
  creating?: boolean
  createError?: string
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const [newDeckMode, setNewDeckMode] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  // Which review formats the new deck practices with - defaults to the same starting point as
  // Settings -> Learning's global picker, overridable per deck right here at creation time.
  const [newDeckQuestionTypes, setNewDeckQuestionTypes] = useState<QuestionType[]>([...DEFAULT_ENABLED_QUESTION_TYPES])

  const decksQuery = useQuery({
    queryKey: ['decks'],
    queryFn: () => getAllDecks(props.db),
    enabled: props.visible,
  })

  const existingDeckIds = props.existingDeckIds ?? []
  const selecting = props.selecting ?? false
  const creating = props.creating ?? false

  const close = (): void => {
    setNewDeckMode(false)
    setNewDeckName('')
    setNewDeckQuestionTypes([...DEFAULT_ENABLED_QUESTION_TYPES])
    props.onClose()
  }

  const submitNewDeck = (): void => {
    if (newDeckName.trim() === '' || creating) return
    props.onCreateDeck(newDeckName.trim(), newDeckQuestionTypes)
  }

  return (
    <Modal visible={props.visible} animationType="fade" transparent onRequestClose={close}>
      <KeyboardAvoidingView style={styles.keyboardAvoider} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{props.title}</Text>

          {newDeckMode ? (
            <View style={styles.newDeckForm}>
              <View style={styles.newDeckRow}>
                <TextInput
                  testID="deck-picker-new-name-input"
                  style={styles.newDeckInput}
                  placeholder={t('New deck name')}
                  placeholderTextColor={colors.textMuted}
                  value={newDeckName}
                  onChangeText={setNewDeckName}
                  autoFocus
                  onSubmitEditing={submitNewDeck}
                />
                <IconButton icon="X" size={20} onPress={() => setNewDeckMode(false)} disabled={creating} />
              </View>
              <ReviewModesPicker
                label={t('Review modes')}
                value={newDeckQuestionTypes}
                onToggle={(qt) => setNewDeckQuestionTypes((prev) => toggleQuestionType(prev, qt))}
              />
              <Button
                label={creating ? t('Creating...') : t('Create')}
                small
                onPress={submitNewDeck}
                disabled={creating || newDeckName.trim() === ''}
              />
            </View>
          ) : (
            <Pressable testID="deck-picker-new-toggle" style={styles.newDeckButton} onPress={() => setNewDeckMode(true)}>
              <Icon name="CirclePlus" size={20} color={colors.primary} />
              <Text style={styles.newDeckButtonLabel}>{t('Create new deck')}</Text>
            </Pressable>
          )}
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
                    onPress={() => props.onSelectDeck(deck)}
                    disabled={selecting || already}
                  >
                    <Text style={styles.emoji}>{deck.emoji ?? '📚'}</Text>
                    <Text style={styles.name}>{deck.name}</Text>
                    {already ? <Icon name="CircleCheck" size={18} color={colors.success} /> : null}
                  </Pressable>
                )
              })}
            </ScrollView>
          ) : (
            <Text style={styles.hint}>{t('No decks yet - create one above.')}</Text>
          )}
          {props.selectError ? <Text style={styles.errorText}>{props.selectError}</Text> : null}
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
      maxWidth: 400,
      maxHeight: '80%',
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.xl,
      gap: spacing.sm,
    },
    title: { fontSize: type.subheading, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
    list: { maxHeight: 280 },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
    rowDisabled: { opacity: 0.5 },
    emoji: { fontSize: 20 },
    name: { flex: 1, fontSize: type.body, fontWeight: '600', color: colors.text },
    newDeckForm: { gap: spacing.md, paddingVertical: spacing.sm },
    newDeckRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    newDeckInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      fontSize: type.body,
      color: colors.text,
      backgroundColor: colors.background,
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
    errorText: { fontSize: type.caption, color: colors.danger, textAlign: 'center', marginTop: spacing.xs },
  })
