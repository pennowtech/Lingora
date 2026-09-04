import { logger } from '@lingora/observability'
import type { LanguageCode } from '@lingora/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Icon } from '../../components/Icon'
import { AlertModal, Button, Card, ConfirmModal, ErrorState, SectionHeader, Spinner } from '../../components/ui'
import {
  getBundledChunkIndexes,
  getDictionariesForLanguagePair,
  getInstalledChunkIndexes,
  getWordGuideManifest,
  installAllAvailable,
  installBundledChunk,
  uninstallAllInstalled,
  uninstallChunk,
  type BundledDictionary,
  type WordGuideManifestChunk,
} from '../../lib/wordGuides'
import { useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'settings', screen: 'WordGuidesScreen' })

type ChunkStatus = 'installed' | 'available'

interface ChunkRow extends Omit<WordGuideManifestChunk, 'status'> {
  status: ChunkStatus
}

/**
 * Display name for a language mentioned on this screen — kept local rather than imported from
 * settings/learning.tsx's VOCAB_LANGUAGE_LABELS, since that map is intentionally duplicated per
 * screen throughout Settings (see ttsSettings.ts's APP_KEY_PREFIX comment for the same
 * convention). Needs an entry for every language a bundled dictionary could reference on either
 * side of its pair (see BundledDictionary), not just the "headword" languages — today that
 * includes English, since every bundled dictionary currently explains into it.
 */
const LANGUAGE_LABELS: Partial<Record<LanguageCode, string>> = {
  de: 'German',
  en: 'English',
  fr: 'French',
  hi: 'Hindi',
}

/**
 * Local Dictionaries — free, offline starter word packs (see LingoraDocs/6_word_guides_plan.md) a
 * learner can install without an AI key, feeding the explain-flow's dictionary-lookup step
 * (word/[form].tsx, review/[deckId].tsx) as a fallback before a live AI call.
 *
 * Only ever shows dictionaries that actually cover the learner's *current* native/target language
 * pair (in either direction — see getDictionariesForLanguagePair) instead of a language-picker
 * chip row letting them browse every bundled language regardless of what they're studying. That
 * also means there's nothing to switch between: at most one dictionary matches a given pair today,
 * so this screen just shows it directly, or a "coming soon" message if none does yet.
 */
export default function WordGuidesScreen(): JSX.Element {
  const { nativeLanguage, targetLanguage } = useServices()
  const styles = useThemedStyles(createStyles)
  const dictionaries = getDictionariesForLanguagePair(nativeLanguage, targetLanguage)

  return (
    <View style={styles.container}>
      {dictionaries.length === 0 ? (
        <ComingSoonCard nativeLanguage={nativeLanguage} targetLanguage={targetLanguage} />
      ) : (
        dictionaries.map((dictionary) => <DictionarySection key={dictionary.language} dictionary={dictionary} />)
      )}
    </View>
  )
}

/** Shown when no bundled dictionary covers the current pair yet — a professional heads-up instead
 * of an empty screen or (the old behavior) a language switcher offering dictionaries for languages
 * the learner isn't even studying. */
function ComingSoonCard({
  nativeLanguage,
  targetLanguage,
}: {
  nativeLanguage: LanguageCode
  targetLanguage: LanguageCode
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const nativeLabel = t(LANGUAGE_LABELS[nativeLanguage] ?? nativeLanguage)
  const targetLabel = t(LANGUAGE_LABELS[targetLanguage] ?? targetLanguage)

  return (
    <Card style={styles.comingSoonCard}>
      <View style={styles.comingSoonIconWrap}>
        <Icon name="BookOpen" size={22} color={colors.primary} />
      </View>
      <Text style={styles.comingSoonTitle}>{t('Coming soon for this language pair')}</Text>
      <Text style={styles.comingSoonBody}>
        {t(
          "We don't have an offline dictionary for {{native}} → {{target}} yet. We're actively adding new language pairs — check back soon.",
          { native: nativeLabel, target: targetLabel },
        )}
      </Text>
    </Card>
  )
}

/** One bundled dictionary's full install/uninstall UI — its own screen section, with its own data
 * fetching and mutations, so multiple dictionaries (if a pair ever has more than one — see
 * getDictionariesForLanguagePair) can render side by side without hooks called conditionally. */
function DictionarySection({ dictionary }: { dictionary: BundledDictionary }): JSX.Element {
  const { db } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const queryClient = useQueryClient()
  const { language } = dictionary
  const manifest = getWordGuideManifest(language)
  const bundledChunkIndexes = new Set(getBundledChunkIndexes(language))
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null)
  const [uninstallAllConfirmOpen, setUninstallAllConfirmOpen] = useState(false)
  const showError = (title: string, error: unknown): void => setNotice({ title, message: String(error) })

  const installedQuery = useQuery({
    queryKey: ['word-guide-installed-chunks', language],
    queryFn: () => getInstalledChunkIndexes(db, language),
  })

  const install = useMutation({
    mutationFn: (chunkIndex: number) => installBundledChunk(db, language, chunkIndex),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['word-guide-installed-chunks'] })
    },
    onError: (error: unknown) => {
      log.error('settings.word_guide_chunk_install_failed', error, { message: 'Word guide chunk install failed' })
      showError(t('Could not install this chunk'), error)
    },
  })

  const uninstall = useMutation({
    mutationFn: (chunkIndex: number) => uninstallChunk(db, chunkIndex, language),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['word-guide-installed-chunks'] })
    },
    onError: (error: unknown) => {
      log.error('settings.word_guide_chunk_uninstall_failed', error, { message: 'Word guide chunk uninstall failed' })
      showError(t('Could not remove this chunk'), error)
    },
  })

  const installAll = useMutation({
    mutationFn: () => installAllAvailable(db, language),
    onSuccess: async (count) => {
      await queryClient.invalidateQueries({ queryKey: ['word-guide-installed-chunks'] })
      setNotice({ title: t('Local Dictionaries installed'), message: t('Installed {{count}} new chunks.', { count: count.toLocaleString() }) })
    },
    onError: (error: unknown) => {
      log.error('settings.word_guide_install_all_failed', error, { message: 'Word guide "install all" failed' })
      showError(t('Could not install local dictionaries'), error)
    },
  })

  const uninstallAll = useMutation({
    mutationFn: () => uninstallAllInstalled(db, language),
    onSuccess: async (count) => {
      await queryClient.invalidateQueries({ queryKey: ['word-guide-installed-chunks'] })
      setNotice({ title: t('Local Dictionaries uninstalled'), message: t('Removed {{count}} chunks.', { count: count.toLocaleString() }) })
    },
    onError: (error: unknown) => {
      log.error('settings.word_guide_uninstall_all_failed', error, { message: 'Word guide "uninstall all" failed' })
      showError(t('Could not uninstall local dictionaries'), error)
    },
  })

  const installedSet = new Set(installedQuery.data ?? [])
  // Chunks that are neither installed nor actually bundled into this app build never show up —
  // there's nothing a user could do with a "not generated yet" row besides be confused by it.
  const rows: ChunkRow[] = manifest.chunks
    .map((chunk) => ({
      ...chunk,
      status: installedSet.has(chunk.index) ? 'installed' : bundledChunkIndexes.has(chunk.index) ? 'available' : null,
    }))
    .filter((row): row is ChunkRow => row.status !== null)
  const installedCount = rows.filter((r) => r.status === 'installed').length
  const availableCount = rows.filter((r) => r.status === 'available').length

  return (
    <>
      <Card style={styles.summaryCard}>
        <Text style={styles.title}>
          {t('{{language}}-{{nativeLanguage}} Dictionary', {
            language: t(LANGUAGE_LABELS[dictionary.language] ?? dictionary.language),
            nativeLanguage: t(LANGUAGE_LABELS[dictionary.nativeLanguage] ?? dictionary.nativeLanguage),
          })}
        </Text>
        {installedQuery.isPending ? (
          <Spinner />
        ) : installedQuery.isError ? (
          <ErrorState message={String(installedQuery.error)} onRetry={() => void installedQuery.refetch()} />
        ) : (
          <>
            <Text style={styles.progress}>
              {t('{{installed}} installed · {{available}} available to install', {
                installed: installedCount,
                available: availableCount,
              })}
            </Text>
            <Button
              label={installAll.isPending ? t('Installing...') : t('Install all available')}
              icon="Download"
              onPress={() => installAll.mutate()}
              disabled={installAll.isPending || availableCount === 0}
              style={styles.installAllButton}
            />
            {installedCount > 0 ? (
              <Button
                label={uninstallAll.isPending ? t('Uninstalling...') : t('Uninstall all')}
                icon="Trash2"
                variant="secondary"
                onPress={() => setUninstallAllConfirmOpen(true)}
                disabled={uninstallAll.isPending}
                style={styles.installAllButton}
              />
            ) : null}
          </>
        )}
      </Card>

      <View style={styles.dictionaryHintCard}>
        <View style={styles.dictionaryHintIconWrap}>
          <Icon name="Info" size={16} color={colors.primary} />
        </View>
        <Text style={styles.dictionaryHintText}>
          {t('Our offline starter dictionaries are currently in active development. We are continuously adding more vocabulary and improving accuracy with each update — thank you for your support as we grow!')}
        </Text>
      </View>

      <SectionHeader title={t('Chunks')} />

      <FlatList
        data={rows}
        keyExtractor={(row) => String(row.index)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.chunkRow}>
            <View style={styles.chunkText}>
              <Text style={styles.chunkTitle}>
                {t('Words {{start}}-{{end}}', { start: item.rankStart.toLocaleString(), end: item.rankEnd.toLocaleString() })}
              </Text>
              <Text style={styles.chunkMeta}>{t('{{count}} words', { count: item.wordCount.toLocaleString() })}</Text>
            </View>
            {item.status === 'installed' ? (
              <Pressable
                style={styles.uninstallButton}
                onPress={() => uninstall.mutate(item.index)}
                disabled={uninstall.isPending}
                accessibilityRole="button"
                accessibilityLabel={t('Uninstall')}
              >
                <Icon name="Trash2" size={15} color={colors.danger} />
                <Text style={styles.uninstallLabel}>{t('Uninstall')}</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.installButton}
                onPress={() => install.mutate(item.index)}
                disabled={install.isPending}
              >
                <Text style={styles.installLabel}>{t('Install')}</Text>
              </Pressable>
            )}
          </Card>
        )}
      />

      <ConfirmModal
        visible={uninstallAllConfirmOpen}
        title={t('Uninstall all local dictionaries?')}
        message={t('Removes every installed chunk from this device. Cards you already added to your deck are not affected.')}
        onCancel={() => setUninstallAllConfirmOpen(false)}
        onConfirm={() => {
          setUninstallAllConfirmOpen(false)
          uninstallAll.mutate()
        }}
        confirmLabel={t('Uninstall')}
        destructive
      />

      <AlertModal
        visible={notice !== null}
        title={notice?.title ?? ''}
        message={notice?.message ?? ''}
        onClose={() => setNotice(null)}
      />
    </>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
    summaryCard: { gap: spacing.sm, marginBottom: spacing.sm },
    title: { fontSize: type.subheading, fontWeight: '700', color: colors.text },
    progress: { fontSize: type.caption, fontWeight: '600', color: colors.text, marginTop: spacing.xs },
    installAllButton: { marginTop: spacing.sm },
    dictionaryHintCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    dictionaryHintIconWrap: {
      marginTop: 2,
    },
    dictionaryHintText: {
      flex: 1,
      fontSize: type.caption,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    listContent: { paddingBottom: spacing.xxl },
    chunkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      paddingVertical: spacing.md,
    },
    chunkText: { flex: 1 },
    chunkTitle: { fontSize: type.body, fontWeight: '600', color: colors.text },
    chunkMeta: { fontSize: type.micro, color: colors.textMuted, marginTop: 1 },
    installButton: {
      backgroundColor: colors.primarySoft,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
    },
    installLabel: { fontSize: type.caption, fontWeight: '700', color: colors.primary },
    uninstallButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.dangerSoft,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
    },
    uninstallLabel: { fontSize: type.caption, fontWeight: '700', color: colors.danger },
    comingSoonCard: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xl,
    },
    comingSoonIconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    comingSoonTitle: {
      fontSize: type.subheading,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    comingSoonBody: {
      fontSize: type.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: spacing.md,
    },
  })
