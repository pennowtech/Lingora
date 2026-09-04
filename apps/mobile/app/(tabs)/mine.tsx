import type { CaptureSource } from '@lingora/types'
import {
  createMineEntry,
  deleteAllMineEntries,
  deleteMineEntries,
  deleteMineEntry,
  getAllMineEntries,
} from '@lingora/database'
import { logger } from '@lingora/observability'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Clipboard from 'expo-clipboard'
import { router, Stack } from 'expo-router'
import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { Icon, type IconName } from '../../components/Icon'
import { InlineMarkdown } from '../../components/InlineMarkdown'
import { AlertModal, Button, Card, ConfirmModal, ErrorState, IconButton, Spinner } from '../../components/ui'
import { timeAgo } from '@lingora/core'
import { useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'mining', screen: 'MiningStudioScreen' })

const SOURCE_ICONS: Record<CaptureSource, IconName> = {
  netflix: 'Tv',
  youtube: 'Video',
  article: 'Newspaper',
  clipboard: 'Clipboard',
  manual: 'Pencil',
  share_sheet: 'Share2',
  process_text: 'Type',
  extension: 'Puzzle',
  pdf: 'File',
}

const MAX_PASSAGE_LENGTH = 1000

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'studio-overview',
    title: 'Mining Studio & Captured Passages',
    icon: 'Sparkles',
    paragraphs: [
      'Capture any passage you read - an article, a message, a subtitle - and one tap turns it into a **translation**, a **grammar** breakdown at your level, and ready-made **flashcards** for the words worth learning. No manual lookup, no dictionary-hopping.',
      'The **Mining Studio** stores passages and sentences captured from your reading, browsing, and clipboard.',
      'Tap anywhere on a passage - or its **Study & Mine** button - to see its fluent translation, grammar breakdown, and extracted vocabulary.',
      'A passage with a *tinted green background* and a **Mined** badge already had at least one card mined from it.',
    ],
  },
  {
    id: 'cleanup',
    title: 'Clearing passages',
    icon: 'Trash2',
    paragraphs: [
      'Tap the checkbox on any passage to select it, then **Delete Selected** to remove just those.',
      "**Clear All** at the top removes every captured passage for this language pair at once - your mined cards are *never* affected, only the captures themselves.",
    ],
  },
]

export default function MiningStudioScreen(): JSX.Element {
  const { db, targetLanguage } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const queryClient = useQueryClient()

  const [captureOpen, setCaptureOpen] = useState(false)
  const [captureText, setCaptureText] = useState('')
  const [captureSource, setCaptureSource] = useState<CaptureSource>('manual')
  const [errorNotice, setErrorNotice] = useState<{ title: string; message: string } | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [confirmClearSelected, setConfirmClearSelected] = useState(false)
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const showError = (title: string, error: unknown): void => setErrorNotice({ title, message: String(error) })
  const help = useHelpAccordion('studio-overview')

  // 'all' suffix keeps this cache entry distinct from BottomTabBar's own ['mine-queue', 'pending']
  // badge-count query - see that file's comment for why sharing the bare key caused already-mined
  // passages to flicker out of this list. Every existing invalidateQueries({ queryKey:
  // ['mine-queue'] }) call (here and in CaptureIntentHandler.tsx) still prefix-matches this key.
  const queueQuery = useQuery({
    queryKey: ['mine-queue', 'all', targetLanguage],
    queryFn: () => getAllMineEntries(db, targetLanguage),
  })

  const entries = queueQuery.data ?? []

  const openCapture = (): void => {
    setCaptureText('')
    setCaptureSource('manual')
    setCaptureOpen(true)
  }

  const closeCapture = (): void => {
    setCaptureOpen(false)
  }

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
        targetLanguage,
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
      showError(t('Could not save capture'), error)
    },
  })

  const handlePasteFromClipboard = (): void => {
    Clipboard.getStringAsync()
      .then((pastedText) => {
        if (!pastedText.trim()) {
          setErrorNotice({ title: t('Clipboard is empty'), message: t('Copy some text first, then paste it here.') })
          return
        }
        const truncated = pastedText.trim().slice(0, MAX_PASSAGE_LENGTH)
        setCaptureText(truncated)
        setCaptureSource('clipboard')
      })
      .catch((err) => {
        log.warn('mining.clipboard_paste_failed', { message: `Clipboard read failed: ${String(err)}` })
      })
  }

  const discard = useMutation({
    mutationFn: (entryId: string) => deleteMineEntry(db, entryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mine-queue'] }),
    onError: (error: unknown) => showError(t('Could not discard capture'), error),
  })

  const deleteSelected = useMutation({
    mutationFn: (ids: string[]) => deleteMineEntries(db, ids),
    onSuccess: async () => {
      setSelected([])
      await queryClient.invalidateQueries({ queryKey: ['mine-queue'] })
    },
    onError: (error: unknown) => showError(t('Could not delete selected passages'), error),
  })

  const clearAll = useMutation({
    mutationFn: () => deleteAllMineEntries(db, targetLanguage),
    onSuccess: async () => {
      setSelected([])
      await queryClient.invalidateQueries({ queryKey: ['mine-queue'] })
    },
    onError: (error: unknown) => showError(t('Could not clear Mining Studio'), error),
  })

  const toggleSelect = (id: string): void => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  const openStudioWithEntry = (entryText: string, entryId: string, mined: boolean): void => {
    router.push({
      pathname: '/mine/studio',
      params: { initialText: entryText, sourceId: entryId, mined: mined ? '1' : '' },
    })
  }

  const helpButton = (
    <Stack.Screen
      options={{
        title: t('Mining Studio'),
        headerRight: () => (
          <IconButton
            icon="CircleQuestionMark"
            size={24}
            color={colors.primary}
            onPress={() => help.openSection('studio-overview')}
          />
        ),
      }}
    />
  )

  const helpSheet = (
    <HelpAccordionSheet
      visible={help.visible}
      onClose={help.close}
      title={t('Mining Studio Help')}
      sections={HELP_SECTIONS}
      activeSectionId={help.sectionId}
      onSectionPress={(id) => help.setSectionId(help.sectionId === id ? null : id)}
      translate={t}
    />
  )

  const alertModal = (
    <AlertModal
      visible={errorNotice !== null}
      title={errorNotice?.title ?? ''}
      message={errorNotice?.message ?? ''}
      onClose={() => setErrorNotice(null)}
    />
  )

  const atLimit = captureText.length >= MAX_PASSAGE_LENGTH

  const captureFab = (
    <TouchableOpacity
      testID="mine-add-button"
      style={styles.fab}
      onPress={openCapture}
      accessibilityRole="button"
      accessibilityLabel={t('Add sentence or passage')}
    >
      <Icon name="Plus" size={24} color="#ffffff" />
    </TouchableOpacity>
  )

  const captureModal = (
    <Modal visible={captureOpen} transparent animationType="slide" onRequestClose={closeCapture}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalSheet}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalScrollContent}
          >
            <Text style={styles.modalTitle}>{t('Add passage or sentence')}</Text>
            <Text style={styles.modalHint}>
              {t('Paste or type target language text to study grammar and mine vocabulary cards.')}
            </Text>
            <TextInput
              testID="mine-capture-input"
              style={[styles.modalInput, atLimit && styles.inputAtLimit]}
              multiline
              maxLength={MAX_PASSAGE_LENGTH}
              placeholder={t('Paste or type a passage or sentence...')}
              placeholderTextColor={colors.textMuted}
              value={captureText}
              onChangeText={(txt) => {
                setCaptureText(txt)
                setCaptureSource('manual')
              }}
            />
            <View style={styles.modalInputToolbar}>
              <Button
                label={t('Paste from clipboard')}
                variant="secondary"
                icon="Clipboard"
                onPress={handlePasteFromClipboard}
                small
              />
              <Text style={[styles.charCounter, atLimit && styles.charCounterLimit]}>
                {captureText.length}/{MAX_PASSAGE_LENGTH}
              </Text>
            </View>
          </ScrollView>
          <View style={styles.modalActions}>
            <Button label={t('Cancel')} variant="ghost" onPress={closeCapture} />
            <Button
              label={capture.isPending ? t('Adding...') : t('Save Passage')}
              onPress={() => capture.mutate({ text: captureText.trim(), source: captureSource })}
              disabled={captureText.trim().length === 0 || capture.isPending}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )

  // Only ever shown when there's genuinely nothing else on screen (the empty state) - once a
  // passage exists, the list itself is the explanation.
  const overviewCard = (
    <View style={styles.overviewCard}>
      <View style={styles.overviewIconWrap}>
        <Icon name="Sparkles" size={24} color={colors.primary} />
      </View>
      <Text style={styles.overviewTitle}>{t('What is Mining Studio?')}</Text>
      <InlineMarkdown
        text={t(
          'Capture any passage you read - an article, a message, a subtitle - and one tap turns it into a **translation**, a **grammar** breakdown at your level, and ready-made **flashcards** for the words worth learning. No manual lookup, no dictionary-hopping.',
        )}
        style={styles.overviewBody}
        boldStyle={styles.overviewBold}
      />
    </View>
  )

  if (queueQuery.isPending) {
    return (
      <View style={styles.container}>
        <Spinner />
        {captureFab}
        {captureModal}
        {alertModal}
      </View>
    )
  }

  // React Query keeps the last successful `data` around across a failed background refetch (it
  // doesn't clear it), so a transient refetch error here shouldn't wipe an already-visible list
  // down to a bare error screen. Only show the full error state when there's genuinely nothing
  // cached to fall back on. (Mined passages flickering out and back was a separate bug - this
  // query used to share its cache key with BottomTabBar's differently-filtered badge query; see
  // the queryKey comment above.)
  if (queueQuery.isError && entries.length === 0) {
    return (
      <View style={styles.container}>
        <ErrorState message={String(queueQuery.error)} onRetry={() => void queueQuery.refetch()} />
        {captureFab}
        {captureModal}
        {alertModal}
      </View>
    )
  }

  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyCentered}>{overviewCard}</View>
        {captureFab}
        {captureModal}
        {helpButton}
        {helpSheet}
        {alertModal}
      </View>
    )
  }

  const clearToolbar = (
    <View style={styles.toolbar}>
      {selected.length > 0 ? (
        <>
          <Text style={styles.toolbarLabel}>{t('{{count}} selected', { count: selected.length })}</Text>
          <View style={styles.toolbarActions}>
            <Button label={t('Cancel')} variant="ghost" small onPress={() => setSelected([])} />
            <Button
              label={t('Delete Selected')}
              variant="danger"
              small
              icon="Trash2"
              onPress={() => setConfirmClearSelected(true)}
              disabled={deleteSelected.isPending}
            />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.toolbarLabel}>
            {t('{{count}} passages', { count: entries.length })}
          </Text>
          <Button
            label={t('Clear All')}
            variant="ghost"
            small
            icon="Trash2"
            onPress={() => setConfirmClearAll(true)}
            disabled={clearAll.isPending}
          />
        </>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      {clearToolbar}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {entries.map((entry) => {
          const charCount = entry.rawText.length
          const isMined = entry.processed
          const isSelected = selected.includes(entry.id)
          return (
            <Card
              key={entry.id}
              style={[styles.entryCard, isMined && styles.entryCardMined]}
              onPress={() => openStudioWithEntry(entry.rawText, entry.id, isMined)}
            >
              <View style={styles.entryHeader}>
                <View style={styles.sourceRow}>
                  <TouchableOpacity
                    onPress={() => toggleSelect(entry.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon
                      name={isSelected ? 'SquareCheck' : 'Square'}
                      size={18}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                  <Icon name={SOURCE_ICONS[entry.sourceType]} size={14} color={colors.textMuted} />
                  <Text style={styles.sourceLabel}>{entry.sourceTitle ?? entry.sourceType}</Text>
                  <Text style={styles.timeLabel}>· {timeAgo(entry.capturedAt)}</Text>
                </View>
                {isMined ? (
                  <View style={styles.minedBadge}>
                    <Icon name="SquareCheck" size={12} color={colors.primary} />
                    <Text style={styles.minedBadgeText}>{t('Mined')}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.entryText} numberOfLines={4}>
                „{entry.rawText}"
              </Text>

              <View style={styles.entryFooter}>
                <Text style={styles.charBadge}>
                  {charCount} {t('chars')}
                </Text>

                <View style={styles.entryActionGroup}>
                  <View style={styles.openHintRow}>
                    <Text style={styles.openHint}>{t('Study & Mine')}</Text>
                    <Icon name="ChevronRight" size={16} color={colors.primary} />
                  </View>
                  <IconButton
                    icon="Trash2"
                    size={18}
                    color={colors.danger}
                    onPress={() => discard.mutate(entry.id)}
                    disabled={discard.isPending}
                  />
                </View>
              </View>
            </Card>
          )
        })}
      </ScrollView>

      {captureFab}
      {captureModal}
      {helpButton}
      {helpSheet}
      {alertModal}

      <ConfirmModal
        visible={confirmClearSelected}
        title={t('Delete {{count}} passages?', { count: selected.length })}
        message={t('This removes the selected captured passages. Cards already mined from them are not affected.')}
        onCancel={() => setConfirmClearSelected(false)}
        onConfirm={() => {
          setConfirmClearSelected(false)
          deleteSelected.mutate(selected)
        }}
        confirmLabel={t('Delete')}
        destructive
      />

      <ConfirmModal
        visible={confirmClearAll}
        title={t('Clear all passages?')}
        message={t("This removes every captured passage shown here (this language pair only). Cards already mined from them aren't affected.")}
        onCancel={() => setConfirmClearAll(false)}
        onConfirm={() => {
          setConfirmClearAll(false)
          clearAll.mutate()
        }}
        confirmLabel={t('Clear All')}
        destructive
      />
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      padding: spacing.md,
      paddingBottom: 110,
      gap: spacing.sm,
    },
    emptyCentered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    overviewCard: {
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primarySoft,
      borderRadius: radius.lg,
      padding: spacing.xl,
      maxWidth: 420,
    },
    overviewIconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overviewTitle: {
      fontSize: type.subheading,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    overviewBody: {
      fontSize: type.caption,
      color: colors.textSecondary,
      lineHeight: 19,
      textAlign: 'center',
    },
    overviewBold: {
      fontWeight: '700',
      color: colors.primaryDark,
    },
    entryCard: {
      gap: spacing.xs,
    },
    entryCardMined: {
      backgroundColor: colors.successSoft,
      borderWidth: 1,
      borderColor: colors.success,
    },
    entryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    minedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.surface,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.full,
    },
    minedBadgeText: {
      fontSize: type.micro,
      fontWeight: '700',
      color: colors.success,
    },
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    toolbarLabel: {
      fontSize: type.caption,
      fontWeight: '600',
      color: colors.textMuted,
    },
    toolbarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flex: 1,
    },
    sourceLabel: {
      fontSize: type.micro,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'capitalize',
    },
    timeLabel: {
      fontSize: type.micro,
      color: colors.textMuted,
    },
    entryText: {
      fontSize: type.body,
      color: colors.text,
      lineHeight: 22,
      fontWeight: '500',
    },
    entryFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    charBadge: {
      fontSize: type.micro,
      color: colors.textMuted,
    },
    entryActionGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    openHintRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    openHint: {
      fontSize: type.caption,
      fontWeight: '600',
      color: colors.primary,
    },
    fab: {
      position: 'absolute',
      right: spacing.lg,
      bottom: 24,
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
      maxHeight: '85%',
    },
    modalScrollContent: {
      gap: spacing.md,
    },
    modalTitle: {
      fontSize: type.subheading,
      fontWeight: '700',
      color: colors.text,
    },
    modalHint: {
      fontSize: type.caption,
      color: colors.textSecondary,
      lineHeight: 18,
    },
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
    inputAtLimit: {
      borderColor: colors.warning,
    },
    modalInputToolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    charCounter: {
      fontSize: type.caption,
      color: colors.textMuted,
      fontWeight: '600',
    },
    charCounterLimit: {
      color: colors.warning,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.md,
    },
  })
