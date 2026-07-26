import type { CsvColumnMapping, CsvField, CsvRowPreview } from '@lingora/database'
import {
  buildCsvImportPreview,
  CEFR_LEVELS,
  getAllDecks,
  importCsvRows,
  parseCsv,
  PARTS_OF_SPEECH,
} from '@lingora/database'
import type { CefrLevel, PartOfSpeech } from '@lingora/types'
import { logger } from '@lingora/observability'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { File } from 'expo-file-system'
import { useMemo, useState, type JSX } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button, Card, Chip, EmptyState, ErrorState, Spinner } from '../../components/ui'
import { useServices } from '../../lib/services'
import { colors, spacing, type } from '../../lib/theme'

const log = logger.child({ feature: 'import', screen: 'CsvImportScreen' })

const FIELD_LABELS: Record<CsvField, string> = {
  word: 'Word (required)',
  meaning: 'Meaning (required)',
  example: 'Example sentence',
  partOfSpeech: 'Part of speech',
  cefrLevel: 'CEFR level',
  tags: 'Tags',
}
const OPTIONAL_FIELDS: CsvField[] = ['example', 'partOfSpeech', 'cefrLevel', 'tags']
const REQUIRED_FIELDS: CsvField[] = ['word', 'meaning']

type Step = 'pick' | 'map' | 'preview' | 'importing' | 'done'

/**
 * CSV import with interactive column mapping (Work package 2). Parsing,
 * validation, and the transactional insert all live in
 * @lingora/database#csv-import — this screen is just the picker → map →
 * preview → confirm wizard around it.
 */
export default function CsvImportScreen(): JSX.Element {
  const { db } = useServices()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<Step>('pick')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<CsvColumnMapping>({})
  const [deckId, setDeckId] = useState<string | null>(null)
  const [defaultPos, setDefaultPos] = useState<PartOfSpeech>('noun')
  const [defaultCefr, setDefaultCefr] = useState<CefrLevel>('A1')
  const [previews, setPreviews] = useState<CsvRowPreview[]>([])
  const [pickError, setPickError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; failed: number } | null>(null)

  const decksQuery = useQuery({ queryKey: ['decks'], queryFn: () => getAllDecks(db) })

  const canBuildPreview = mapping.word !== undefined && mapping.meaning !== undefined && deckId !== null

  const handlePickFile = (): void => {
    setPickError(null)
    log.info('import.csv_file_picker_opened', { message: 'User opened the CSV file picker' })
    File.pickFileAsync({ mimeTypes: ['text/csv', 'text/comma-separated-values', 'text/plain', 'text/tab-separated-values'] })
      .then(async (picked) => {
        if (picked.canceled) return
        const text = await picked.result.text()
        const parsed = parseCsv(text)
        if (parsed.headers.length === 0 || parsed.rows.length === 0) {
          setPickError('This file has no rows to import.')
          return
        }
        setFileName(picked.result.name)
        setHeaders(parsed.headers)
        setRows(parsed.rows)
        setMapping({})
        setStep('map')
        log.info('import.csv_file_parsed', {
          message: 'CSV file parsed',
          metadata: { itemCount: parsed.rows.length },
        })
      })
      .catch((error: unknown) => {
        log.error('import.csv_file_pick_failed', error, { message: 'CSV file picking failed' })
        setPickError(String(error))
      })
  }

  const setField = (field: CsvField, columnIndex: number | null): void => {
    setMapping((prev) => {
      const next = { ...prev }
      if (columnIndex === null) delete next[field]
      else next[field] = columnIndex
      return next
    })
  }

  const handleBuildPreview = (): void => {
    if (!deckId) return
    setPreviewLoading(true)
    log.info('import.csv_preview_started', { message: 'Building CSV import preview' })
    buildCsvImportPreview(db, rows, {
      mapping,
      language: 'de',
      defaultPartOfSpeech: defaultPos,
      defaultCefrLevel: defaultCefr,
    })
      .then((built) => {
        setPreviews(built)
        setStep('preview')
      })
      .catch((error: unknown) => {
        log.error('import.csv_preview_failed', error, { message: 'Building CSV import preview failed' })
        Alert.alert('Could not read this file', String(error))
      })
      .finally(() => setPreviewLoading(false))
  }

  const counts = useMemo(() => {
    const ok = previews.filter((p) => p.status === 'ok').length
    const duplicate = previews.filter((p) => p.status === 'duplicate').length
    const error = previews.filter((p) => p.status === 'error').length
    return { ok, duplicate, error }
  }, [previews])

  const handleConfirmImport = (): void => {
    if (!deckId) return
    setStep('importing')
    log.info('import.csv_import_confirmed', {
      message: 'User confirmed CSV import',
      metadata: { itemCount: previews.length },
    })
    importCsvRows(db, previews, deckId, 'de')
      .then(async (outcome) => {
        setResult(outcome)
        setStep('done')
        await queryClient.invalidateQueries()
      })
      .catch((error: unknown) => {
        log.error('import.csv_import_failed', error, { message: 'CSV import failed' })
        Alert.alert('Import failed', String(error))
        setStep('preview')
      })
  }

  const handleStartOver = (): void => {
    setStep('pick')
    setFileName('')
    setHeaders([])
    setRows([])
    setMapping({})
    setPreviews([])
    setResult(null)
    setPickError(null)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {step === 'pick' ? (
        <Card style={styles.card}>
          <Text style={styles.title}>Import from CSV</Text>
          <Text style={styles.body}>
            From Quizlet, Memrise, or a spreadsheet export. You'll choose which column means what next.
          </Text>
          <Button label="Choose CSV file" icon="folder-open" onPress={handlePickFile} />
          {pickError ? <Text style={styles.errorText}>{pickError}</Text> : null}
        </Card>
      ) : null}

      {step === 'map' ? (
        <>
          <Card style={styles.card}>
            <Text style={styles.title}>{fileName}</Text>
            <Text style={styles.body}>{rows.length.toLocaleString()} rows detected. Map each column below.</Text>
          </Card>

          {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map((field) => (
            <Card key={field} style={styles.card}>
              <Text style={styles.fieldLabel}>{FIELD_LABELS[field]}</Text>
              <View style={styles.chipRow}>
                {OPTIONAL_FIELDS.includes(field) ? (
                  <Chip label="None" selected={mapping[field] === undefined} onPress={() => setField(field, null)} />
                ) : null}
                {headers.map((header, index) => (
                  <Chip
                    key={`${field}-${index}`}
                    label={header || `Column ${index + 1}`}
                    selected={mapping[field] === index}
                    onPress={() => setField(field, index)}
                  />
                ))}
              </View>
            </Card>
          ))}

          <Card style={styles.card}>
            <Text style={styles.fieldLabel}>Import into deck</Text>
            {decksQuery.isPending ? (
              <Spinner />
            ) : decksQuery.isError ? (
              <ErrorState message={String(decksQuery.error)} onRetry={() => void decksQuery.refetch()} />
            ) : (
              <View style={styles.chipRow}>
                {(decksQuery.data ?? []).map((deck) => (
                  <Chip key={deck.id} label={deck.name} selected={deckId === deck.id} onPress={() => setDeckId(deck.id)} />
                ))}
              </View>
            )}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.fieldLabel}>Default part of speech</Text>
            <Text style={styles.hint}>Used for rows with no mapped or recognized part-of-speech column.</Text>
            <View style={styles.chipRow}>
              {PARTS_OF_SPEECH.map((pos) => (
                <Chip key={pos} label={pos} selected={defaultPos === pos} onPress={() => setDefaultPos(pos)} />
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.fieldLabel}>Default CEFR level</Text>
            <Text style={styles.hint}>Used for rows with no mapped or recognized CEFR column.</Text>
            <View style={styles.chipRow}>
              {CEFR_LEVELS.map((level) => (
                <Chip key={level} label={level} selected={defaultCefr === level} onPress={() => setDefaultCefr(level)} />
              ))}
            </View>
          </Card>

          <View style={styles.actions}>
            <Button label="Back" variant="ghost" onPress={handleStartOver} />
            <Button
              label={previewLoading ? 'Checking…' : 'Preview import'}
              onPress={handleBuildPreview}
              disabled={!canBuildPreview || previewLoading}
            />
          </View>
        </>
      ) : null}

      {step === 'preview' ? (
        <>
          <Card style={styles.card}>
            <Text style={styles.title}>Preview</Text>
            <View style={styles.summaryRow}>
              <SummaryStat label="Will import" value={counts.ok} color={colors.success} />
              <SummaryStat label="Duplicates" value={counts.duplicate} color={colors.warning} />
              <SummaryStat label="Errors" value={counts.error} color={colors.danger} />
            </View>
          </Card>

          {previews.slice(0, 50).map((preview) => (
            <Card key={preview.rowIndex} style={styles.rowCard}>
              <View style={styles.rowHeader}>
                <Text style={styles.rowWord}>{preview.word || '(empty)'}</Text>
                <StatusChip status={preview.status} />
              </View>
              <Text style={styles.rowMeaning}>{preview.meaning || '—'}</Text>
              {preview.errors.length > 0 ? (
                <Text style={styles.rowError}>{preview.errors.join(' ')}</Text>
              ) : null}
            </Card>
          ))}
          {previews.length > 50 ? (
            <Text style={styles.hint}>…and {(previews.length - 50).toLocaleString()} more rows.</Text>
          ) : null}

          <View style={styles.actions}>
            <Button label="Back" variant="ghost" onPress={() => setStep('map')} />
            <Button
              label={`Import ${counts.ok.toLocaleString()} rows`}
              onPress={handleConfirmImport}
              disabled={counts.ok === 0}
            />
          </View>
        </>
      ) : null}

      {step === 'importing' ? <Spinner message="Importing…" /> : null}

      {step === 'done' && result ? (
        <Card style={styles.card}>
          <EmptyState icon="checkmark-circle" title="Import complete" message={`Imported ${result.imported.toLocaleString()} words.`} />
          <View style={styles.summaryRow}>
            <SummaryStat label="Imported" value={result.imported} color={colors.success} />
            <SummaryStat label="Skipped" value={result.skipped} color={colors.warning} />
            <SummaryStat label="Failed" value={result.failed} color={colors.danger} />
          </View>
          <Button label="Import another file" variant="secondary" onPress={handleStartOver} />
        </Card>
      ) : null}
    </ScrollView>
  )
}

function SummaryStat(props: { label: string; value: number; color: string }): JSX.Element {
  return (
    <View style={styles.summaryStat}>
      <Text style={[styles.summaryValue, { color: props.color }]}>{props.value.toLocaleString()}</Text>
      <Text style={styles.summaryLabel}>{props.label}</Text>
    </View>
  )
}

function StatusChip(props: { status: CsvRowPreview['status'] }): JSX.Element {
  const config = {
    ok: { label: 'OK', color: { fg: colors.success, bg: colors.successSoft } },
    duplicate: { label: 'Duplicate', color: { fg: colors.warning, bg: colors.warningSoft } },
    error: { label: 'Error', color: { fg: colors.danger, bg: colors.dangerSoft } },
  }[props.status]
  return <Chip label={config.label} selected color={config.color} />
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  card: { gap: spacing.sm, marginBottom: spacing.sm },
  rowCard: { gap: spacing.xs, marginBottom: spacing.xs, padding: spacing.md },
  title: { fontSize: type.subheading, fontWeight: '700', color: colors.text },
  body: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
  fieldLabel: { fontSize: type.body, fontWeight: '700', color: colors.text },
  hint: { fontSize: type.micro, color: colors.textMuted },
  errorText: { fontSize: type.caption, color: colors.danger },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md },
  summaryRow: { flexDirection: 'row', gap: spacing.lg },
  summaryStat: { alignItems: 'center' },
  summaryValue: { fontSize: type.subheading, fontWeight: '700' },
  summaryLabel: { fontSize: type.micro, color: colors.textMuted },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowWord: { fontSize: type.body, fontWeight: '700', color: colors.text },
  rowMeaning: { fontSize: type.caption, color: colors.textSecondary },
  rowError: { fontSize: type.micro, color: colors.danger },
})
