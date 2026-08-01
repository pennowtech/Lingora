import { Ionicons } from '@expo/vector-icons'
import type { CaptureSource } from '@lingora/types'
import {
  createDeck,
  createMineEntry,
  deleteMineEntry,
  getPendingMineEntries,
  updateMineEntryProcessed,
  updateMineEntryStatus,
} from '@lingora/database'
import { logger } from '@lingora/observability'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Clipboard from 'expo-clipboard'
import { router, Stack } from 'expo-router'
import { useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { DeckPickerModal } from '../../components/DeckPickerModal'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { ProgressOverlay } from '../../components/ProgressOverlay'
import { Button, Card, EmptyState, ErrorState, IconButton, Spinner } from '../../components/ui'
import { timeAgo } from '../../lib/format'
import { useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'mining', screen: 'MiningQueueScreen' })

const SOURCE_ICONS: Record<CaptureSource, keyof typeof Ionicons.glyphMap> = {
  netflix: 'tv',
  youtube: 'logo-youtube',
  article: 'newspaper',
  clipboard: 'clipboard',
  manual: 'pencil',
  share_sheet: 'share-social',
  process_text: 'text',
  extension: 'extension-puzzle',
  pdf: 'document',
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'what',
    title: 'What this screen is for',
    icon: 'download-outline',
    paragraphs: [
      'Queue is a holding area for sentences you want to turn into vocabulary cards later — nothing here happens automatically.',
      'Add a sentence by typing it, pasting it from your clipboard, or sharing text here from another app.',
    ],
  },
  {
    id: 'curate',
    title: 'Choosing what to keep',
    icon: 'checkbox-outline',
    paragraphs: [
      'Everything in the queue is selected by default. Tap a card to include or leave it out, or use the trash icon to remove it for good.',
      'Only bother with this if you want to be selective — otherwise everything gets turned into cards together.',
    ],
  },
  {
    id: 'generate',
    title: 'Turning captures into cards',
    icon: 'sparkles-outline',
    paragraphs: [
      'The button at the bottom turns your selected sentences into real vocabulary cards, one at a time.',
      'This is the one step that actually does the work — nothing before it does anything with your captured text.',
    ],
  },
  {
    id: 'from-outside',
    title: 'Adding from other apps',
    icon: 'share-outline',
    paragraphs: [
      'Found a sentence somewhere else, like an article or a message? Share it to Lingora the same way you\'d share it to any other app.',
      'Depending on a setting in Settings, under "Share & Search," a shared sentence might land here right away, or you might get asked what to do with it first.',
    ],
  },
]

/**
 * Sentence mining queue: captured text waits here BEFORE any AI call —
 * the user discards what they don't want, then generates the rest in one go.
 */
export default function MiningQueueScreen(): JSX.Element {
  const { db, pipeline, tier, defaultCefr } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<string[] | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [captureText, setCaptureText] = useState('')
  const [captureSource, setCaptureSource] = useState<CaptureSource>('manual')
  const [deckPickerOpen, setDeckPickerOpen] = useState(false)
  const help = useHelpAccordion('what')

  const queueQuery = useQuery({
    queryKey: ['mine-queue'],
    queryFn: () => getPendingMineEntries(db),
  })

  const entries = queueQuery.data ?? []
  // Default selection = everything, until the user starts curating.
  const selectedIds = selected ?? entries.map((e) => e.id)

  const discard = useMutation({
    mutationFn: (entryId: string) => deleteMineEntry(db, entryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mine-queue'] }),
    onError: (error: unknown) => Alert.alert(t('Could not discard capture'), String(error)),
  })

  const capture = useMutation({
    mutationFn: (args: { text: string; source: CaptureSource }) => {
      log.info('mining.capture_submitted', {
        message: 'User submitted a manual capture',
        metadata: { itemCount: args.text.length },
      })
      return createMineEntry(db, {
        id: crypto.randomUUID(),
        rawText: args.text,
        sourceType: args.source,
        status: 'pending',
        capturedAt: Date.now(),
        processed: false,
      })
    },
    onSuccess: async () => {
      setCaptureOpen(false)
      setCaptureText('')
      setCaptureSource('manual')
      await queryClient.invalidateQueries({ queryKey: ['mine-queue'] })
    },
    onError: (error: unknown) => {
      log.error('mining.capture_failed', error, { message: 'Manual capture failed to save' })
      Alert.alert(t('Could not save capture'), String(error))
    },
  })

  const handlePasteFromClipboard = (): void => {
    Clipboard.getStringAsync()
      .then((text) => {
        if (!text.trim()) {
          Alert.alert(t('Clipboard is empty'), t('Copy some text first, then paste it here.'))
          return
        }
        setCaptureText(text.trim())
        setCaptureSource('clipboard')
      })
      .catch((error: unknown) => {
        log.error('mining.clipboard_read_failed', error, { message: 'Reading the clipboard failed' })
        Alert.alert(t('Could not read clipboard'), String(error))
      })
  }

  const closeCapture = (): void => {
    setCaptureOpen(false)
    setCaptureText('')
    setCaptureSource('manual')
  }

  // Unlike the AI generation calls in search.tsx/word/[form].tsx, this one really can be stopped
  // mid-flight — it's a loop over individually-awaited items, so Cancel just stops it from
  // starting the next one instead of only discarding a result that already arrived.
  const generateCancelledRef = useRef(false)
  const generate = useMutation({
    mutationFn: async (deckId: string) => {
      if (!pipeline) throw new Error(t('No AI provider is active. Add and enable one in Settings to generate cards.'))
      generateCancelledRef.current = false
      const chosen = entries.filter((e) => selectedIds.includes(e.id))
      let failures = 0

      for (const [index, entry] of chosen.entries()) {
        if (generateCancelledRef.current) break
        setProgress(`Generating ${index + 1} of ${chosen.length}…`)
        try {
          await updateMineEntryStatus(db, entry.id, 'processing')
          const outcome = await pipeline.lookupOrGenerate(entry.rawText.trim(), {
            cefrLevel: defaultCefr,
            deckId,
          })
          if (outcome.kind === 'generated') {
            await updateMineEntryProcessed(db, entry.id, outcome.cardId)
          } else if (outcome.kind === 'existing') {
            await updateMineEntryStatus(db, entry.id, 'done')
          } else {
            await updateMineEntryStatus(db, entry.id, 'error')
            failures += 1
          }
        } catch (error) {
          await updateMineEntryStatus(db, entry.id, 'error')
          failures += 1
          if (chosen.length === 1) throw error
        }
      }
      return { total: chosen.length, failures }
    },
    onSettled: async () => {
      setProgress(null)
      setSelected(null)
      await queryClient.invalidateQueries()
    },
  })

  const cancelGenerate = (): void => {
    generateCancelledRef.current = true
  }

  // "Generate cards" used to add every card to one hardcoded deck with no say in the matter — the
  // same silent-default-deck problem already fixed on Search and word/[form] earlier. Reuses the
  // same DeckPickerModal so all three "which deck?" moments in the app look and behave alike.
  const createDeckAndGenerate = useMutation({
    mutationFn: async (name: string) => {
      const now = Date.now()
      const deckId = crypto.randomUUID()
      await createDeck(db, { id: deckId, name, createdAt: now, updatedAt: now })
      return deckId
    },
    onSuccess: (deckId) => {
      setDeckPickerOpen(false)
      generate.mutate(deckId)
    },
    onError: (error: unknown) => {
      log.error('mining.create_deck_failed', error, { message: 'Creating a deck from the mining queue failed' })
    },
  })

  const toggle = (id: string): void => {
    setSelected(
      selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id],
    )
  }

  const captureFab = (
    <View style={styles.fab}>
      <IconButton
        testID="mine-capture-fab"
        icon="add"
        size={28}
        color={colors.textOnPrimary}
        onPress={() => setCaptureOpen(true)}
      />
    </View>
  )

  // Help lives in the native header, next to the "Queue" title, not an in-body overlay — see the
  // header-right pattern shared with Search, word/[form], and the Settings screens that have a
  // help sheet.
  const helpButton = (
    <Stack.Screen
      options={{
        headerRight: () => (
          <IconButton icon="help-circle-outline" size={24} color={colors.primary} onPress={() => help.openSection('what')} />
        ),
      }}
    />
  )

  const helpSheet = (
    <HelpAccordionSheet
      visible={help.visible}
      onClose={help.close}
      title={t('Queue help')}
      sections={HELP_SECTIONS}
      activeSectionId={help.sectionId}
      onSectionPress={(id) => help.setSectionId(help.sectionId === id ? null : id)}
      translate={t}
    />
  )

  const progressOverlay = (
    <ProgressOverlay visible={generate.isPending} message={progress ?? t('Generating…')} onCancel={cancelGenerate} />
  )

  const captureModal = (
    <Modal visible={captureOpen} animationType="slide" transparent onRequestClose={closeCapture}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{t('Add a sentence')}</Text>
          <Text style={styles.modalHint}>
            {t('Paste or type a German sentence. It joins the queue below — nothing is sent to AI until you generate.')}
          </Text>
          <TextInput
            testID="mine-capture-input"
            style={styles.modalInput}
            multiline
            placeholder="Ich gehe heute Abend aus."
            placeholderTextColor={colors.textMuted}
            value={captureText}
            onChangeText={(text) => {
              setCaptureText(text)
              setCaptureSource('manual')
            }}
          />
          <Button
            label={t('Paste from clipboard')}
            variant="secondary"
            icon="clipboard-outline"
            onPress={handlePasteFromClipboard}
            small
          />
          <View style={styles.modalActions}>
            <Button label={t('Cancel')} variant="ghost" onPress={closeCapture} />
            <Button
              label={capture.isPending ? t('Adding…') : t('Add to queue')}
              onPress={() => capture.mutate({ text: captureText.trim(), source: captureSource })}
              disabled={captureText.trim().length === 0 || capture.isPending}
            />
          </View>
        </View>
      </View>
    </Modal>
  )

  if (queueQuery.isPending) {
    return (
      <View style={styles.container}>
        <Spinner />
        {captureFab}
        {captureModal}
      </View>
    )
  }

  if (queueQuery.isError) {
    return (
      <View style={styles.container}>
        <ErrorState message={String(queueQuery.error)} onRetry={() => void queueQuery.refetch()} />
        {captureFab}
        {captureModal}
      </View>
    )
  }

  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="download"
          title={t('Queue is empty')}
          message={t('Add a sentence manually, paste one from your clipboard, or capture text from the share sheet — it lands here before any AI processing.')}
        />
        {generate.data && generate.data.total > 0 ? (
          <Text style={styles.resultLabel}>
            {t('{{done}} of {{total}} generated', {
              done: generate.data.total - generate.data.failures,
              total: generate.data.total,
            })}
            {generate.data.failures > 0 ? ` · ${t('{{count}} failed', { count: generate.data.failures })}` : ''}
            {' — '}
            {t('see Decks.')}
          </Text>
        ) : null}
        {captureFab}
        {captureModal}
        {helpButton}
        {helpSheet}
        {progressOverlay}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          {t("Review your captures. Discard what you don't need, then generate cards for the rest.")}
        </Text>

        {entries.map((entry) => {
          const isSelected = selectedIds.includes(entry.id)
          return (
            <Card key={entry.id} style={styles.entryCard} onPress={() => toggle(entry.id)}>
              <View style={styles.entryHeader}>
                <View style={styles.sourceRow}>
                  <Ionicons name={SOURCE_ICONS[entry.sourceType]} size={13} color={colors.textMuted} />
                  <Text style={styles.sourceLabel}>{entry.sourceTitle ?? entry.sourceType}</Text>
                  <Text style={styles.timeLabel}>· {timeAgo(entry.capturedAt)}</Text>
                </View>
                <Ionicons
                  name={isSelected ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={isSelected ? colors.primary : colors.textMuted}
                />
              </View>
              <Text style={styles.entryText}>„{entry.rawText}"</Text>
              <View style={styles.entryActions}>
                <IconButton
                  icon="trash-outline"
                  size={17}
                  color={colors.danger}
                  onPress={() => discard.mutate(entry.id)}
                  disabled={discard.isPending}
                />
              </View>
            </Card>
          )
        })}
        {generate.isError ? <Text style={styles.errorLabel}>{String(generate.error)}</Text> : null}
      </ScrollView>

      <View style={styles.bottomBar}>
        {tier === 'full' ? (
          <Button
            label={progress ?? t('Generate {{count}} cards with AI', { count: selectedIds.length })}
            icon="sparkles"
            onPress={() => setDeckPickerOpen(true)}
            disabled={selectedIds.length === 0 || generate.isPending}
          />
        ) : (
          <Button
            label={t('No AI provider active — open Settings')}
            icon="key"
            variant="secondary"
            onPress={() => router.push('/settings')}
          />
        )}
      </View>
      {captureFab}
      {captureModal}
      {helpButton}
      {helpSheet}
      {progressOverlay}
      <DeckPickerModal
        db={db}
        visible={deckPickerOpen}
        onClose={() => setDeckPickerOpen(false)}
        title={t('Generate {{count}} cards to…', { count: selectedIds.length })}
        onSelectDeck={(deck) => {
          setDeckPickerOpen(false)
          generate.mutate(deck.id)
        }}
        selecting={generate.isPending}
        onCreateDeck={(name) => createDeckAndGenerate.mutate(name)}
        creating={createDeckAndGenerate.isPending}
      />
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 96 },
  intro: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 19, marginBottom: spacing.lg },
  entryCard: { marginBottom: spacing.sm },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  sourceLabel: { fontSize: type.micro, fontWeight: '600', color: colors.textMuted },
  timeLabel: { fontSize: type.micro, color: colors.textMuted },
  entryText: { fontSize: type.body, fontWeight: '600', color: colors.text, marginTop: spacing.sm, lineHeight: 22 },
  entryActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.sm },
  errorLabel: { fontSize: type.caption, color: colors.danger, marginTop: spacing.md },
  resultLabel: {
    fontSize: type.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: -spacing.xl,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderRadius: radius.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 104,
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: { fontSize: type.subheading, fontWeight: '700', color: colors.text },
  modalHint: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
  modalInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: type.body,
    color: colors.text,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  })
