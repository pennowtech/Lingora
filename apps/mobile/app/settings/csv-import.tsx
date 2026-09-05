import type { CsvColumnMapping, CsvField, CsvRowPreview, DuplicatePolicy } from '@lingora/database'
import type { QuestionType } from '@lingora/types'
import { buildCsvImportPreview, createDeck, getDeckById, getDecksForLemma, importCsvRows, parseCsv } from '@lingora/database'
import { logger } from '@lingora/observability'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { File } from 'expo-file-system'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { DeckPickerModal } from '../../components/DeckPickerModal'
import { Icon } from '../../components/Icon'
import { AlertModal, Button, Card, Chip, Dropdown, EmptyState, Spinner } from '../../components/ui'
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
// Part of speech, CEFR level, and tags are deliberately not mappable —
// every import gets the same fallback part of speech/CEFR level and no
// tags (see FALLBACK_PART_OF_SPEECH/FALLBACK_CEFR_LEVEL in csv-import.ts).
//
// Which fields show up depends on the card-type choice above the mapping list: a "Regular" import
// has no use for a Cloze sentence column (that row's cloze markup, if any, is ignored — see
// importRow's cardType handling), and a "Cloze" import has no use for a plain Example column (its
// example content, if any, is ignored the same way) — so only the fields that choice actually
// consumes are offered, instead of a fixed list where half the rows silently do nothing.
const FIELDS_BY_CARD_TYPE: Record<'basic' | 'cloze', CsvField[]> = {
  basic: ['word', 'meaning', 'example', 'exampleTranslation', 'synonyms'],
  cloze: ['word', 'meaning', 'cloze', 'exampleTranslation', 'synonyms'],
}
// A Regular row has nothing to fall back to for word/meaning; a Cloze row derives them from the
// cloze markup/translation if left unmapped (see resolveWordAndMeaning in import-shared.ts), but
// still needs the markup itself mapped somewhere. Drives both canBuildPreview and the "*" marker
// on the field mapping list below.
const REQUIRED_FIELDS_BY_CARD_TYPE: Record<'basic' | 'cloze', CsvField[]> = {
  basic: ['word', 'meaning'],
  cloze: ['cloze'],
}

// 'merge' is still a supported DuplicatePolicy value in the database layer, but not offered here
// — each preview row already has its own checkbox, so unchecking a same-word row (see the
// "matching word" row highlight below) is the merge-equivalent decision, made per-row instead of
// as one blanket policy for the whole file.
const DUPLICATE_POLICIES: { value: DuplicatePolicy; label: string; hint: string }[] = [
  { value: 'skip', label: 'Skip', hint: "Don't touch the existing word." },
  { value: 'duplicate', label: 'Keep both', hint: 'Add a second, separate card for the same word.' },
]

const STATUS_COLOR: Record<CsvRowPreview['status'], string> = {
  ok: colors.success,
  duplicate: colors.warning,
  error: colors.danger,
}

// Word/Meaning always show (every row ends up with real content there, mapped directly or
// derived from cloze markup — see resolveWordAndMeaning). A column for a field that was never
// mapped at all would just be "—" on every single row — dead weight — so Cloze/Example/Example
// translation/Synonyms only appear when their column was actually mapped. "Existing deck" (needs
// the existingDeckNames lookup — see handleBuildPreview) and Status/Issues aren't field-mapping
// columns at all (computed/diagnostic), so they're unconditional.
function buildTableColumns(
  existingDeckNames: Map<string, string[]>,
  mapping: CsvColumnMapping,
): DataTableColumn<CsvRowPreview>[] {
  return [
    { label: 'Word', width: 140, cell: (p) => p.word || '(empty)' },
    { label: 'Meaning', width: 140, cell: (p) => p.meaning || '-' },
    ...(mapping.cloze !== undefined
      ? [{ label: 'Cloze', width: 220, cell: (p: CsvRowPreview) => p.cloze ?? '-' }]
      : []),
    ...(mapping.example !== undefined
      ? [{ label: 'Example', width: 220, cell: (p: CsvRowPreview) => p.example ?? '-' }]
      : []),
    ...(mapping.exampleTranslation !== undefined
      ? [{ label: 'Example translation', width: 220, cell: (p: CsvRowPreview) => p.exampleTranslation ?? '-' }]
      : []),
    ...(mapping.synonyms !== undefined
      ? [
          {
            label: 'Synonyms',
            width: 160,
            cell: (p: CsvRowPreview) => (p.synonyms.length > 0 ? p.synonyms.join(', ') : '-'),
          },
        ]
      : []),
    {
      label: 'Existing deck',
      width: 160,
      cell: (p) => (p.existingLemmaId ? (existingDeckNames.get(p.existingLemmaId)?.join(', ') ?? '-') : '-'),
    },
    {
      label: 'Status',
      width: 100,
      cell: (p) => p.status,
      cellStyle: (p) => ({ color: STATUS_COLOR[p.status], fontWeight: '700' }),
    },
    {
      label: 'Issues',
      width: 260,
      cell: (p) => (p.errors.length > 0 ? p.errors.join(' ') : '-'),
      cellStyle: (p) => (p.errors.length > 0 ? { color: colors.danger } : undefined),
    },
  ]
}
const SAMPLE_COLUMN_WIDTH = 160

type Step = 'pick' | 'map' | 'preview'

/**
 * CSV import with interactive column mapping. Parsing, validation, and the
 * transactional insert all live in @lingora/database#csv-import — this
 * screen is just the picker → map → preview → confirm wizard around it.
 */
export default function CsvImportScreen(): JSX.Element {
  const { db, targetLanguage, nativeLanguage } = useServices()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const params = useLocalSearchParams<{ deckId?: string }>()

  const [step, setStep] = useState<Step>('pick')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<CsvColumnMapping>({})
  const [deckId, setDeckId] = useState<string | null>(params.deckId ?? null)
  const [deckName, setDeckName] = useState<string | null>(null)
  // Drives deckModeWarning below - null until a deck is actually known (route param fetch, picker
  // selection, or a just-created deck), not just "no types enabled" (which can't happen for a real
  // deck anyway).
  const [deckQuestionTypes, setDeckQuestionTypes] = useState<QuestionType[] | null>(null)
  const [deckPickerOpen, setDeckPickerOpen] = useState(false)
  const [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>('skip')
  const [cardType, setCardType] = useState<'basic' | 'cloze'>('basic')
  const [previews, setPreviews] = useState<CsvRowPreview[]>([])
  const [existingDeckNames, setExistingDeckNames] = useState<Map<string, string[]>>(new Map())
  const [checkedIndexes, setCheckedIndexes] = useState<Set<number>>(new Set())
  const [pickError, setPickError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; failed: number } | null>(null)
  const [importing, setImporting] = useState(false)
  const [errorNotice, setErrorNotice] = useState<{ title: string; message: string } | null>(null)
  const showError = (title: string, error: unknown): void => setErrorNotice({ title, message: String(error) })

  const createNewDeck = useMutation({
    mutationFn: async ({ name, questionTypes }: { name: string; questionTypes: QuestionType[] }) => {
      const trimmed = name.trim()
      if (trimmed === '') throw new Error(t('Give the deck a name.'))
      const id = crypto.randomUUID()
      const now = Date.now()
      await createDeck(db, {
        id,
        name: trimmed,
        enabledQuestionTypes: questionTypes,
        targetLanguage,
        nativeLanguage,
        createdAt: now,
        updatedAt: now,
      })
      return { id, name: trimmed, questionTypes }
    },
    onSuccess: async ({ id, name, questionTypes }) => {
      setDeckId(id)
      setDeckName(name)
      setDeckQuestionTypes(questionTypes)
      setDeckPickerOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['decks'] })
      await queryClient.invalidateQueries({ queryKey: ['deck-counts'] })
    },
  })

  // Whether the chosen cardType's content will actually be exercised by this deck's own review
  // modes - see the equivalent comment/design note in apkg-import.tsx (both screens share the same
  // cardType/deck-mismatch concern). Nothing breaks either way (pickEligibleTypes falls back to
  // 'vocab' for a card ineligible for every enabled type), so this is a heads-up, not a block.
  const deckModeWarning = useMemo(() => {
    if (!deckQuestionTypes || deckQuestionTypes.length === 0) return null
    if (cardType === 'cloze' && !deckQuestionTypes.includes('cloze')) {
      return t(
        "This deck's review modes don't include Cloze. These cards will still work, but will be tested as regular vocabulary instead of fill-in-the-blank.",
      )
    }
    if (cardType === 'basic' && deckQuestionTypes.every((qt) => qt === 'cloze')) {
      return t(
        "This deck's review mode is Cloze only, but these cards have no fill-in-the-blank content. They will be tested as regular vocabulary instead.",
      )
    }
    return null
  }, [cardType, deckQuestionTypes, t])

  // Required fields depend on which card type is being imported — a Regular import needs a real
  // Word and Meaning column (there's nothing to derive them from), while a Cloze import needs the
  // Cloze sentence column instead (word/meaning are optionally derived from its markup/
  // translation — see resolveWordAndMeaning in import-shared.ts).
  const canBuildPreview =
    deckId !== null &&
    (cardType === 'basic'
      ? mapping.word !== undefined && mapping.meaning !== undefined
      : mapping.cloze !== undefined)

  const handlePickFile = (): void => {
    setPickError(null)
    log.info('import.csv_file_picker_opened', { message: 'User opened the CSV file picker' })
    File.pickFileAsync({ mimeTypes: ['text/csv', 'text/comma-separated-values', 'text/plain', 'text/tab-separated-values'] })
      .then(async (picked) => {
        if (picked.canceled) {
          // Nothing to show for this screen without a file — go back rather than leaving the user
          // stranded on a near-empty "pick" step they never meant to see in the first place.
          router.back()
          return
        }
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

  // Opens the file browser immediately on landing here, instead of making the user tap a second
  // "Choose CSV file" button first — the Settings screen's own .csv option should feel like it
  // goes straight to the file browser. The button stays visible as a manual retry if the picker
  // is dismissed/canceled. Guarded by a ref (not state) so React's dev-mode double-invoke of
  // effects can't open the picker twice.
  const autoPicked = useRef(false)
  useEffect(() => {
    if (autoPicked.current) return
    autoPicked.current = true
    handlePickFile()
  }, [])

  // Reached with a deckId already in the route params (the deck detail screen's "Import into
  // this deck" menu) — the id alone isn't enough to show a deck name (or its review modes, for
  // deckModeWarning above), so fetch it once.
  useEffect(() => {
    if (!params.deckId) return
    void getDeckById(db, params.deckId).then((deck) => {
      if (deck) {
        setDeckName(deck.name)
        setDeckQuestionTypes(deck.enabledQuestionTypes ?? null)
      }
    })
  }, [params.deckId, db])

  // The header's native back button otherwise pops this whole screen off the stack regardless of
  // wizard step — jarring from 'preview' (loses the mapping/preview work, not just one step). Stepping
  // the wizard backward here instead makes it behave like the (now-removed) in-screen "Back"
  // buttons used to: one step at a time, only really leaving on 'pick'. Blocked outright during
  // 'importing' so a mid-write navigation can't happen. Once `result` is set (the import-complete
  // popup's "OK" button also just calls router.back()), this has to get out of the way and let the
  // navigation through — otherwise "OK" would bounce the user back to 'map' instead of leaving.
  const navigation = useNavigation()
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (importing) {
        e.preventDefault()
        return
      }
      if (step === 'pick' || result !== null) return
      e.preventDefault()
      if (step === 'preview') setStep('map')
      else if (step === 'map') handleStartOver()
    })
    return unsubscribe
  }, [navigation, step, result, importing])

  const setField = (field: CsvField, columnIndex: number | null): void => {
    setMapping((prev) => {
      const next = { ...prev }
      if (columnIndex === null) delete next[field]
      else next[field] = columnIndex
      return next
    })
  }

  // Switching card type changes which fields are offered (see FIELDS_BY_CARD_TYPE) — drop whatever
  // mapping the newly-hidden field had, so a stale mapping from the other mode can't linger unseen.
  const handleSetCardType = (next: 'basic' | 'cloze'): void => {
    setCardType(next)
    setMapping((prev) => {
      const nextMapping = { ...prev }
      delete nextMapping[next === 'basic' ? 'cloze' : 'example']
      return nextMapping
    })
  }

  const handleBuildPreview = (): void => {
    if (!deckId) return
    setPreviewLoading(true)
    log.info('import.csv_preview_started', { message: 'Building CSV import preview' })
    buildCsvImportPreview(db, rows, { mapping, language: targetLanguage, cardType })
      .then(async (built) => {
        setPreviews(built)
        // Checked by default: importable rows, and duplicates too (the
        // chosen duplicate-handling policy decides what happens to them —
        // unchecking is how you opt a specific row out). Rows with real
        // errors (missing word/meaning) start unchecked since there's
        // nothing valid to import yet.
        setCheckedIndexes(new Set(built.filter((p) => p.status !== 'error').map((p) => p.rowIndex)))

        // Which deck(s) already have a duplicate row's word — shown as its own preview column so
        // skip vs. keep-both is an informed choice, not a guess.
        const lemmaIds = [...new Set(built.map((p) => p.existingLemmaId).filter((id) => id !== null))]
        const decksByLemma = await Promise.all(lemmaIds.map((id) => getDecksForLemma(db, id)))
        setExistingDeckNames(new Map(lemmaIds.map((id, i) => [id, decksByLemma[i]!.map((d) => d.name)])))

        setStep('preview')
      })
      .catch((error: unknown) => {
        log.error('import.csv_preview_failed', error, { message: 'Building CSV import preview failed' })
        showError(t('Could not read this file'), error)
      })
      .finally(() => setPreviewLoading(false))
  }

  const counts = useMemo(() => {
    const duplicate = previews.filter((p) => p.status === 'duplicate').length
    const error = previews.filter((p) => p.status === 'error').length
    return { duplicate, error }
  }, [previews])

  // Rows sharing a word with another row in THIS file, not just a word already in the library —
  // buildCsvImportPreview only checks each row against the database, so two same-word rows
  // within one file both come back status 'ok' with nothing visually distinguishing them, even
  // though only the first actually lands as a plain new card (importRow re-checks live,
  // in-transaction state — see its doc comment — so the second follows duplicatePolicy same as
  // a real pre-existing duplicate would). Highlighting them here is what makes that visible
  // before import, not after.
  const sameWordRowIndexes = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of previews) {
      if (!p.word) continue
      const key = p.word.toLowerCase()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    const indexes = new Set<number>()
    for (const p of previews) {
      if (p.word && (counts.get(p.word.toLowerCase()) ?? 0) > 1) indexes.add(p.rowIndex)
    }
    return indexes
  }, [previews])

  const tableColumns = useMemo(() => buildTableColumns(existingDeckNames, mapping), [existingDeckNames, mapping])

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
    setImporting(true)
    log.info('import.csv_import_confirmed', {
      message: 'User confirmed CSV import',
      metadata: { itemCount: toImport.length },
    })
    importCsvRows(db, toImport, deckId, targetLanguage, nativeLanguage, duplicatePolicy, cardType)
      .then(async (outcome) => {
        setResult(outcome)
        await queryClient.invalidateQueries()
      })
      .catch((error: unknown) => {
        log.error('import.csv_import_failed', error, { message: 'CSV import failed' })
        showError(t('Import failed'), error)
      })
      .finally(() => setImporting(false))
  }

  const handleStartOver = (): void => {
    setStep('pick')
    setFileName('')
    setHeaders([])
    setRows([])
    setMapping({})
    setPreviews([])
    setExistingDeckNames(new Map())
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

          <Card style={styles.card}>
            <Text style={styles.fieldLabel}>{t('If the word already exists')}</Text>
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
        </View>

        <DataTable
          columns={tableColumns}
          data={previews}
          keyExtractor={(preview) => String(preview.rowIndex)}
          showRowNumber
          rowStyle={(preview) => (sameWordRowIndexes.has(preview.rowIndex) ? styles.sameWordRow : undefined)}
          selection={{
            isSelected: (preview) => checkedIndexes.has(preview.rowIndex),
            onToggle: (preview) => toggleChecked(preview.rowIndex),
            allSelected: allVisibleChecked,
            onToggleAll: toggleSelectAll,
          }}
        />

        <View style={styles.actions}>
          <Button
            label={t('Import {{count}} rows', { count: willImportCount.toLocaleString() })}
            onPress={handleConfirmImport}
            disabled={checkedCount === 0}
          />
        </View>

        {/* ── One popup covers both "importing" and "done" — no second modal/screen, just this
            one's content swapping from progress to result once `result` is set ── */}
        <Modal
          visible={importing || result !== null}
          animationType="fade"
          transparent
          onRequestClose={() => (result !== null ? router.back() : undefined)}
        >
          <View style={styles.centerModalContainer}>
            <View style={styles.centerModalCard}>
              {result === null ? (
                <Spinner message={t('Importing...')} />
              ) : (
                <>
                  <EmptyState
                    icon="CircleCheck"
                    title={t('Import complete')}
                    message={t('Imported {{count}} words.', { count: result.imported.toLocaleString() })}
                  />
                  <View style={styles.summaryRow}>
                    <SummaryStat label={t('Imported')} value={result.imported} color={colors.success} />
                    <SummaryStat label={t('Skipped')} value={result.skipped} color={colors.warning} />
                    <SummaryStat label={t('Failed')} value={result.failed} color={colors.danger} />
                  </View>
                  <Button label={t('OK')} onPress={() => router.back()} />
                </>
              )}
            </View>
          </View>
        </Modal>

        <AlertModal
          visible={errorNotice !== null}
          title={errorNotice?.title ?? ''}
          message={errorNotice?.message ?? ''}
          onClose={() => setErrorNotice(null)}
        />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {step === 'pick' ? (
        pickError !== null ? (
          <Card style={styles.card}>
            <Text style={styles.title}>{t('Import from CSV')}</Text>
            <Text style={styles.body}>
              {t("From Quizlet, Memrise, or a spreadsheet export. You'll choose which column means what next.")}
            </Text>
            <Button label={t('Choose CSV file')} icon="FolderOpen" onPress={handlePickFile} />
            <Text style={styles.errorText}>{pickError}</Text>
          </Card>
        ) : (
          <View style={styles.pickLoading}>
            <Spinner />
          </View>
        )
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
                        {row[index] && row[index].length > 0 ? row[index] : '-'}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.fieldLabel}>{t('What are you importing?')}</Text>
            <Text style={styles.hint}>
              {t('Each row becomes ONE card, never two. Want both a regular and a cloze card from the same file? Import it again afterward with the other option selected.')}
            </Text>
            <View style={styles.chipRow}>
              <Chip label={t('Regular (word/meaning)')} selected={cardType === 'basic'} onPress={() => handleSetCardType('basic')} />
              <Chip label={t('Cloze (fill-in-the-blank)')} selected={cardType === 'cloze'} onPress={() => handleSetCardType('cloze')} />
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.fieldLabel}>{t('Field mapping')}</Text>
            <Text style={styles.hint}>
              {cardType === 'basic'
                ? t('Word and Meaning are required. Everything else is optional.')
                : t('Cloze sentence is required - it must contain {{c1::word}} markup. Everything else is optional.')}
            </Text>
            {FIELDS_BY_CARD_TYPE[cardType].map((field) => (
              <View key={field} style={styles.mappingRow}>
                <Text style={styles.mappingLabel}>
                  {field === 'cloze' ? FIELD_LABELS[field] : t(FIELD_LABELS[field])}
                  {REQUIRED_FIELDS_BY_CARD_TYPE[cardType].includes(field) ? ' *' : ''}
                </Text>
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
            <Text style={styles.fieldLabel}>{t('Add to deck')}</Text>
            <Button
              label={deckName ?? t('Choose a deck')}
              icon="Layers"
              variant="secondary"
              onPress={() => setDeckPickerOpen(true)}
            />
            {deckModeWarning ? (
              <View style={styles.warningBanner}>
                <Icon name="CircleAlert" size={16} color={colors.warning} />
                <Text style={styles.warningText}>{deckModeWarning}</Text>
              </View>
            ) : null}
          </Card>

          <View style={styles.actions}>
            <Button
              label={previewLoading ? t('Checking...') : t('Preview import')}
              onPress={handleBuildPreview}
              disabled={!canBuildPreview || previewLoading}
            />
          </View>
        </>
      ) : null}

      <DeckPickerModal
        db={db}
        visible={deckPickerOpen}
        onClose={() => setDeckPickerOpen(false)}
        title={t('Add to deck')}
        targetLanguage={targetLanguage}
        nativeLanguage={nativeLanguage}
        onSelectDeck={(deck) => {
          setDeckId(deck.id)
          setDeckName(deck.name)
          setDeckQuestionTypes(deck.enabledQuestionTypes ?? null)
          setDeckPickerOpen(false)
        }}
        onCreateDeck={(name, questionTypes) => createNewDeck.mutate({ name, questionTypes })}
        creating={createNewDeck.isPending}
        {...(createNewDeck.isError && { createError: String(createNewDeck.error) })}
      />

      <AlertModal
        visible={errorNotice !== null}
        title={errorNotice?.title ?? ''}
        message={errorNotice?.message ?? ''}
        onClose={() => setErrorNotice(null)}
      />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  pickLoading: { alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl },
  card: { gap: spacing.sm, marginBottom: spacing.sm },
  title: { fontSize: type.subheading, fontWeight: '700', color: colors.text },
  body: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
  fieldLabel: { fontSize: type.body, fontWeight: '700', color: colors.text },
  hint: { fontSize: type.micro, color: colors.textMuted },
  errorText: { fontSize: type.caption, color: colors.danger },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  warningText: { flex: 1, fontSize: type.caption, color: colors.text },
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
  sameWordRow: { backgroundColor: colors.warningSoft },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  tableRowAlt: { backgroundColor: colors.surfaceMuted },
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
  centerModalContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: '#00000066' },
  centerModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
})
