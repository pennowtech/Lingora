import type { QuestionType } from '@lingora/types'
import type { JSX } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Icon, type IconName } from './Icon'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'
import { ALL_QUESTION_TYPES, QUESTION_TYPE_META } from '../lib/reviewTypes'

const QUESTION_TYPE_ICONS: Record<QuestionType, IconName> = {
  vocab: 'ArrowLeftRight',
  reverse: 'CornerUpLeft',
  cloze: 'Type',
  trueFalse: 'CircleCheckBig',
  mcq: 'List',
}

/**
 * Which formats a deck's cards use during Review. Desktop-styled 3-column tile grid matching
 * desktop's `ReviewModesGrid` (icon badge + label + selection outline), replacing mobile capsules.
 */
export function ReviewModesPicker(props: {
  value: QuestionType[]
  onToggle: (type: QuestionType) => void
  label?: string
}): JSX.Element {
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.container}>
      {props.label ? <Text style={styles.label}>{props.label}</Text> : null}
      <View style={styles.gridRow}>
        {ALL_QUESTION_TYPES.map((questionType) => {
          const meta = QUESTION_TYPE_META[questionType]
          const iconName = QUESTION_TYPE_ICONS[questionType]
          const isOn = props.value.includes(questionType)
          const displayLabel = meta.arrowFrom ? `${meta.arrowFrom} → ${meta.arrowTo}` : meta.label

          return (
            <Pressable
              key={questionType}
              onPress={() => props.onToggle(questionType)}
              style={[styles.tileCard, isOn && styles.tileCardSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected: isOn }}
            >
              <View style={[styles.iconBadge, isOn && styles.iconBadgeSelected]}>
                <Icon
                  name={iconName}
                  size={15}
                  color={isOn ? colors.textOnPrimary : colors.textSecondary}
                />
              </View>
              <Text style={[styles.tileLabel, isOn && styles.tileLabelSelected]}>
                {displayLabel}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { gap: spacing.xs },
    label: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
    gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    tileCard: {
      width: '31%',
      flexGrow: 1,
      minWidth: 96,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    tileCardSelected: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    iconBadge: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBadgeSelected: {
      backgroundColor: colors.primary,
    },
    tileLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 14,
    },
    tileLabelSelected: {
      color: colors.primary,
    },
  })

/**
 * Compact row of review mode / card type icon badges (icons only, matching deck creation).
 */
export function ReviewModeBadges(props: {
  modes?: QuestionType[] | null | undefined
  label?: string | undefined
  size?: 'sm' | 'md' | undefined
}): JSX.Element | null {
  const colors = useColors()
  const styles = useThemedStyles(createBadgeStyles)
  const modes = props.modes && props.modes.length > 0 ? props.modes : ALL_QUESTION_TYPES

  return (
    <View style={styles.badgeContainer}>
      {props.label ? <Text style={styles.badgeGroupLabel}>{props.label}</Text> : null}
      <View style={styles.badgeRow}>
        {modes.map((mode) => {
          const icon = QUESTION_TYPE_ICONS[mode]
          const meta = QUESTION_TYPE_META[mode]
          if (!icon) return null
          return (
            <View
              key={mode}
              style={[styles.badge, props.size === 'sm' && styles.badgeSm]}
              accessibilityLabel={meta?.label ?? mode}
            >
              <Icon name={icon} size={props.size === 'sm' ? 12 : 14} color={colors.primary} />
            </View>
          )
        })}
      </View>
    </View>
  )
}

const createBadgeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    badgeContainer: {
      gap: 3,
    },
    badgeGroupLabel: {
      fontSize: type.micro,
      fontWeight: '600',
      color: colors.textMuted,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 4,
    },
    badge: {
      width: 24,
      height: 24,
      borderRadius: radius.sm,
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeSm: {
      width: 20,
      height: 20,
      borderRadius: 4,
    },
  })
