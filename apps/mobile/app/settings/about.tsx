import { logger } from '@lingora/observability'
import Constants from 'expo-constants'
import { Stack } from 'expo-router'
import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import appIcon from '../../assets/icon-lingora.png'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { AlertModal, Button, Card, Chip, IconButton } from '../../components/ui'
import { useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'settings', screen: 'AboutScreen' })

type Category = 'bug' | 'feature' | 'general'

const CATEGORY_META: Record<Category, { label: string; icon: 'bug-outline' | 'bulb-outline' | 'chatbubbles-outline' }> = {
  bug: { label: 'Bug / Issue', icon: 'bug-outline' },
  feature: { label: 'Feature request', icon: 'bulb-outline' },
  general: { label: 'General feedback', icon: 'chatbubbles-outline' },
}
const CATEGORIES = Object.keys(CATEGORY_META) as Category[]

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'public',
    title: 'This becomes a public issue',
    icon: 'globe-outline',
    paragraphs: [
      'Submitting posts your message as a GitHub issue on Lemmory\'s public repository - anyone can read it, including your contact email if you provide one.',
      'Please don\'t include anything private in your message.',
    ],
  },
  {
    id: 'diagnostics',
    title: 'What diagnostics includes',
    icon: 'information-circle-outline',
    paragraphs: [
      'Only app version, platform, and your current feature tier (Full or Translation-only) - enough to help reproduce a bug.',
      'Never included: word content, translations, AI responses, or API keys.',
    ],
  },
  {
    id: 'status',
    title: 'Why nothing sends yet',
    icon: 'construct-outline',
    paragraphs: [
      'Creating a GitHub issue needs a token with write access to the repo - that can never ship inside the app, since a compiled build can be decompiled and any embedded secret treated as public.',
      'This screen is a preview of the full flow; submitting just confirms locally for now. A small server-side function will handle real submission in a future update.',
    ],
  },
]

/**
 * "About & Support" — the app identity card (unchanged from the standalone About screen) plus the
 * "Send Feedback" form (also unchanged — see below), merged into one settings-menu destination so
 * the main menu doesn't need a separate row for each. Kept as two distinct sections in one
 * ScrollView rather than actually interleaving their logic — they have nothing to share, and
 * keeping the feedback form's own code block intact (instead of restructuring it) minimizes the
 * chance of breaking its working submission-preview flow.
 *
 * The feedback form itself — UI shell for the flow designed in
 * LingoraDocs/10_feedback_to_github_issue.md. Deliberately frontend-only for now: creating a
 * GitHub issue needs a repo-write token that can never ship inside the app (see that doc's §2), so
 * there is no real submission path yet — Submit just confirms locally.
 *
 * TODO(feedback-backend): once the Firebase Cloud Function from doc 10 §5 exists, replace
 * handleSubmit's local confirmation with a real call to it (category/title/message/diagnostics/
 * contactEmail, exactly the fields already collected here) and surface the created issue's URL or
 * a rate-limit error instead of the placeholder Alert.
 */
export default function AboutScreen(): JSX.Element {
  const { t } = useTranslation()
  const { tier } = useServices()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const help = useHelpAccordion('public')

  const [category, setCategory] = useState<Category>('bug')
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

  const handleSubmit = (): void => {
    if (!canSubmit) return
    setSubmitting(true)
    log.info('settings.feedback_submitted_locally', {
      message: 'User completed the feedback form (no backend wired up yet)',
      metadata: { settingKey: category },
    })
    // No backend yet (see file doc comment) — this is where the real submission call goes once
    // LingoraDocs/10_feedback_to_github_issue.md's Cloud Function exists.
    setTimeout(() => {
      setSubmitting(false)
      setNotice({
        title: t('Thanks for the feedback'),
        message: t("This is a preview of the feedback form - sending isn't connected yet, so nothing was sent anywhere. Once it is, this exact form will open a GitHub issue on your behalf."),
      })
      setCategory('bug')
      setTitle('')
      setMessage('')
      setContactEmail('')
    }, 400)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Help lives in the native header, next to the "About & Support" title (set by
          app/_layout.tsx), not inline in the body — see the header-right pattern shared with
          Search, Mine, word/[form], and the other Settings screens that have a help sheet. */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton icon="help-circle-outline" onPress={() => help.openSection('public')} color={colors.primary} size={22} />
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
      <Card>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((key) => {
            const meta = CATEGORY_META[key]
            const selected = category === key
            return (
              <Chip
                key={key}
                testID={`feedback-category-${key}`}
                label={t(meta.label)}
                selected={selected}
                onPress={() => setCategory(key)}
              />
            )
          })}
        </View>
      </Card>

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
        icon="send"
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
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
