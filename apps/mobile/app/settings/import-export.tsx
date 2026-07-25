import { Ionicons } from '@expo/vector-icons'
import type { JSX } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button, Card, SectionHeader } from '../../components/ui'
import { colors, radius, spacing, type } from '../../lib/theme'

/**
 * Import & export. Anki import is the adoption-critical feature per the
 * roadmap — power users ask "can I import my Anki decks?" first.
 *
 * TODO(phase4): implement .apkg parsing, CSV column mapping with a real
 * file picker (expo-document-picker), and JSON backup via the repositories.
 */
export default function ImportExportScreen(): JSX.Element {
  const noop = (): void => undefined

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <SectionHeader title="Import" />

      <Card style={styles.optionCard}>
        <View style={styles.optionHeader}>
          <View style={[styles.optionIcon, { backgroundColor: colors.infoSoft }]}>
            <Ionicons name="albums" size={20} color={colors.info} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Anki deck (.apkg)</Text>
            <Text style={styles.optionDetail}>
              Bring your existing decks with review history where possible.
            </Text>
          </View>
        </View>
        <Button label="Choose .apkg file" variant="secondary" icon="folder-open" onPress={noop} small />
      </Card>

      <Card style={styles.optionCard}>
        <View style={styles.optionHeader}>
          <View style={[styles.optionIcon, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="grid" size={20} color={colors.success} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>CSV with column mapping</Text>
            <Text style={styles.optionDetail}>From Quizlet, Memrise, or spreadsheets.</Text>
          </View>
        </View>
        {/* Dummy mapping preview — becomes an interactive mapper after file pick */}
        <View style={styles.mappingPreview}>
          <MappingRow from="Column A" to="word" />
          <MappingRow from="Column B" to="meaning" />
          <MappingRow from="Column C" to="example (optional)" />
        </View>
        <Button label="Choose CSV file" variant="secondary" icon="folder-open" onPress={noop} small />
      </Card>

      <SectionHeader title="Export" />
      <Card style={styles.optionCard}>
        <View style={styles.optionHeader}>
          <View style={[styles.optionIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="cloud-download" size={20} color={colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>JSON backup</Text>
            <Text style={styles.optionDetail}>
              Your full library — decks, cards, review history. Your data is always yours.
            </Text>
          </View>
        </View>
        <Button label="Export everything" variant="secondary" icon="download" onPress={noop} small />
      </Card>
    </ScrollView>
  )
}

function MappingRow(props: { from: string; to: string }): JSX.Element {
  return (
    <View style={styles.mappingRow}>
      <Text style={styles.mappingFrom}>{props.from}</Text>
      <Ionicons name="arrow-forward" size={13} color={colors.textMuted} />
      <Text style={styles.mappingTo}>{props.to}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  optionCard: { gap: spacing.md, marginBottom: spacing.sm },
  optionHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionTitle: { fontSize: type.body, fontWeight: '700', color: colors.text },
  optionDetail: { fontSize: type.caption, color: colors.textSecondary, marginTop: 1, lineHeight: 18 },
  mappingPreview: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  mappingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mappingFrom: { fontSize: type.micro, color: colors.textSecondary, width: 80 },
  mappingTo: { fontSize: type.micro, fontWeight: '700', color: colors.primary },
})
