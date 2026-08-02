import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
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
    <Modal visible={props.visible} animationType="fade" transparent onRequestClose={props.onCancel}>
      <KeyboardAvoidingView style={styles.keyboardAvoider} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={props.onCancel} />
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{t('Add cloze card')}</Text>

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
      maxHeight: '85%',
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.xl,
    },
    title: { fontSize: type.subheading, fontWeight: '800', color: colors.text },
    errorText: { fontSize: type.caption, color: colors.danger, marginTop: spacing.sm },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.lg },
  })
