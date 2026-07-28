import { Ionicons } from '@expo/vector-icons'
import { logger } from '@lingora/observability'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Button, Card, ErrorState, SectionHeader, Spinner } from '../../components/ui'
import {
  getBundledChunkIndexes,
  getInstalledChunkIndexes,
  getWordGuideManifest,
  installAllAvailable,
  installBundledChunk,
  uninstallAllInstalled,
  uninstallChunk,
  type WordGuideManifestChunk,
} from '../../lib/wordGuides'
import { useServices } from '../../lib/services'
import { colors, radius, spacing, type } from '../../lib/theme'

const log = logger.child({ feature: 'settings', screen: 'WordGuidesScreen' })

type ChunkStatus = 'installed' | 'available' | 'pending'

interface ChunkRow extends Omit<WordGuideManifestChunk, 'status'> {
  status: ChunkStatus
}

/**
 * A free, offline starter dictionary — chunks of pre-generated word content
 * (see LingoraDocs/6_word_guides_plan.md) a user can install without an AI
 * key. Installing feeds the explain-flow's dictionary-lookup step
 * (word/[form].tsx, review/[deckId].tsx); nothing here touches decks/cards.
 */
export default function WordGuidesScreen(): JSX.Element {
  const { db } = useServices()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const manifest = getWordGuideManifest()
  const bundledChunkIndexes = useMemo(() => new Set(getBundledChunkIndexes()), [])

  const installedQuery = useQuery({
    queryKey: ['word-guide-installed-chunks', manifest.language],
    queryFn: () => getInstalledChunkIndexes(db, manifest.language),
  })

  const install = useMutation({
    mutationFn: (chunkIndex: number) => installBundledChunk(db, chunkIndex),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['word-guide-installed-chunks'] })
    },
    onError: (error: unknown) => {
      log.error('settings.word_guide_chunk_install_failed', error, { message: 'Word guide chunk install failed' })
      Alert.alert(t('Could not install this chunk'), String(error))
    },
  })

  const uninstall = useMutation({
    mutationFn: (chunkIndex: number) => uninstallChunk(db, chunkIndex, manifest.language),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['word-guide-installed-chunks'] })
    },
    onError: (error: unknown) => {
      log.error('settings.word_guide_chunk_uninstall_failed', error, { message: 'Word guide chunk uninstall failed' })
      Alert.alert(t('Could not remove this chunk'), String(error))
    },
  })

  const installAll = useMutation({
    mutationFn: () => installAllAvailable(db, manifest.language),
    onSuccess: async (count) => {
      await queryClient.invalidateQueries({ queryKey: ['word-guide-installed-chunks'] })
      Alert.alert(t('Word guides installed'), t('Installed {{count}} new chunks.', { count: count.toLocaleString() }))
    },
    onError: (error: unknown) => {
      log.error('settings.word_guide_install_all_failed', error, { message: 'Word guide "install all" failed' })
      Alert.alert(t('Could not install word guides'), String(error))
    },
  })

  const uninstallAll = useMutation({
    mutationFn: () => uninstallAllInstalled(db, manifest.language),
    onSuccess: async (count) => {
      await queryClient.invalidateQueries({ queryKey: ['word-guide-installed-chunks'] })
      Alert.alert(t('Word guides uninstalled'), t('Removed {{count}} chunks.', { count: count.toLocaleString() }))
    },
    onError: (error: unknown) => {
      log.error('settings.word_guide_uninstall_all_failed', error, { message: 'Word guide "uninstall all" failed' })
      Alert.alert(t('Could not uninstall word guides'), String(error))
    },
  })

  const confirmUninstallAll = (): void => {
    Alert.alert(
      t('Uninstall all word guides?'),
      t('Removes every installed chunk from this device. Cards you already added to your deck are not affected.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Uninstall'), style: 'destructive', onPress: () => uninstallAll.mutate() },
      ],
    )
  }

  const installedSet = new Set(installedQuery.data ?? [])
  const rows: ChunkRow[] = manifest.chunks.map((chunk) => ({
    ...chunk,
    status: installedSet.has(chunk.index)
      ? 'installed'
      : bundledChunkIndexes.has(chunk.index)
        ? 'available'
        : 'pending',
  }))
  const installedCount = rows.filter((r) => r.status === 'installed').length
  const availableCount = rows.filter((r) => r.status === 'available').length

  return (
    <View style={styles.container}>
      <Card style={styles.summaryCard}>
        <Text style={styles.title}>{t('German word guides')}</Text>
        <Text style={styles.body}>
          {t('A free, pre-written dictionary — install to get instant word explanations without an AI key.')}
          {' '}
          {t('{{words}} words planned, {{chunks}} chunks of ~100.', {
            words: manifest.totalWords.toLocaleString(),
            chunks: manifest.totalChunks,
          })}
        </Text>
        {installedQuery.isPending ? (
          <Spinner />
        ) : installedQuery.isError ? (
          <ErrorState message={String(installedQuery.error)} onRetry={() => void installedQuery.refetch()} />
        ) : (
          <>
            <Text style={styles.progress}>
              {t('{{installed}} installed · {{available}} available to install · {{pending}} not generated yet', {
                installed: installedCount,
                available: availableCount,
                pending: manifest.totalChunks - installedCount - availableCount,
              })}
            </Text>
            <Button
              label={installAll.isPending ? t('Installing…') : t('Install all available')}
              icon="download"
              onPress={() => installAll.mutate()}
              disabled={installAll.isPending || availableCount === 0}
              style={styles.installAllButton}
            />
            {installedCount > 0 ? (
              <Button
                label={uninstallAll.isPending ? t('Uninstalling…') : t('Uninstall all')}
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
          <Card style={[styles.chunkRow, item.status === 'pending' && styles.chunkRowPending]}>
            <View style={styles.chunkText}>
              <Text style={styles.chunkTitle}>
                {t('Words {{start}}–{{end}}', { start: item.rankStart.toLocaleString(), end: item.rankEnd.toLocaleString() })}
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
            ) : item.status === 'available' ? (
              <Pressable
                style={styles.installButton}
                onPress={() => install.mutate(item.index)}
                disabled={install.isPending}
              >
                <Text style={styles.installLabel}>{t('Install')}</Text>
              </Pressable>
            ) : (
              <Text style={styles.pendingLabel}>{t('Not generated yet')}</Text>
            )}
          </Card>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  summaryCard: { gap: spacing.sm, marginBottom: spacing.sm },
  title: { fontSize: type.subheading, fontWeight: '700', color: colors.text },
  body: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
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
  chunkRowPending: { opacity: 0.5 },
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
  pendingLabel: { fontSize: type.micro, color: colors.textMuted },
})
