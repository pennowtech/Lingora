import type { DistractorMeaning } from '@lingora/database'
import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Icon } from './Icon'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

/** How long the correct/incorrect feedback shows before advancing — long enough to read, short
 * enough not to stall a session someone's moving quickly through. */
const FEEDBACK_DELAY_MS = 900

export interface TrueFalseQuestionProps {
  /** Stable per-card key — statement truth/false-swap is only rolled once per card, on mount, not
   * re-rolled on every render (which would flip the answer out from under an in-progress tap). */
  cardKey: string
  word: string
  meaning: string
  onListen: () => void
  distractors: DistractorMeaning[]
  onAnswered: (correct: boolean) => void
}

/**
 * Auto-graded review question: a true/false statement about the word, correct 50% of the time,
 * swapped for a distractor's meaning the other 50%. Bypasses the LiquidJS/WebView template
 * pipeline entirely — this is a system-defined interaction, not a user-customizable card layout
 * (see review/[deckId].tsx `mode=mixed`). Grading is binary: correct -> onAnswered(true), wrong ->
 * onAnswered(false) — the caller maps that to the 'good'/'again' FSRS ratings.
 */
export function TrueFalseQuestion(props: TrueFalseQuestionProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const [choice, setChoice] = useState<boolean | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { statementIsTrue, shownMeaning } = useMemo(() => {
    // A distractor whose meaning coincidentally matches the real one (synonyms, near-duplicate
    // translations across cards) would make an intended-false statement actually true, grading the
    // right answer as wrong — filter those out before picking one.
    const normalizedMeaning = props.meaning.trim().toLowerCase()
    const validDistractors = props.distractors.filter((d) => d.meaning.trim().toLowerCase() !== normalizedMeaning)
    const isTrue = Math.random() < 0.5
    if (isTrue || validDistractors.length === 0) {
      return { statementIsTrue: true, shownMeaning: props.meaning }
    }
    const distractor = validDistractors[Math.floor(Math.random() * validDistractors.length)]
    return { statementIsTrue: false, shownMeaning: distractor?.meaning ?? props.meaning }
    // Rolled once per card, keyed by cardKey — not on every props.meaning/distractors identity change.
  }, [props.cardKey])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const choose = (guess: boolean): void => {
    if (choice !== null) return
    setChoice(guess)
    const correct = guess === statementIsTrue
    timer.current = setTimeout(() => props.onAnswered(correct), FEEDBACK_DELAY_MS)
  }

  const answered = choice !== null
  const guessedCorrectly = answered && choice === statementIsTrue

  return (
    <View style={styles.wrap}>
      <Text style={styles.prompt}>{t('True or false?')}</Text>
      <View style={styles.statementRow}>
        <Text style={styles.statement}>
          {t('"{{word}}" means "{{meaning}}"', { word: props.word, meaning: shownMeaning })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Listen')}
          hitSlop={8}
          style={styles.listenButton}
          onPress={props.onListen}
        >
          <Icon name="Volume1" size={20} color={colors.primary} />
        </Pressable>
      </View>
      <View style={styles.optionRow}>
        <Pressable
          style={[
            styles.option,
            answered && choice === true && { borderColor: guessedCorrectly ? colors.success : colors.danger, backgroundColor: guessedCorrectly ? colors.successSoft : colors.dangerSoft },
          ]}
          onPress={() => choose(true)}
          disabled={answered}
        >
          <Icon
            name="CircleCheckBig"
            size={20}
            color={answered && choice === true ? (guessedCorrectly ? colors.success : colors.danger) : colors.text}
          />
          <Text style={styles.optionLabel}>{t('True')}</Text>
        </Pressable>
        <Pressable
          style={[
            styles.option,
            answered && choice === false && { borderColor: guessedCorrectly ? colors.success : colors.danger, backgroundColor: guessedCorrectly ? colors.successSoft : colors.dangerSoft },
          ]}
          onPress={() => choose(false)}
          disabled={answered}
        >
          <Icon
            name="CircleX"
            size={20}
            color={answered && choice === false ? (guessedCorrectly ? colors.success : colors.danger) : colors.text}
          />
          <Text style={styles.optionLabel}>{t('False')}</Text>
        </Pressable>
      </View>
      {answered ? (
        <Text style={[styles.feedback, { color: guessedCorrectly ? colors.success : colors.danger }]}>
          {guessedCorrectly
            ? t('Correct!')
            : t('Not quite - "{{word}}" means "{{meaning}}".', { word: props.word, meaning: props.meaning })}
        </Text>
      ) : null}
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.lg,
    },
    prompt: {
      fontSize: type.caption,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statement: {
      flexShrink: 1,
      fontSize: type.heading,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    statementRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    listenButton: {
      width: 34,
      height: 34,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    optionRow: {
      flexDirection: 'row',
      gap: spacing.md,
      width: '100%',
    },
    option: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    optionLabel: {
      fontSize: type.body,
      fontWeight: '600',
      color: colors.text,
    },
    feedback: {
      fontSize: type.body,
      textAlign: 'center',
    },
  })
