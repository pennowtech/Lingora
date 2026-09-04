import Constants from 'expo-constants'
import { Stack } from 'expo-router'
import { useEffect, useMemo, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import appIcon from '../../assets/icon-lingora.png'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { Icon } from '../../components/Icon'
import { Button, Card, IconButton } from '../../components/ui'
import { WhatsNewModal } from '../../components/WhatsNewModal'
import { StartupScreen } from '../../components/StartupScreen'
import { parseChangelogMarkdown } from '../../lib/changelog'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'
import {
  checkForAppUpdate,
  getAutoUpdateEnabled,
  notifyUpdateAvailable,
  setAutoUpdateEnabled,
  type CheckUpdateResult,
} from '../../lib/updateManager'

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'privacy',
    title: 'Offline-first & Privacy',
    icon: 'ShieldCheck',
    paragraphs: [
      'Lemony is built **offline-first**. All your cards, review history, and learning progress stay strictly on your device unless you enable optional Cloud Sync.',
      'AI lookups only send the term you search for to your chosen AI provider, never your full study history.',
    ],
  },
  {
    id: 'updates',
    title: 'Google Play & App Updates',
    icon: 'Sparkles',
    paragraphs: [
      'Lemony checks the **Google Play Store** directly to see if a newer release is ready for your device.',
      '**Automatic Checks**: When enabled, Lemony checks Google Play at most once every 24 hours while active to save battery, and notifies you when an update is available.',
      '**User Control**: You can turn off update checks at any time. When turned off, Lemony stops all automatic checks and notifications completely.',
      '**What\'s Fresh in Lemony**: Tapping any update notification or release card displays the full changelog digest with an instant link to update on Google Play.',
    ],
  },
  {
    id: 'playstore',
    title: 'Google Play Auto-Updates',
    icon: 'RefreshCw',
    paragraphs: [
      'If Google Play\'s own auto-update is active on your device, Play Store may silently update the app overnight over Wi-Fi.',
      'When this happens, Lemony detects the new version on launch and displays what changed, without sending redundant update notifications.',
    ],
  },
]

export default function AboutScreen(): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const help = useHelpAccordion('privacy')
  const [whatsNewModalOpen, setWhatsNewModalOpen] = useState(false)
  const [featureReplayOpen, setFeatureReplayOpen] = useState(false)

  const [autoUpdateEnabled, setAutoUpdateEnabledState] = useState(true)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [checkResult, setCheckResult] = useState<CheckUpdateResult | null>(null)
  const [activeModalVersion, setActiveModalVersion] = useState<string | undefined>()
  const [activeModalChangelog, setActiveModalChangelog] = useState<string | undefined>()
  const [showPlayStoreInModal, setShowPlayStoreInModal] = useState(false)

  useEffect(() => {
    void getAutoUpdateEnabled().then(setAutoUpdateEnabledState)
  }, [])

  const handleToggleAutoUpdate = async (value: boolean): Promise<void> => {
    setAutoUpdateEnabledState(value)
    await setAutoUpdateEnabled(value)
  }

  const handleCheckUpdates = async (): Promise<void> => {
    setCheckingUpdates(true)
    setCheckResult(null)
    try {
      const result = await checkForAppUpdate({ force: true, notify: autoUpdateEnabled })
      setCheckResult(result)
      if (result.updateAvailable) {
        setShowPlayStoreInModal(true)
      }
    } finally {
      setCheckingUpdates(false)
    }
  }

  const handleTestNotification = async (): Promise<void> => {
    await notifyUpdateAvailable({
      version: '0.3.1',
      versionCode: (Constants.expoConfig?.android?.versionCode ?? 13) + 1,
      changelog: `### 🌟 What's Fresh in Lemony
- **Play Store Update Notifications**: Receive timely notifications when a new update is released on Google Play.
- **Direct What's Fresh**: Tapping the notification immediately displays release highlights and changes.
- **Polished Dark Themes**: Harmonious backgrounds and typography across Search, Mining Studio, and Review.`,
    })
  }

  const appVersion = Constants.expoConfig?.version ?? '0.2.0'
  const buildNumber =
    Constants.nativeBuildVersion ??
    (Platform.OS === 'android'
      ? Constants.expoConfig?.android?.versionCode?.toString()
      : Constants.expoConfig?.ios?.buildNumber) ??
    '8'

  const buildLabel = `v${appVersion} (${t('Build')} ${buildNumber})`

  const release = useMemo(() => parseChangelogMarkdown(), [])
  const recentSections = release.sections.slice(0, 3)

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Stack.Screen
        options={{
          title: t('About Lemony'),
          headerRight: () => (
            <IconButton icon="CircleQuestionMark" onPress={() => help.openSection('privacy')} color={colors.primary} size={22} />
          ),
        }}
      />

      {/* App Identity Card */}
      <Card style={styles.aboutCard}>
        <View style={styles.iconWrap}>
          <Image source={appIcon} style={styles.icon} resizeMode="contain" />
        </View>
        <Text style={styles.appName}>Lemony</Text>
        <View style={styles.versionBadgeContainer}>
          <Text style={styles.versionBadgeText}>{buildLabel}</Text>
        </View>
        <Text style={styles.tagline}>{t('offline-first · your data stays on device')}</Text>
        <Button
          label={t('Replay introduction')}
          icon="Play"
          variant="secondary"
          small
          onPress={() => setFeatureReplayOpen(true)}
          style={styles.replayButton}
        />
      </Card>

      {/* App Updates & Notification Card */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWrap}>
            <Icon name="Bell" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('App Updates')}</Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingLabel}>{t('Check for updates')}</Text>
            <Text style={styles.settingDesc}>
              {autoUpdateEnabled
                ? t('Automatically checks Google Play and notifies you when a new version is ready')
                : t('Disabled. Lemony will not check for updates or send notifications.')}
            </Text>
          </View>
          <Switch
            value={autoUpdateEnabled}
            onValueChange={(val) => void handleToggleAutoUpdate(val)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.updateActionsRow}>
          <Button
            label={checkingUpdates ? t('Checking Play Store...') : t('Check Play Store for updates')}
            {...(checkingUpdates ? {} : { icon: 'RefreshCw' as const })}
            variant="secondary"
            small
            disabled={checkingUpdates}
            onPress={() => void handleCheckUpdates()}
            style={styles.checkBtn}
          />
          <IconButton
            icon="Bell"
            size={18}
            color={colors.primary}
            onPress={() => void handleTestNotification()}
            accessibilityLabel={t('Send test update notification')}
          />
        </View>

        {checkResult ? (
          <View
            style={[
              styles.feedbackBanner,
              checkResult.updateAvailable
                ? styles.feedbackAvailable
                : checkResult.error
                  ? styles.feedbackError
                  : styles.feedbackUpToDate,
            ]}
          >
            <Icon
              name={
                checkResult.updateAvailable
                  ? 'Sparkles'
                  : checkResult.error
                    ? 'CircleAlert'
                    : 'CircleCheck'
              }
              size={16}
              color={
                checkResult.updateAvailable
                  ? colors.primary
                  : checkResult.error
                    ? colors.danger
                    : colors.success
              }
            />
            <View style={styles.feedbackTextWrap}>
              <Text style={styles.feedbackText}>
                {checkResult.updateAvailable
                  ? t('A new version is available on Google Play!')
                  : checkResult.error
                    ? t('Could not query Google Play Store. Verify Play services.')
                    : t('Lemony is up to date on Google Play (v{{version}})', { version: checkResult.currentVersion })}
              </Text>
            </View>
            {checkResult.updateAvailable ? (
              <Pressable
                style={styles.inlineWhatsNewButton}
                onPress={() => {
                  setActiveModalVersion(checkResult.latestVersion)
                  setActiveModalChangelog(checkResult.changelog)
                  setShowPlayStoreInModal(true)
                  setWhatsNewModalOpen(true)
                }}
              >
                <Text style={styles.inlineWhatsNewText}>{t("What's Fresh →")}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </Card>

      {/* What's New Card */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWrap}>
            <Icon name="Sparkles" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t("What's New in v{{version}}", { version: release.version })}</Text>
          </View>
          <Pressable
            style={styles.seeAllButton}
            onPress={() => {
              setActiveModalVersion(undefined)
              setActiveModalChangelog(undefined)
              setShowPlayStoreInModal(false)
              setWhatsNewModalOpen(true)
            }}
            hitSlop={8}
          >
            <Text style={styles.seeAllLabel}>{t('View all')}</Text>
            <Icon name="ChevronRight" size={14} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.whatsNewHighlights}>
          {recentSections.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.highlightRow, pressed && styles.highlightRowPressed]}
              onPress={() => {
                setActiveModalVersion(undefined)
                setActiveModalChangelog(undefined)
                setShowPlayStoreInModal(false)
                setWhatsNewModalOpen(true)
              }}
            >
              <View style={[styles.highlightIconBubble, { backgroundColor: colors.primarySoft }]}>
                <Icon name={item.icon} size={16} color={colors.primary} />
              </View>
              <View style={styles.highlightTextWrap}>
                <Text style={styles.highlightTitle}>{t(item.title)}</Text>
                <Text style={styles.highlightDesc} numberOfLines={2}>{t(item.subtitle)}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Button
          label={t('Explore All Updates')}
          icon="Sparkles"
          variant="secondary"
          small
          onPress={() => {
            setActiveModalVersion(undefined)
            setActiveModalChangelog(undefined)
            setShowPlayStoreInModal(false)
            setWhatsNewModalOpen(true)
          }}
          style={styles.whatsNewFullBtn}
        />
      </Card>

      <WhatsNewModal
        visible={whatsNewModalOpen}
        onClose={() => {
          setWhatsNewModalOpen(false)
          setActiveModalVersion(undefined)
          setActiveModalChangelog(undefined)
          setShowPlayStoreInModal(false)
        }}
        version={activeModalVersion}
        markdownContent={activeModalChangelog}
        showPlayStoreButton={showPlayStoreInModal}
      />

      <HelpAccordionSheet
        visible={help.visible}
        onClose={help.close}
        title={t('About & Privacy')}
        sections={HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={(id) => help.setSectionId(help.sectionId === id ? null : id)}
        translate={t}
      />
    </ScrollView>
    {featureReplayOpen ? (
      <StartupScreen
        visible
        mode="feature-replay"
        onComplete={() => setFeatureReplayOpen(false)}
      />
    ) : null}
    </>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    aboutCard: {
      alignItems: 'center',
      padding: spacing.lg,
      gap: spacing.xs,
      backgroundColor: colors.surface,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: radius.lg,
      overflow: 'hidden',
      marginBottom: spacing.xs,
    },
    icon: { width: '100%', height: '100%' },
    appName: { fontSize: 24, fontWeight: '800', color: colors.text },
    versionBadgeContainer: {
      backgroundColor: colors.primarySoft,
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    versionBadgeText: { fontSize: type.caption, fontWeight: '700', color: colors.primary },
    tagline: { fontSize: type.caption, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
    replayButton: { alignSelf: 'stretch', marginTop: spacing.sm },
    sectionCard: {
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    sectionTitle: {
      fontSize: type.body,
      fontWeight: '700',
      color: colors.text,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
      gap: spacing.md,
    },
    settingTextWrap: {
      flex: 1,
      gap: 2,
    },
    settingLabel: {
      fontSize: type.body,
      fontWeight: '600',
      color: colors.text,
    },
    settingDesc: {
      fontSize: type.caption,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    updateActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    checkBtn: {
      flex: 1,
    },
    feedbackBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      marginTop: spacing.xs,
    },
    feedbackAvailable: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    feedbackError: {
      backgroundColor: colors.dangerSoft,
      borderColor: colors.danger,
    },
    feedbackUpToDate: {
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
    },
    feedbackTextWrap: {
      flex: 1,
    },
    feedbackText: {
      fontSize: type.caption,
      color: colors.text,
      fontWeight: '500',
    },
    inlineWhatsNewButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.sm,
      backgroundColor: colors.primary,
    },
    inlineWhatsNewText: {
      fontSize: type.micro + 1,
      fontWeight: '700',
      color: '#ffffff',
    },
    seeAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    seeAllLabel: {
      fontSize: type.caption,
      fontWeight: '600',
      color: colors.primary,
    },
    whatsNewHighlights: {
      gap: spacing.xs,
    },
    highlightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.md,
    },
    highlightRowPressed: {
      backgroundColor: colors.surfaceMuted,
    },
    highlightIconBubble: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    highlightTextWrap: {
      flex: 1,
      gap: 2,
    },
    highlightTitle: {
      fontSize: type.caption,
      fontWeight: '700',
      color: colors.text,
    },
    highlightDesc: {
      fontSize: type.micro,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    whatsNewFullBtn: {
      marginTop: spacing.xs,
    },
  })
