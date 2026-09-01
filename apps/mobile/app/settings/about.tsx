import { logger } from '@lingora/observability'
import Constants from 'expo-constants'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import appIcon from '../../assets/icon-lingora.png'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { Icon } from '../../components/Icon'
import { AlertModal, Button, Card, IconButton } from '../../components/ui'
import { submitFeedback, type FeedbackPayload } from '../../lib/feedbackService'
import { useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'settings', screen: 'AboutScreen' })

type Category = 'support' | 'bug' | 'feature' | 'general'

interface CategoryItem {
  label: string
  description: string
  icon: 'CircleQuestionMark' | 'Bug' | 'Lightbulb' | 'MessagesSquare'
}

const CATEGORY_META: Record<Category, CategoryItem> = {
  support: {
    label: 'Help & Support',
    description: 'Setup questions, troubleshooting & guidance',
    icon: 'CircleQuestionMark',
  },
  bug: {
    label: 'Bug / Issue',
    description: 'Report unexpected behavior or errors',
    icon: 'Bug',
  },
  feature: {
    label: 'Feature request',
    description: 'Suggest improvements or new tools',
    icon: 'Lightbulb',
  },
  general: {
    label: 'General feedback',
    description: 'Thoughts, suggestions & ideas',
    icon: 'MessagesSquare',
  },
}
const CATEGORIES = Object.keys(CATEGORY_META) as Category[]

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'public',
    title: 'How your feedback is handled',
    icon: 'Globe',
    paragraphs: [
      'Your feedback is delivered directly to the Lemmory engineering team to help improve the app, resolve issues, and build requested features.',
      'Please don\'t include sensitive private credentials or passwords in your message.',
    ],
  },
  {
    id: 'diagnostics',
    title: 'What diagnostics includes',
    icon: 'Info',
    paragraphs: [
      'Only app version, platform, and your current feature tier (Full or Translation-only) - enough to help reproduce a bug.',
      'Never included: word content, translations, AI responses, or API keys.',
    ],
  },
  {
    id: 'status',
    title: 'Direct and secure delivery',
    icon: 'Wrench',
    paragraphs: [
      'Submissions are processed securely through the feedback service backend.',
      'If you provide an email address, our team can follow up with you regarding your message.',
    ],
  },
]

export default function AboutScreen(): JSX.Element {
  const { t } = useTranslation()
  const { tier } = useServices()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const help = useHelpAccordion('public')
  const params = useLocalSearchParams<{ category?: Category }>()

  const initialCategory: Category = params.category && CATEGORIES.includes(params.category) ? params.category : 'support'
  const [category, setCategory] = useState<Category>(initialCategory)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const selectedCategoryMeta = CATEGORY_META[category]

  useEffect(() => {
    if (params.category && CATEGORIES.includes(params.category)) {
      setCategory(params.category)
    }
  }, [params.category])

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true)
  const [contactEmail, setContactEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null)

  const appVersion = Constants.expoConfig?.version ?? '0.1.0'
  const buildNumber =
    Constants.nativeBuildVersion ??
    (Platform.OS === 'android'
      ? Constants.expoConfig?.android?.versionCode?.toString()
      : Constants.expoConfig?.ios?.buildNumber) ??
    '8'

  const buildLabel = `v${appVersion} (${t('Build')} ${buildNumber})`
  const platformLabel = Platform.OS === 'ios' ? 'iOS' : 'Android'

  const canSubmit = title.trim() !== '' && message.trim() !== '' && !submitting

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) return
    setSubmitting(true)

    const payload: FeedbackPayload = {
      category,
      title: title.trim(),
      message: message.trim(),
      contactEmail: contactEmail.trim() || undefined,
      diagnostics: includeDiagnostics
        ? {
            appVersion,
            buildNumber,
            platform: platformLabel,
            tier: tier === 'full' ? 'Full' : 'Translation-only',
          }
        : null,
    }

    log.info('settings.feedback_submitted', {
      message: 'User submitted feedback form',
      metadata: { settingKey: category },
    })

    try {
      const result = await submitFeedback(payload)
      setSubmitting(false)

      if (result.success) {
        setNotice({
          title: t('Feedback Sent!'),
          message: t('Thank you for reaching out! Your message has been received and our team will review it.'),
        })
        setCategory('support')
        setTitle('')
        setMessage('')
        setContactEmail('')
      } else {
        setNotice({
          title: t('Could not send feedback'),
          message: t('We could not send your feedback at this time. Please check your connection and try again.'),
        })
      }
    } catch {
      setSubmitting(false)
      setNotice({
        title: t('Could not send feedback'),
        message: t('Something went wrong while sending your feedback. Please check your connection and try again.'),
      })
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Help lives in the native header, next to the "About & Support" title (set by
          app/_layout.tsx), not inline in the body — see the header-right pattern shared with
          Search, Mine, word/[form], and the other Settings screens that have a help sheet. */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton icon="CircleQuestionMark" onPress={() => help.openSection('public')} color={colors.primary} size={22} />
          ),
        }}
      />

      <Card style={styles.aboutCard}>
        <View style={styles.iconWrap}>
          <Image source={appIcon} style={styles.icon} resizeMode="contain" />
        </View>
        <Text style={styles.appName}>Lemmory</Text>
        <View style={styles.versionBadgeContainer}>
          <Text style={styles.versionBadgeText}>{buildLabel}</Text>
        </View>
        <Text style={styles.detail}>{t('offline-first · your data stays on device')}</Text>
      </Card>

      <Text style={styles.sectionLabel}>{t('Send Feedback')}</Text>

      <Text style={styles.fieldLabel}>{t('What kind of feedback?')}</Text>
      <View style={[styles.dropdownContainer, dropdownOpen && styles.dropdownContainerOpen]}>
        <Pressable
          style={({ pressed }) => [styles.dropdownHeader, pressed && styles.dropdownHeaderPressed]}
          onPress={() => setDropdownOpen((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={t('Feedback category')}
        >
          <View style={[styles.dropdownIconBubble, { backgroundColor: colors.primarySoft }]}>
            <Icon name={selectedCategoryMeta.icon} size={18} color={colors.primary} />
          </View>
          <View style={styles.dropdownHeaderTextWrap}>
            <Text style={styles.dropdownSelectedLabel}>{t(selectedCategoryMeta.label)}</Text>
            <Text style={styles.dropdownSelectedDesc} numberOfLines={1}>
              {t(selectedCategoryMeta.description)}
            </Text>
          </View>
          <Icon
            name={dropdownOpen ? 'ChevronUp' : 'ChevronDown'}
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>

        {dropdownOpen ? (
          <View style={styles.dropdownMenu}>
            <View style={styles.dropdownDivider} />
            {CATEGORIES.map((key) => {
              const meta = CATEGORY_META[key]
              const isSelected = category === key
              return (
                <Pressable
                  key={key}
                  testID={`feedback-category-${key}`}
                  style={({ pressed }) => [
                    styles.dropdownOption,
                    isSelected && styles.dropdownOptionSelected,
                    pressed && styles.dropdownOptionPressed,
                  ]}
                  onPress={() => {
                    setCategory(key)
                    setDropdownOpen(false)
                  }}
                >
                  <View
                    style={[
                      styles.optionIconBubble,
                      { backgroundColor: isSelected ? colors.primarySoft : colors.surfaceMuted },
                    ]}
                  >
                    <Icon
                      name={meta.icon}
                      size={16}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <View style={styles.optionTextWrap}>
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && { color: colors.primary, fontWeight: '700' },
                      ]}
                    >
                      {t(meta.label)}
                    </Text>
                    <Text style={styles.optionDesc} numberOfLines={1}>
                      {t(meta.description)}
                    </Text>
                  </View>
                  {isSelected ? (
                    <Icon name="Check" size={16} color={colors.primary} />
                  ) : null}
                </Pressable>
              )
            })}
          </View>
        ) : null}
      </View>

      <Card style={styles.detailsCard}>
        <Text style={styles.fieldLabel}>{t('Title')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('A short summary')}
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />

        <Text style={[styles.fieldLabel, styles.fieldSpacing]}>{t('Message')}</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          placeholder={t('What happened, or what would you like to see?')}
          placeholderTextColor={colors.textMuted}
          value={message}
          onChangeText={setMessage}
          multiline
          textAlignVertical="top"
        />
      </Card>

      <Card>
        <View style={styles.switchRow}>
          <View style={styles.switchLabelWrap}>
            <Text style={styles.fieldLabel}>{t('Include diagnostics')}</Text>
            <Text style={styles.fieldHint}>{t('App version, platform, and feature tier - helps reproduce a bug.')}</Text>
          </View>
          <Switch testID="feedback-diagnostics-toggle" value={includeDiagnostics} onValueChange={setIncludeDiagnostics} />
        </View>
        {includeDiagnostics ? (
          <Text style={styles.diagnosticsPreview}>
            {t('App {{version}} · {{platform}} · {{tier}}', {
              version: appVersion,
              platform: platformLabel,
              tier: tier === 'full' ? t('Full') : t('Translation-only'),
            })}
          </Text>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.fieldLabel}>{t('Email (Optional)')}</Text>
        <Text style={styles.fieldHint}>{t('Only if you want a reply - also becomes public once posted.')}</Text>
        <TextInput
          style={[styles.input, styles.fieldSpacing]}
          placeholder={t('you@example.com')}
          placeholderTextColor={colors.textMuted}
          value={contactEmail}
          onChangeText={setContactEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Card>

      <Button
        label={submitting ? t('Sending...') : t('Send Feedback')}
        icon="Send"
        onPress={handleSubmit}
        disabled={!canSubmit}
        style={styles.submitButton}
      />

      <HelpAccordionSheet
        visible={help.visible}
        onClose={help.close}
        title={t('Send Feedback help')}
        sections={HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={(id) => help.setSectionId(help.sectionId === id ? null : id)}
        translate={t}
      />
      <AlertModal
        visible={notice !== null}
        title={notice?.title ?? ''}
        message={notice?.message ?? ''}
        onClose={() => setNotice(null)}
      />
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
    aboutCard: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl, marginBottom: spacing.sm },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: radius.lg,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
      overflow: 'hidden',
    },
    icon: { width: 72, height: 72 },
    appName: { fontSize: type.heading, fontWeight: '800', color: colors.text },
    versionBadgeContainer: {
      backgroundColor: colors.primarySoft,
      paddingHorizontal: spacing.md,
      paddingVertical: 2,
      borderRadius: radius.full,
      marginVertical: spacing.xs,
    },
    versionBadgeText: {
      fontSize: type.caption,
      fontWeight: '700',
      color: colors.primary,
    },
    detail: { fontSize: type.caption, color: colors.textMuted, textAlign: 'center' },
    sectionLabel: {
      fontSize: type.caption,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    fieldLabel: { fontSize: type.body, fontWeight: '700', color: colors.text },
    fieldHint: { fontSize: type.micro, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 16 },
    fieldSpacing: { marginTop: spacing.md },
    dropdownContainer: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginTop: spacing.xs,
    },
    dropdownContainerOpen: {
      borderColor: colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    dropdownHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.sm,
    },
    dropdownHeaderPressed: {
      backgroundColor: colors.surfaceMuted,
    },
    dropdownIconBubble: {
      width: 38,
      height: 38,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropdownHeaderTextWrap: {
      flex: 1,
      gap: 2,
    },
    dropdownSelectedLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    dropdownSelectedDesc: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    dropdownMenu: {
      paddingBottom: spacing.xs,
    },
    dropdownDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing.md,
      marginBottom: spacing.xs,
    },
    dropdownOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      borderRadius: radius.md,
      marginHorizontal: spacing.xs,
    },
    dropdownOptionSelected: {
      backgroundColor: colors.primarySoft,
    },
    dropdownOptionPressed: {
      backgroundColor: colors.surfaceMuted,
    },
    optionIconBubble: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionTextWrap: {
      flex: 1,
      gap: 1,
    },
    optionLabel: {
      fontSize: 13.5,
      fontWeight: '600',
      color: colors.text,
    },
    optionDesc: {
      fontSize: 11.5,
      color: colors.textSecondary,
    },
    detailsCard: { gap: 0 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      fontSize: type.caption,
      color: colors.text,
      backgroundColor: colors.background,
      marginTop: spacing.xs,
    },
    messageInput: { minHeight: 120 },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    switchLabelWrap: { flex: 1 },
    diagnosticsPreview: {
      fontSize: type.caption,
      color: colors.textSecondary,
      marginTop: spacing.md,
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.sm,
      padding: spacing.sm,
    },
    submitButton: { marginTop: spacing.md },
  })
