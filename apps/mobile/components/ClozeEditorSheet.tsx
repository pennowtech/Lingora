import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ClozeMarkupEditor, type ClozeEditorResult } from './ClozeMarkupEditor'
import { Button } from './ui'
import { radius, spacing, type } from '../lib/theme'
import { useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

export type { ClozeEditorResult }

/**
 * Modal wrapper around `ClozeMarkupEditor` for the word-detail screen's cloze flows, where a card
 * already exists to attach the saved result to (unlike the deck "Add card" screen, which embeds
 * the editor inline instead — see ClozeMarkupEditor's doc comment). Unmounting the editor while
 * closed (rather than just hiding it) is deliberate: it forces a fresh `useState` initialization
 * from `initialSentence`/`initialTranslation` on every open, the same as the old re-seeding effect
 * this replaced, without needing to track "did the props change since last time" by hand.
 */
export function ClozeEditorSheet(props: {
  visible: boolean
  initialSentence: string
  initialTranslation: string
  onCancel: () => void
  onSave: (result: ClozeEditorResult) => void
  saving?: boolean
  saveError?: string
}): JSX.Element {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)

  const [result, setResult] = useState<ClozeEditorResult | null>(null)

  const handleSave = (): void => {
    if (!result) return
    props.onSave(result)
  }

  return (
    <Modal visible={props.visible} animationType="slide" transparent onRequestClose={props.onCancel}>
      <Pressable style={styles.backdrop} onPress={props.onCancel} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('Mark cloze')}</Text>

          {props.visible ? (
            <ClozeMarkupEditor
              initialSentence={props.initialSentence}
              initialTranslation={props.initialTranslation}
              onChange={setResult}
            />
          ) : null}

          {props.saveError ? <Text style={styles.errorText}>{props.saveError}</Text> : null}

          <View style={styles.actions}>
            <Button label={t('Cancel')} variant="ghost" onPress={props.onCancel} disabled={props.saving ?? false} />
            <Button
              label={props.saving ? t('Saving…') : t('Save cloze card')}
              onPress={handleSave}
              disabled={!result || (props.saving ?? false)}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: '#00000066' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.xl,
      maxHeight: '85%',
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: radius.full,
      backgroundColor: colors.border,
      marginBottom: spacing.md,
    },
    title: { fontSize: type.subheading, fontWeight: '800', color: colors.text },
    errorText: { fontSize: type.caption, color: colors.danger, marginTop: spacing.sm },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.lg },
  })
