import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import type { JSX } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Card } from '../../components/ui'
import { dummyDecks, type DummyDeck } from '../../lib/dummy'
import { colors, radius, spacing, type } from '../../lib/theme'

/**
 * Deck list with nesting and due badges.
 * TODO(phase4): replace dummyDecks with getAllDecks()/getChildDecks() +
 * getDueCardsCount() per deck; FAB creates a deck via createDeck().
 */
export default function DecksScreen(): JSX.Element {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {dummyDecks.map((deck) => (
          <DeckRow key={deck.id} deck={deck} depth={0} />
        ))}
      </ScrollView>

      {/* TODO(phase4): opens a "new deck" dialog → createDeck() */}
      <Pressable style={styles.fab} onPress={() => undefined}>
        <Ionicons name="add" size={28} color={colors.textOnPrimary} />
      </Pressable>
    </View>
  )
}

function DeckRow(props: { deck: DummyDeck; depth: number }): JSX.Element {
  const { deck, depth } = props
  return (
    <>
      <Card
        style={[styles.deckCard, depth > 0 && { marginLeft: depth * spacing.xl }]}
        onPress={() => router.push({ pathname: '/deck/[id]', params: { id: deck.id } })}
      >
        <Text style={styles.deckEmoji}>{deck.emoji}</Text>
        <View style={styles.deckText}>
          <Text style={styles.deckName}>{deck.name}</Text>
          <Text style={styles.deckMeta}>{deck.cardCount} cards</Text>
        </View>
        {deck.dueCount > 0 ? (
          <Pressable
            style={styles.dueBadge}
            onPress={() => router.push({ pathname: '/review/[deckId]', params: { deckId: deck.id } })}
          >
            <Text style={styles.dueBadgeLabel}>{deck.dueCount} due</Text>
          </Pressable>
        ) : (
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        )}
      </Card>
      {deck.children.map((child) => (
        <DeckRow key={child.id} deck={child} depth={depth + 1} />
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
})
