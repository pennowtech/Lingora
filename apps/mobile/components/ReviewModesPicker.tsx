import type { QuestionType } from '@lingora/types'
import type { JSX } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Chip } from './ui'
import { spacing, type } from '../lib/theme'
import { useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'
import { ALL_QUESTION_TYPES, QUESTION_TYPE_META } from '../lib/reviewTypes'

/**
 * Which review formats a deck's cards get reviewed with - same five chips as Settings -> Learning's
 * global "Practice question types" picker (settings/learning.tsx), same Chip component and layout,
 * just controlled by the caller instead of persisted to SecureStore directly. Used at deck-creation
 * time (DeckPickerModal's inline "Create new deck" row, and the Decks tab's own new-deck modal) so
 * a deck can override the learner's global default from the moment it's created.
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
