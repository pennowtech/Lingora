import type { BackupPayload, LinDeckOption, LinDuplicatePolicy, LinLemmaPreview } from '@lingora/database'
import { buildLinImportPreview, createDeck, getAllDecks, getDecksInPayload, importLinDeck } from '@lingora/database'
import { Ionicons } from '@expo/vector-icons'
import { logger } from '@lingora/observability'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { useMemo, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from 'react-native'
import { Button, Card, Chip, EmptyState, ErrorState, Spinner } from '../../components/ui'
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
const TABLE_COLUMNS: TableColumn[] = [
  { label: 'Word', width: 160, cell: (p) => p.form },
  { label: 'Meaning', width: 200, cell: (p) => p.cards[0]?.translation ?? '—' },
  { label: 'Cards', width: 160, cell: (p) => p.cards.map((c) => c.type).join(', ') || '—' },
  { label: 'Status', width: 110, cell: (p) => p.status },
]
const SELECT_COLUMN_WIDTH = 48

type Step = 'pick' | 'source-deck' | 'target' | 'preview' | 'importing' | 'done'

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
  const { db } = useServices()
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
  const [newDeckOpen, setNewDeckOpen] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  const [duplicatePolicy, setDuplicatePolicy] = useState<LinDuplicatePolicy>('skip')
  const [previews, setPreviews] = useState<LinLemmaPreview[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [pickError, setPickError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; cardsImported: number } | null>(null)

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
      setTargetDeckId(id)
      setNewDeckOpen(false)
      setNewDeckName('')
      await queryClient.invalidateQueries({ queryKey: ['decks'] })
      await queryClient.invalidateQueries({ queryKey: ['deck-counts'] })
    },
  })

  const handlePickFile = (): void => {
    setPickError(null)
    log.info('import.lin_file_picker_opened', { message: 'User opened the .lin file picker' })
    pickAndParseBackupFile()
      .then((picked) => {
        if (!picked) return
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

  const handleBuildPreview = (): void => {
    if (!payload || !sourceDeckId || !targetDeckId) return
    setPreviewLoading(true)
    log.info('import.lin_preview_started', { message: 'Building .lin import preview' })
    buildLinImportPreview(db, payload, sourceDeckId, 'de')
      .then((built) => {
        setPreviews(built)
        setCheckedIds(new Set(built.map((p) => p.sourceLemmaId)))
        setStep('preview')
      })
      .catch((error: unknown) => {
        log.error('import.lin_preview_failed', error, { message: 'Building .lin import preview failed' })
        Alert.alert(t('Could not read this file'), String(error))
      })
      .finally(() => setPreviewLoading(false))
  }

  const counts = useMemo(() => {
    const duplicate = previews.filter((p) => p.status === 'duplicate').length
    return { duplicate }
  }, [previews])

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
    setStep('importing')
    log.info('import.lin_import_confirmed', {
      message: 'User confirmed .lin import',
      metadata: { itemCount: toImport.length },
    })
    importLinDeck(db, payload, sourceDeckId, targetDeckId, 'de', toImport, duplicatePolicy)
      .then(async (outcome) => {
        setResult(outcome)
        setStep('done')
        await queryClient.invalidateQueries()
      })
      .catch((error: unknown) => {
        log.error('import.lin_import_failed', error, { message: '.lin import failed' })
        Alert.alert(t('Import failed'), String(error))
        setStep('preview')
      })
  }

  const handleStartOver = (): void => {
    setStep('pick')
    setFileName('')
    setPayload(null)
    setDeckOptions([])
    setSourceDeckId(null)
    setTargetDeckId(null)
    setPreviews([])
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
        </View>

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
              keyExtractor={(preview) => preview.sourceLemmaId}
              windowSize={7}
              maxToRenderPerBatch={20}
              initialNumToRender={20}
              removeClippedSubviews
              renderItem={({ item: preview, index: rowIndex }) => {
                const checked = checkedIds.has(preview.sourceLemmaId)
                return (
                  <View style={[styles.tableRow, rowIndex % 2 === 1 ? styles.tableRowAlt : null]}>
                    <Pressable
                      style={[styles.tableCheckboxCell, { width: SELECT_COLUMN_WIDTH }]}
                      onPress={() => toggleChecked(preview.sourceLemmaId)}
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
          <Button label={t('Back')} variant="ghost" onPress={() => setStep('target')} />
          <Button
            label={t('Import {{count}} words', { count: checkedCount.toLocaleString() })}
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
          <Text style={styles.title}>{t('Import from a .lin file')}</Text>
          <Text style={styles.body}>
            {t('Choose a Lingora `.lin` file — a deck someone shared with you, or one of your own deck exports. Full fidelity: meanings, examples, synonyms, cloze cards, review history, and FSRS scheduling all come across.')}
          </Text>
          <Button label={t('Choose .lin file')} icon="folder-open" onPress={handlePickFile} />
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
            <Button label={t('Back')} variant="ghost" onPress={handleStartOver} />
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
            <Text style={styles.fieldLabel}>{t('Import into deck')}</Text>
            {decksQuery.isPending ? (
              <Spinner />
            ) : decksQuery.isError ? (
              <ErrorState message={String(decksQuery.error)} onRetry={() => void decksQuery.refetch()} />
            ) : (
              <View style={styles.chipRow}>
                {(decksQuery.data ?? []).map((deck) => (
                  <Chip
                    key={deck.id}
                    label={deck.name}
                    selected={targetDeckId === deck.id}
                    onPress={() => setTargetDeckId(deck.id)}
                  />
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
              disabled={!targetDeckId || previewLoading}
            />
          </View>
        </>
      ) : null}

      {step === 'importing' ? (
        <Card style={styles.card}>
          <Text style={styles.title}>{t('Importing…')}</Text>
          <Spinner />
        </Card>
      ) : null}

      {step === 'done' && result ? (
        <Card style={styles.card}>
          <EmptyState
            icon="checkmark-circle"
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
  tableCheckboxCell: { alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  tableCell: {
    fontSize: type.caption,
    color: colors.text,
    paddingVertical: 2,
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
