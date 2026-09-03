import { BackupValidationError } from '@lingora/database'
import { logger } from '@lingora/observability'
import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState, type JSX, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Icon, type IconName } from '../../components/Icon'
import { AlertModal, Card, ConfirmModal, SectionHeader } from '../../components/ui'
import { ExportNameModal } from '../../components/ExportNameModal'
import { applyBackupRestore, exportBackupToFile, pickAndParseBackupFile, type PickedBackup } from '../../lib/backup'
import { defaultExportFileName, runExport, type ExportFormat } from '../../lib/export'
import { useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'export', screen: 'ImportExportScreen' })

type OptionId =
  | 'import-apkg'
  | 'import-csv'
  | 'import-lem-deck'
  | 'import-restore'
  | 'export-lem'
  | 'export-csv'
  | 'export-apkg'
  | 'export-markdown'

/** One collapsible option row — header always visible, detail + action only when expanded. */
function OptionAccordion(props: {
  icon: IconName
  iconBg: string
  iconColor: string
  title: string
  detail: string
  expanded: boolean
  onToggle: () => void
  children: ReactNode
}): JSX.Element {
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  return (
    <Card style={styles.optionCard}>
      <Pressable style={styles.optionHeader} onPress={props.onToggle}>
        <View style={[styles.optionIcon, { backgroundColor: props.iconBg }]}>
          <Icon name={props.icon} size={20} color={props.iconColor} />
        </View>
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>{props.title}</Text>
          {!props.expanded ? (
            <Text style={styles.optionDetail} numberOfLines={1}>
              {props.detail}
            </Text>
          ) : null}
        </View>
        <Icon name={props.expanded ? 'ChevronUp' : 'ChevronDown'} size={18} color={colors.textMuted} />
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
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const queryClient = useQueryClient()
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)
  const [expanded, setExpanded] = useState<Set<OptionId>>(new Set())
  const [exportPending, setExportPending] = useState<{ kind: 'format'; format: ExportFormat } | { kind: 'backup' } | null>(
    null,
  )
  const [exportNotice, setExportNotice] = useState<{ title: string; message: string } | null>(null)
  const [restoreConfirm, setRestoreConfirm] = useState<PickedBackup | null>(null)

  const toggle = (id: OptionId): void => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const runFormatExport = (format: ExportFormat, fileName: string): void => {
    setExportingFormat(format)
    log.info('export.format_export_pressed', { message: 'User pressed a whole-library format export button' })
    runExport(db, format, { deckName: 'Lemory vocabulary', fileName })
      .then(({ itemCount, outcome }) => {
        setExportNotice({
          title: t('Export ready'),
          message: `${t('Exported {{count}} cards.', { count: itemCount.toLocaleString() })}${outcome === 'device' ? ` ${t('Saved to the folder you chose.')}` : ` ${t('Choose where to save it.')}`}`,
        })
      })
      .catch((error: unknown) => {
        log.error('export.format_export_failed', error, { message: 'Whole-library format export failed' })
        setExportNotice({ title: t('Export failed'), message: String(error) })
      })
      .finally(() => setExportingFormat(null))
  }

  const runBackupExport = (fileName: string): void => {
    setExporting(true)
    log.info('export.backup_button_pressed', { message: 'User pressed "Export everything"' })
    exportBackupToFile(db, { fileName })
      .then(({ itemCount, outcome }) => {
        setExportNotice({
          title: t('Backup ready'),
          message: `${t('Exported {{count}} cards.', { count: itemCount.toLocaleString() })}${outcome === 'device' ? ` ${t('Saved to the folder you chose.')}` : ` ${t('Choose where to save it.')}`}`,
        })
      })
      .catch((error: unknown) => {
        log.error('export.backup_failed', error, { message: 'Backup export failed' })
        setExportNotice({ title: t('Export failed'), message: String(error) })
      })
      .finally(() => setExporting(false))
  }

  // Both export paths open the file-name prompt first — see decks.tsx's identical pattern.
  const handleFormatExport = (format: ExportFormat): void => setExportPending({ kind: 'format', format })
  const handleExport = (): void => setExportPending({ kind: 'backup' })

  const handleRestore = (): void => {
    log.info('import.restore_button_pressed', { message: 'User pressed "Restore from backup"' })
    pickAndParseBackupFile()
      .then((picked) => {
        if (!picked) return // user canceled the file picker
        setRestoreConfirm(picked)
      })
      .catch((error: unknown) => {
        if (error instanceof BackupValidationError) {
          log.warn('import.restore_validation_failed', {
            message: 'Picked file failed backup validation',
            metadata: { itemCount: error.issues.length },
          })
          setExportNotice({ title: t('Invalid backup file'), message: [error.message, ...error.issues.slice(0, 5)].join('\n') })
          return
        }
        log.error('import.restore_failed', error, { message: 'Backup file picking failed' })
        setExportNotice({ title: t('Could not read file'), message: String(error) })
      })
  }

  const runRestore = (picked: PickedBackup): void => {
    setRestoring(true)
    applyBackupRestore(db, picked.payload)
      .then(async ({ result }) => {
        const totalRows = Object.values(result.tableCounts).reduce((sum, count) => sum + (count ?? 0), 0)
        await queryClient.invalidateQueries()
        await reloadServices()
        setExportNotice({ title: t('Restore complete'), message: t('Restored {{count}} rows.', { count: totalRows.toLocaleString() }) })
      })
      .catch((error: unknown) => {
        log.error('import.restore_failed', error, { message: 'Backup restore failed' })
        setExportNotice({ title: t('Restore failed'), message: String(error) })
      })
      .finally(() => setRestoring(false))
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <SectionHeader title={t('Import')} />

      <OptionAccordion
        icon="Layers"
        iconBg={colors.infoSoft}
        iconColor={colors.info}
        title={t('Anki deck (.apkg)')}
        detail={t("Bring your existing decks. Review history isn't imported - cards start fresh.")}
        expanded={expanded.has('import-apkg')}
        onToggle={() => toggle('import-apkg')}
      >
        <Pressable style={styles.actionButton} onPress={() => router.push('/settings/apkg-import')}>
          <Icon name="FolderOpen" size={16} color={colors.primary} />
          <Text style={styles.actionButtonLabel}>{t('Choose .apkg file')}</Text>
        </Pressable>
      </OptionAccordion>

      <OptionAccordion
        icon="LayoutGrid"
        iconBg={colors.successSoft}
        iconColor={colors.success}
        title={t('CSV with column mapping')}
        detail={t('From Quizlet, Memrise, or spreadsheets.')}
        expanded={expanded.has('import-csv')}
        onToggle={() => toggle('import-csv')}
      >
        <Pressable style={styles.actionButton} onPress={() => router.push('/settings/csv-import')}>
          <Icon name="FolderOpen" size={16} color={colors.primary} />
          <Text style={styles.actionButtonLabel}>{t('Choose CSV file')}</Text>
        </Pressable>
      </OptionAccordion>

      <OptionAccordion
        icon="Sparkles"
        iconBg={colors.primarySoft}
        iconColor={colors.primary}
        title={t('A shared deck (.lem)')}
        detail={t("Add a deck someone shared with you - full fidelity, including review history. Doesn't touch anything else on this device.")}
        expanded={expanded.has('import-lem-deck')}
        onToggle={() => toggle('import-lem-deck')}
      >
        <Pressable style={styles.actionButton} onPress={() => router.push('/settings/lem-import')}>
          <Icon name="FolderOpen" size={16} color={colors.primary} />
          <Text style={styles.actionButtonLabel}>{t('Choose .lem file')}</Text>
        </Pressable>
      </OptionAccordion>

      <OptionAccordion
        icon="CloudUpload"
        iconBg={colors.primarySoft}
        iconColor={colors.primary}
        title={t('Restore from Lemory backup (.lem)')}
        detail={t('Replaces everything on this device with a previously exported backup.')}
        expanded={expanded.has('import-restore')}
        onToggle={() => toggle('import-restore')}
      >
        <Pressable style={styles.actionButton} onPress={handleRestore} disabled={restoring}>
          <Icon name="FolderOpen" size={16} color={colors.primary} />
          <Text style={styles.actionButtonLabel}>{restoring ? t('Restoring...') : t('Choose backup file')}</Text>
          {restoring ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </Pressable>
      </OptionAccordion>

      <SectionHeader title={t('Export')} />

      <OptionAccordion
        icon="CloudDownload"
        iconBg={colors.primarySoft}
        iconColor={colors.primary}
        title={t('Lemory backup (.lem)')}
        detail={t('Your full library - decks, cards, review history. Your data is always yours. API keys are never included.')}
        expanded={expanded.has('export-lem')}
        onToggle={() => toggle('export-lem')}
      >
        <Pressable style={styles.actionButton} onPress={handleExport} disabled={exporting}>
          <Icon name="Download" size={16} color={colors.primary} />
          <Text style={styles.actionButtonLabel}>{exporting ? t('Exporting...') : t('Export everything')}</Text>
          {exporting ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </Pressable>
      </OptionAccordion>

      <OptionAccordion
        icon="LayoutGrid"
        iconBg={colors.successSoft}
        iconColor={colors.success}
        title={t('CSV')}
        detail={t('One row per card - the same columns CSV import reads, so this file re-imports as-is.')}
        expanded={expanded.has('export-csv')}
        onToggle={() => toggle('export-csv')}
      >
        <Pressable style={styles.actionButton} onPress={() => handleFormatExport('csv')} disabled={exportingFormat !== null}>
          <Icon name="Download" size={16} color={colors.primary} />
          <Text style={styles.actionButtonLabel}>{exportingFormat === 'csv' ? t('Exporting...') : t('Export as CSV')}</Text>
        </Pressable>
      </OptionAccordion>

      <OptionAccordion
        icon="Layers"
        iconBg={colors.infoSoft}
        iconColor={colors.info}
        title={t('Anki deck (.apkg)')}
        detail={t("Study your Lemory vocabulary in Anki/AnkiDroid. Cards start fresh - review history isn't carried over.")}
        expanded={expanded.has('export-apkg')}
        onToggle={() => toggle('export-apkg')}
      >
        <Pressable style={styles.actionButton} onPress={() => handleFormatExport('apkg')} disabled={exportingFormat !== null}>
          <Icon name="Download" size={16} color={colors.primary} />
          <Text style={styles.actionButtonLabel}>{exportingFormat === 'apkg' ? t('Exporting...') : t('Export as .apkg')}</Text>
        </Pressable>
      </OptionAccordion>

      <OptionAccordion
        icon="FileText"
        iconBg={colors.primarySoft}
        iconColor={colors.primary}
        title={t('Markdown')}
        detail={t('A readable word - meaning - example list. Not meant to re-import.')}
        expanded={expanded.has('export-markdown')}
        onToggle={() => toggle('export-markdown')}
      >
        <Pressable
          style={styles.actionButton}
          onPress={() => handleFormatExport('markdown')}
          disabled={exportingFormat !== null}
        >
          <Icon name="Download" size={16} color={colors.primary} />
          <Text style={styles.actionButtonLabel}>{exportingFormat === 'markdown' ? t('Exporting...') : t('Export as Markdown')}</Text>
        </Pressable>
      </OptionAccordion>

      <ExportNameModal
        visible={exportPending !== null}
        defaultName={defaultExportFileName('Lemory vocabulary')}
        onCancel={() => setExportPending(null)}
        onConfirm={(fileName) => {
          const pending = exportPending
          setExportPending(null)
          if (!pending) return
          if (pending.kind === 'backup') runBackupExport(fileName)
          else runFormatExport(pending.format, fileName)
        }}
      />

      <AlertModal
        visible={exportNotice !== null}
        title={exportNotice?.title ?? ''}
        message={exportNotice?.message ?? ''}
        onClose={() => setExportNotice(null)}
      />

      <ConfirmModal
        visible={restoreConfirm !== null}
        title={t('Restore from backup?')}
        message={
          restoreConfirm
            ? t(
                'This replaces everything currently on this device with the contents of "{{fileName}}" (exported {{date}}). This cannot be undone.',
                { fileName: restoreConfirm.fileName, date: new Date(restoreConfirm.payload.exportedAt).toLocaleDateString() },
              )
            : ''
        }
        onCancel={() => setRestoreConfirm(null)}
        onConfirm={() => {
          const picked = restoreConfirm
          setRestoreConfirm(null)
          if (picked) runRestore(picked)
        }}
        confirmLabel={t('Restore')}
        destructive
      />
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
