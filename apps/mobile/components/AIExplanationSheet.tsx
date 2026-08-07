import { Ionicons } from '@expo/vector-icons'
import type { LanguageCode, Synonym } from '@lingora/types'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { FollowUpComposer } from './FollowUpComposer'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

/** A tidy title fragment ("Verb", "Noun", ...) from a free-text part of speech — same mapping
 * WordGuideModal uses, duplicated rather than shared since it's a 12-line pure function. */
function titleWordClass(partOfSpeech: string | undefined): string {
  const KNOWN = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'article', 'phrase']
  const firstTag = partOfSpeech?.split(/[/\s(]/)[0]?.toLowerCase()
  if (firstTag && KNOWN.includes(firstTag)) return firstTag[0]!.toUpperCase() + firstTag.slice(1)
  return 'Word'
}

/** Display name for the sheet title's "Understanding the {{language}} ..." fragment — same
 * mapping WordGuideModal.tsx uses, duplicated per that file's own comment on the convention. */
const TITLE_LANGUAGE_LABELS: Partial<Record<LanguageCode, string>> = {
  de: 'German',
  fr: 'French',
  hi: 'Hindi',
}

export interface FollowUpEntry {
  question: string
  explanation: string
  usage: string | null
}

/**
 * The AI-sourced counterpart to WordGuideModal's rich presentation (same "Understanding the
 * {language} {wordClass} '{headword}'" / Usage / Examples shape, so a dictionary-sourced and an
 * AI-sourced explanation read consistently) — plus a short follow-up question composer and the
 * resulting Q&A thread, kept in memory only for this session (never persisted as new cards/cloze
 * — see LingoraDocs decision on ephemeral follow-ups). Opened by the "More info" action on an
 * AI-generated card's action bar.
 */
export function AIExplanationSheet(props: {
  visible: boolean
  onClose: () => void
  headword: string
  partOfSpeech: string | undefined
  language: LanguageCode
  translation: string
  explanation: string
  usage: string | null
  loading: boolean
  synonyms: Synonym[]
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
            <Text style={styles.title}>
              {t('Understanding the {{language}} {{wordClass}} "{{headword}}"', {
                language: t(TITLE_LANGUAGE_LABELS[props.language] ?? props.language),
                wordClass: t(titleWordClass(props.partOfSpeech)),
                headword: props.headword,
              })}
            </Text>
            <Pressable onPress={props.onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
            {props.loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingLabel}>{t('Generating…')}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.intro}>{props.explanation || t('No explanation yet.')}</Text>

                {props.synonyms.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>{t('Synonyms')}</Text>
                    {props.synonyms.map((syn) => (
                      <Text key={syn.id} style={styles.synonym}>
                        {'• '}
                        <Text style={styles.synonymWord}>{syn.word}</Text>
                        {syn.nuance ? ` — ${syn.nuance}` : ''}
                      </Text>
                    ))}
                  </>
                ) : null}

                {props.usage ? (
                  <>
                    <Text style={styles.sectionTitle}>{t('Usage')}</Text>
                    <Text style={styles.usage}>{props.usage}</Text>
                  </>
                ) : null}

                {props.followUps.map((entry, index) => (
                  <View key={`${entry.question}-${index}`} style={styles.followUpEntry}>
                    <View style={styles.followUpQuestionRow}>
                      <Ionicons name="help-circle-outline" size={15} color={colors.primary} />
                      <Text style={styles.followUpQuestion}>{entry.question}</Text>
                    </View>
                    <Text style={styles.followUpAnswer}>{entry.explanation}</Text>
                    {entry.usage ? <Text style={styles.followUpAnswer}>{entry.usage}</Text> : null}
                  </View>
                ))}

                <Text style={styles.footnote}>
                  {t('AI-generated — explanations can be inaccurate. Check important details against a trusted reference.')}
                </Text>
              </>
            )}
          </ScrollView>
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
      maxHeight: '85%',
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.xl,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
    title: { flex: 1, fontSize: type.subheading, fontWeight: '800', color: colors.text, lineHeight: 26 },
    scroll: { marginTop: spacing.md, flexGrow: 0 },
    loadingRow: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
    loadingLabel: { fontSize: type.body, color: colors.textSecondary },
    intro: { fontSize: type.body, color: colors.text, lineHeight: 22 },
    sectionTitle: {
      fontSize: type.body,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    synonym: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 20 },
    synonymWord: { fontWeight: '700', color: colors.text },
    usage: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 20 },
    followUpEntry: {
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    followUpQuestionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
    followUpQuestion: { flex: 1, fontSize: type.caption, fontWeight: '700', color: colors.primary },
    followUpAnswer: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 20, marginTop: 4 },
    footnote: {
      fontSize: type.micro,
      color: colors.textMuted,
      marginTop: spacing.lg,
    },
  })
