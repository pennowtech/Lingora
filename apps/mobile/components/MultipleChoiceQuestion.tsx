import type { DistractorMeaning } from '@lingora/database'
import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { shuffleArray } from '../lib/reviewTypes'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

const FEEDBACK_DELAY_MS = 900
const OPTION_COUNT = 4

export interface MultipleChoiceQuestionProps {
  /** Stable per-card key — options are shuffled once per card, on mount. */
  cardKey: string
  word: string
  meaning: string
  distractors: DistractorMeaning[]
  onAnswered: (correct: boolean) => void
}

/**
 * Auto-graded review question: "What does {word} mean?" with the correct meaning plus up to 3
 * distractor meanings, shuffled. Bypasses the LiquidJS/WebView template pipeline entirely — a
 * system-defined interaction, not a user-customizable card layout (see review/[deckId].tsx
 * `mode=mixed`). Grading is binary, mapped by the caller to 'good'/'again'.
 */
export function MultipleChoiceQuestion(props: MultipleChoiceQuestionProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const [choice, setChoice] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const options = useMemo(() => {
    // Distractors come from other cards' meanings with no uniqueness guarantee — two different
    // words can translate to the same text (synonyms, near-duplicates), or a distractor can
    // coincidentally match the correct answer itself. Either produces a genuinely ambiguous
    // question (two "correct" options) and, since selection below is compared by string value,
    // duplicate option text also makes tapping one row visually select both. Dedupe case/whitespace-
    // insensitively and always exclude anything matching the correct answer.
    const seen = new Set<string>([props.meaning.trim().toLowerCase()])
    const wrongOptions: string[] = []
    for (const d of shuffleArray(props.distractors)) {
      if (wrongOptions.length >= OPTION_COUNT - 1) break
      const normalized = d.meaning.trim().toLowerCase()
      if (seen.has(normalized)) continue
      seen.add(normalized)
      wrongOptions.push(d.meaning)
    }
    return shuffleArray([props.meaning, ...wrongOptions])
    // Shuffled once per card, keyed by cardKey — not on every props.meaning/distractors identity change.
  }, [props.cardKey])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const choose = (option: string): void => {
    if (choice !== null) return
    setChoice(option)
    timer.current = setTimeout(() => props.onAnswered(option === props.meaning), FEEDBACK_DELAY_MS)
  }

  const answered = choice !== null

  return (
    <View style={styles.wrap}>
      <Text style={styles.prompt}>{t('What does this mean?')}</Text>
      <Text style={styles.word}>{props.word}</Text>
      <View style={styles.optionList}>
        {options.map((option, index) => {
          const isCorrectOption = option === props.meaning
          const isChosen = choice === option
          const showAsCorrect = answered && isCorrectOption
          const showAsWrong = answered && isChosen && !isCorrectOption
          return (
            <Pressable
              // Index, not just the option text — options are deduped above, but keying on the
              // text alone would still collide if that guarantee ever slipped.
              key={`${index}-${option}`}
              style={[
                styles.option,
                showAsCorrect && { borderColor: colors.success, backgroundColor: colors.successSoft },
                showAsWrong && { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
              ]}
              onPress={() => choose(option)}
              disabled={answered}
            >
              <Text style={styles.optionLabel}>{option}</Text>
              {showAsCorrect ? <Ionicons name="checkmark-circle" size={18} color={colors.success} /> : null}
              {showAsWrong ? <Ionicons name="close-circle" size={18} color={colors.danger} /> : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.lg,
    },
    prompt: {
      fontSize: type.caption,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    word: {
      fontSize: type.heading,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    optionList: {
      gap: spacing.sm,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    optionLabel: {
      flex: 1,
      fontSize: type.body,
      color: colors.text,
    },
  })
