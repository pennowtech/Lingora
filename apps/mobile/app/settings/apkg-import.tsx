import type { ApkgField, ApkgFieldMapping, ApkgRowPreview } from '@lingora/database'
import {
  buildApkgImportPreview,
  CEFR_LEVELS,
  getAllDecks,
  importApkgNotes,
  PARTS_OF_SPEECH,
} from '@lingora/database'
import type { AnkiDeckInfo, AnkiNote } from '@lingora/database'
import type { CefrLevel, PartOfSpeech } from '@lingora/types'
import { logger } from '@lingora/observability'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState, type JSX } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button, Card, Chip, EmptyState, ErrorState, ProgressBar, Spinner } from '../../components/ui'
import { pickAndParseApkgFile } from '../../lib/apkg'
import { useServices } from '../../lib/services'
import { colors, spacing, type } from '../../lib/theme'

const log = logger.child({ feature: 'import', screen: 'ApkgImportScreen' })

const FIELD_LABELS: Record<ApkgField, string> = {
  word: 'Word (required)',
  meaning: 'Meaning (required)',
  example: 'Example sentence',
  partOfSpeech: 'Part of speech',
  cefrLevel: 'CEFR level',
}
const OPTIONAL_FIELDS: ApkgField[] = ['example', 'partOfSpeech', 'cefrLevel']
const REQUIRED_FIELDS: ApkgField[] = ['word', 'meaning']

type Step = 'pick' | 'map' | 'preview' | 'importing' | 'done'

/**
 * Anki `.apkg` import (Work package 3). Field mapping is positional and
 * shared across every note in the collection — Anki mixes note types
 * (Basic, Cloze, …) with different field counts, but a single word/meaning/
 * example-by-index mapping still works: a note whose mapped index doesn't
 * exist just yields an empty field, caught by the same required-field
 * validation CSV import uses. Cloze note syntax ({{c1::...}}) is imported as
 * raw text, not decoded — reported honestly in the preview, not silently
 * mangled.
 */
export default function ApkgImportScreen(): JSX.Element {
  const { db } = useServices()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<Step>('pick')
  const [fileName, setFileName] = useState('')
  const [notes, setNotes] = useState<AnkiNote[]>([])
  const [decks, setDecks] = useState<AnkiDeckInfo[]>([])
  const [mapping, setMapping] = useState<ApkgFieldMapping>({})
  const [deckId, setDeckId] = useState<string | null>(null)
  const [defaultPos, setDefaultPos] = useState<PartOfSpeech>('noun')
  const [defaultCefr, setDefaultCefr] = useState<CefrLevel>('A1')
  const [previews, setPreviews] = useState<ApkgRowPreview[]>([])
  const [pickError, setPickError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [result, setResult] = useState<{ imported: number; skipped: number; failed: number; cancelled: boolean } | null>(
    null,
  )
  const cancelRequested = useRef(false)

  const decksQuery = useQuery({ queryKey: ['decks'], queryFn: () => getAllDecks(db) })

  const maxFieldCount = Math.max(1, ...notes.map((n) => n.fields.length))
  const fieldIndices = Array.from({ length: maxFieldCount }, (_, i) => i)
  const canBuildPreview = mapping.word !== undefined && mapping.meaning !== undefined && deckId !== null

  const handlePickFile = (): void => {
    setPickError(null)
    log.info('import.apkg_file_picker_opened', { message: 'User opened the .apkg file picker' })
    pickAndParseApkgFile()
      .then((picked) => {
        if (!picked) return
        if (picked.notes.length === 0) {
          setPickError('This collection has no notes to import.')
          return
        }
        setFileName(picked.fileName)
        setNotes(picked.notes)
        setDecks(picked.decks)
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
    buildApkgImportPreview(db, notes, {
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
        log.error('import.apkg_preview_failed', error, { message: 'Building Anki import preview failed' })
        Alert.alert('Could not read this collection', String(error))
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
    cancelRequested.current = false
    setProgress({ done: 0, total: counts.ok })
    setStep('importing')
    log.info('import.apkg_import_confirmed', {
      message: 'User confirmed Anki import',
      metadata: { itemCount: previews.length },
    })
    importApkgNotes(db, previews, deckId, 'de', {
      onProgress: (done, total) => setProgress({ done, total }),
      shouldCancel: () => cancelRequested.current,
    })
      .then(async (outcome) => {
        setResult(outcome)
        setStep('done')
        await queryClient.invalidateQueries()
      })
      .catch((error: unknown) => {
        log.error('import.apkg_import_failed', error, { message: 'Anki import failed' })
        Alert.alert('Import failed', String(error))
        setStep('preview')
      })
  }

  const handleStartOver = (): void => {
    setStep('pick')
    setFileName('')
    setNotes([])
    setDecks([])
    setMapping({})
    setPreviews([])
    setResult(null)
    setProgress(null)
    setPickError(null)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {step === 'pick' ? (
        <Card style={styles.card}>
          <Text style={styles.title}>Import from Anki</Text>
          <Text style={styles.body}>
            Choose a `.apkg` export. Review history isn't imported — every card starts fresh — and
            media (audio/images) is stripped rather than copied.
          </Text>
          <Button label="Choose .apkg file" icon="folder-open" onPress={handlePickFile} />
          {pickError ? <Text style={styles.errorText}>{pickError}</Text> : null}
        </Card>
      ) : null}

      {step === 'map' ? (
        <>
          <Card style={styles.card}>
            <Text style={styles.title}>{fileName}</Text>
            <Text style={styles.body}>
              {notes.length.toLocaleString()} notes across {Math.max(decks.length, 1)} deck
              {decks.length === 1 ? '' : 's'}. Map each field below — it applies to every note, so a
              note type without that many fields just leaves it empty.
            </Text>
          </Card>

          {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map((fieldName) => (
            <Card key={fieldName} style={styles.card}>
              <Text style={styles.fieldLabel}>{FIELD_LABELS[fieldName]}</Text>
              <View style={styles.chipRow}>
                {OPTIONAL_FIELDS.includes(fieldName) ? (
                  <Chip
                    label="None"
                    selected={mapping[fieldName] === undefined}
                    onPress={() => setField(fieldName, null)}
                  />
                ) : null}
                {fieldIndices.map((index) => (
                  <Chip
                    key={`${fieldName}-${index}`}
                    label={`Field ${index + 1}`}
                    selected={mapping[fieldName] === index}
                    onPress={() => setField(fieldName, index)}
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
            <Text style={styles.hint}>Used for notes with no mapped or recognized part-of-speech field.</Text>
            <View style={styles.chipRow}>
              {PARTS_OF_SPEECH.map((pos) => (
                <Chip key={pos} label={pos} selected={defaultPos === pos} onPress={() => setDefaultPos(pos)} />
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.fieldLabel}>Default CEFR level</Text>
            <Text style={styles.hint}>Used for notes with no mapped or recognized CEFR field.</Text>
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
            <Card key={preview.noteId} style={styles.rowCard}>
              <View style={styles.rowHeader}>
                <Text style={styles.rowWord}>{preview.word || '(empty)'}</Text>
                <StatusChip status={preview.status} />
              </View>
              <Text style={styles.rowMeaning}>{preview.meaning || '—'}</Text>
              {preview.errors.length > 0 ? <Text style={styles.rowError}>{preview.errors.join(' ')}</Text> : null}
            </Card>
          ))}
          {previews.length > 50 ? (
            <Text style={styles.hint}>…and {(previews.length - 50).toLocaleString()} more notes.</Text>
          ) : null}

          <View style={styles.actions}>
            <Button label="Back" variant="ghost" onPress={() => setStep('map')} />
            <Button
              label={`Import ${counts.ok.toLocaleString()} notes`}
              onPress={handleConfirmImport}
              disabled={counts.ok === 0}
            />
          </View>
        </>
      ) : null}

      {step === 'importing' && progress ? (
        <Card style={styles.card}>
          <Text style={styles.title}>Importing…</Text>
          <Text style={styles.body}>
            {progress.done.toLocaleString()} of {progress.total.toLocaleString()} notes
          </Text>
          <ProgressBar progress={progress.total > 0 ? progress.done / progress.total : 0} />
          <Button
            label="Cancel"
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
            title={result.cancelled ? 'Import canceled' : 'Import complete'}
            message={`Imported ${result.imported.toLocaleString()} words.${result.cancelled ? ' The rest were left untouched — you can import the same file again to pick up where you left off (already-imported words are skipped as duplicates).' : ''}`}
          />
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

function StatusChip(props: { status: ApkgRowPreview['status'] }): JSX.Element {
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
