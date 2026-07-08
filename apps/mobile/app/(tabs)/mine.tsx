import { Ionicons } from '@expo/vector-icons'
import { useState, type JSX } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button, Card, EmptyState, IconButton } from '../../components/ui'
import { dummyMineQueue, type DummyMineEntry } from '../../lib/dummy'
import { colors, radius, spacing, type } from '../../lib/theme'

const SOURCE_ICONS: Record<DummyMineEntry['sourceType'], keyof typeof Ionicons.glyphMap> = {
  netflix: 'tv',
  youtube: 'logo-youtube',
  article: 'newspaper',
  clipboard: 'clipboard',
  manual: 'pencil',
}

/**
 * Sentence mining queue: captured text waits here BEFORE any AI call —
 * the user discards what they don't want, then generates the rest in one go.
 *
 * TODO(phase4): replace dummyMineQueue with getPendingMineEntries(); discard
 * calls deleteMineEntry(); "Generate cards" walks the selection through the
 * Phase 3 AI pipeline and updateMineEntryProcessed().
 */
export default function MiningQueueScreen(): JSX.Element {
  const [selected, setSelected] = useState<string[]>(dummyMineQueue.map((e) => e.id))
  const noop = (): void => undefined

  const toggle = (id: string): void => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  if (dummyMineQueue.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="download"
          title="Queue is empty"
          message="Text you capture — from the share sheet, clipboard, or later the browser extension — lands here before any AI processing."
        />
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

        {dummyMineQueue.map((entry) => {
          const isSelected = selected.includes(entry.id)
          return (
            <Card key={entry.id} style={styles.entryCard} onPress={() => toggle(entry.id)}>
              <View style={styles.entryHeader}>
                <View style={styles.sourceRow}>
                  <Ionicons name={SOURCE_ICONS[entry.sourceType]} size={13} color={colors.textMuted} />
                  <Text style={styles.sourceLabel}>{entry.sourceTitle}</Text>
                  <Text style={styles.timeLabel}>· {entry.capturedAgo}</Text>
                </View>
                <Ionicons
                  name={isSelected ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={isSelected ? colors.primary : colors.textMuted}
                />
              </View>
              <Text style={styles.entryText}>„{entry.text}"</Text>
              <View style={styles.entryActions}>
                {/* TODO(phase4): deleteMineEntry(id) */}
                <IconButton icon="trash-outline" size={17} color={colors.danger} onPress={noop} />
              </View>
            </Card>
          )
        })}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          label={`Generate ${selected.length} card${selected.length === 1 ? '' : 's'} with AI`}
          icon="sparkles"
          onPress={noop}
          disabled={selected.length === 0}
        />
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
