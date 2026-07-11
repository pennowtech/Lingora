import { Ionicons } from '@expo/vector-icons'
import type { CaptureSource } from '@lingora/types'
import {
  deleteMineEntry,
  getPendingMineEntries,
  updateMineEntryProcessed,
  updateMineEntryStatus,
} from '@lingora/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState, type JSX } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button, Card, EmptyState, ErrorState, IconButton, Spinner } from '../../components/ui'
import { timeAgo } from '../../lib/format'
import { DEFAULT_DECK_ID, useServices } from '../../lib/services'
import { colors, radius, spacing, type } from '../../lib/theme'

const SOURCE_ICONS: Record<CaptureSource, keyof typeof Ionicons.glyphMap> = {
  netflix: 'tv',
  youtube: 'logo-youtube',
  article: 'newspaper',
  clipboard: 'clipboard',
  manual: 'pencil',
  share_sheet: 'share-social',
  extension: 'extension-puzzle',
  pdf: 'document',
}

/**
 * Sentence mining queue: captured text waits here BEFORE any AI call —
 * the user discards what they don't want, then generates the rest in one go.
 */
export default function MiningQueueScreen(): JSX.Element {
  const { db, pipeline, tier, defaultCefr } = useServices()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<string[] | null>(null)
  const [progress, setProgress] = useState<string | null>(null)

  const queueQuery = useQuery({
    queryKey: ['mine-queue'],
    queryFn: () => getPendingMineEntries(db),
  })

  const entries = queueQuery.data ?? []
  // Default selection = everything, until the user starts curating.
  const selectedIds = selected ?? entries.map((e) => e.id)

  const discard = useMutation({
    mutationFn: (entryId: string) => deleteMineEntry(db, entryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mine-queue'] }),
  })

  const generate = useMutation({
    mutationFn: async () => {
      if (!pipeline) throw new Error('Add your OpenAI key in Settings to generate cards.')
      const chosen = entries.filter((e) => selectedIds.includes(e.id))
      let failures = 0

      for (const [index, entry] of chosen.entries()) {
        setProgress(`Generating ${index + 1} of ${chosen.length}…`)
        try {
          await updateMineEntryStatus(db, entry.id, 'processing')
          const outcome = await pipeline.lookupOrGenerate(entry.rawText.trim(), {
            cefrLevel: defaultCefr,
            deckId: DEFAULT_DECK_ID,
          })
          if (outcome.kind === 'generated') {
            await updateMineEntryProcessed(db, entry.id, outcome.cardId)
          } else if (outcome.kind === 'existing') {
            await updateMineEntryStatus(db, entry.id, 'done')
          } else {
            await updateMineEntryStatus(db, entry.id, 'error')
            failures += 1
          }
        } catch (error) {
          await updateMineEntryStatus(db, entry.id, 'error')
          failures += 1
          if (chosen.length === 1) throw error
        }
      }
      return { total: chosen.length, failures }
    },
    onSettled: async () => {
      setProgress(null)
      setSelected(null)
      await queryClient.invalidateQueries()
    },
  })

  const toggle = (id: string): void => {
    setSelected(
      selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id],
    )
  }

  if (queueQuery.isPending) {
    return (
      <View style={styles.container}>
        <Spinner />
      </View>
    )
  }

  if (queueQuery.isError) {
    return (
      <View style={styles.container}>
        <ErrorState message={String(queueQuery.error)} onRetry={() => void queueQuery.refetch()} />
      </View>
    )
  }

  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="download"
          title="Queue is empty"
          message="Text you capture — from the share sheet, clipboard, or later the browser extension — lands here before any AI processing."
        />
        {generate.data && generate.data.total > 0 ? (
          <Text style={styles.resultLabel}>
            {generate.data.total - generate.data.failures} of {generate.data.total} generated
            {generate.data.failures > 0 ? ` · ${generate.data.failures} failed` : ''} — see Decks.
          </Text>
        ) : null}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Review your captures. Discard what you don't need, then generate cards for the rest — no
          API call is wasted on text you didn't ask for.
        </Text>

        {entries.map((entry) => {
          const isSelected = selectedIds.includes(entry.id)
          return (
            <Card key={entry.id} style={styles.entryCard} onPress={() => toggle(entry.id)}>
              <View style={styles.entryHeader}>
                <View style={styles.sourceRow}>
                  <Ionicons name={SOURCE_ICONS[entry.sourceType]} size={13} color={colors.textMuted} />
                  <Text style={styles.sourceLabel}>{entry.sourceTitle ?? entry.sourceType}</Text>
                  <Text style={styles.timeLabel}>· {timeAgo(entry.capturedAt)}</Text>
                </View>
                <Ionicons
                  name={isSelected ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={isSelected ? colors.primary : colors.textMuted}
                />
              </View>
              <Text style={styles.entryText}>„{entry.rawText}"</Text>
              <View style={styles.entryActions}>
                <IconButton
                  icon="trash-outline"
                  size={17}
                  color={colors.danger}
                  onPress={() => discard.mutate(entry.id)}
                />
              </View>
            </Card>
          )
        })}
        {generate.isError ? <Text style={styles.errorLabel}>{String(generate.error)}</Text> : null}
      </ScrollView>

      <View style={styles.bottomBar}>
        {tier === 'full' ? (
          <Button
            label={
              progress ??
              `Generate ${selectedIds.length} card${selectedIds.length === 1 ? '' : 's'} with AI`
            }
            icon="sparkles"
            onPress={() => generate.mutate()}
            disabled={selectedIds.length === 0 || generate.isPending}
          />
        ) : (
          <Button
            label="Add your OpenAI key to generate cards"
            icon="key"
            variant="secondary"
            onPress={() => router.push('/settings')}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 96 },
  intro: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 19, marginBottom: spacing.lg },
  entryCard: { marginBottom: spacing.sm },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  sourceLabel: { fontSize: type.micro, fontWeight: '600', color: colors.textMuted },
  timeLabel: { fontSize: type.micro, color: colors.textMuted },
  entryText: { fontSize: type.body, fontWeight: '600', color: colors.text, marginTop: spacing.sm, lineHeight: 22 },
  entryActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.sm },
  errorLabel: { fontSize: type.caption, color: colors.danger, marginTop: spacing.md },
  resultLabel: {
    fontSize: type.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: -spacing.xl,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderRadius: radius.sm,
  },
})
