import { Ionicons } from '@expo/vector-icons'
import type { LanguageCode } from '@lingora/types'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { FollowUpComposer } from './FollowUpComposer'
import { InlineMarkdown } from './InlineMarkdown'
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

/**
 * The word detail screen's "More info" sheet — additional practical context (when/why/how/where
 * a word is used) for whichever cluster is currently active, and never repeating synonyms
 * (already in their own section). Fetched on demand only, the first time this sheet opens for the
 * current cluster — never as part of initial card generation — see explainWordDetail's doc
 * comment in packages/ai/src/providers/types.ts.
 *
 * `explanation` is optional: word/[form].tsx omits it (that screen already shows the meaning's own
 * explanation inline on the card, so repeating it here would be redundant) — the review session
 * passes it, since its back-card no longer shows an explanation inline at all any more and this
 * sheet is now the only place to see it, on demand, instead of it auto-generating and appearing
 * the moment every AI card is flipped whether or not it's ever asked for.
 *
 * The composer at the bottom doesn't answer inline any more — `onAsk` bridges straight to the
 * persistent "Ask AI" chat (WordChatSheet) for this same card, sending the typed question there
 * on top of whatever chat history already exists. One thread per card, not two.
 */
export function AIExplanationSheet(props: {
  visible: boolean
  onClose: () => void
  headword: string
  partOfSpeech: string | undefined
  language: LanguageCode
  /** The meaning's own stored explanation. Omit entirely when the caller already shows it inline
   * elsewhere (see doc comment above) — pass '' (not omitted) while it's still being fetched. */
  explanation?: string
  explanationLoading?: boolean
  /** True when the last fetch attempt for `explanation` failed — shown as an inline "couldn't
   * load, retry" row rather than a blocking alert, since this is one part of a sheet that may
   * otherwise be showing perfectly good content (the paragraphs can fail independently of this,
   * and vice versa — a modal error over an already-useful sheet reads as scarier than it is). */
  explanationError?: boolean
  onRetryExplanation?: () => void
  /** 2-3 short paragraphs of additional context — empty while not yet fetched. */
  paragraphs: string[]
  loading: boolean
  /** Same reasoning as explanationError, for the paragraphs fetch. */
  paragraphsError?: boolean
  /** Re-fetches the paragraphs — shown as "Retry" after a failure, and as "Regenerate" once
   * paragraphs already loaded successfully (same callback either way: the caller's own
   * persistence overwrites whatever was stored before, unconditionally). */
  onRetryParagraphs?: () => void
  /** Bridges the typed question to the persistent "Ask AI" chat — see doc comment above. */
  onAsk: (question: string) => void
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
            {props.explanationError ? (
              <View style={styles.errorRow}>
                <Text style={styles.errorText}>{t("Couldn't load the explanation.")}</Text>
                {props.onRetryExplanation ? (
                  <Pressable onPress={props.onRetryExplanation} hitSlop={8}>
                    <Text style={styles.retryLabel}>{t('Retry')}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : props.explanation !== undefined ? (
              <InlineMarkdown
                text={props.explanationLoading ? t('Generating...') : props.explanation || t('No explanation yet.')}
                style={styles.explanation}
                boldStyle={styles.explanationBold}
                italicStyle={styles.italic}
                codeStyle={styles.code}
                selectable
              />
            ) : null}
            {props.loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingLabel}>{t('Generating...')}</Text>
              </View>
            ) : props.paragraphsError ? (
              <View style={styles.errorRow}>
                <Text style={styles.errorText}>{t("Couldn't load additional info.")}</Text>
                {props.onRetryParagraphs ? (
                  <Pressable onPress={props.onRetryParagraphs} hitSlop={8}>
                    <Text style={styles.retryLabel}>{t('Retry')}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <>
                {props.paragraphs.length > 0 ? (
                  <>
                    {props.paragraphs.map((paragraph, index) => (
                      <InlineMarkdown
                        key={index}
                        text={paragraph}
                        style={styles.usage}
                        boldStyle={styles.usageBold}
                        italicStyle={styles.italic}
                        codeStyle={styles.code}
                        selectable
                      />
                    ))}
                    {/* Re-runs the exact same fetch as the initial load, just triggered manually —
                        the caller's persistence (updateClusterMoreInfo) overwrites the stored
                        value unconditionally either way, so this doubles as "regenerate" with no
                        separate code path needed. */}
                    {props.onRetryParagraphs ? (
                      <Pressable style={styles.regenerateRow} onPress={props.onRetryParagraphs} hitSlop={8}>
                        <Ionicons name="refresh-circle-outline" size={15} color={colors.primary} />
                        <Text style={styles.regenerateLabel}>{t('Regenerate')}</Text>
                      </Pressable>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.usage}>{t('No additional info available yet.')}</Text>
                )}

                <Text style={styles.footnote}>
                  {t('AI-generated - explanations can be inaccurate. Check important details against a trusted reference.')}
                </Text>
              </>
            )}
          </ScrollView>
          <FollowUpComposer loading={false} onAsk={props.onAsk} />
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
    // Each paragraph is its own Text block with its own bottom margin — short paragraphs read as
    // distinct thoughts, not one dense wall of text.
    // Bolder/darker than `usage` below — this is the meaning's own direct explanation (the
    // answer), the additional-context paragraphs are secondary detail on top of it.
    explanation: {
      fontSize: type.body,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 22,
      marginBottom: spacing.lg,
    },
    usage: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.md },
    // Minimal markdown support (see InlineMarkdown) — bold/italic/code spans the AI is allowed to
    // use sparingly, same three spans the Search screen's quick-explain card already renders.
    explanationBold: { fontWeight: '800', color: colors.text },
    usageBold: { fontWeight: '800', color: colors.text },
    italic: { fontStyle: 'italic' },
    code: {
      fontFamily: 'monospace',
      backgroundColor: colors.surfaceMuted,
      color: colors.text,
      fontSize: type.micro,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.dangerSoft,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
    },
    errorText: { flex: 1, fontSize: type.caption, color: colors.danger },
    retryLabel: { fontSize: type.caption, fontWeight: '700', color: colors.danger, textDecorationLine: 'underline' },
    regenerateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    regenerateLabel: { fontSize: type.caption, fontWeight: '700', color: colors.primary },
    footnote: {
      fontSize: type.micro,
      color: colors.textMuted,
      marginTop: spacing.lg,
    },
  })
