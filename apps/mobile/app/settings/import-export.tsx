import { Ionicons } from '@expo/vector-icons'
import { BackupValidationError } from '@lingora/database'
import { logger } from '@lingora/observability'
import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState, type JSX } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button, Card, SectionHeader } from '../../components/ui'
import { applyBackupRestore, exportBackupToFile, pickAndParseBackupFile } from '../../lib/backup'
import { runExport, type ExportFormat } from '../../lib/export'
import { useServices } from '../../lib/services'
import { colors, radius, spacing, type } from '../../lib/theme'

const log = logger.child({ feature: 'export', screen: 'ImportExportScreen' })

/**
 * Import & export. Anki import is the adoption-critical feature per the
 * roadmap — power users ask "can I import my Anki decks?" first.
 *
 * JSON backup export/restore (Work package 1), CSV import with column
 * mapping (Work package 2), and Anki .apkg import (Work package 3) are all
 * implemented.
 */
export default function ImportExportScreen(): JSX.Element {
  const { db, reloadServices } = useServices()
  const queryClient = useQueryClient()
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)

  const handleFormatExport = (format: ExportFormat): void => {
    setExportingFormat(format)
    log.info('export.format_export_pressed', { message: 'User pressed a whole-library format export button' })
    runExport(db, format, { deckName: 'Lingora vocabulary' })
      .then(({ itemCount }) => {
        Alert.alert('Export ready', `Exported ${itemCount.toLocaleString()} cards. Choose where to save it.`)
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
      .then(({ itemCount }) => {
        Alert.alert('Backup ready', `Exported ${itemCount.toLocaleString()} rows. Choose where to save it.`)
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

      <Card style={styles.optionCard}>
        <View style={styles.optionHeader}>
          <View style={[styles.optionIcon, { backgroundColor: colors.infoSoft }]}>
            <Ionicons name="albums" size={20} color={colors.info} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Anki deck (.apkg)</Text>
            <Text style={styles.optionDetail}>
              Bring your existing decks. Review history isn't imported — cards start fresh.
            </Text>
          </View>
        </View>
        <Button
          label="Choose .apkg file"
          variant="secondary"
          icon="folder-open"
          onPress={() => router.push('/settings/apkg-import')}
          small
        />
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
        <Button
          label="Choose CSV file"
          variant="secondary"
          icon="folder-open"
          onPress={() => router.push('/settings/csv-import')}
          small
        />
      </Card>

      <Card style={styles.optionCard}>
        <View style={styles.optionHeader}>
          <View style={[styles.optionIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="cloud-upload" size={20} color={colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Restore from Lingora backup (.lin)</Text>
            <Text style={styles.optionDetail}>
              Replaces everything on this device with a previously exported backup.
            </Text>
          </View>
        </View>
        <Button
          label={restoring ? 'Restoring…' : 'Choose backup file'}
          variant="secondary"
          icon="folder-open"
          onPress={handleRestore}
          disabled={restoring}
          small
        />
        {restoring ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </Card>

      <SectionHeader title="Export" />
      <Card style={styles.optionCard}>
        <View style={styles.optionHeader}>
          <View style={[styles.optionIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="cloud-download" size={20} color={colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Lingora backup (.lin)</Text>
            <Text style={styles.optionDetail}>
              Your full library — decks, cards, review history. Your data is always yours. API keys
              are never included.
            </Text>
          </View>
        </View>
        <Button
          label={exporting ? 'Exporting…' : 'Export everything'}
          variant="secondary"
          icon="download"
          onPress={handleExport}
          disabled={exporting}
          small
        />
        {exporting ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </Card>

      <Card style={styles.optionCard}>
        <View style={styles.optionHeader}>
          <View style={[styles.optionIcon, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="grid" size={20} color={colors.success} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>CSV</Text>
            <Text style={styles.optionDetail}>
              One row per card — the same columns CSV import reads, so this file re-imports as-is.
            </Text>
          </View>
        </View>
        <Button
          label={exportingFormat === 'csv' ? 'Exporting…' : 'Export as CSV'}
          variant="secondary"
          icon="download"
          onPress={() => handleFormatExport('csv')}
          disabled={exportingFormat !== null}
          small
        />
      </Card>

      <Card style={styles.optionCard}>
        <View style={styles.optionHeader}>
          <View style={[styles.optionIcon, { backgroundColor: colors.infoSoft }]}>
            <Ionicons name="albums" size={20} color={colors.info} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Anki deck (.apkg)</Text>
            <Text style={styles.optionDetail}>
              Study your Lingora vocabulary in Anki/AnkiDroid. Cards start fresh — review history
              isn't carried over.
            </Text>
          </View>
        </View>
        <Button
          label={exportingFormat === 'apkg' ? 'Exporting…' : 'Export as .apkg'}
          variant="secondary"
          icon="download"
          onPress={() => handleFormatExport('apkg')}
          disabled={exportingFormat !== null}
          small
        />
      </Card>

      <Card style={styles.optionCard}>
        <View style={styles.optionHeader}>
          <View style={[styles.optionIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="document-text" size={20} color={colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Markdown</Text>
            <Text style={styles.optionDetail}>A readable word — meaning — example list. Not meant to re-import.</Text>
          </View>
        </View>
        <Button
          label={exportingFormat === 'markdown' ? 'Exporting…' : 'Export as Markdown'}
          variant="secondary"
          icon="download"
          onPress={() => handleFormatExport('markdown')}
          disabled={exportingFormat !== null}
          small
        />
      </Card>
    </ScrollView>
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
})
