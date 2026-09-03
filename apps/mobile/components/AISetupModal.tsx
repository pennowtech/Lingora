import { useRouter } from 'expo-router'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Icon } from './Icon'
import { IconButton } from './ui'
import { radius, spacing } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

export interface AISetupModalProps {
  visible: boolean
  onClose: () => void
  title?: string
  subtitle?: string
}

export function AISetupModal({
  visible,
  onClose,
  title,
  subtitle,
}: AISetupModalProps): JSX.Element {
  const { t } = useTranslation()
  const router = useRouter()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  const modalTitle = title ?? t('Word Discovery Setup')
  const modalSubtitle = subtitle ?? t("Choose how you'd like to power daily words")

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{modalTitle}</Text>
              <Text style={styles.subtitle}>{modalSubtitle}</Text>
            </View>
            <IconButton icon="X" size={20} onPress={onClose} />
          </View>

          {/* Action Row 1: Connect AI Provider */}
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
            onPress={() => {
              onClose()
              router.push('/settings/ai-providers')
            }}
          >
            <View style={[styles.iconBubble, { backgroundColor: colors.primarySoft }]}>
              <Icon name="Sparkles" size={18} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{t('Connect AI Provider')}</Text>
              <Text style={styles.actionSubtitle}>{t('OpenAI, Anthropic, Gemini, Groq, etc.')}</Text>
            </View>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>{t('Configure ↗')}</Text>
            </View>
          </Pressable>

          {/* Action Row 2: Local Offline Dictionaries */}
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
            onPress={() => {
              onClose()
              router.push('/settings/word-guides')
            }}
          >
            <View style={[styles.iconBubble, { backgroundColor: colors.warningSoft }]}>
              <Icon name="BookOpen" size={18} color={colors.warning} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{t('Local Offline Dictionaries')}</Text>
              <Text style={styles.actionSubtitle}>{t('Grammar, inflections & starter packs')}</Text>
            </View>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>{t('Manage ↗')}</Text>
            </View>
          </Pressable>

          {/* Polite Help Footer Bar */}
          <View style={styles.helpFooter}>
            <Text style={styles.helpText}>{t('Need help setting up?')}</Text>
            <Pressable
              onPress={() => {
                onClose()
                router.push({ pathname: '/settings/feedback', params: { category: 'support' } })
              }}
              style={styles.helpBtn}
            >
              <Icon name="CircleQuestionMark" size={14} color={colors.primary} />
              <Text style={styles.helpLink}>{t('Ask in Support ↗')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
    },
    dialog: {
      width: '100%',
      maxWidth: 440,
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 25,
      elevation: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontSize: 12.5,
      color: colors.textSecondary,
      fontWeight: '500',
      marginTop: 2,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    actionRowPressed: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
    },
    iconBubble: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionContent: {
      flex: 1,
      gap: 2,
    },
    actionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    actionSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    actionBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionBadgeText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.primary,
    },
    helpFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginTop: 2,
    },
    helpText: {
      fontSize: 12.5,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    helpBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    helpLink: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.primary,
    },
  })
}
