import { markSelectionAsCloze, parseClozeMarkup } from '@lingora/database'
import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { Button } from './ui'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

interface Selection {
  start: number
  end: number
}

export interface ClozeEditorResult {
  sentence: string
  answer: string
  translation: string
}

/**
 * The mark-and-blank cloze composer's actual fields — sentence input, mark/reset toolbar, live
 * preview, translation input. Deliberately headless of any container (no modal, no save/cancel
 * buttons): `ClozeEditorSheet` wraps this in a modal sheet for the word-detail screen's "Add a
 * cloze card" flow, where a card already exists to attach the result to; the deck "Add card"
 * screen embeds it directly inline instead (no overlay), since there's no card yet for a save
 * action to target until the whole form submits — it just tracks the latest result via `onChange`
 * and uses it when the surrounding form's own submit button fires.
 *
 * See cloze-parse.ts's `markSelectionAsCloze` doc comment for why marking is manual rather than
 * automatic (fails for German separable verbs).
 */
export function ClozeMarkupEditor(props: {
  initialSentence: string
  initialTranslation: string
  onChange: (result: ClozeEditorResult | null) => void
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  const [text, setText] = useState(props.initialSentence)
  const [translation, setTranslation] = useState(props.initialTranslation)
  const [selection, setSelection] = useState<Selection>({ start: 0, end: 0 })

  const parsed = parseClozeMarkup(text)
  const canMark = selection.end > selection.start

  useEffect(() => {
    props.onChange(
      parsed && translation.trim() !== ''
        ? { sentence: parsed.blanked, answer: parsed.answers.join('; '), translation: translation.trim() }
        : null,
    )
  }, [text, translation])

  const handleMark = (): void => {
    if (!canMark) return
    const next = markSelectionAsCloze(text, selection.start, selection.end)
    setText(next)
    // Collapse the selection to just past the inserted markup — a stale range from before the
    // text grew would otherwise point at the wrong characters on the next mark.
    const insertedLength = next.length - text.length
    setSelection({ start: selection.end + insertedLength, end: selection.end + insertedLength })
  }

  const handleReset = (): void => {
    setText(props.initialSentence)
    setSelection({ start: 0, end: 0 })
  }

  return (
    <View>
      <Text style={styles.hint}>
        {t('Select a word or phrase in the sentence below, then tap "Mark as cloze" to blank it out.')}
      </Text>

      <Text style={styles.fieldLabel}>{t('Sentence')}</Text>
      <TextInput
        testID="cloze-editor-sentence-input"
        style={styles.sentenceInput}
        value={text}
        onChangeText={setText}
        selection={selection}
        onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
        multiline
      />

      <View style={styles.toolbar}>
        <Button label={t('Mark as cloze')} icon="create-outline" small onPress={handleMark} disabled={!canMark} />
        <Button label={t('Reset')} variant="ghost" small onPress={handleReset} />
      </View>

      <Text style={styles.fieldLabel}>{t('Preview')}</Text>
      <View style={styles.previewBox}>
        <Text style={styles.previewText}>{parsed ? parsed.blanked : text || t('Nothing to preview yet.')}</Text>
      </View>

      <Text style={styles.fieldLabel}>{t('Translation')}</Text>
      <TextInput
        testID="cloze-editor-translation-input"
        style={styles.translationInput}
        value={translation}
        onChangeText={setTranslation}
        placeholder={t('English translation')}
        placeholderTextColor={colors.textMuted}
        multiline
      />
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    hint: { fontSize: type.caption, color: colors.textMuted, lineHeight: 18 },
    fieldLabel: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs },
    sentenceInput: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      fontSize: type.body,
      color: colors.text,
      minHeight: 72,
      textAlignVertical: 'top',
    },
    toolbar: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    previewBox: {
      backgroundColor: colors.primarySoft,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    previewText: { fontSize: type.body, color: colors.text, fontWeight: '600' },
    translationInput: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      fontSize: type.body,
      color: colors.text,
      minHeight: 48,
      textAlignVertical: 'top',
    },
  })
