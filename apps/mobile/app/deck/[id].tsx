import { Ionicons } from '@expo/vector-icons'
import type { Deck } from '@lingora/types'
import {
  deleteDeck,
  getAllDecks,
  getCardCountForDeck,
  getCardsForDeck,
  getDeckById,
  getDueCardsCount,
  getRetentionRate,
  mergeDecks,
  moveDeck,
  renameDeck,
  type DatabaseAdapter,
} from '@lingora/database'
import { logger } from '@lingora/observability'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useState, type JSX } from 'react'
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  Button,
  Card,
  CefrBadge,
  ErrorState,
  ExportFormatSheet,
  IconButton,
  ImportFormatSheet,
  SectionHeader,
  Spinner,
  type ImportFormat,
} from '../../components/ui'
import { collectDescendantIds } from '../../lib/deckTree'
import { runExport, type ExportFormat } from '../../lib/export'
import { useServices } from '../../lib/services'
import { colors, radius, spacing, type } from '../../lib/theme'

const log = logger.child({ feature: 'export', screen: 'DeckDetailScreen' })

const IMPORT_ROUTES: Record<ImportFormat, '/settings/csv-import' | '/settings/apkg-import' | '/settings/lin-import'> = {
  csv: '/settings/csv-import',
  apkg: '/settings/apkg-import',
  lin: '/settings/lin-import',
}

async function loadDeckDetail(db: DatabaseAdapter, deckId: string) {
  const deck = await getDeckById(db, deckId)
  if (!deck) return null
  const [cardCount, dueCount, retention, cards] = await Promise.all([
    getCardCountForDeck(db, deckId),
    getDueCardsCount(db, deckId),
    getRetentionRate(db, 30), // global for now — per-deck retention lands with Phase 5 stats
    getCardsForDeck(db, deckId),
  ])
  return { deck, cardCount, dueCount, retention, cards }
}

/**
 * Deck detail: header stats, card list, rename/delete actions.
 */
export default function DeckDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { db } = useServices()
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [importSheetOpen, setImportSheetOpen] = useState(false)
  const [exportSheetOpen, setExportSheetOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  // 'move' re-parents this deck (nesting); 'merge' folds this deck's cards
  // into another deck and deletes this one. Both share one deck-picker
  // modal, distinguished by this mode.
  const [pickerMode, setPickerMode] = useState<'move' | 'merge' | null>(null)

  const deckQuery = useQuery({
    queryKey: ['deck', id],
    queryFn: () => loadDeckDetail(db, id ?? ''),
    enabled: (id ?? '') !== '',
  })

  const allDecksQuery = useQuery({
    queryKey: ['decks'],
    queryFn: () => getAllDecks(db),
    enabled: pickerMode !== null,
  })

  const rename = useMutation({
    mutationFn: async () => {
      const name = renameValue.trim()
      if (name === '') throw new Error('Give the deck a name.')
      await renameDeck(db, id, name)
    },
    onSuccess: async () => {
      setRenameOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['deck', id] })
      await queryClient.invalidateQueries({ queryKey: ['deck-counts'] })
    },
  })

  const remove = useMutation({
    mutationFn: () => deleteDeck(db, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      router.back()
    },
    onError: (error: unknown) => Alert.alert('Could not delete deck', String(error)),
  })

  const confirmDelete = (): void => {
    setMenuOpen(false)
    Alert.alert(
      'Delete deck?',
      'Cards that are only in this deck are deleted with it. Cards in other decks stay there.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
      ],
    )
  }

  const move = useMutation({
    mutationFn: (newParentId: string | null) => moveDeck(db, id, newParentId),
    onSuccess: async () => {
      setPickerMode(null)
      await queryClient.invalidateQueries({ queryKey: ['deck', id] })
      await queryClient.invalidateQueries({ queryKey: ['decks'] })
    },
    onError: (error: unknown) => Alert.alert('Could not move deck', String(error)),
  })

  const merge = useMutation({
    mutationFn: (targetDeckId: string) => mergeDecks(db, id, targetDeckId),
    onSuccess: async () => {
      setPickerMode(null)
      await queryClient.invalidateQueries()
      router.back()
    },
    onError: (error: unknown) => Alert.alert('Could not merge deck', String(error)),
  })

  const showMove = (): void => {
    setMenuOpen(false)
    setPickerMode('move')
  }

  const showMerge = (): void => {
    setMenuOpen(false)
    setPickerMode('merge')
  }

  const handlePickTarget = (target: Deck): void => {
    if (pickerMode === 'move') {
      move.mutate(target.id)
      return
    }
    if (pickerMode === 'merge') {
      Alert.alert(
        `Merge into "${target.name}"?`,
        `This deletes "${deckQuery.data?.deck.name ?? 'this deck'}" and moves all its cards into "${target.name}". This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Merge', style: 'destructive', onPress: () => merge.mutate(target.id) },
        ],
      )
    }
  }

  const showImport = (): void => {
    setMenuOpen(false)
    setImportSheetOpen(true)
  }

  const handleImportSelect = (format: ImportFormat): void => {
    setImportSheetOpen(false)
    router.push({
      pathname: IMPORT_ROUTES[format],
      params: { deckId: id },
    })
  }

  const runDeckExport = (format: ExportFormat): void => {
    if (!deckQuery.data) return
    runExport(db, format, { deckId: id, deckName: deckQuery.data.deck.name })
      .then(({ itemCount, outcome }) =>
        Alert.alert(
          'Export ready',
          `Exported ${itemCount.toLocaleString()} cards.${outcome === 'device' ? ' Saved to the folder you chose.' : ' Choose where to save it.'}`,
        ),
      )
      .catch((error: unknown) => {
        log.error('export.deck_export_failed', error, { message: 'Deck export failed' })
        Alert.alert('Export failed', String(error))
      })
  }

  const showExport = (): void => {
    setMenuOpen(false)
    setExportSheetOpen(true)
  }

  const handleExportSelect = (format: ExportFormat): void => {
    setExportSheetOpen(false)
    runDeckExport(format)
  }

  if (deckQuery.isPending) {
    return (
      <>
        <Stack.Screen options={{ title: 'Deck' }} />
        <Spinner />
      </>
    )
  }

  if (deckQuery.isError || !deckQuery.data) {
    return (
      <>
        <Stack.Screen options={{ title: 'Deck' }} />
        <ErrorState
          message={deckQuery.isError ? String(deckQuery.error) : 'This deck no longer exists.'}
          {...(deckQuery.isError && { onRetry: () => void deckQuery.refetch() })}
        />
      </>
    )
  }

  const { deck, cardCount, dueCount, retention, cards } = deckQuery.data

  const allDecks = allDecksQuery.data ?? []
  const excludedIds = collectDescendantIds(allDecks, deck.id)
  excludedIds.add(deck.id)
  const pickerTargets = allDecks.filter((d) => !excludedIds.has(d.id))

  return (
    <>
      <Stack.Screen
        options={{
          title: `${deck.emoji ?? '📚'} ${deck.name}`,
          headerRight: () => <IconButton icon="ellipsis-horizontal" onPress={() => setMenuOpen(true)} />,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{cardCount}</Text>
            <Text style={styles.statLabel}>cards</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{dueCount}</Text>
            <Text style={styles.statLabel}>due now</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {Math.round(retention * 100)}%
            </Text>
            <Text style={styles.statLabel}>retention</Text>
          </Card>
        </View>

        <Button
          label={dueCount > 0 ? `Review ${dueCount} due cards` : 'Nothing due — study ahead'}
          icon="play"
          onPress={() => router.push({ pathname: '/review/[deckId]', params: { deckId: deck.id } })}
          style={styles.reviewButton}
        />
        <Button
          label="Practice cloze"
          icon="create-outline"
          variant="secondary"
          onPress={() =>
            router.push({ pathname: '/review/[deckId]', params: { deckId: deck.id, mode: 'cloze' } })
          }
          style={styles.clozeButton}
        />

        <SectionHeader title="Cards" />
        {cards.map((card) => (
          <Card
            key={card.cardId}
            style={styles.cardRow}
            onPress={() => router.push({ pathname: '/word/[form]', params: { form: card.form } })}
          >
            <View style={styles.cardRowText}>
              <Text style={styles.cardForm}>{card.form}</Text>
              {card.translation ? <Text style={styles.cardMeaning}>{card.translation}</Text> : null}
            </View>
            <View style={styles.cardRowRight}>
              {card.hasCloze ? (
                <View style={styles.clozeBadge}>
                  <Ionicons name="create-outline" size={12} color={colors.warning} />
                </View>
              ) : null}
              {card.cefrLevel ? <CefrBadge level={card.cefrLevel} /> : null}
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </Card>
        ))}
        {cards.length === 0 ? (
          <Text style={styles.footnote}>No cards yet — add words from Search.</Text>
        ) : null}
      </ScrollView>

      {/* ── Deck actions menu ── */}
      <Modal visible={menuOpen} animationType="fade" transparent onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuOpen(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Button label="Import into this deck" icon="download" variant="secondary" onPress={showImport} />
          <Button label="Export this deck" icon="cloud-download" variant="secondary" onPress={showExport} />
          <Button
            label="Rename deck"
            icon="pencil"
            variant="secondary"
            onPress={() => {
              setMenuOpen(false)
              setRenameValue(deck.name)
              setRenameOpen(true)
            }}
          />
          <Button label="Move to…" icon="folder-open-outline" variant="secondary" onPress={showMove} />
          <Button label="Merge into…" icon="git-merge-outline" variant="secondary" onPress={showMerge} />
          <Button
            label={remove.isPending ? 'Deleting…' : 'Delete deck'}
            icon="trash"
            variant="danger"
            onPress={confirmDelete}
            disabled={remove.isPending}
          />
        </View>
      </Modal>

      {/* ── Rename modal ── */}
      <Modal visible={renameOpen} animationType="slide" transparent onRequestClose={() => setRenameOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRenameOpen(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Rename deck</Text>
          <TextInput
            style={styles.inputField}
            value={renameValue}
            onChangeText={setRenameValue}
            autoFocus
          />
          {rename.isError ? <Text style={styles.errorLabel}>{String(rename.error)}</Text> : null}
          <Button
            label={rename.isPending ? 'Saving…' : 'Save'}
            disabled={rename.isPending}
            onPress={() => rename.mutate()}
          />
        </View>
      </Modal>

      {/* ── Move/merge deck picker — shared between both actions, see pickerMode ── */}
      <Modal visible={pickerMode !== null} animationType="slide" transparent onRequestClose={() => setPickerMode(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerMode(null)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>
            {pickerMode === 'move' ? `Move "${deck.name}" to…` : `Merge "${deck.name}" into…`}
          </Text>
          {pickerMode === 'move' ? (
            <Pressable
              style={styles.deckRow}
              onPress={() => move.mutate(null)}
              disabled={move.isPending || deck.parentId === undefined}
            >
              <Ionicons name="apps-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.deckRowLabel}>Top level (no parent)</Text>
            </Pressable>
          ) : null}
          {allDecksQuery.isPending ? (
            <Spinner />
          ) : allDecksQuery.isError ? (
            <ErrorState message={String(allDecksQuery.error)} onRetry={() => void allDecksQuery.refetch()} />
          ) : pickerTargets.length === 0 ? (
            <Text style={styles.hint}>
              {pickerMode === 'move'
                ? 'No other deck to nest this one under.'
                : 'No other deck to merge into.'}
            </Text>
          ) : (
            pickerTargets.map((target) => (
              <Pressable
                key={target.id}
                style={styles.deckRow}
                onPress={() => handlePickTarget(target)}
                disabled={move.isPending || merge.isPending}
              >
                <Text style={styles.deckEmoji}>{target.emoji ?? '📚'}</Text>
                <Text style={styles.deckRowLabel}>{target.name}</Text>
              </Pressable>
            ))
          )}
          {move.isError ? <Text style={styles.errorLabel}>{String(move.error)}</Text> : null}
          {merge.isError ? <Text style={styles.errorLabel}>{String(merge.error)}</Text> : null}
        </View>
      </Modal>

      <ImportFormatSheet
        visible={importSheetOpen}
        onClose={() => setImportSheetOpen(false)}
        onSelect={handleImportSelect}
        title={`Import into "${deck.name}"`}
      />

      <ExportFormatSheet
        visible={exportSheetOpen}
        onClose={() => setExportSheetOpen(false)}
        onSelect={handleExportSelect}
        title={`Export "${deck.name}"`}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statValue: { fontSize: type.heading, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: type.micro, color: colors.textSecondary, marginTop: 2 },
  reviewButton: { marginTop: spacing.lg },
  clozeButton: { marginTop: spacing.sm },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
  },
  cardRowText: { flex: 1, marginRight: spacing.md },
  cardForm: { fontSize: type.body, fontWeight: '700', color: colors.text },
  cardMeaning: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
  cardRowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  clozeBadge: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footnote: { fontSize: type.micro, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
  modalBackdrop: { flex: 1, backgroundColor: '#00000066' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  modalTitle: { fontSize: type.subheading, fontWeight: '800', color: colors.text },
  inputField: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: type.body,
    color: colors.text,
  },
  errorLabel: { fontSize: type.caption, color: colors.danger },
  deckRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  deckRowLabel: { flex: 1, fontSize: type.body, fontWeight: '600', color: colors.text },
  deckEmoji: { fontSize: 20 },
  hint: { fontSize: type.caption, color: colors.textMuted, paddingVertical: spacing.md },
})
