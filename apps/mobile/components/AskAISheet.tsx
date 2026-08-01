import { Ionicons } from '@expo/vector-icons'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { FollowUpComposer } from './FollowUpComposer'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'
import type { FollowUpEntry } from './AIExplanationSheet'

/**
 * "Ask AI" — deliberately just the question composer (with its character-limit counter) plus the
 * resulting Q&A thread, nothing else. Not a smaller AIExplanationSheet: no word-class title, no
 * explanation/synonyms/usage sections, no footnote — those belong to "More info" on an AI card,
 * a separate, richer surface. This one is available on any card and does exactly one thing.
 */
export function AskAISheet(props: {
  visible: boolean
  onClose: () => void
  followUps: FollowUpEntry[]
  askLoading: boolean
  onAsk: (question: string) => void
  onAskCancel?: () => void
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
            <Text style={styles.title}>{t('Ask AI')}</Text>
            <Pressable onPress={props.onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>
          {props.followUps.length > 0 ? (
            <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
              {props.followUps.map((entry, index) => (
                <View key={`${entry.question}-${index}`} style={styles.followUpEntry}>
                  <Text style={styles.followUpQuestion}>{entry.question}</Text>
                  <Text style={styles.followUpAnswer}>{entry.explanation}</Text>
                  {entry.usage ? <Text style={styles.followUpAnswer}>{entry.usage}</Text> : null}
                </View>
              ))}
            </ScrollView>
          ) : null}
          <FollowUpComposer loading={props.askLoading} onAsk={props.onAsk} {...(props.onAskCancel && { onCancel: props.onAskCancel })} />
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
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
    title: { flex: 1, fontSize: type.subheading, fontWeight: '800', color: colors.text },
    scroll: { marginTop: spacing.md, flexGrow: 0 },
    followUpEntry: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    followUpQuestion: { fontSize: type.caption, fontWeight: '700', color: colors.primary },
    followUpAnswer: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 20, marginTop: 4 },
  })
