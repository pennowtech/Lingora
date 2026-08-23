import type { ApkgField, ApkgFieldMapping, ApkgRowPreview, DuplicatePolicy } from '@lingora/database'
import {
  buildApkgImportPreview,
  createDeck,
  dominantNoteType,
  getDeckById,
  getDecksForLemma,
  importApkgNotes,
  stripAnkiHtml,
} from '@lingora/database'
import type { AnkiDeckInfo, AnkiNote, AnkiNoteType } from '@lingora/database'
import { logger } from '@lingora/observability'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { DeckPickerModal } from '../../components/DeckPickerModal'
import { AlertModal, Button, Card, Chip, Dropdown, EmptyState, ProgressBar } from '../../components/ui'
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
//
// Which fields show up depends on the card-type choice above the mapping list — see
// FIELDS_BY_CARD_TYPE's doc comment in csv-import.tsx, the same reasoning applies here.
const FIELDS_BY_CARD_TYPE: Record<'basic' | 'cloze', ApkgField[]> = {
  basic: ['word', 'meaning', 'example', 'exampleTranslation', 'synonyms'],
  cloze: ['word', 'meaning', 'cloze', 'exampleTranslation', 'synonyms'],
}
// See REQUIRED_FIELDS_BY_CARD_TYPE's doc comment in csv-import.tsx, the same reasoning applies here.
const REQUIRED_FIELDS_BY_CARD_TYPE: Record<'basic' | 'cloze', ApkgField[]> = {
  basic: ['word', 'meaning'],
  cloze: ['cloze'],
}

// 'merge' is still a supported DuplicatePolicy value in the database layer, but not offered here
// — see the same note in csv-import.tsx's DUPLICATE_POLICIES.
const DUPLICATE_POLICIES: { value: DuplicatePolicy; label: string; hint: string }[] = [
  { value: 'skip', label: 'Skip', hint: "Don't touch the existing word." },
  { value: 'duplicate', label: 'Keep both', hint: 'Add a second, separate card for the same word.' },
]

const STATUS_COLOR: Record<ApkgRowPreview['status'], string> = {
  ok: colors.success,
  duplicate: colors.warning,
  error: colors.danger,
}

// See buildTableColumns's doc comment in csv-import.tsx for the always-shown-vs-mapped-only
// reasoning. Tags aren't mappable (no dropdown for them) but come free from the Anki note's own
// tags — like Existing deck/Status/Issues, not a field-mapping column, so unconditional too.
function buildTableColumns(
  existingDeckNames: Map<string, string[]>,
  mapping: ApkgFieldMapping,
): DataTableColumn<ApkgRowPreview>[] {
  return [
    { label: 'Word', width: 140, cell: (p) => p.word || '(empty)' },
    { label: 'Meaning', width: 140, cell: (p) => p.meaning || '-' },
    ...(mapping.cloze !== undefined
      ? [{ label: 'Cloze', width: 220, cell: (p: ApkgRowPreview) => p.cloze ?? '-' }]
      : []),
    ...(mapping.example !== undefined
      ? [{ label: 'Example', width: 220, cell: (p: ApkgRowPreview) => p.example ?? '-' }]
      : []),
    ...(mapping.exampleTranslation !== undefined
      ? [{ label: 'Example translation', width: 220, cell: (p: ApkgRowPreview) => p.exampleTranslation ?? '-' }]
      : []),
    ...(mapping.synonyms !== undefined
      ? [
          {
            label: 'Synonyms',
            width: 160,
            cell: (p: ApkgRowPreview) => (p.synonyms.length > 0 ? p.synonyms.join(', ') : '-'),
          },
        ]
      : []),
    { label: 'Tags', width: 150, cell: (p) => (p.tags.length > 0 ? p.tags.join(', ') : '-') },
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
 * Anki `.apkg` import. Field mapping is positional and shared across every
 * note in the collection — Anki mixes note types (Basic, Cloze, …) with
 * different field counts, but a single word/meaning/example-by-index
 * mapping still works: a note whose mapped index doesn't exist just yields
 * an empty field, caught by the same required-field validation CSV import
 * uses. Cloze note syntax ({{c1::...}}) is imported as raw text, not
 * decoded — reported honestly in the preview, not silently mangled.
 */
export default function ApkgImportScreen(): JSX.Element {
  const { db, targetLanguage, nativeLanguage } = useServices()
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
  const [deckName, setDeckName] = useState<string | null>(null)
  const [deckPickerOpen, setDeckPickerOpen] = useState(false)
  const [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>('skip')
  const [cardType, setCardType] = useState<'basic' | 'cloze'>('basic')
  const [previews, setPreviews] = useState<ApkgRowPreview[]>([])
  const [existingDeckNames, setExistingDeckNames] = useState<Map<string, string[]>>(new Map())
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [pickError, setPickError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [result, setResult] = useState<{ imported: number; skipped: number; failed: number; cancelled: boolean } | null>(
    null,
  )
  const cancelRequested = useRef(false)
  const [errorNotice, setErrorNotice] = useState<{ title: string; message: string } | null>(null)
  const showError = (title: string, error: unknown): void => setErrorNotice({ title, message: String(error) })

  const createNewDeck = useMutation({
    mutationFn: async (name: string) => {
      const trimmed = name.trim()
      if (trimmed === '') throw new Error(t('Give the deck a name.'))
      const id = crypto.randomUUID()
      const now = Date.now()
      await createDeck(db, { id, name: trimmed, createdAt: now, updatedAt: now })
      return { id, name: trimmed }
    },
    onSuccess: async ({ id, name }) => {
      setDeckId(id)
      setDeckName(name)
      setDeckPickerOpen(false)
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

  // See csv-import.tsx's identical canBuildPreview for why the required field depends on cardType.
  const canBuildPreview =
    deckId !== null &&
    (cardType === 'basic'
      ? mapping.word !== undefined && mapping.meaning !== undefined
      : mapping.cloze !== undefined)

  const handlePickFile = (): void => {
    setPickError(null)
    log.info('import.apkg_file_picker_opened', { message: 'User opened the .apkg file picker' })
    pickAndParseApkgFile()
      .then((picked) => {
        if (!picked) {
          // Nothing to show for this screen without a file — go back rather than leaving the user
          // stranded on a near-empty "pick" step they never meant to see in the first place.
          router.back()
          return
        }
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

  // Opens the file browser immediately on landing here — same reasoning as csv-import.tsx's
  // identical effect: the Settings screen's .apkg option should feel like it goes straight to the
  // file browser rather than requiring a second "Choose .apkg file" tap. Button stays as a manual
  // retry if the picker is dismissed/canceled.
  const autoPicked = useRef(false)
  useEffect(() => {
    if (autoPicked.current) return
    autoPicked.current = true
    handlePickFile()
  }, [])

  // Reached with a deckId already in the route params (the deck detail screen's "Import into
  // this deck" menu) — the id alone isn't enough to show a deck name, so fetch it once.
  useEffect(() => {
    if (!params.deckId) return
    void getDeckById(db, params.deckId).then((deck) => {
      if (deck) setDeckName(deck.name)
    })
  }, [params.deckId, db])

  // True for exactly as long as an import is in flight — progress is set at the start of
  // handleConfirmImport and result at the end, so this window is what drives both the popup's
  // progress-vs-result content and the back-navigation block below.
  const importing = progress !== null && result === null

  // See csv-import.tsx's identical effect for why: the native header back button otherwise pops
  // this whole screen regardless of wizard step. Blocked outright while `importing` so a mid-write
  // navigation can't happen; let through once `result` is set so the import-complete popup's "OK"
  // button (which also just calls router.back()) can actually leave.
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

  const setField = (fieldName: ApkgField, index: number | null): void => {
    setMapping((prev) => {
      const next = { ...prev }
      if (index === null) delete next[fieldName]
      else next[fieldName] = index
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
    log.info('import.apkg_preview_started', { message: 'Building Anki import preview' })
    buildApkgImportPreview(db, notes, { mapping, language: targetLanguage, cardType })
      .then(async (built) => {
        setPreviews(built)
        // Checked by default: importable rows, and duplicates too (the
        // chosen duplicate-handling policy decides what happens to them —
        // unchecking is how you opt a specific row out). Rows with real
        // errors (missing word/meaning) start unchecked since there's
        // nothing valid to import yet.
        setCheckedIds(new Set(built.filter((p) => p.status !== 'error').map((p) => p.noteId)))

        // Which deck(s) already have a duplicate row's word — see csv-import.tsx's identical block.
        const lemmaIds = [...new Set(built.map((p) => p.existingLemmaId).filter((id) => id !== null))]
        const decksByLemma = await Promise.all(lemmaIds.map((id) => getDecksForLemma(db, id)))
        setExistingDeckNames(new Map(lemmaIds.map((id, i) => [id, decksByLemma[i]!.map((d) => d.name)])))

        setStep('preview')
      })
      .catch((error: unknown) => {
        log.error('import.apkg_preview_failed', error, { message: 'Building Anki import preview failed' })
        showError(t('Could not read this collection'), error)
      })
      .finally(() => setPreviewLoading(false))
  }

  const counts = useMemo(() => {
    const duplicate = previews.filter((p) => p.status === 'duplicate').length
    const error = previews.filter((p) => p.status === 'error').length
    return { duplicate, error }
  }, [previews])

  // Rows sharing a word with another row in THIS collection, not just a word already in the
  // library — see csv-import.tsx's sameWordRowIndexes for why this needs its own pass instead of
  // relying on `status`.
  const sameWordNoteIds = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of previews) {
      if (!p.word) continue
      const key = p.word.toLowerCase()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    const ids = new Set<number>()
    for (const p of previews) {
      if (p.word && (counts.get(p.word.toLowerCase()) ?? 0) > 1) ids.add(p.noteId)
    }
    return ids
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
    log.info('import.apkg_import_confirmed', {
      message: 'User confirmed Anki import',
      metadata: { itemCount: toImport.length },
    })
    importApkgNotes(db, toImport, deckId, targetLanguage, nativeLanguage, {
      onProgress: (done, total) => setProgress({ done, total }),
      shouldCancel: () => cancelRequested.current,
      duplicatePolicy,
      cardType,
    })
      .then(async (outcome) => {
        setResult(outcome)
        await queryClient.invalidateQueries()
      })
      .catch((error: unknown) => {
        log.error('import.apkg_import_failed', error, { message: 'Anki import failed' })
        showError(t('Import failed'), error)
        // Reset progress (not just leave it stale) — `importing` derives from progress !== null &&
        // result === null, and result stays null on failure, so without this the popup would
        // stay stuck showing "Importing…" forever instead of closing back to the preview table.
        setProgress(null)
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
    setExistingDeckNames(new Map())
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
          keyExtractor={(preview) => String(preview.noteId)}
          showRowNumber
          rowStyle={(preview) => (sameWordNoteIds.has(preview.noteId) ? styles.sameWordRow : undefined)}
          selection={{
            isSelected: (preview) => checkedIds.has(preview.noteId),
            onToggle: (preview) => toggleChecked(preview.noteId),
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
                <>
                  <Text style={styles.title}>{t('Importing...')}</Text>
                  <Text style={styles.body}>
                    {t('{{done}} of {{total}} notes', {
                      done: (progress?.done ?? 0).toLocaleString(),
                      total: (progress?.total ?? 0).toLocaleString(),
                    })}
                  </Text>
                  <ProgressBar progress={progress && progress.total > 0 ? progress.done / progress.total : 0} />
                  <Button
                    label={t('Cancel')}
                    variant="ghost"
                    onPress={() => {
                      cancelRequested.current = true
                    }}
                  />
                </>
              ) : (
                <>
                  <EmptyState
                    icon="CircleCheck"
                    title={result.cancelled ? t('Import canceled') : t('Import complete')}
                    message={`${t('Imported {{count}} words.', { count: result.imported.toLocaleString() })}${result.cancelled ? ` ${t('The rest were left untouched - you can import the same file again to pick up where you left off (already-imported words are skipped as duplicates).')}` : ''}`}
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
        <Card style={styles.card}>
          <Text style={styles.title}>{t('Import from Anki')}</Text>
          <Text style={styles.body}>
            {t("Choose a `.apkg` export. Review history isn't imported - every card starts fresh - and media (audio/images) is stripped rather than copied.")}
          </Text>
          <Button label={t('Choose .apkg file')} icon="FolderOpen" onPress={handlePickFile} />
          {pickError ? <Text style={styles.errorText}>{pickError}</Text> : null}
        </Card>
      ) : null}

      {step === 'map' ? (
        <>
          <Card style={styles.card}>
            <Text style={styles.title}>{fileName}</Text>
            <Text style={styles.body}>
              {t('{{notes}} notes across {{decks}} decks. Map each field below - it applies to every note, so a note type without that many fields just leaves it empty.', {
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
                        {stripAnkiHtml(note.fields[index] ?? '') || '-'}
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
              {t('Each note becomes ONE card, never two. Want both a regular and a cloze card from the same file? Import it again afterward with the other option selected.')}
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
            {FIELDS_BY_CARD_TYPE[cardType].map((fieldName) => (
              <View key={fieldName} style={styles.mappingRow}>
                <Text style={styles.mappingLabel}>
                  {fieldName === 'cloze' ? FIELD_LABELS[fieldName] : t(FIELD_LABELS[fieldName])}
                  {REQUIRED_FIELDS_BY_CARD_TYPE[cardType].includes(fieldName) ? ' *' : ''}
                </Text>
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
            <Text style={styles.fieldLabel}>{t('Add to deck')}</Text>
            <Button
              label={deckName ?? t('Choose a deck')}
              icon="Layers"
              variant="secondary"
              onPress={() => setDeckPickerOpen(true)}
            />
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
        onSelectDeck={(deck) => {
          setDeckId(deck.id)
          setDeckName(deck.name)
          setDeckPickerOpen(false)
        }}
        onCreateDeck={(name) => createNewDeck.mutate(name)}
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
