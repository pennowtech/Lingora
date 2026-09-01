import Constants from 'expo-constants'
import { useMemo, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Icon, type IconName } from './Icon'
import { Button, IconButton } from './ui'
import { parseChangelogMarkdown, type ParsedChangelogSection } from '../lib/changelog'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

interface WhatsNewModalProps {
  visible: boolean
  onClose: () => void
  version?: string
  markdownContent?: string
}

function renderFormattedBullet(bullet: string, colors: ThemeColors, styles: ReturnType<typeof createStyles>): JSX.Element {
  // Check if bullet starts with **Bold Title**: rest of text
  const match = bullet.match(/^\*\*([^*]+)\*\*:\s*(.*)$/)
  if (match && match[1]) {
    return (
      <Text style={styles.detailText}>
        <Text style={styles.boldTitle}>{match[1]}: </Text>
        {match[2]}
      </Text>
    )
  }
  return <Text style={styles.detailText}>{bullet.replace(/\*\*/g, '')}</Text>
}

export function WhatsNewModal({
  visible,
  onClose,
  version,
  markdownContent,
}: WhatsNewModalProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  const release = useMemo(() => parseChangelogMarkdown(markdownContent), [markdownContent])
  const items = release.sections
  const appVersion = version ?? release.version ?? Constants.expoConfig?.version ?? '0.2.0'

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    return new Set(items.length > 0 && items[0] ? [items[0].id] : [])
  })

  const toggleItem = (id: string): void => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>✨ {t('v{{version}} Update', { version: appVersion })}</Text>
              </View>
              <Text style={styles.title}>{t("What's Fresh in Lemmory")}</Text>
              <Text style={styles.subtitle}>{t('Tap any feature below to see what changed')}</Text>
            </View>
            <IconButton
              icon="X"
              size={18}
              color={colors.textMuted}
              onPress={onClose}
              accessibilityLabel={t('Close')}
            />
          </View>

          {/* Scrollable Accordion Digest */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.accordionContainer}
            showsVerticalScrollIndicator={true}
          >
            {items.map((item) => {
              const isExpanded = expandedIds.has(item.id)
              return (
                <View key={item.id} style={[styles.accordionItem, isExpanded && styles.accordionItemExpanded]}>
                  <Pressable
                    style={styles.accordionHeader}
                    onPress={() => toggleItem(item.id)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                  >
                    <View style={[styles.iconBubble, { backgroundColor: item.iconBg ?? colors.primarySoft }]}>
                      <Icon
                        name={item.icon}
                        size={18}
                        color={item.iconColor ?? colors.primary}
                      />
                    </View>
                    <View style={styles.headerTextWrap}>
                      <View style={styles.titleRow}>
                        <Text style={styles.itemTitle}>{t(item.title)}</Text>
                        {item.badge ? (
                          <View style={styles.badgePill}>
                            <Text style={styles.badgePillText}>{t(item.badge)}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <Icon
                      name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                      size={16}
                      color={isExpanded ? colors.primary : colors.textMuted}
                    />
                  </Pressable>

                  {isExpanded ? (
                    <View style={styles.accordionBody}>
                      {item.details.map((detail, idx) => (
                        <View key={idx} style={styles.detailBulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          {renderFormattedBullet(t(detail), colors, styles)}
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              )
            })}
          </ScrollView>

          {/* Footer CTA */}
          <View style={styles.footer}>
            <Button
              label={t("Got it, Let's Explore! →")}
              onPress={onClose}
              style={styles.ctaButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      width: '100%',
      maxWidth: 440,
      maxHeight: '88%',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.25,
      shadowRadius: 28,
      elevation: 20,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    headerLeft: {
      flex: 1,
    },
    versionBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primarySoft,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 3,
      borderRadius: radius.full,
      marginBottom: spacing.xs,
    },
    versionText: {
      fontSize: type.micro,
      fontWeight: '800',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    title: {
      fontSize: type.title,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: type.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    scrollArea: {
      marginVertical: spacing.sm,
      maxHeight: 380,
    },
    accordionContainer: {
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    accordionItem: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    accordionItemExpanded: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    accordionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      gap: spacing.sm + 2,
    },
    iconBubble: {
      width: 32,
      height: 32,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextWrap: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    itemTitle: {
      fontSize: type.caption,
      fontWeight: '600',
      color: colors.text,
    },
    badgePill: {
      backgroundColor: colors.warningSoft,
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: radius.sm,
    },
    badgePillText: {
      fontSize: type.micro,
      fontWeight: '800',
      color: colors.warning,
      textTransform: 'uppercase',
    },
    itemSubtitle: {
      fontSize: type.micro + 1,
      color: colors.textSecondary,
      marginTop: 1,
    },
    accordionBody: {
      paddingHorizontal: spacing.md + 4,
      paddingTop: spacing.xs,
      paddingBottom: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      gap: spacing.xs + 2,
    },
    detailBulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs + 2,
    },
    bulletDot: {
      fontSize: type.body,
      color: colors.primary,
      lineHeight: 18,
      fontWeight: '700',
    },
    detailText: {
      flex: 1,
      fontSize: type.caption,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    boldTitle: {
      fontWeight: '700',
      color: colors.text,
    },
    footer: {
      marginTop: spacing.md,
    },
    ctaButton: {
      width: '100%',
    },
  })
