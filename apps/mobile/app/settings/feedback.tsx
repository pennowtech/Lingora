import { logger } from '@lingora/observability'
import Constants from 'expo-constants'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { Icon } from '../../components/Icon'
import { AlertModal, Button, Card, ConfirmModal, IconButton } from '../../components/ui'
import { submitFeedback, type FeedbackPayload } from '../../lib/feedbackService'
import { useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'settings', screen: 'FeedbackScreen' })

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

export default function FeedbackScreen(): JSX.Element {
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
  const [emailWarningOpen, setEmailWarningOpen] = useState(false)

  const appVersion = Constants.expoConfig?.version ?? '0.1.0'
  const buildNumber =
    Constants.nativeBuildVersion ??
    (Platform.OS === 'android'
      ? Constants.expoConfig?.android?.versionCode?.toString()
      : Constants.expoConfig?.ios?.buildNumber) ??
    '8'

  const platformLabel = Platform.OS === 'ios' ? 'iOS' : 'Android'
  const canSubmit = title.trim() !== '' && message.trim() !== '' && !submitting

  // Feedback is posted as a public GitHub issue - an email typed here would be visible to anyone,
  // not just our team - so submitting with one filled in is gated on an explicit acknowledgement
  // rather than sent straight through.
  const handleSubmit = (): void => {
    if (!canSubmit) return
    if (contactEmail.trim() !== '') {
      setEmailWarningOpen(true)
      return
    }
    void doSubmit()
  }

  const doSubmit = async (): Promise<void> => {
    setSubmitting(true)

    const payload: FeedbackPayload = {
      category,
      title: title.trim(),
      message: message.trim(),
      app: Platform.OS === 'ios' ? 'ios-lemmory' : 'android-lemmory',
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
      <Stack.Screen
        options={{
          title: t('Send Feedback'),
          headerRight: () => (
            <IconButton icon="CircleQuestionMark" onPress={() => help.openSection('public')} color={colors.primary} size={22} />
          ),
        }}
      />

      <Card style={styles.headerCard}>
        <View style={styles.headerIconWrap}>
          <Icon name="MessageSquareText" size={24} color={colors.primary} />
        </View>
        <Text style={styles.headerTitle}>{t('We\'d love to hear from you')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('Send ideas, report bugs, or ask for help.')}
        </Text>
      </Card>

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
                      size={18}
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
                    <Text style={styles.optionDescription}>{t(meta.description)}</Text>
                  </View>
                  {isSelected ? (
                    <Icon name="CircleCheck" size={16} color={colors.primary} />
                  ) : null}
                </Pressable>
              )
            })}
          </View>
        ) : null}
      </View>

      <Text style={styles.fieldLabel}>{t('Summary')}</Text>
      <TextInput
        testID="feedback-title-input"
        style={styles.input}
        placeholder={t('Short title (e.g. "Audio crashes on slow network")')}
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
        autoCapitalize="sentences"
      />

      <Text style={styles.fieldLabel}>{t('Details')}</Text>
      <TextInput
        testID="feedback-message-input"
        style={[styles.input, styles.textarea]}
        placeholder={t('What happened? What did you expect to happen instead?')}
        placeholderTextColor={colors.textMuted}
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        autoCapitalize="sentences"
      />

      <Text style={styles.fieldLabel}>{t('Your Email (Optional)')}</Text>
      <TextInput
        testID="feedback-email-input"
        style={styles.input}
        placeholder={t('email@example.com (so we can follow up with you)')}
        placeholderTextColor={colors.textMuted}
        value={contactEmail}
        onChangeText={setContactEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {contactEmail.trim() !== '' ? (
        <View style={styles.emailWarningRow}>
          <Icon name="CircleAlert" size={14} color={colors.warning} />
          <Text style={styles.emailWarningText}>
            {t('Feedback is posted as a public GitHub issue - this email will be visible to anyone who views it.')}
          </Text>
        </View>
      ) : null}

      <Card style={styles.diagnosticsCard}>
        <View style={styles.diagnosticsRow}>
          <View style={styles.diagnosticsText}>
            <Text style={styles.diagnosticsTitle}>{t('Include Diagnostics')}</Text>
            <Text style={styles.diagnosticsDetail}>
              {t('Includes app version ({{version}}), OS ({{platform}}), and tier ({{tier}}). Never includes your words or keys.', {
                version: appVersion,
                platform: platformLabel,
                tier: tier === 'full' ? 'Full' : 'Translation-only',
              })}
            </Text>
          </View>
          <Switch
            value={includeDiagnostics}
            onValueChange={setIncludeDiagnostics}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
      </Card>

      <View style={styles.submitWrap}>
        <Button
          testID="feedback-submit-button"
          label={submitting ? t('Sending...') : t('Send Feedback')}
          icon="Send"
          onPress={handleSubmit}
          disabled={!canSubmit}
        />
      </View>

      <AlertModal
        visible={notice !== null}
        title={notice?.title ?? ''}
        message={notice?.message ?? ''}
        onClose={() => setNotice(null)}
      />

      <ConfirmModal
        visible={emailWarningOpen}
        title={t('Your email will be public')}
        message={t(
          'Feedback is posted as a public GitHub issue. The email address you entered will be visible there to anyone who views it - not just our team. Go back to remove it if you\'d rather keep it private, or send it as-is if that\'s fine.',
        )}
        cancelLabel={t('Go Back')}
        confirmLabel={t('Send Anyway')}
        onCancel={() => setEmailWarningOpen(false)}
        onConfirm={() => {
          setEmailWarningOpen(false)
          void doSubmit()
        }}
      />

      <HelpAccordionSheet
        visible={help.visible}
        onClose={help.close}
        title={t('Feedback help')}
        sections={HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={(id) => help.setSectionId(help.sectionId === id ? null : id)}
        translate={t}
      />
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    headerCard: {
      alignItems: 'center',
      padding: spacing.lg,
      gap: spacing.xs,
      backgroundColor: colors.surface,
    },
    headerIconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    headerTitle: {
      fontSize: type.subheading,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: type.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    fieldLabel: {
      fontSize: type.caption,
      fontWeight: '700',
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    dropdownContainer: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    dropdownContainerOpen: {
      borderColor: colors.primary,
    },
    dropdownHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.md,
    },
    dropdownHeaderPressed: {
      backgroundColor: colors.surfaceMuted,
    },
    dropdownIconBubble: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropdownHeaderTextWrap: {
      flex: 1,
      gap: 2,
    },
    dropdownSelectedLabel: {
      fontSize: type.body,
      fontWeight: '700',
      color: colors.text,
    },
    dropdownSelectedDesc: {
      fontSize: type.micro,
      color: colors.textMuted,
    },
    dropdownMenu: {
      backgroundColor: colors.surface,
    },
    dropdownDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    dropdownOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.md,
    },
    dropdownOptionSelected: {
      backgroundColor: colors.primarySoft,
    },
    dropdownOptionPressed: {
      opacity: 0.7,
    },
    optionIconBubble: {
      width: 34,
      height: 34,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionTextWrap: {
      flex: 1,
      gap: 2,
    },
    optionLabel: {
      fontSize: type.body,
      fontWeight: '600',
      color: colors.text,
    },
    optionDescription: {
      fontSize: type.micro,
      color: colors.textMuted,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: type.body,
      color: colors.text,
    },
    textarea: {
      minHeight: 120,
    },
    emailWarningRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
      marginTop: -spacing.xs,
    },
    emailWarningText: {
      flex: 1,
      fontSize: type.micro,
      color: colors.warning,
      lineHeight: 16,
    },
    diagnosticsCard: {
      backgroundColor: colors.surface,
      padding: spacing.md,
    },
    diagnosticsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    diagnosticsText: {
      flex: 1,
      gap: 2,
    },
    diagnosticsTitle: {
      fontSize: type.body,
      fontWeight: '700',
      color: colors.text,
    },
    diagnosticsDetail: {
      fontSize: type.micro,
      color: colors.textMuted,
      lineHeight: 16,
    },
    submitWrap: {
      marginTop: spacing.sm,
    },
  })
