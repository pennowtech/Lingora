import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button } from './ui'
import { radius, spacing, type } from '../lib/theme'
import { useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

/**
 * The "what should this file be called?" prompt shown before every export (CSV/Markdown/Anki/
 * `.lin`) — prefilled with a sensible default (`defaultExportFileName` in lib/save-file.ts:
 * `deckname_YYYY-MM-DD_HHmm`) but always editable, and always shown, rather than silently
 * generating a name the user never sees. The actual save location is a separate, native step
 * (Android's Storage Access Framework folder picker, or the share sheet) that `saveExportFile`
 * triggers once this modal's name is confirmed — there's no single OS dialog that combines both
 * on Android, so this modal is the "file name" half and the native folder browser is the
 * "location" half, run back to back.
 */
export function ExportNameModal(props: {
  visible: boolean
  defaultName: string
  onCancel: () => void
  onConfirm: (fileName: string) => void
}): JSX.Element {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)
  const [name, setName] = useState(props.defaultName)

  // Re-seed whenever a fresh export opens this — this modal stays mounted across opens (unlike a
  // remount-on-open pattern), so without this a second export would still show the first one's
  // (possibly hand-edited) name.
  useEffect(() => {
    if (props.visible) setName(props.defaultName)
  }, [props.visible, props.defaultName])

  const trimmed = name.trim()

  return (
    <Modal visible={props.visible} animationType="fade" transparent onRequestClose={props.onCancel}>
      <KeyboardAvoidingView style={styles.keyboardAvoider} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={props.onCancel} />
        <View style={styles.card}>
          <Text style={styles.title}>{t('Save as')}</Text>
          <Text style={styles.hint}>{t('You can change the file name below. Where to save it comes next.')}</Text>
          <TextInput
            testID="export-name-input"
            style={styles.input}
            value={name}
            onChangeText={setName}
            autoFocus
            selectTextOnFocus
          />
          <View style={styles.actions}>
            <Button label={t('Cancel')} variant="ghost" onPress={props.onCancel} />
            <Button label={t('Export')} onPress={() => props.onConfirm(trimmed)} disabled={trimmed === ''} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    keyboardAvoider: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00000066' },
    card: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.xl,
      gap: spacing.md,
    },
    title: { fontSize: type.subheading, fontWeight: '800', color: colors.text },
    hint: { fontSize: type.caption, color: colors.textMuted, lineHeight: 18 },
    input: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: type.body,
      color: colors.text,
    },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  })
