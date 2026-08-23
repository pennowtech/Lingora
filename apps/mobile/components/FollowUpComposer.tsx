import type { JSX } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Icon } from './Icon'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

const MAX_LENGTH = 100

/**
 * A short (max 100 char) follow-up question composer for the AI explanation sheet — same shape
 * as Shelfie's AIExplanationSheet follow-up input: a single-line TextInput, a color-coded
 * "N/100" counter, and an "Ask" action. The icon-button entry point that makes this discoverable
 * lives on the caller (word/[form].tsx / review/[deckId].tsx's "More info" sheet header).
 */
export function FollowUpComposer(props: {
  loading: boolean
  onAsk: (question: string) => void
  onCancel?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const [text, setText] = useState('')
  const atLimit = text.length >= MAX_LENGTH
  const canAsk = text.trim() !== '' && !props.loading

  const submit = (): void => {
    if (!canAsk) return
    props.onAsk(text.trim())
    setText('')
  }

  return (
    <View style={styles.wrap}>
      <TextInput
        testID="follow-up-input"
        accessibilityLabel={t('Ask a follow-up question, maximum {{max}} characters', { max: MAX_LENGTH })}
        style={[styles.input, atLimit && styles.inputAtLimit]}
        value={text}
        // Native `maxLength` alone enforces the cap. A redundant JS-side `.slice()` on top of it
        // fights the IME on composed characters (e.g. Gboard's smart/curly-quote key sends the
        // quote as a two-step composition) — the second keystroke could land after the slice had
        // already re-set state, dropping the punctuation entirely. autoCorrect off for the same
        // reason: word-suggestion autocomplete was also swallowing punctuation on accept.
        onChangeText={setText}
        maxLength={MAX_LENGTH}
        placeholder={t('Ask a short follow-up...')}
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        autoCapitalize="sentences"
        returnKeyType="go"
        enterKeyHint="go"
        onSubmitEditing={submit}
        // Deliberately single-line, not multiline — a 100-char question doesn't need to wrap, and
        // Android's multiline TextInput largely ignores returnKeyType (the keyboard keeps showing
        // a newline glyph no matter what) and often never fires onSubmitEditing at all, Enter just
        // inserts a literal "\n" into the value instead. That's what was actually behind both "Go
        // doesn't show" and the second question "eating" punctuation — a stray newline landing
        // mid-text from a keypress that should have submitted instead confused the IME's
        // composition state for whatever was typed right after. Single-line doesn't have either
        // problem: returnKeyType is respected and onSubmitEditing fires reliably on both platforms.
      />
      <View style={styles.footerRow}>
        {props.loading ? (
          <View style={styles.thinkingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.thinkingLabel}>{t('Thinking...')}</Text>
            {props.onCancel ? (
              <Pressable onPress={props.onCancel} hitSlop={8}>
                <Text style={styles.cancelLabel}>{t('Cancel')}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <Text style={[styles.counter, atLimit && styles.counterAtLimit]}>
            {text.length}/{MAX_LENGTH}
          </Text>
        )}
        <Pressable
          testID="follow-up-ask"
          onPress={submit}
          disabled={!canAsk}
          style={[styles.askButton, !canAsk && styles.askButtonDisabled]}
        >
          {props.loading ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : (
            <Icon name="CircleArrowUp" size={18} color={canAsk ? colors.primary : colors.textMuted} />
          )}
          <Text style={[styles.askLabel, canAsk && styles.askLabelActive]}>
            {props.loading ? t('Asking...') : t('Ask')}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { gap: spacing.xs, marginTop: spacing.md },
    input: {
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
      color: colors.text,
      fontSize: type.caption,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    inputAtLimit: { borderColor: colors.danger },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    counter: { fontSize: type.micro, color: colors.textMuted },
    thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    thinkingLabel: { fontSize: type.micro, color: colors.textMuted },
    cancelLabel: { fontSize: type.micro, color: colors.danger, fontWeight: '700' },
    counterAtLimit: { color: colors.danger, fontWeight: '700' },
    askButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    askButtonDisabled: { opacity: 0.5 },
    askLabel: { fontSize: type.caption, fontWeight: '700', color: colors.textMuted },
    askLabelActive: { color: colors.primary },
  })
