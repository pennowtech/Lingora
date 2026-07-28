import { Ionicons } from '@expo/vector-icons'
import type { Deck } from '@lingora/types'
import { createDeck, deleteDeck, getAllDecks, getDeckCounts, renameDeck, type DatabaseAdapter } from '@lingora/database'
import { logger } from '@lingora/observability'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState, type JSX } from 'react'
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  ExportFormatSheet,
  IconButton,
  ImportFormatSheet,
  Spinner,
  type ImportFormat,
} from '../../components/ui'
import { runExport, type ExportFormat } from '../../lib/export'
import { useServices } from '../../lib/services'
import { colors, radius, spacing, type } from '../../lib/theme'

const log = logger.child({ feature: 'export', screen: 'DecksScreen' })

/** A deck with its computed counts and resolved children. */
interface DeckNode {
  deck: Deck
  cardCount: number
  dueCount: number
  children: DeckNode[]
}

async function loadDeckTree(db: DatabaseAdapter): Promise<DeckNode[]> {
  const [decks, counts] = await Promise.all([getAllDecks(db), getDeckCounts(db)])
  const countByDeck = new Map(counts.map((c) => [c.deckId, c]))

  const toNode = (deck: Deck): DeckNode => ({
    deck,
    cardCount: countByDeck.get(deck.id)?.cardCount ?? 0,
    dueCount: countByDeck.get(deck.id)?.dueCount ?? 0,
    children: decks.filter((d) => d.parentId === deck.id).map(toNode),
  })

  return decks.filter((d) => !d.parentId).map(toNode)
}

/**
 * Deck list with nesting and due badges; the FAB creates a deck. Each row's
 * "⋮" menu offers import/export/rename/delete for that specific deck.
 */
export default function DecksScreen(): JSX.Element {
  const { db } = useServices()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [menuDeck, setMenuDeck] = useState<Deck | null>(null)
  const [importDeck, setImportDeck] = useState<Deck | null>(null)
  const [exportDeck, setExportDeck] = useState<Deck | null>(null)
  const [renameDeckTarget, setRenameDeckTarget] = useState<Deck | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const decksQuery = useQuery({ queryKey: ['deck-counts'], queryFn: () => loadDeckTree(db) })

  const invalidateDecks = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['deck-counts'] })
    await queryClient.invalidateQueries({ queryKey: ['decks'] })
  }

  const create = useMutation({
    mutationFn: async () => {
      const name = newName.trim()
      if (name === '') throw new Error('Give the deck a name.')
      const now = Date.now()
      await createDeck(db, {
        id: crypto.randomUUID(),
        name,
        ...(newEmoji.trim() !== '' && { emoji: newEmoji.trim() }),
        createdAt: now,
        updatedAt: now,
      })
    },
    onSuccess: async () => {
      setCreateOpen(false)
      setNewName('')
      setNewEmoji('')
      await invalidateDecks()
    },
  })

  const rename = useMutation({
    mutationFn: async () => {
      if (!renameDeckTarget) return
      const name = renameValue.trim()
      if (name === '') throw new Error('Give the deck a name.')
      await renameDeck(db, renameDeckTarget.id, name)
    },
    onSuccess: async () => {
      setRenameDeckTarget(null)
      await invalidateDecks()
    },
  })

  const remove = useMutation({
    mutationFn: async (deckId: string) => deleteDeck(db, deckId),
    onSuccess: async () => {
      await invalidateDecks()
    },
    onError: (error: unknown) => Alert.alert('Could not delete deck', String(error)),
  })

  const confirmDelete = (deck: Deck): void => {
    setMenuDeck(null)
    Alert.alert(
      'Delete deck?',
      'Cards that are only in this deck are deleted with it. Cards in other decks stay there.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(deck.id) },
      ],
    )
  }

  const showImport = (deck: Deck): void => {
    setMenuDeck(null)
    setImportDeck(deck)
  }

  const handleImportSelect = (format: ImportFormat): void => {
    if (!importDeck) return
    const deck = importDeck
    setImportDeck(null)
    router.push({
      pathname: format === 'csv' ? '/settings/csv-import' : '/settings/apkg-import',
      params: { deckId: deck.id },
    })
  }

  const runDeckExport = (deck: Deck, format: ExportFormat): void => {
    runExport(db, format, { deckId: deck.id, deckName: deck.name })
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

  const showExport = (deck: Deck): void => {
    setMenuDeck(null)
    setExportDeck(deck)
  }

  const handleExportSelect = (format: ExportFormat): void => {
    if (!exportDeck) return
    setExportDeck(null)
    runDeckExport(exportDeck, format)
  }

  return (
    <View style={styles.container}>
      {decksQuery.isPending ? (
        <Spinner />
      ) : decksQuery.isError ? (
        <ErrorState message={String(decksQuery.error)} onRetry={() => void decksQuery.refetch()} />
      ) : decksQuery.data.length === 0 ? (
        <EmptyState
          icon="albums"
          title="No decks yet"
          message="Create your first deck with the + button."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {decksQuery.data.map((node) => (
            <DeckRow key={node.deck.id} node={node} depth={0} onOpenMenu={setMenuDeck} />
          ))}
        </ScrollView>
      )}

      <Pressable style={styles.fab} onPress={() => setCreateOpen(true)}>
        <Ionicons name="add" size={28} color={colors.textOnPrimary} />
      </Pressable>

      {/* ── New deck modal ── */}
      <Modal visible={createOpen} animationType="slide" transparent onRequestClose={() => setCreateOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCreateOpen(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>New deck</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Deck name"
            placeholderTextColor={colors.textMuted}
            value={newName}
            onChangeText={setNewName}
            autoFocus
          />
          <TextInput
            style={styles.inputField}
            placeholder="Emoji (optional)"
            placeholderTextColor={colors.textMuted}
            value={newEmoji}
            onChangeText={setNewEmoji}
            maxLength={4}
          />
          {create.isError ? <Text style={styles.errorLabel}>{String(create.error)}</Text> : null}
          <Button
            label={create.isPending ? 'Creating…' : 'Create deck'}
            icon="add"
            disabled={create.isPending}
            onPress={() => create.mutate()}
          />
        </View>
      </Modal>

      {/* ── Per-deck actions menu ── */}
      <Modal visible={menuDeck !== null} animationType="fade" transparent onRequestClose={() => setMenuDeck(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuDeck(null)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          {menuDeck ? (
            <>
              <Text style={styles.modalTitle}>{menuDeck.emoji ?? '📚'} {menuDeck.name}</Text>
              <Button label="Import into this deck" icon="download" variant="secondary" onPress={() => showImport(menuDeck)} />
              <Button label="Export this deck" icon="cloud-download" variant="secondary" onPress={() => showExport(menuDeck)} />
              <Button
                label="Rename deck"
                icon="pencil"
                variant="secondary"
                onPress={() => {
                  setRenameValue(menuDeck.name)
                  setRenameDeckTarget(menuDeck)
                  setMenuDeck(null)
                }}
              />
              <Button label="Delete deck" icon="trash" variant="danger" onPress={() => confirmDelete(menuDeck)} />
            </>
          ) : null}
        </View>
      </Modal>

      {/* ── Rename modal ── */}
      <Modal
        visible={renameDeckTarget !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setRenameDeckTarget(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setRenameDeckTarget(null)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Rename deck</Text>
          <TextInput style={styles.inputField} value={renameValue} onChangeText={setRenameValue} autoFocus />
          {rename.isError ? <Text style={styles.errorLabel}>{String(rename.error)}</Text> : null}
          <Button
            label={rename.isPending ? 'Saving…' : 'Save'}
            disabled={rename.isPending}
            onPress={() => rename.mutate()}
          />
        </View>
      </Modal>

      <ImportFormatSheet
        visible={importDeck !== null}
        onClose={() => setImportDeck(null)}
        onSelect={handleImportSelect}
        {...(importDeck && { title: `Import into "${importDeck.name}"` })}
      />

      <ExportFormatSheet
        visible={exportDeck !== null}
        onClose={() => setExportDeck(null)}
        onSelect={handleExportSelect}
        {...(exportDeck && { title: `Export "${exportDeck.name}"` })}
      />
    </View>
  )
}

function DeckRow(props: { node: DeckNode; depth: number; onOpenMenu: (deck: Deck) => void }): JSX.Element {
  const { node, depth, onOpenMenu } = props
  return (
    <>
      <Card
        style={[styles.deckCard, depth > 0 && { marginLeft: depth * spacing.xl }]}
        onPress={() => router.push({ pathname: '/deck/[id]', params: { id: node.deck.id } })}
      >
        <Text style={styles.deckEmoji}>{node.deck.emoji ?? '📚'}</Text>
        <View style={styles.deckText}>
          <Text style={styles.deckName}>{node.deck.name}</Text>
          <Text style={styles.deckMeta}>
            {node.dueCount.toLocaleString()} due/{node.cardCount.toLocaleString()} cards
          </Text>
        </View>
        {node.dueCount > 0 ? (
          <Pressable
            style={styles.dueBadge}
            onPress={() =>
              router.push({ pathname: '/review/[deckId]', params: { deckId: node.deck.id } })
            }
          >
            <Text style={styles.dueBadgeLabel}>{node.dueCount} due</Text>
          </Pressable>
        ) : (
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        )}
        <IconButton icon="ellipsis-vertical" onPress={() => onOpenMenu(node.deck)} />
      </Card>
      {node.children.map((child) => (
        <DeckRow key={child.deck.id} node={child} depth={depth + 1} onOpenMenu={onOpenMenu} />
      ))}
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 96 },
  deckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
  },
  deckEmoji: { fontSize: 22 },
  deckText: { flex: 1 },
  deckName: { fontSize: type.body, fontWeight: '700', color: colors.text },
  deckMeta: { fontSize: type.micro, color: colors.textMuted, marginTop: 1 },
  dueBadge: {
    backgroundColor: colors.primarySoft,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  dueBadgeLabel: { fontSize: type.micro, fontWeight: '700', color: colors.primary },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
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
})
