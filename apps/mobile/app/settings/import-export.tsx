import { Ionicons } from '@expo/vector-icons'
import { BackupValidationError } from '@lingora/database'
import { logger } from '@lingora/observability'
import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState, type JSX, type ReactNode } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Card, SectionHeader } from '../../components/ui'
import { applyBackupRestore, exportBackupToFile, pickAndParseBackupFile } from '../../lib/backup'
import { runExport, type ExportFormat } from '../../lib/export'
import { useServices } from '../../lib/services'
import { colors, radius, spacing, type } from '../../lib/theme'

const log = logger.child({ feature: 'export', screen: 'ImportExportScreen' })

type OptionId =
  | 'import-apkg'
  | 'import-csv'
  | 'import-restore'
  | 'export-lin'
  | 'export-csv'
  | 'export-apkg'
  | 'export-markdown'

/** One collapsible option row — header always visible, detail + action only when expanded. */
function OptionAccordion(props: {
  icon: keyof typeof Ionicons.glyphMap
  iconBg: string
  iconColor: string
  title: string
  detail: string
  expanded: boolean
  onToggle: () => void
  children: ReactNode
}): JSX.Element {
  return (
    <Card style={styles.optionCard}>
      <Pressable style={styles.optionHeader} onPress={props.onToggle}>
        <View style={[styles.optionIcon, { backgroundColor: props.iconBg }]}>
          <Ionicons name={props.icon} size={20} color={props.iconColor} />
        </View>
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>{props.title}</Text>
          {!props.expanded ? (
            <Text style={styles.optionDetail} numberOfLines={1}>
              {props.detail}
            </Text>
          ) : null}
        </View>
        <Ionicons name={props.expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </Pressable>
      {props.expanded ? (
        <View style={styles.optionBody}>
          <Text style={styles.optionDetail}>{props.detail}</Text>
          {props.children}
        </View>
      ) : null}
    </Card>
  )
}

/**
 * Import & export. Anki import is the adoption-critical feature per the
 * roadmap — power users ask "can I import my Anki decks?" first.
 *
 * Every option is a collapsible accordion (header always visible, detail +
 * action button only when expanded) — with seven options across import and
 * export, having every card always fully expanded made this screen a wall
 * of text before you'd even picked what you wanted.
 */
export default function ImportExportScreen(): JSX.Element {
  const { db, reloadServices } = useServices()
  const queryClient = useQueryClient()
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)
  const [expanded, setExpanded] = useState<Set<OptionId>>(new Set())

  const toggle = (id: OptionId): void => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleFormatExport = (format: ExportFormat): void => {
    setExportingFormat(format)
    log.info('export.format_export_pressed', { message: 'User pressed a whole-library format export button' })
    runExport(db, format, { deckName: 'Lingora vocabulary' })
      .then(({ itemCount, outcome }) => {
        Alert.alert(
          'Export ready',
          `Exported ${itemCount.toLocaleString()} cards.${outcome === 'device' ? ' Saved to the folder you chose.' : ' Choose where to save it.'}`,
        )
      })
      .catch((error: unknown) => {
        log.error('export.format_export_failed', error, { message: 'Whole-library format export failed' })
        Alert.alert('Export failed', String(error))
      })
      .finally(() => setExportingFormat(null))
  }

  const handleExport = (): void => {
    setExporting(true)
    log.info('export.backup_button_pressed', { message: 'User pressed "Export everything"' })
    exportBackupToFile(db)
      .then(({ itemCount, outcome }) => {
        Alert.alert(
          'Backup ready',
          `Exported ${itemCount.toLocaleString()} cards.${outcome === 'device' ? ' Saved to the folder you chose.' : ' Choose where to save it.'}`,
        )
      })
      .catch((error: unknown) => {
        log.error('export.backup_failed', error, { message: 'Backup export failed' })
        Alert.alert('Export failed', String(error))
      })
      .finally(() => setExporting(false))
  }

  const handleRestore = (): void => {
    log.info('import.restore_button_pressed', { message: 'User pressed "Restore from backup"' })
    pickAndParseBackupFile()
      .then((picked) => {
        if (!picked) return // user canceled the file picker
        Alert.alert(
          'Restore from backup?',
          `This replaces everything currently on this device with the contents of "${picked.fileName}" (exported ${new Date(picked.payload.exportedAt).toLocaleDateString()}). This cannot be undone.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Restore',
              style: 'destructive',
              onPress: () => {
                setRestoring(true)
                applyBackupRestore(db, picked.payload)
                  .then(async ({ result }) => {
                    const totalRows = Object.values(result.tableCounts).reduce(
                      (sum, count) => sum + (count ?? 0),
                      0,
                    )
                    await queryClient.invalidateQueries()
                    await reloadServices()
                    Alert.alert('Restore complete', `Restored ${totalRows.toLocaleString()} rows.`)
                  })
                  .catch((error: unknown) => {
                    log.error('import.restore_failed', error, { message: 'Backup restore failed' })
                    Alert.alert('Restore failed', String(error))
                  })
                  .finally(() => setRestoring(false))
              },
            },
          ],
        )
      })
      .catch((error: unknown) => {
        if (error instanceof BackupValidationError) {
          log.warn('import.restore_validation_failed', {
            message: 'Picked file failed backup validation',
            metadata: { itemCount: error.issues.length },
          })
          Alert.alert('Invalid backup file', [error.message, ...error.issues.slice(0, 5)].join('\n'))
          return
        }
        log.error('import.restore_failed', error, { message: 'Backup file picking failed' })
        Alert.alert('Could not read file', String(error))
      })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <SectionHeader title="Import" />

      <OptionAccordion
        icon="albums"
        iconBg={colors.infoSoft}
        iconColor={colors.info}
        title="Anki deck (.apkg)"
        detail="Bring your existing decks. Review history isn't imported — cards start fresh."
        expanded={expanded.has('import-apkg')}
        onToggle={() => toggle('import-apkg')}
      >
        <Pressable style={styles.actionButton} onPress={() => router.push('/settings/apkg-import')}>
          <Ionicons name="folder-open" size={16} color={colors.primary} />
          <Text style={styles.actionButtonLabel}>Choose .apkg file</Text>
        </Pressable>
      </OptionAccordion>

      <OptionAccordion
        icon="grid"
        iconBg={colors.successSoft}
        iconColor={colors.success}
        title="CSV with column mapping"
        detail="From Quizlet, Memrise, or spreadsheets."
        expanded={expanded.has('import-csv')}
        onToggle={() => toggle('import-csv')}
      >
        <Pressable style={styles.actionButton} onPress={() => router.push('/settings/csv-import')}>
          <Ionicons name="folder-open" size={16} color={colors.primary} />
          <Text style={styles.actionButtonLabel}>Choose CSV file</Text>
        </Pressable>
      </OptionAccordion>

      <OptionAccordion
        icon="cloud-upload"
        iconBg={colors.primarySoft}
        iconColor={colors.primary}
        title="Restore from Lingora backup (.lin)"
        detail="Replaces everything on this device with a previously exported backup."
        expanded={expanded.has('import-restore')}
        onToggle={() => toggle('import-restore')}
      >
        <Pressable style={styles.actionButton} onPress={handleRestore} disabled={restoring}>
          <Ionicons name="folder-open" size={16} color={colors.primary} />
          <Text style={styles.actionButtonLabel}>{restoring ? 'Restoring…' : 'Choose backup file'}</Text>
          {restoring ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </Pressable>
      </OptionAccordion>

      <SectionHeader title="Export" />

      <OptionAccordion
        icon="cloud-download"
        iconBg={colors.primarySoft}
        iconColor={colors.primary}
        title="Lingora backup (.lin)"
        detail="Your full library — decks, cards, review history. Your data is always yours. API keys are never included."
        expanded={expanded.has('export-lin')}
        onToggle={() => toggle('export-lin')}
      >
        <Pressable style={styles.actionButton} onPress={handleExport} disabled={exporting}>
          <Ionicons name="download" size={16} color={colors.primary} />
          <Text style={styles.actionButtonLabel}>{exporting ? 'Exporting…' : 'Export everything'}</Text>
          {exporting ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </Pressable>
      </OptionAccordion>

      <OptionAccordion
        icon="grid"
        iconBg={colors.successSoft}
        iconColor={colors.success}
        title="CSV"
        detail="One row per card — the same columns CSV import reads, so this file re-imports as-is."
        expanded={expanded.has('export-csv')}
        onToggle={() => toggle('export-csv')}
      >
        <Pressable style={styles.actionButton} onPress={() => handleFormatExport('csv')} disabled={exportingFormat !== null}>
          <Ionicons name="download" size={16} color={colors.primary} />
          <Text style={styles.actionButtonLabel}>{exportingFormat === 'csv' ? 'Exporting…' : 'Export as CSV'}</Text>
        </Pressable>
      </OptionAccordion>

      <OptionAccordion
        icon="albums"
        iconBg={colors.infoSoft}
        iconColor={colors.info}
        title="Anki deck (.apkg)"
        detail="Study your Lingora vocabulary in Anki/AnkiDroid. Cards start fresh — review history isn't carried over."
        expanded={expanded.has('export-apkg')}
        onToggle={() => toggle('export-apkg')}
      >
        <Pressable style={styles.actionButton} onPress={() => handleFormatExport('apkg')} disabled={exportingFormat !== null}>
          <Ionicons name="download" size={16} color={colors.primary} />
          <Text style={styles.actionButtonLabel}>{exportingFormat === 'apkg' ? 'Exporting…' : 'Export as .apkg'}</Text>
        </Pressable>
      </OptionAccordion>

      <OptionAccordion
        icon="document-text"
        iconBg={colors.primarySoft}
        iconColor={colors.primary}
        title="Markdown"
        detail="A readable word — meaning — example list. Not meant to re-import."
        expanded={expanded.has('export-markdown')}
        onToggle={() => toggle('export-markdown')}
      >
        <Pressable
          style={styles.actionButton}
          onPress={() => handleFormatExport('markdown')}
          disabled={exportingFormat !== null}
        >
          <Ionicons name="download" size={16} color={colors.primary} />
          <Text style={styles.actionButtonLabel}>{exportingFormat === 'markdown' ? 'Exporting…' : 'Export as Markdown'}</Text>
        </Pressable>
      </OptionAccordion>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  optionCard: { padding: 0, overflow: 'hidden', marginBottom: spacing.sm },
  optionHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', padding: spacing.lg },
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
  optionBody: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  actionButtonLabel: { fontSize: type.caption, fontWeight: '700', color: colors.primary },
})
