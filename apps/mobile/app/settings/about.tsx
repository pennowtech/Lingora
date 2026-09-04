import Constants from 'expo-constants'
import { Stack } from 'expo-router'
import { useMemo, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
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
    title: 'Updates & Release Highlights',
    icon: 'Sparkles',
    paragraphs: [
      'We release frequent updates with new features, language support, and bug fixes.',
      'Check the **"What\'s New"** section to review what changed in recent versions.',
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

      {/* What's New Card */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWrap}>
            <Icon name="Sparkles" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t("What's New in v{{version}}", { version: release.version })}</Text>
          </View>
          <Pressable
            style={styles.seeAllButton}
            onPress={() => setWhatsNewModalOpen(true)}
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
              onPress={() => setWhatsNewModalOpen(true)}
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
          onPress={() => setWhatsNewModalOpen(true)}
          style={styles.whatsNewFullBtn}
        />
      </Card>

      <WhatsNewModal
        visible={whatsNewModalOpen}
        onClose={() => setWhatsNewModalOpen(false)}
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
