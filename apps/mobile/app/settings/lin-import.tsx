import type { BackupPayload, LinDeckOption, LinDuplicatePolicy, LinLemmaPreview } from '@lingora/database'
import type { QuestionType } from '@lingora/types'
import { buildLinImportPreview, createDeck, getDeckById, getDecksForLemma, getDecksInPayload, importLinDeck } from '@lingora/database'
import { logger } from '@lingora/observability'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native'
import { DeckPickerModal } from '../../components/DeckPickerModal'
import { Icon } from '../../components/Icon'
import { AlertModal, Button, Card, Chip, EmptyState, Spinner } from '../../components/ui'
import { pickAndParseBackupFile } from '../../lib/backup'
import { useServices } from '../../lib/services'
import { colors, radius, spacing, type } from '../../lib/theme'

const log = logger.child({ feature: 'import', screen: 'LinImportScreen' })

const DUPLICATE_POLICIES: { value: LinDuplicatePolicy; label: string; hint: string }[] = [
  { value: 'skip', label: 'Skip', hint: "Don't touch the word already in your library." },
  { value: 'duplicate', label: 'Keep both', hint: 'Add a second, separate card for the same word.' },
]

interface TableColumn {
  label: string
  width: number
  cell: (preview: LinLemmaPreview) => string
}
// Built inside the component — "Existing deck" needs the existingDeckNames lookup, same shape as
// csv-import.tsx/apkg-import.tsx's buildTableColumns.
function buildTableColumns(existingDeckNames: Map<string, string[]>): TableColumn[] {
  return [
    { label: 'Word', width: 160, cell: (p) => p.form },
    { label: 'Meaning', width: 200, cell: (p) => p.cards[0]?.translation ?? '-' },
    { label: 'Example', width: 260, cell: (p) => p.cards[0]?.example ?? '-' },
    { label: 'Example translation', width: 220, cell: (p) => p.cards[0]?.exampleTranslation ?? '-' },
    // `join(', ')` always returns a string (never null/undefined) — `??` would never fall through
    // to the placeholder for an empty list, so `||` (empty string counts too) is deliberate here.
    /* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
    { label: 'Synonyms', width: 200, cell: (p) => p.cards[0]?.synonyms.join(', ') || '-' },
    { label: 'Cards', width: 160, cell: (p) => p.cards.map((c) => c.type).join(', ') || '-' },
    /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
    {
      label: 'Existing deck',
      width: 160,
      cell: (p) => (p.existingLemmaId ? (existingDeckNames.get(p.existingLemmaId)?.join(', ') ?? '-') : '-'),
    },
    { label: 'Status', width: 110, cell: (p) => p.status },
  ]
}
const SELECT_COLUMN_WIDTH = 48

type Step = 'pick' | 'source-deck' | 'target' | 'preview'

/**
 * Deck-scoped `.lin` **import** — the counterpart to `createDeckBackup`'s
 * export. Additive, not a restore: a word already in your library is
 * flagged 'duplicate' and handled per `LinDuplicatePolicy` ('skip' or
 * 'duplicate' — "keep both", the schema-respecting equivalent since
 * `lemmas.form` is UNIQUE, see `lin-import.ts`), exactly like CSV/Anki
 * import already does. Full fidelity otherwise: FSRS state, review
 * history, meanings/examples/synonyms/phrases/cloze variants all carry
 * over with fresh IDs.
 */
export default function LinImportScreen(): JSX.Element {
  const { db, targetLanguage } = useServices()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const params = useLocalSearchParams<{ deckId?: string }>()

  const [step, setStep] = useState<Step>('pick')
  const [fileName, setFileName] = useState('')
  const [payload, setPayload] = useState<BackupPayload | null>(null)
  const [deckOptions, setDeckOptions] = useState<LinDeckOption[]>([])
  const [sourceDeckId, setSourceDeckId] = useState<string | null>(null)
  // Pre-selected when opened from a deck's own "Import into this deck" menu
  // (`deck/[id].tsx`/`decks.tsx`, same param the CSV/Anki importers take);
  // still changeable on the target-deck step for Settings-launched imports.
  const [targetDeckId, setTargetDeckId] = useState<string | null>(params.deckId ?? null)
  const [targetDeckName, setTargetDeckName] = useState<string | null>(null)
  const [deckPickerOpen, setDeckPickerOpen] = useState(false)
  const [duplicatePolicy, setDuplicatePolicy] = useState<LinDuplicatePolicy>('skip')
  const [previews, setPreviews] = useState<LinLemmaPreview[]>([])
  const [existingDeckNames, setExistingDeckNames] = useState<Map<string, string[]>>(new Map())
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [pickError, setPickError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; cardsImported: number } | null>(null)
  const [importing, setImporting] = useState(false)
  const [errorNotice, setErrorNotice] = useState<{ title: string; message: string } | null>(null)
  const showError = (title: string, error: unknown): void => setErrorNotice({ title, message: String(error) })

  const createNewDeck = useMutation({
    mutationFn: async ({ name, questionTypes }: { name: string; questionTypes: QuestionType[] }) => {
      const trimmed = name.trim()
      if (trimmed === '') throw new Error(t('Give the deck a name.'))
      const id = crypto.randomUUID()
      const now = Date.now()
      await createDeck(db, { id, name: trimmed, enabledQuestionTypes: questionTypes, createdAt: now, updatedAt: now })
      return { id, name: trimmed }
    },
    onSuccess: async ({ id, name }) => {
      setTargetDeckId(id)
      setTargetDeckName(name)
      setDeckPickerOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['decks'] })
      await queryClient.invalidateQueries({ queryKey: ['deck-counts'] })
    },
  })

  const handlePickFile = (): void => {
    setPickError(null)
    log.info('import.lin_file_picker_opened', { message: 'User opened the .lin file picker' })
    pickAndParseBackupFile()
      .then((picked) => {
        if (!picked) {
          // Nothing to show for this screen without a file — go back rather than leaving the user
          // stranded on a near-empty "pick" step they never meant to see in the first place.
          router.back()
          return
        }
        const decks = getDecksInPayload(picked.payload)
        if (decks.length === 0) {
          setPickError(t('This file has no decks to import.'))
          return
        }
        setFileName(picked.fileName)
        setPayload(picked.payload)
        setDeckOptions(decks)
        if (decks.length === 1) {
          setSourceDeckId(decks[0]!.id)
          setStep('target')
        } else {
          setSourceDeckId(null)
          setStep('source-deck')
        }
      })
      .catch((error: unknown) => {
        log.error('import.lin_file_pick_failed', error, { message: '.lin file picking or parsing failed' })
        setPickError(String(error))
      })
  }

  // Opens the file browser immediately on landing here — same reasoning as csv-import.tsx/
  // apkg-import.tsx's identical effect: the Settings screen's .lin option should feel like it goes
  // straight to the file browser rather than requiring a second "Choose .lin file" tap.
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
      if (deck) setTargetDeckName(deck.name)
    })
  }, [params.deckId, db])

  // See csv-import.tsx's identical effect for why: the native header back button otherwise pops
  // this whole screen regardless of wizard step. 'source-deck' and 'target' both fall back to
  // handleStartOver — matching what their own (now-removed) in-screen "Back" buttons already did,
  // since 'target' can be reached from either 'pick' or 'source-deck' and there's no record of
  // which. Let through once `result` is set so the import-complete popup's "OK" (router.back())
  // can actually leave.
  const navigation = useNavigation()
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (importing) {
        e.preventDefault()
        return
      }
      if (step === 'pick' || result !== null) return
      e.preventDefault()
      if (step === 'preview') setStep('target')
      else if (step === 'target' || step === 'source-deck') handleStartOver()
    })
    return unsubscribe
  }, [navigation, step, result, importing])

  const handleBuildPreview = (): void => {
    if (!payload || !sourceDeckId || !targetDeckId) return
    setPreviewLoading(true)
    log.info('import.lin_preview_started', { message: 'Building .lin import preview' })
    buildLinImportPreview(db, payload, sourceDeckId, targetLanguage)
      .then(async (built) => {
        setPreviews(built)
        setCheckedIds(new Set(built.map((p) => p.sourceLemmaId)))

        // Which deck(s) already have a duplicate row's word — see csv-import.tsx's identical block.
        const lemmaIds = [...new Set(built.map((p) => p.existingLemmaId).filter((id) => id !== null))]
        const decksByLemma = await Promise.all(lemmaIds.map((id) => getDecksForLemma(db, id)))
        setExistingDeckNames(new Map(lemmaIds.map((id, i) => [id, decksByLemma[i]!.map((d) => d.name)])))

        setStep('preview')
      })
      .catch((error: unknown) => {
        log.error('import.lin_preview_failed', error, { message: 'Building .lin import preview failed' })
        showError(t('Could not read this file'), error)
      })
      .finally(() => setPreviewLoading(false))
  }

  const counts = useMemo(() => {
    const duplicate = previews.filter((p) => p.status === 'duplicate').length
    return { duplicate }
  }, [previews])

  // Rows sharing a form with another row in this file — see csv-import.tsx's
  // sameWordRowIndexes for why. Each .lin preview row is already one lemma (with every one of
  // its cards nested under it, see LinLemmaPreview), so this is mostly defensive: a well-formed
  // export shouldn't have two rows for the same form, but nothing enforces that on the way in.
  const sameFormIds = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of previews) counts.set(p.form.toLowerCase(), (counts.get(p.form.toLowerCase()) ?? 0) + 1)
    const ids = new Set<string>()
    for (const p of previews) {
      if ((counts.get(p.form.toLowerCase()) ?? 0) > 1) ids.add(p.sourceLemmaId)
    }
    return ids
  }, [previews])

  const tableColumns = useMemo(() => buildTableColumns(existingDeckNames), [existingDeckNames])

  const willImportCount = useMemo(
    () =>
      previews.filter(
        (p) => checkedIds.has(p.sourceLemmaId) && (p.status === 'ok' || duplicatePolicy !== 'skip'),
      ).length,
    [previews, checkedIds, duplicatePolicy],
  )

  const checkedCount = useMemo(
    () => previews.filter((p) => checkedIds.has(p.sourceLemmaId)).length,
    [previews, checkedIds],
  )

  const toggleChecked = (id: string): void => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allVisibleChecked = previews.length > 0 && previews.every((p) => checkedIds.has(p.sourceLemmaId))
  const toggleSelectAll = (): void => {
    setCheckedIds(allVisibleChecked ? new Set() : new Set(previews.map((p) => p.sourceLemmaId)))
  }

  const handleConfirmImport = (): void => {
    if (!payload || !sourceDeckId || !targetDeckId) return
    const toImport = previews.filter((p) => checkedIds.has(p.sourceLemmaId))
    setImporting(true)
    log.info('import.lin_import_confirmed', {
      message: 'User confirmed .lin import',
      metadata: { itemCount: toImport.length },
    })
    importLinDeck(db, payload, sourceDeckId, targetDeckId, targetLanguage, toImport, duplicatePolicy)
      .then(async (outcome) => {
        setResult(outcome)
        await queryClient.invalidateQueries()
      })
      .catch((error: unknown) => {
        log.error('import.lin_import_failed', error, { message: '.lin import failed' })
        showError(t('Import failed'), error)
      })
      .finally(() => setImporting(false))
  }

  const handleStartOver = (): void => {
    setStep('pick')
    setFileName('')
    setPayload(null)
    setDeckOptions([])
    setSourceDeckId(null)
    setTargetDeckId(null)
    setPreviews([])
    setExistingDeckNames(new Map())
    setCheckedIds(new Set())
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

        <ScrollView horizontal style={styles.tableOuterScroll} showsHorizontalScrollIndicator>
          <View style={styles.tableFlexColumn}>
            <View style={styles.tableHeaderRow}>
              <Pressable style={[styles.tableHeaderCheckboxCell, { width: SELECT_COLUMN_WIDTH }]} onPress={toggleSelectAll}>
                <Icon
                  name={allVisibleChecked ? 'SquareCheck' : 'Square'}
                  size={18}
                  color={allVisibleChecked ? colors.primary : colors.textMuted}
                />
              </Pressable>
              {tableColumns.map((col) => (
                <Text key={col.label} style={[styles.tableHeaderCell, { width: col.width }]}>
                  {t(col.label)}
                </Text>
              ))}
            </View>
            <FlatList
              style={styles.tableBodyScroll}
              data={previews}
              keyExtractor={(preview) => preview.sourceLemmaId}
              windowSize={7}
              maxToRenderPerBatch={20}
              initialNumToRender={20}
              removeClippedSubviews
              renderItem={({ item: preview, index: rowIndex }) => {
                const checked = checkedIds.has(preview.sourceLemmaId)
                const sameForm = sameFormIds.has(preview.sourceLemmaId)
                return (
                  <View
                    style={[
                      styles.tableRow,
                      rowIndex % 2 === 1 ? styles.tableRowAlt : null,
                      sameForm ? styles.sameWordRow : null,
                    ]}
                  >
                    <Pressable
                      style={[styles.tableCheckboxCell, { width: SELECT_COLUMN_WIDTH }]}
                      onPress={() => toggleChecked(preview.sourceLemmaId)}
                    >
                      <Icon
                        name={checked ? 'SquareCheck' : 'Square'}
                        size={18}
                        color={checked ? colors.primary : colors.textMuted}
                      />
                    </Pressable>
                    {tableColumns.map((col) => (
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
          <Button
            label={t('Import {{count}} words', { count: willImportCount.toLocaleString() })}
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
                    message={t('Imported {{words}} words ({{cards}} cards).', {
                      words: result.imported.toLocaleString(),
                      cards: result.cardsImported.toLocaleString(),
                    })}
                  />
                  <View style={styles.summaryRow}>
                    <SummaryStat label={t('Imported')} value={result.imported} color={colors.success} />
                    <SummaryStat label={t('Skipped')} value={result.skipped} color={colors.warning} />
                    <SummaryStat label={t('Cards')} value={result.cardsImported} color={colors.primary} />
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
          <Text style={styles.title}>{t('Import from a .lin file')}</Text>
          <Text style={styles.body}>
            {t('Choose a Lemmory `.lin` file - a deck someone shared with you, or one of your own deck exports. Full fidelity: meanings, examples, synonyms, cloze cards, review history, and FSRS scheduling all come across.')}
          </Text>
          <Button label={t('Choose .lin file')} icon="FolderOpen" onPress={handlePickFile} />
          {pickError ? <Text style={styles.errorText}>{pickError}</Text> : null}
        </Card>
      ) : null}

      {step === 'source-deck' ? (
        <Card style={styles.card}>
          <Text style={styles.title}>{fileName}</Text>
          <Text style={styles.body}>{t('This file has more than one deck. Which one do you want to import?')}</Text>
          <View style={styles.chipRow}>
            {deckOptions.map((deck) => (
              <Chip
                key={deck.id}
                label={`${deck.name} (${deck.cardCount})`}
                selected={sourceDeckId === deck.id}
                onPress={() => setSourceDeckId(deck.id)}
              />
            ))}
          </View>
          <View style={styles.actions}>
            <Button label={t('Continue')} onPress={() => setStep('target')} disabled={!sourceDeckId} />
          </View>
        </Card>
      ) : null}

      {step === 'target' ? (
        <>
          <Card style={styles.card}>
            <Text style={styles.title}>{fileName}</Text>
            <Text style={styles.body}>
              {t('Importing "{{name}}" ({{count}} cards).', {
                name: deckOptions.find((d) => d.id === sourceDeckId)?.name ?? '',
                count: deckOptions.find((d) => d.id === sourceDeckId)?.cardCount ?? 0,
              })}
            </Text>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.fieldLabel}>{t('Add to deck')}</Text>
            <Button
              label={targetDeckName ?? t('Choose a deck')}
              icon="Layers"
              variant="secondary"
              onPress={() => setDeckPickerOpen(true)}
            />
          </Card>

          <View style={styles.actions}>
            <Button
              label={previewLoading ? t('Checking...') : t('Preview import')}
              onPress={handleBuildPreview}
              disabled={!targetDeckId || previewLoading}
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
          setTargetDeckId(deck.id)
          setTargetDeckName(deck.name)
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

const STATUS_COLOR: Record<LinLemmaPreview['status'], string> = {
  ok: colors.success,
  duplicate: colors.warning,
}

function statusCellStyle(preview: LinLemmaPreview, columnLabel: string): TextStyle | undefined {
  if (columnLabel === 'Status') return { color: STATUS_COLOR[preview.status], fontWeight: '700' }
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
  sameWordRow: { backgroundColor: colors.warningSoft },
  tableCheckboxCell: { alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  tableCell: {
    fontSize: type.caption,
    color: colors.text,
    paddingVertical: 2,
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
