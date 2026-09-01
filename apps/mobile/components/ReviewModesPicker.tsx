import type { QuestionType } from '@lingora/types'
import type { JSX } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Chip } from './ui'
import { spacing, type } from '../lib/theme'
import { useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'
import { ALL_QUESTION_TYPES, QUESTION_TYPE_META } from '../lib/reviewTypes'

/**
 * Which formats a deck's cards use during Review. This is selected and saved per deck at creation
 * time (DeckPickerModal's inline "Create new deck" row and the Decks tab's new-deck modal), so two
 * decks can intentionally use different review experiences.
 */
export function ReviewModesPicker(props: {
  value: QuestionType[]
  onToggle: (type: QuestionType) => void
  label?: string
}): JSX.Element {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.container}>
      {props.label ? <Text style={styles.label}>{props.label}</Text> : null}
      <View style={styles.chipRow}>
        {ALL_QUESTION_TYPES.map((questionType) => {
          const meta = QUESTION_TYPE_META[questionType]
          return (
            <Chip
              key={questionType}
              {...(meta.arrowFrom !== undefined && meta.arrowTo !== undefined
                ? { arrow: { from: meta.arrowFrom, to: meta.arrowTo } }
                : { label: meta.label })}
              selected={props.value.includes(questionType)}
              onPress={() => props.onToggle(questionType)}
            />
          )
        })}
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { gap: spacing.xs },
    label: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  })
