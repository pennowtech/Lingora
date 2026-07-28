import type { CsvColumnMapping, CsvField, CsvRowPreview, DuplicatePolicy } from '@lingora/database'
import { buildCsvImportPreview, createDeck, getAllDecks, importCsvRows, parseCsv } from '@lingora/database'
import { Ionicons } from '@expo/vector-icons'
import { logger } from '@lingora/observability'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { File } from 'expo-file-system'
import { useLocalSearchParams } from 'expo-router'
import { useMemo, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from 'react-native'
import { Button, Card, Chip, Dropdown, EmptyState, ErrorState, Spinner } from '../../components/ui'
import { useServices } from '../../lib/services'
import { colors, radius, spacing, type } from '../../lib/theme'

const log = logger.child({ feature: 'import', screen: 'CsvImportScreen' })

const FIELD_LABELS: Record<CsvField, string> = {
  word: 'Word',
  meaning: 'Meaning',
  cloze: 'Cloze sentence ({{c1::word}})',
  example: 'Example sentence',
  exampleTranslation: 'Example translation',
  synonyms: 'Synonyms',
}
// Every column is optional now — a Cloze-style import maps only Cloze
// sentence (+ Example translation) and leaves Word/Meaning unmapped;
// buildCsvImportPreview derives them from the cloze answer/translation.
// See resolveWordAndMeaning in packages/database/src/import-shared.ts.
// Cloze and Example are separate mappings: map the fill-in-the-blank
// sentence to Cloze sentence, not Example — a plain Example sentence is
// for non-cloze cards. (If Cloze is left unmapped but Example contains
// {{c1::...}} markup, that's still auto-detected for backward
// compatibility, but the exported file will look cleaner if you map Cloze
// directly.)
// Part of speech, CEFR level, and tags are deliberately not mappable —
// every import gets the same fallback part of speech/CEFR level and no
// tags (see FALLBACK_PART_OF_SPEECH/FALLBACK_CEFR_LEVEL in csv-import.ts).
const ALL_FIELDS: CsvField[] = ['word', 'meaning', 'cloze', 'example', 'exampleTranslation', 'synonyms']

const DUPLICATE_POLICIES: { value: DuplicatePolicy; label: string; hint: string }[] = [
  { value: 'skip', label: 'Skip', hint: "Don't touch the existing word." },
  { value: 'merge', label: 'Merge', hint: 'Add this as another meaning on the existing card.' },
  { value: 'duplicate', label: 'Keep both', hint: 'Add a second, separate card for the same word.' },
]

interface TableColumn {
  label: string
  width: number
  cell: (preview: CsvRowPreview) => string
}
const TABLE_COLUMNS: TableColumn[] = [
  { label: 'Word', width: 140, cell: (p) => p.word || '(empty)' },
  { label: 'Meaning', width: 140, cell: (p) => p.meaning || '—' },
  { label: 'Cloze', width: 220, cell: (p) => p.cloze ?? '—' },
  { label: 'Example', width: 220, cell: (p) => p.example ?? '—' },
  { label: 'Example translation', width: 220, cell: (p) => p.exampleTranslation ?? '—' },
  { label: 'Synonyms', width: 160, cell: (p) => (p.synonyms.length > 0 ? p.synonyms.join(', ') : '—') },
  { label: 'Status', width: 100, cell: (p) => p.status },
  { label: 'Issues', width: 260, cell: (p) => (p.errors.length > 0 ? p.errors.join(' ') : '—') },
]
const SELECT_COLUMN_WIDTH = 48
const SAMPLE_COLUMN_WIDTH = 160

type Step = 'pick' | 'map' | 'preview' | 'importing' | 'done'

/**
 * CSV import with interactive column mapping. Parsing, validation, and the
 * transactional insert all live in @lingora/database#csv-import — this
 * screen is just the picker → map → preview → confirm wizard around it.
 */
export default function CsvImportScreen(): JSX.Element {
  const { db } = useServices()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const params = useLocalSearchParams<{ deckId?: string }>()

  const [step, setStep] = useState<Step>('pick')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<CsvColumnMapping>({})
  const [deckId, setDeckId] = useState<string | null>(params.deckId ?? null)
  const [newDeckOpen, setNewDeckOpen] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  const [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>('skip')
  const [previews, setPreviews] = useState<CsvRowPreview[]>([])
  const [checkedIndexes, setCheckedIndexes] = useState<Set<number>>(new Set())
  const [pickError, setPickError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; failed: number } | null>(null)

  const decksQuery = useQuery({ queryKey: ['decks'], queryFn: () => getAllDecks(db) })

  const createNewDeck = useMutation({
    mutationFn: async (name: string) => {
      const trimmed = name.trim()
      if (trimmed === '') throw new Error(t('Give the deck a name.'))
      const id = crypto.randomUUID()
      const now = Date.now()
      await createDeck(db, { id, name: trimmed, createdAt: now, updatedAt: now })
      return id
    },
    onSuccess: async (id) => {
      setDeckId(id)
      setNewDeckOpen(false)
      setNewDeckName('')
      await queryClient.invalidateQueries({ queryKey: ['decks'] })
      await queryClient.invalidateQueries({ queryKey: ['deck-counts'] })
    },
  })

  // A word column is no longer strictly required — a Cloze-style import can
  // map only Example, and the word/meaning get derived from the cloze
  // markup. But *something* has to be mapped, or every row is empty.
  const canBuildPreview = deckId !== null && (mapping.word !== undefined || mapping.example !== undefined)

  const handlePickFile = (): void => {
    setPickError(null)
    log.info('import.csv_file_picker_opened', { message: 'User opened the CSV file picker' })
    File.pickFileAsync({ mimeTypes: ['text/csv', 'text/comma-separated-values', 'text/plain', 'text/tab-separated-values'] })
      .then(async (picked) => {
        if (picked.canceled) return
        const text = await picked.result.text()
        const parsed = parseCsv(text)
        if (parsed.headers.length === 0 || parsed.rows.length === 0) {
          setPickError(t('This file has no rows to import.'))
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
    buildCsvImportPreview(db, rows, { mapping, language: 'de' })
      .then((built) => {
        setPreviews(built)
        // Checked by default: importable rows, and duplicates too (the
        // chosen duplicate-handling policy decides what happens to them —
        // unchecking is how you opt a specific row out). Rows with real
        // errors (missing word/meaning) start unchecked since there's
        // nothing valid to import yet.
        setCheckedIndexes(new Set(built.filter((p) => p.status !== 'error').map((p) => p.rowIndex)))
        setStep('preview')
      })
      .catch((error: unknown) => {
        log.error('import.csv_preview_failed', error, { message: 'Building CSV import preview failed' })
        Alert.alert(t('Could not read this file'), String(error))
      })
      .finally(() => setPreviewLoading(false))
  }

  const counts = useMemo(() => {
    const duplicate = previews.filter((p) => p.status === 'duplicate').length
    const error = previews.filter((p) => p.status === 'error').length
    return { duplicate, error }
  }, [previews])

  // "Will import" has to reflect what pressing Import actually does: every
  // *checked* row that isn't a hard error, since a checked 'duplicate' row
  // is genuinely imported (not skipped) once duplicatePolicy is 'merge' or
  // 'duplicate' — counting only status === 'ok' undercounted it to 0
  // whenever every checked row happened to be a duplicate.
  const willImportCount = useMemo(
    () =>
      previews.filter(
        (p) =>
          checkedIndexes.has(p.rowIndex) && (p.status === 'ok' || (p.status === 'duplicate' && duplicatePolicy !== 'skip')),
      ).length,
    [previews, checkedIndexes, duplicatePolicy],
  )

  const checkedCount = useMemo(
    () => previews.filter((p) => checkedIndexes.has(p.rowIndex)).length,
    [previews, checkedIndexes],
  )

  const toggleChecked = (rowIndex: number): void => {
    setCheckedIndexes((prev) => {
      const next = new Set(prev)
      if (next.has(rowIndex)) next.delete(rowIndex)
      else next.add(rowIndex)
      return next
    })
  }

  const allVisibleChecked = previews.length > 0 && previews.every((p) => checkedIndexes.has(p.rowIndex))
  const toggleSelectAll = (): void => {
    setCheckedIndexes(allVisibleChecked ? new Set() : new Set(previews.map((p) => p.rowIndex)))
  }

  const handleConfirmImport = (): void => {
    if (!deckId) return
    const toImport = previews.filter((p) => checkedIndexes.has(p.rowIndex))
    setStep('importing')
    log.info('import.csv_import_confirmed', {
      message: 'User confirmed CSV import',
      metadata: { itemCount: toImport.length },
    })
    importCsvRows(db, toImport, deckId, 'de', duplicatePolicy)
      .then(async (outcome) => {
        setResult(outcome)
        setStep('done')
        await queryClient.invalidateQueries()
      })
      .catch((error: unknown) => {
        log.error('import.csv_import_failed', error, { message: 'CSV import failed' })
        Alert.alert(t('Import failed'), String(error))
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
    setCheckedIndexes(new Set())
    setResult(null)
    setPickError(null)
  }

  if (step === 'preview') {
    return (
      <View style={styles.container}>
        <View style={styles.previewHeaderArea}>
          <Card style={styles.card}>
            <Text style={styles.title}>{t('Preview')}</Text>
            <View style={styles.summaryRow}>
              <SummaryStat label={t('Will import')} value={willImportCount} color={colors.success} />
              <SummaryStat label={t('Duplicates')} value={counts.duplicate} color={colors.warning} />
              <SummaryStat label={t('Errors')} value={counts.error} color={colors.danger} />
              <SummaryStat label={t('Selected')} value={checkedCount} color={colors.primary} />
            </View>
          </Card>
        </View>

        {/* Table region fills remaining space; the header row lives outside
            the vertical ScrollView below so it stays pinned on screen while
            rows scroll — both share one horizontal ScrollView so columns
            still line up when scrolling sideways. */}
        <ScrollView horizontal style={styles.tableOuterScroll} showsHorizontalScrollIndicator>
          <View style={styles.tableFlexColumn}>
            <View style={styles.tableHeaderRow}>
              <Pressable style={[styles.tableHeaderCheckboxCell, { width: SELECT_COLUMN_WIDTH }]} onPress={toggleSelectAll}>
                <Ionicons
                  name={allVisibleChecked ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={allVisibleChecked ? colors.primary : colors.textMuted}
                />
              </Pressable>
              {TABLE_COLUMNS.map((col) => (
                <Text key={col.label} style={[styles.tableHeaderCell, { width: col.width }]}>
                  {t(col.label)}
                </Text>
              ))}
            </View>
            <FlatList
              style={styles.tableBodyScroll}
              data={previews}
              keyExtractor={(preview) => String(preview.rowIndex)}
              windowSize={7}
              maxToRenderPerBatch={20}
              initialNumToRender={20}
              removeClippedSubviews
              renderItem={({ item: preview, index: i }) => {
                const checked = checkedIndexes.has(preview.rowIndex)
                return (
                  <View style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : null]}>
                    <Pressable
                      style={[styles.tableCheckboxCell, { width: SELECT_COLUMN_WIDTH }]}
                      onPress={() => toggleChecked(preview.rowIndex)}
                    >
                      <Ionicons
                        name={checked ? 'checkbox' : 'square-outline'}
                        size={18}
                        color={checked ? colors.primary : colors.textMuted}
                      />
                    </Pressable>
                    {TABLE_COLUMNS.map((col) => (
                      <Text
                        key={col.label}
                        style={[styles.tableCell, { width: col.width }, statusCellStyle(preview, col.label)]}
                        numberOfLines={4}
                      >
                        {col.cell(preview)}
                      </Text>
                    ))}
                  </View>
                )
              }}
            />
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <Button label={t('Back')} variant="ghost" onPress={() => setStep('map')} />
          <Button
            label={t('Import {{count}} rows', { count: checkedCount.toLocaleString() })}
            onPress={handleConfirmImport}
            disabled={checkedCount === 0}
          />
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {step === 'pick' ? (
        <Card style={styles.card}>
          <Text style={styles.title}>{t('Import from CSV')}</Text>
          <Text style={styles.body}>
            {t("From Quizlet, Memrise, or a spreadsheet export. You'll choose which column means what next.")}
          </Text>
          <Button label={t('Choose CSV file')} icon="folder-open" onPress={handlePickFile} />
          {pickError ? <Text style={styles.errorText}>{pickError}</Text> : null}
        </Card>
      ) : null}

      {step === 'map' ? (
        <>
          <Card style={styles.card}>
            <Text style={styles.title}>{fileName}</Text>
            <Text style={styles.body}>{t('{{count}} rows detected. Map each column below.', { count: rows.length.toLocaleString() })}</Text>
          </Card>

          <Card style={[styles.card, styles.samplePreviewCard]}>
            <Text style={styles.fieldLabel}>{t('Sample data')}</Text>
            <Text style={styles.hint}>{t('The first few rows, so you can see what each column actually holds.')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <View style={styles.tableHeaderRow}>
                  {headers.map((header, index) => (
                    <Text key={index} style={[styles.sampleHeaderCell, { width: SAMPLE_COLUMN_WIDTH }]}>
                      {header || t('Column {{n}}', { n: index + 1 })}
                    </Text>
                  ))}
                </View>
                {rows.slice(0, 4).map((row, rowIndex) => (
                  <View key={rowIndex} style={[styles.tableRow, rowIndex % 2 === 1 ? styles.tableRowAlt : null]}>
                    {headers.map((_, index) => (
                      <Text
                        key={index}
                        style={[styles.sampleCell, { width: SAMPLE_COLUMN_WIDTH }]}
                        numberOfLines={2}
                      >
                        {row[index] && row[index].length > 0 ? row[index] : '—'}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.fieldLabel}>{t('Field mapping')}</Text>
            <Text style={styles.hint}>
              {t("Everything is optional. Leave Word/Meaning unmapped for Cloze-style notes — they're derived from the example's cloze markup and its translation.")}
            </Text>
            {ALL_FIELDS.map((field) => (
              <View key={field} style={styles.mappingRow}>
                <Text style={styles.mappingLabel}>{field === 'cloze' ? FIELD_LABELS[field] : t(FIELD_LABELS[field])}</Text>
                <Dropdown
                  label={field === 'cloze' ? FIELD_LABELS[field] : t(FIELD_LABELS[field])}
                  placeholder={t('None')}
                  clearable
                  value={mapping[field] !== undefined ? String(mapping[field]) : null}
                  onChange={(v) => setField(field, v === null ? null : Number(v))}
                  options={headers.map((header, index) => ({
                    label: header || t('Column {{n}}', { n: index + 1 }),
                    value: String(index),
                  }))}
                />
              </View>
            ))}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.fieldLabel}>{t('Import into deck')}</Text>
            {decksQuery.isPending ? (
              <Spinner />
            ) : decksQuery.isError ? (
              <ErrorState message={String(decksQuery.error)} onRetry={() => void decksQuery.refetch()} />
            ) : (
              <View style={styles.chipRow}>
                {(decksQuery.data ?? []).map((deck) => (
                  <Chip key={deck.id} label={deck.name} selected={deckId === deck.id} onPress={() => setDeckId(deck.id)} />
                ))}
                <Chip label={t('+ New deck')} onPress={() => setNewDeckOpen(true)} />
              </View>
            )}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.fieldLabel}>{t('If the word already exists')}</Text>
            <Text style={styles.hint}>{t('Applies to every duplicate row you leave checked in the next step.')}</Text>
            <View style={styles.chipRow}>
              {DUPLICATE_POLICIES.map((policy) => (
                <Chip
                  key={policy.value}
                  label={t(policy.label)}
                  selected={duplicatePolicy === policy.value}
                  onPress={() => setDuplicatePolicy(policy.value)}
                />
              ))}
            </View>
            <Text style={styles.hint}>{t(DUPLICATE_POLICIES.find((p) => p.value === duplicatePolicy)?.hint ?? '')}</Text>
          </Card>

          <View style={styles.actions}>
            <Button label={t('Back')} variant="ghost" onPress={handleStartOver} />
            <Button
              label={previewLoading ? t('Checking…') : t('Preview import')}
              onPress={handleBuildPreview}
              disabled={!canBuildPreview || previewLoading}
            />
          </View>
        </>
      ) : null}

      {step === 'importing' ? <Spinner message={t('Importing…')} /> : null}

      {step === 'done' && result ? (
        <Card style={styles.card}>
          <EmptyState icon="checkmark-circle" title={t('Import complete')} message={t('Imported {{count}} words.', { count: result.imported.toLocaleString() })} />
          <View style={styles.summaryRow}>
            <SummaryStat label={t('Imported')} value={result.imported} color={colors.success} />
            <SummaryStat label={t('Skipped')} value={result.skipped} color={colors.warning} />
            <SummaryStat label={t('Failed')} value={result.failed} color={colors.danger} />
          </View>
          <Button label={t('Import another file')} variant="secondary" onPress={handleStartOver} />
        </Card>
      ) : null}

      {/* ── New deck modal ── */}
      <Modal visible={newDeckOpen} animationType="slide" transparent onRequestClose={() => setNewDeckOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setNewDeckOpen(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{t('New deck')}</Text>
          <TextInput
            style={styles.inputField}
            placeholder={t('Deck name')}
            placeholderTextColor={colors.textMuted}
            value={newDeckName}
            onChangeText={setNewDeckName}
            autoFocus
          />
          {createNewDeck.isError ? <Text style={styles.errorLabel}>{String(createNewDeck.error)}</Text> : null}
          <Button
            label={createNewDeck.isPending ? t('Creating…') : t('Create & select')}
            icon="add"
            disabled={createNewDeck.isPending}
            onPress={() => createNewDeck.mutate(newDeckName)}
          />
        </View>
      </Modal>
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

const STATUS_COLOR: Record<CsvRowPreview['status'], string> = {
  ok: colors.success,
  duplicate: colors.warning,
  error: colors.danger,
}

/** Colors the Status cell by row status, and the Issues cell red when non-empty. */
function statusCellStyle(preview: CsvRowPreview, columnLabel: string): TextStyle | undefined {
  if (columnLabel === 'Status') return { color: STATUS_COLOR[preview.status], fontWeight: '700' }
  if (columnLabel === 'Issues' && preview.errors.length > 0) return { color: colors.danger }
  return undefined
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  card: { gap: spacing.sm, marginBottom: spacing.sm },
  title: { fontSize: type.subheading, fontWeight: '700', color: colors.text },
  body: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
  fieldLabel: { fontSize: type.body, fontWeight: '700', color: colors.text },
  hint: { fontSize: type.micro, color: colors.textMuted },
  errorText: { fontSize: type.caption, color: colors.danger },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  mappingRow: { gap: spacing.xs, marginTop: spacing.sm },
  mappingLabel: { fontSize: type.caption, fontWeight: '600', color: colors.textSecondary },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  summaryRow: { flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap' },
  summaryStat: { alignItems: 'center' },
  summaryValue: { fontSize: type.subheading, fontWeight: '700' },
  summaryLabel: { fontSize: type.micro, color: colors.textMuted },
  previewHeaderArea: { padding: spacing.lg, paddingBottom: 0 },
  tableOuterScroll: { flex: 1, marginHorizontal: spacing.lg },
  tableFlexColumn: { flex: 1 },
  tableBodyScroll: { flex: 1 },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  tableHeaderCheckboxCell: { alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  tableHeaderCell: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  tableRowAlt: { backgroundColor: colors.surfaceMuted },
  tableCheckboxCell: { alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  tableCell: {
    fontSize: type.caption,
    color: colors.text,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  samplePreviewCard: { padding: spacing.md },
  sampleHeaderCell: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  sampleCell: {
    fontSize: type.caption,
    color: colors.text,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
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
