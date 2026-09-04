import { router, Stack } from 'expo-router'
import { useState, useMemo, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Icon } from '../../components/Icon'
import { Card } from '../../components/ui'
import { HelpVideoPlayerModal } from '../../components/HelpVideoPlayerModal'
import { DEFAULT_HELP_VIDEO_ID, searchHelpDocs } from '@lingora/core'
import { useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

export default function HelpHubScreen(): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const { nativeLanguage } = useServices()
  const [searchQuery, setSearchQuery] = useState('')
  const [videoModalOpen, setVideoModalOpen] = useState(false)

  const filteredChapters = useMemo(() => {
    return searchHelpDocs(searchQuery, nativeLanguage)
  }, [searchQuery, nativeLanguage])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Stack.Screen
        options={{
          title: t('Help & Learning Center'),
        }}
      />

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Icon name="Search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('Search guides, SRS algorithms, features...')}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Icon name="CircleX" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* 2-Minute Video Tour Hero Card */}
      <Card
        style={styles.videoHeroCard}
        onPress={() => setVideoModalOpen(true)}
      >
        <View style={styles.videoHeroRow}>
          <View style={styles.playIconBadge}>
            <Icon name="Play" size={20} color={colors.textOnPrimary} />
          </View>
          <View style={styles.videoHeroTextWrap}>
            <Text style={styles.videoHeroTitle}>🎬 {t('2-Minute Quickstart Video Tour')}</Text>
            <Text style={styles.videoHeroSub}>
              {t('Watch walkthrough: Instant search, sentence mining & FSRS spaced reviews.')}
            </Text>
          </View>
        </View>
      </Card>

      <HelpVideoPlayerModal
        visible={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoId={DEFAULT_HELP_VIDEO_ID}
        title={t('🎬 2-Minute Quickstart Video Tour')}
      />

      {/* Chapter Directory */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>{t('Feature Guides')}</Text>
        <Text style={styles.sectionCount}>
          {filteredChapters.length} {t('Chapters')}
        </Text>
      </View>

      <View style={styles.chapterList}>
        {filteredChapters.map((chapter) => (
          <Card
            key={chapter.id}
            style={styles.chapterCard}
            onPress={() =>
              router.push({
                pathname: '/settings/help-chapter',
                params: { chapterId: chapter.id },
              })
            }
          >
            <View style={styles.chapterRow}>
              <View style={styles.chapterIconBox}>
                <Text style={styles.chapterIconEmoji}>{chapter.icon}</Text>
              </View>
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterTitle}>
                  {chapter.number}. {chapter.title}
                </Text>
                {chapter.matchedSnippet ? (
                  <Text style={styles.snippetText} numberOfLines={2}>
                    {chapter.matchedSnippet}
                  </Text>
                ) : null}
                {chapter.videoCount > 0 ? (
                  <View style={styles.chapterBadgesRow}>
                    <View style={[styles.badge, styles.badgeVideo]}>
                      <Text style={[styles.badgeText, styles.badgeTextVideo]}>🎬 {t('Video')}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
              <Icon name="ChevronRight" size={18} color={colors.textMuted} />
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    langBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.primarySoft,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    langBannerText: {
      fontSize: type.caption,
      color: colors.primary,
    },
    boldText: {
      fontWeight: '700',
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: type.body,
      color: colors.text,
      padding: 0,
    },
    videoHeroCard: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
      borderWidth: 1,
      padding: spacing.md,
    },
    videoHeroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    playIconBadge: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    videoHeroTextWrap: {
      flex: 1,
      gap: 2,
    },
    videoHeroTitle: {
      fontSize: type.body,
      fontWeight: '700',
      color: colors.text,
    },
    videoHeroSub: {
      fontSize: type.caption,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    sectionHeader: {
      fontSize: type.caption,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      color: colors.textSecondary,
    },
    sectionCount: {
      fontSize: type.micro,
      color: colors.textMuted,
      fontWeight: '700',
    },
    chapterList: {
      gap: spacing.sm + 2,
    },
    chapterCard: {
      backgroundColor: colors.surface,
      padding: spacing.md + 2,
    },
    chapterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    chapterIconBox: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chapterIconEmoji: {
      fontSize: 20,
    },
    chapterInfo: {
      flex: 1,
      gap: 4,
    },
    chapterTitle: {
      fontSize: type.body,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 20,
    },
    snippetText: {
      fontSize: type.micro,
      color: colors.textSecondary,
      lineHeight: 18,
      fontStyle: 'italic',
    },
    chapterBadgesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    badge: {
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    badgeVideo: {
      backgroundColor: colors.primarySoft,
    },
    badgeText: {
      fontSize: type.micro,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    badgeTextVideo: {
      color: colors.primary,
      fontWeight: '700',
    },
  })
