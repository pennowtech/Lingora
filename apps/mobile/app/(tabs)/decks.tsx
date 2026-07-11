import { Ionicons } from '@expo/vector-icons'
import type { Deck } from '@lingora/types'
import { createDeck, getAllDecks, getDeckCounts, type DatabaseAdapter } from '@lingora/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState, type JSX } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button, Card, EmptyState, ErrorState, Spinner } from '../../components/ui'
import { useServices } from '../../lib/services'
import { colors, radius, spacing, type } from '../../lib/theme'

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
 * Deck list with nesting and due badges; the FAB creates a deck.
 */
export default function DecksScreen(): JSX.Element {
  const { db } = useServices()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('')

  const decksQuery = useQuery({ queryKey: ['deck-counts'], queryFn: () => loadDeckTree(db) })

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
      await queryClient.invalidateQueries({ queryKey: ['deck-counts'] })
      await queryClient.invalidateQueries({ queryKey: ['decks'] })
    },
  })

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
            <DeckRow key={node.deck.id} node={node} depth={0} />
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
    </View>
  )
}

function DeckRow(props: { node: DeckNode; depth: number }): JSX.Element {
  const { node, depth } = props
  return (
    <>
      <Card
        style={[styles.deckCard, depth > 0 && { marginLeft: depth * spacing.xl }]}
        onPress={() => router.push({ pathname: '/deck/[id]', params: { id: node.deck.id } })}
      >
        <Text style={styles.deckEmoji}>{node.deck.emoji ?? '📚'}</Text>
        <View style={styles.deckText}>
          <Text style={styles.deckName}>{node.deck.name}</Text>
          <Text style={styles.deckMeta}>{node.cardCount} cards</Text>
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
      </Card>
      {node.children.map((child) => (
        <DeckRow key={child.deck.id} node={child} depth={depth + 1} />
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
