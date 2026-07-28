import type { ApkgField, ApkgFieldMapping, ApkgRowPreview, DuplicatePolicy } from '@lingora/database'
import {
  buildApkgImportPreview,
  createDeck,
  dominantNoteType,
  getAllDecks,
  importApkgNotes,
  stripAnkiHtml,
} from '@lingora/database'
import type { AnkiDeckInfo, AnkiNote, AnkiNoteType } from '@lingora/database'
import { Ionicons } from '@expo/vector-icons'
import { logger } from '@lingora/observability'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { useMemo, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from 'react-native'
import { Button, Card, Chip, Dropdown, EmptyState, ErrorState, ProgressBar, Spinner } from '../../components/ui'
import { pickAndParseApkgFile } from '../../lib/apkg'
import { useServices } from '../../lib/services'
import { colors, radius, spacing, type } from '../../lib/theme'

const log = logger.child({ feature: 'import', screen: 'ApkgImportScreen' })

const FIELD_LABELS: Record<ApkgField, string> = {
  word: 'Word',
  meaning: 'Meaning',
  cloze: 'Cloze sentence ({{c1::word}})',
  example: 'Example sentence',
  exampleTranslation: 'Example translation',
  synonyms: 'Synonyms',
}
// Every field is optional now — a real Anki Cloze note has no standalone
// word/meaning field at all (the fill-in-the-blank sentence IS the card), so
// mapping only Cloze sentence (+ Example translation) works:
// buildApkgImportPreview derives word/meaning from the cloze answer/
// translation. See resolveWordAndMeaning in packages/database/src/import-shared.ts.
// A real Anki Cloze note's Text field (the one with {{c1::...}} markup)
// should map to Cloze sentence, not Example sentence — Example is for a
// plain, non-cloze sentence. (Mapping cloze markup to Example instead still
// auto-detects it for backward compatibility, but Cloze sentence is the
// direct, unambiguous mapping and exports cleaner.)
// Part of speech and CEFR level are deliberately not mappable — every
// import gets the same fallback (see FALLBACK_PART_OF_SPEECH/
// FALLBACK_CEFR_LEVEL in apkg-import.ts). Tags aren't mappable either, but
// for a different reason — they come free from the Anki note's own tags.
const ALL_FIELDS: ApkgField[] = ['word', 'meaning', 'cloze', 'example', 'exampleTranslation', 'synonyms']

const DUPLICATE_POLICIES: { value: DuplicatePolicy; label: string; hint: string }[] = [
  { value: 'skip', label: 'Skip', hint: "Don't touch the existing word." },
  { value: 'merge', label: 'Merge', hint: 'Add this as another meaning on the existing card.' },
  { value: 'duplicate', label: 'Keep both', hint: 'Add a second, separate card for the same word.' },
]

interface TableColumn {
  label: string
  width: number
  cell: (preview: ApkgRowPreview) => string
}
const TABLE_COLUMNS: TableColumn[] = [
  { label: 'Word', width: 140, cell: (p) => p.word || '(empty)' },
  { label: 'Meaning', width: 140, cell: (p) => p.meaning || '—' },
  { label: 'Cloze', width: 220, cell: (p) => p.cloze ?? '—' },
  { label: 'Example', width: 220, cell: (p) => p.example ?? '—' },
  { label: 'Example translation', width: 220, cell: (p) => p.exampleTranslation ?? '—' },
  { label: 'Synonyms', width: 160, cell: (p) => (p.synonyms.length > 0 ? p.synonyms.join(', ') : '—') },
  // Tags aren't mappable (no dropdown for them) but come free from the Anki note's own tags — still worth showing.
  { label: 'Tags', width: 150, cell: (p) => (p.tags.length > 0 ? p.tags.join(', ') : '—') },
  { label: 'Status', width: 100, cell: (p) => p.status },
  { label: 'Issues', width: 260, cell: (p) => (p.errors.length > 0 ? p.errors.join(' ') : '—') },
]
const SELECT_COLUMN_WIDTH = 48
const SAMPLE_COLUMN_WIDTH = 160

type Step = 'pick' | 'map' | 'preview' | 'importing' | 'done'

/**
 * Anki `.apkg` import. Field mapping is positional and shared across every
 * note in the collection — Anki mixes note types (Basic, Cloze, …) with
 * different field counts, but a single word/meaning/example-by-index
 * mapping still works: a note whose mapped index doesn't exist just yields
 * an empty field, caught by the same required-field validation CSV import
 * uses. Cloze note syntax ({{c1::...}}) is imported as raw text, not
 * decoded — reported honestly in the preview, not silently mangled.
 */
export default function ApkgImportScreen(): JSX.Element {
  const { db } = useServices()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const params = useLocalSearchParams<{ deckId?: string }>()

  const [step, setStep] = useState<Step>('pick')
  const [fileName, setFileName] = useState('')
  const [notes, setNotes] = useState<AnkiNote[]>([])
  const [decks, setDecks] = useState<AnkiDeckInfo[]>([])
  const [noteTypes, setNoteTypes] = useState<AnkiNoteType[]>([])
  const [mapping, setMapping] = useState<ApkgFieldMapping>({})
  const [deckId, setDeckId] = useState<string | null>(params.deckId ?? null)
  const [newDeckOpen, setNewDeckOpen] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  const [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>('skip')
  const [previews, setPreviews] = useState<ApkgRowPreview[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [pickError, setPickError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [result, setResult] = useState<{ imported: number; skipped: number; failed: number; cancelled: boolean } | null>(
    null,
  )
  const cancelRequested = useRef(false)

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

  const maxFieldCount = Math.max(1, ...notes.map((n) => n.fields.length))
  // Real field names ("German", "Example", …) from whichever note type has
  // the most notes in this collection, so the chips below aren't just
  // "Field 1"/"Field 2" — other note types may have different fields, but
  // the mapping still applies by index to every note (see the screen doc
  // comment), so this is a labeling aid, not a per-note-type system.
  const dominantType = dominantNoteType(notes, noteTypes)
  // Bounded to the dominant note type's own field count, not the max across
  // every note type in the collection — a collection mixing e.g. a 3-field
  // Cloze type with a 7-field Image Occlusion type would otherwise show
  // "Field 4".."Field 7" chips that are empty on nearly every row and just
  // confuse the mapping step. Falls back to the raw max if no note-type
  // metadata was readable at all (rare — see readAnkiCollection).
  const fieldCount = dominantType ? Math.max(1, dominantType.fieldNames.length) : maxFieldCount
  const fieldIndices = Array.from({ length: fieldCount }, (_, i) => i)
  const fieldChipLabel = (index: number): string => {
    const name = dominantType?.fieldNames[index]
    return name && name.length > 0 ? name : t('Field {{n}}', { n: index + 1 })
  }

  // A word field is no longer strictly required — a Cloze note can map only
  // Example, and word/meaning get derived from the cloze markup. But
  // *something* has to be mapped, or every row is empty.
  const canBuildPreview = deckId !== null && (mapping.word !== undefined || mapping.example !== undefined)

  const handlePickFile = (): void => {
    setPickError(null)
    log.info('import.apkg_file_picker_opened', { message: 'User opened the .apkg file picker' })
    pickAndParseApkgFile()
      .then((picked) => {
        if (!picked) return
        if (picked.notes.length === 0) {
          setPickError(t('This collection has no notes to import.'))
          return
        }
        setFileName(picked.fileName)
        setNotes(picked.notes)
        setDecks(picked.decks)
        setNoteTypes(picked.noteTypes)
        setMapping({})
        setStep('map')
      })
      .catch((error: unknown) => {
        log.error('import.apkg_file_pick_failed', error, { message: '.apkg file picking or parsing failed' })
        setPickError(String(error))
      })
  }

  const setField = (fieldName: ApkgField, index: number | null): void => {
    setMapping((prev) => {
      const next = { ...prev }
      if (index === null) delete next[fieldName]
      else next[fieldName] = index
      return next
    })
  }

  const handleBuildPreview = (): void => {
    if (!deckId) return
    setPreviewLoading(true)
    log.info('import.apkg_preview_started', { message: 'Building Anki import preview' })
    buildApkgImportPreview(db, notes, { mapping, language: 'de' })
      .then((built) => {
        setPreviews(built)
        // Checked by default: importable rows, and duplicates too (the
        // chosen duplicate-handling policy decides what happens to them —
        // unchecking is how you opt a specific row out). Rows with real
        // errors (missing word/meaning) start unchecked since there's
        // nothing valid to import yet.
        setCheckedIds(new Set(built.filter((p) => p.status !== 'error').map((p) => p.noteId)))
        setStep('preview')
      })
      .catch((error: unknown) => {
        log.error('import.apkg_preview_failed', error, { message: 'Building Anki import preview failed' })
        Alert.alert(t('Could not read this collection'), String(error))
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
        (p) => checkedIds.has(p.noteId) && (p.status === 'ok' || (p.status === 'duplicate' && duplicatePolicy !== 'skip')),
      ).length,
    [previews, checkedIds, duplicatePolicy],
  )

  const checkedCount = useMemo(
    () => previews.filter((p) => checkedIds.has(p.noteId)).length,
    [previews, checkedIds],
  )

  const toggleChecked = (noteId: number): void => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(noteId)) next.delete(noteId)
      else next.add(noteId)
      return next
    })
  }

  const allVisibleChecked = previews.length > 0 && previews.every((p) => checkedIds.has(p.noteId))
  const toggleSelectAll = (): void => {
    setCheckedIds(allVisibleChecked ? new Set() : new Set(previews.map((p) => p.noteId)))
  }

  const handleConfirmImport = (): void => {
    if (!deckId) return
    const toImport = previews.filter((p) => checkedIds.has(p.noteId))
    cancelRequested.current = false
    setProgress({ done: 0, total: toImport.length })
    setStep('importing')
    log.info('import.apkg_import_confirmed', {
      message: 'User confirmed Anki import',
      metadata: { itemCount: toImport.length },
    })
    importApkgNotes(db, toImport, deckId, 'de', {
      onProgress: (done, total) => setProgress({ done, total }),
      shouldCancel: () => cancelRequested.current,
      duplicatePolicy,
    })
      .then(async (outcome) => {
        setResult(outcome)
        setStep('done')
        await queryClient.invalidateQueries()
      })
      .catch((error: unknown) => {
        log.error('import.apkg_import_failed', error, { message: 'Anki import failed' })
        Alert.alert(t('Import failed'), String(error))
        setStep('preview')
      })
  }

  const handleStartOver = (): void => {
    setStep('pick')
    setFileName('')
    setNotes([])
    setDecks([])
    setNoteTypes([])
    setMapping({})
    setPreviews([])
    setCheckedIds(new Set())
    setResult(null)
    setProgress(null)
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
              keyExtractor={(preview) => String(preview.noteId)}
              windowSize={7}
              maxToRenderPerBatch={20}
              initialNumToRender={20}
              removeClippedSubviews
              renderItem={({ item: preview, index: rowIndex }) => {
                const checked = checkedIds.has(preview.noteId)
                return (
                  <View style={[styles.tableRow, rowIndex % 2 === 1 ? styles.tableRowAlt : null]}>
                    <Pressable
                      style={[styles.tableCheckboxCell, { width: SELECT_COLUMN_WIDTH }]}
                      onPress={() => toggleChecked(preview.noteId)}
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
          <Text style={styles.title}>{t('Import from Anki')}</Text>
          <Text style={styles.body}>
            {t("Choose a `.apkg` export. Review history isn't imported — every card starts fresh — and media (audio/images) is stripped rather than copied.")}
          </Text>
          <Button label={t('Choose .apkg file')} icon="folder-open" onPress={handlePickFile} />
          {pickError ? <Text style={styles.errorText}>{pickError}</Text> : null}
        </Card>
      ) : null}

      {step === 'map' ? (
        <>
          <Card style={styles.card}>
            <Text style={styles.title}>{fileName}</Text>
            <Text style={styles.body}>
              {t('{{notes}} notes across {{decks}} decks. Map each field below — it applies to every note, so a note type without that many fields just leaves it empty.', {
                notes: notes.length.toLocaleString(),
                decks: Math.max(decks.length, 1),
              })}
            </Text>
          </Card>

          <Card style={[styles.card, styles.samplePreviewCard]}>
            <Text style={styles.fieldLabel}>{t('Sample data')}</Text>
            <Text style={styles.hint}>{t('The first few notes, so you can see what each field actually holds.')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <View style={styles.tableHeaderRow}>
                  {fieldIndices.map((index) => (
                    <Text key={index} style={[styles.sampleHeaderCell, { width: SAMPLE_COLUMN_WIDTH }]}>
                      {fieldChipLabel(index)}
                    </Text>
                  ))}
                </View>
                {notes.slice(0, 4).map((note, rowIndex) => (
                  <View key={note.id} style={[styles.tableRow, rowIndex % 2 === 1 ? styles.tableRowAlt : null]}>
                    {fieldIndices.map((index) => (
                      <Text
                        key={index}
                        style={[styles.sampleCell, { width: SAMPLE_COLUMN_WIDTH }]}
                        numberOfLines={2}
                      >
                        {stripAnkiHtml(note.fields[index] ?? '') || '—'}
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
              {t("Everything is optional. Leave Word/Meaning unmapped for Cloze notes — they're derived from the example's cloze markup and its translation.")}
            </Text>
            {ALL_FIELDS.map((fieldName) => (
              <View key={fieldName} style={styles.mappingRow}>
                <Text style={styles.mappingLabel}>{fieldName === 'cloze' ? FIELD_LABELS[fieldName] : t(FIELD_LABELS[fieldName])}</Text>
                <Dropdown
                  label={fieldName === 'cloze' ? FIELD_LABELS[fieldName] : t(FIELD_LABELS[fieldName])}
                  placeholder={t('None')}
                  clearable
                  value={mapping[fieldName] !== undefined ? String(mapping[fieldName]) : null}
                  onChange={(v) => setField(fieldName, v === null ? null : Number(v))}
                  options={fieldIndices.map((index) => ({ label: fieldChipLabel(index), value: String(index) }))}
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

      {step === 'importing' && progress ? (
        <Card style={styles.card}>
          <Text style={styles.title}>{t('Importing…')}</Text>
          <Text style={styles.body}>
            {t('{{done}} of {{total}} notes', { done: progress.done.toLocaleString(), total: progress.total.toLocaleString() })}
          </Text>
          <ProgressBar progress={progress.total > 0 ? progress.done / progress.total : 0} />
          <Button
            label={t('Cancel')}
            variant="ghost"
            onPress={() => {
              cancelRequested.current = true
            }}
          />
        </Card>
      ) : null}

      {step === 'done' && result ? (
        <Card style={styles.card}>
          <EmptyState
            icon="checkmark-circle"
            title={result.cancelled ? t('Import canceled') : t('Import complete')}
            message={`${t('Imported {{count}} words.', { count: result.imported.toLocaleString() })}${result.cancelled ? ` ${t('The rest were left untouched — you can import the same file again to pick up where you left off (already-imported words are skipped as duplicates).')}` : ''}`}
          />
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

const STATUS_COLOR: Record<ApkgRowPreview['status'], string> = {
  ok: colors.success,
  duplicate: colors.warning,
  error: colors.danger,
}

/** Colors the Status cell by row status, and the Issues cell red when non-empty. */
function statusCellStyle(preview: ApkgRowPreview, columnLabel: string): TextStyle | undefined {
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
