import { Ionicons } from '@expo/vector-icons'
import { logger } from '@lingora/observability'
import type { LanguageCode } from '@lingora/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { AlertModal, Button, Card, Chip, ConfirmModal, ErrorState, SectionHeader, Spinner } from '../../components/ui'
import {
  getBundledChunkIndexes,
  getInstalledChunkIndexes,
  getWordGuideLanguages,
  getWordGuideManifest,
  installAllAvailable,
  installBundledChunk,
  uninstallAllInstalled,
  uninstallChunk,
  type WordGuideManifestChunk,
} from '../../lib/wordGuides'
import { useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'settings', screen: 'WordGuidesScreen' })

type ChunkStatus = 'installed' | 'available' | 'pending'

interface ChunkRow extends Omit<WordGuideManifestChunk, 'status'> {
  status: ChunkStatus
}

/** Display name for a word-guide language tab — kept local rather than imported from
 * settings/learning.tsx's VOCAB_LANGUAGE_LABELS since that map is intentionally duplicated
 * per screen throughout Settings (see ttsSettings.ts's APP_KEY_PREFIX comment for the same
 * convention). Only languages actually bundled here (getWordGuideLanguages()) ever need a label. */
const WORD_GUIDE_LANGUAGE_LABELS: Partial<Record<LanguageCode, string>> = {
  de: 'German',
  fr: 'French',
  hi: 'Hindi',
}

/**
 * A free, offline starter dictionary — chunks of pre-generated word content
 * (see LingoraDocs/6_word_guides_plan.md) a user can install without an AI
 * key. Installing feeds the explain-flow's dictionary-lookup step
 * (word/[form].tsx, review/[deckId].tsx); nothing here touches decks/cards.
 */
export default function WordGuidesScreen(): JSX.Element {
  const { db, targetLanguage } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const queryClient = useQueryClient()
  const guideLanguages = useMemo(() => getWordGuideLanguages(), [])
  // Defaults to whatever the user is currently learning if a word guide is bundled for it,
  // otherwise the first bundled language — a bare fallback since guideLanguages is never empty
  // in a real build (German always ships).
  const [language, setLanguage] = useState<LanguageCode>(
    () => guideLanguages.find((l) => l === targetLanguage) ?? guideLanguages[0] ?? 'de',
  )
  const manifest = getWordGuideManifest(language)
  const bundledChunkIndexes = useMemo(() => new Set(getBundledChunkIndexes(language)), [language])
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

  const confirmUninstallAll = (): void => {
    setUninstallAllConfirmOpen(true)
  }

  const installedSet = new Set(installedQuery.data ?? [])
  // Chunks that are neither installed nor actually bundled into this app build never show up —
  // there's nothing a user could do with a "not generated yet" row besides be confused by it.
  const rows: ChunkRow[] = manifest.chunks
    .map((chunk) => ({
      ...chunk,
      status: installedSet.has(chunk.index)
        ? 'installed'
        : bundledChunkIndexes.has(chunk.index)
          ? 'available'
          : ('pending' as const),
    }))
    .filter((row): row is ChunkRow & { status: 'installed' | 'available' } => row.status !== 'pending')
  const installedCount = rows.filter((r) => r.status === 'installed').length
  const availableCount = rows.filter((r) => r.status === 'available').length

  return (
    <View style={styles.container}>
      {guideLanguages.length > 1 ? (
        <View style={styles.languageRow}>
          {guideLanguages.map((l) => (
            <Chip
              key={l}
              label={t(WORD_GUIDE_LANGUAGE_LABELS[l] ?? l)}
              selected={l === language}
              onPress={() => setLanguage(l)}
            />
          ))}
        </View>
      ) : null}
      <Card style={styles.summaryCard}>
        <Text style={styles.title}>
          {t('{{language}}-English Dictionary', { language: t(WORD_GUIDE_LANGUAGE_LABELS[language] ?? language) })}
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
              icon="download"
              onPress={() => installAll.mutate()}
              disabled={installAll.isPending || availableCount === 0}
              style={styles.installAllButton}
            />
            {installedCount > 0 ? (
              <Button
                label={uninstallAll.isPending ? t('Uninstalling...') : t('Uninstall all')}
                icon="trash"
                variant="secondary"
                onPress={confirmUninstallAll}
                disabled={uninstallAll.isPending}
                style={styles.installAllButton}
              />
            ) : null}
          </>
        )}
      </Card>

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
                <Ionicons name="trash-outline" size={15} color={colors.danger} />
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
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
    languageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    summaryCard: { gap: spacing.sm, marginBottom: spacing.sm },
    title: { fontSize: type.subheading, fontWeight: '700', color: colors.text },
    progress: { fontSize: type.caption, fontWeight: '600', color: colors.text, marginTop: spacing.xs },
    installAllButton: { marginTop: spacing.sm },
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
  })
