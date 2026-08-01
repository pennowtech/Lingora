import { Ionicons } from '@expo/vector-icons'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from './ui'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

/**
 * "What do you want to do with this?" — shown for text captured from outside the app (Android's
 * Process Text selection-toolbar entry, or the share sheet) when the user's capture-destination
 * setting is "Quick-add chooser" rather than always-Search or split-by-source. See
 * `lib/captureIntent.ts` for the setting and `components/CaptureIntentHandler.tsx` for what wires
 * this up to the actual native capture events.
 */
export function CaptureChooserSheet(props: {
  visible: boolean
  text: string
  onSearch: () => void
  onAddToMining: () => void
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  return (
    <Modal visible={props.visible} animationType="fade" transparent onRequestClose={props.onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={props.onClose} />
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t('Add to Lingora')}</Text>
            <Pressable onPress={props.onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView style={styles.textScroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.capturedText}>{props.text}</Text>
          </ScrollView>
          <Button label={t('Search this')} icon="search" onPress={props.onSearch} />
          <Button
            label={t('Add to Mining queue')}
            icon="download"
            variant="secondary"
            onPress={props.onAddToMining}
            style={styles.secondButton}
          />
        </View>
      </View>
    </Modal>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: '#00000066',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    dismissArea: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    card: {
      width: '100%',
      maxHeight: '70%',
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.xl,
      gap: spacing.md,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
    title: { flex: 1, fontSize: type.subheading, fontWeight: '800', color: colors.text },
    textScroll: { flexGrow: 0 },
    capturedText: {
      fontSize: type.body,
      color: colors.textSecondary,
      lineHeight: 22,
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    secondButton: { marginTop: 0 },
  })
