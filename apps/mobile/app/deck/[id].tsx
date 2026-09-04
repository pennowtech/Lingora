import type { Deck } from '@lingora/types'
import {
  deleteDeck,
  getAllDecks,
  getCardCountForDeck,
  getCardsForDeck,
  getDeckById,
  getDueCardsCount,
  getRetentionRate,
  mergeDecks,
  moveDeck,
  removeCardFromDeck,
  renameDeck,
  resetDeckProgress,
  type DatabaseAdapter,
} from '@lingora/database'
import { logger } from '@lingora/observability'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  AlertModal,
  Button,
  Card,
  CefrBadge,
  ConfirmModal,
  ErrorState,
  ExportFormatSheet,
  IconButton,
  ImportFormatSheet,
  SectionHeader,
  Spinner,
  type ImportFormat,
} from '../../components/ui'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { Icon } from '../../components/Icon'
import { ExportNameModal } from '../../components/ExportNameModal'
import { collectDescendantIds } from '@lingora/core'
import { defaultExportFileName, runExport, type ExportFormat } from '../../lib/export'
import { useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'export', screen: 'DeckDetailScreen' })

const IMPORT_ROUTES: Record<ImportFormat, '/settings/csv-import' | '/settings/apkg-import' | '/settings/lem-import'> = {
  csv: '/settings/csv-import',
  apkg: '/settings/apkg-import',
  lem: '/settings/lem-import',
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'stats',
    title: 'The stats row',
    icon: 'ChartColumn',
    paragraphs: [
      'Cards is everything in this deck; due now is the number of cards ready for their next review, and retention shows recent recall across your collection.',
    ],
  },
  {
    id: 'practice',
    title: 'Review',
    icon: 'Play',
    paragraphs: [
      'Review presents this deck\'s due cards in every eligible format selected when the deck was created, such as word, reverse, cloze, true/false, or multiple choice.',
    ],
  },
  {
    id: 'menu',
    title: 'The "..." menu',
    icon: 'Ellipsis',
    paragraphs: [
      'Rename, move, change review modes, export, reset progress, or delete this deck - delete always asks for confirmation first.',
    ],
  },
]

async function loadDeckDetail(db: DatabaseAdapter, deckId: string) {
  const deck = await getDeckById(db, deckId)
  if (!deck) return null
  const [cardCount, dueCount, retention, cards] = await Promise.all([
    getCardCountForDeck(db, deckId),
    getDueCardsCount(db, deckId),
    getRetentionRate(db, 30), // global for now — per-deck retention lands with Phase 5 stats
    getCardsForDeck(db, deckId),
  ])
  return { deck, cardCount, dueCount, retention, cards }
}

/**
 * Deck detail: header stats, card list, rename/delete actions.
 */
export default function DeckDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { db } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const queryClient = useQueryClient()
  const help = useHelpAccordion('stats')
  const [menuOpen, setMenuOpen] = useState(false)
  const [importSheetOpen, setImportSheetOpen] = useState(false)
  const [exportSheetOpen, setExportSheetOpen] = useState(false)
  const [exportPending, setExportPending] = useState<ExportFormat | null>(null)
  const [exportNotice, setExportNotice] = useState<{ title: string; message: string } | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  // 'move' re-parents this deck (nesting); 'merge' folds this deck's cards
  // into another deck and deletes this one. Both share one deck-picker
  // modal, distinguished by this mode.
  const [pickerMode, setPickerMode] = useState<'move' | 'merge' | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [removeSelectedConfirmOpen, setRemoveSelectedConfirmOpen] = useState(false)
  const [mergeConfirmTarget, setMergeConfirmTarget] = useState<Deck | null>(null)
  const showError = (title: string, error: unknown): void => setExportNotice({ title, message: String(error) })

  const deckQuery = useQuery({
    queryKey: ['deck', id],
    queryFn: () => loadDeckDetail(db, id ?? ''),
    enabled: (id ?? '') !== '',
  })

  const allDecksQuery = useQuery({
    queryKey: ['decks'],
    queryFn: () => getAllDecks(db),
    enabled: pickerMode !== null,
  })

  const rename = useMutation({
    mutationFn: async () => {
      const name = renameValue.trim()
      if (name === '') throw new Error(t('Give the deck a name.'))
      await renameDeck(db, id, name)
    },
    onSuccess: async () => {
      setRenameOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['deck', id] })
      await queryClient.invalidateQueries({ queryKey: ['deck-counts'] })
    },
  })

  const remove = useMutation({
    mutationFn: () => deleteDeck(db, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      router.back()
    },
    onError: (error: unknown) => showError(t('Could not delete deck'), error),
  })

  const confirmDelete = (): void => {
    setMenuOpen(false)
    setDeleteConfirmOpen(true)
  }

  const move = useMutation({
    mutationFn: (newParentId: string | null) => moveDeck(db, id, newParentId),
    onSuccess: async () => {
      setPickerMode(null)
      await queryClient.invalidateQueries({ queryKey: ['deck', id] })
      await queryClient.invalidateQueries({ queryKey: ['decks'] })
    },
    onError: (error: unknown) => showError(t('Could not move deck'), error),
  })

  const merge = useMutation({
    mutationFn: (targetDeckId: string) => mergeDecks(db, id, targetDeckId),
    onSuccess: async () => {
      setPickerMode(null)
      await queryClient.invalidateQueries()
      router.back()
    },
    onError: (error: unknown) => showError(t('Could not merge deck'), error),
  })

  const resetProgress = useMutation({
    mutationFn: () => resetDeckProgress(db, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
    },
    onError: (error: unknown) => showError(t('Could not reset progress'), error),
  })

  const removeCards = useMutation({
    mutationFn: async (cardIds: string[]) => {
      for (const cardId of cardIds) {
        await removeCardFromDeck(db, id, cardId)
      }
    },
    onSuccess: async () => {
      setSelectMode(false)
      setSelectedCardIds(new Set())
      await queryClient.invalidateQueries({ queryKey: ['deck', id] })
      await queryClient.invalidateQueries({ queryKey: ['deck-counts'] })
    },
    onError: (error: unknown) => showError(t('Could not remove card'), error),
  })

  const toggleCardSelected = (cardId: string): void => {
    setSelectMode(true)
    setSelectedCardIds((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }

  const cancelSelectMode = (): void => {
    setSelectMode(false)
    setSelectedCardIds(new Set())
  }

  const confirmRemoveSelected = (): void => {
    setRemoveSelectedConfirmOpen(true)
  }

  const confirmResetProgress = (): void => {
    setMenuOpen(false)
    setResetConfirmOpen(true)
  }

  const showMove = (): void => {
    setMenuOpen(false)
    setPickerMode('move')
  }

  const showMerge = (): void => {
    setMenuOpen(false)
    setPickerMode('merge')
  }

  const handlePickTarget = (target: Deck): void => {
    if (pickerMode === 'move') {
      move.mutate(target.id)
      return
    }
    if (pickerMode === 'merge') {
      setMergeConfirmTarget(target)
    }
  }

  const showImport = (): void => {
    setMenuOpen(false)
    setImportSheetOpen(true)
  }

  const handleImportSelect = (format: ImportFormat): void => {
    setImportSheetOpen(false)
    router.push({
      pathname: IMPORT_ROUTES[format],
      params: { deckId: id },
    })
  }

  const runDeckExport = (format: ExportFormat, fileName: string): void => {
    if (!deckQuery.data) return
    runExport(db, format, { deckId: id, deckName: deckQuery.data.deck.name, fileName })
      .then(({ itemCount, outcome }) =>
        setExportNotice({
          title: t('Export ready'),
          message: `${t('Exported {{count}} cards.', { count: itemCount.toLocaleString() })}${outcome === 'device' ? ` ${t('Saved to the folder you chose.')}` : ` ${t('Choose where to save it.')}`}`,
        }),
      )
      .catch((error: unknown) => {
        log.error('export.deck_export_failed', error, { message: 'Deck export failed' })
        setExportNotice({ title: t('Export failed'), message: String(error) })
      })
  }

  const showExport = (): void => {
    setMenuOpen(false)
    setExportSheetOpen(true)
  }

  // Picking a format opens the file-name prompt next — see decks.tsx's identical handler.
  const handleExportSelect = (format: ExportFormat): void => {
    setExportSheetOpen(false)
    setExportPending(format)
  }

  if (deckQuery.isPending) {
    return (
      <>
        <Stack.Screen options={{ title: t('Deck') }} />
        <Spinner />
      </>
    )
  }

  if (deckQuery.isError || !deckQuery.data) {
    return (
      <>
        <Stack.Screen options={{ title: t('Deck') }} />
        <ErrorState
          message={deckQuery.isError ? String(deckQuery.error) : t('This deck no longer exists.')}
          {...(deckQuery.isError && { onRetry: () => void deckQuery.refetch() })}
        />
      </>
    )
  }

  const { deck, cardCount, dueCount, retention, cards } = deckQuery.data

  const allDecks = allDecksQuery.data ?? []
  const excludedIds = collectDescendantIds(allDecks, deck.id)
  excludedIds.add(deck.id)
  const pickerTargets = allDecks.filter((d) => !excludedIds.has(d.id))

  return (
    <>
      <Stack.Screen
        options={{
          title: deck.name,
          headerRight: () => (
            <View style={styles.headerActions}>
              <IconButton icon="CircleQuestionMark" size={24} color={colors.primary} onPress={() => help.openSection('stats')} />
              <IconButton testID="deck-menu-button" icon="Ellipsis" onPress={() => setMenuOpen(true)} />
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{cardCount}</Text>
            <Text style={styles.statLabel}>{t('cards')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{dueCount}</Text>
            <Text style={styles.statLabel}>{t('due now')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {Math.round(retention * 100)}%
            </Text>
            <Text style={styles.statLabel}>{t('retention')}</Text>
          </Card>
        </View>

        {/* One clear entry point: the review session expands every due card into the formats saved
            on this deck at creation time, skipping formats that are not eligible for that card. */}
        {cardCount > 0 ? (
          <Button
            testID="deck-review-button"
            label={t('Review')}
            icon="Play"
            onPress={() =>
              router.push({ pathname: '/review/[deckId]', params: { deckId: deck.id, mode: 'mixed' } })
            }
            style={styles.reviewButton}
          />
        ) : null}

        <SectionHeader
          title={selectMode ? t('{{count}} selected', { count: selectedCardIds.size }) : t('Cards')}
        />
        {cards.map((card) => {
          const selected = selectedCardIds.has(card.cardId)
          return (
            <Card
              key={card.cardId}
              style={styles.cardRow}
              // Opens like a review card (tap-to-flip word/meaning, and a header toggle to the
              // cloze view too if this word has one) rather than the full word management page —
              // this is "look at this card the way I'd study it", not "edit this card". Long-press
              // enters multi-select (mirrors the deck list's own selection pattern); once in select
              // mode, a normal tap toggles selection instead of opening the card.
              onPress={() =>
                selectMode
                  ? toggleCardSelected(card.cardId)
                  : router.push({ pathname: '/review/[deckId]', params: { deckId: deck.id, cardId: card.cardId } })
              }
              onLongPress={() => toggleCardSelected(card.cardId)}
            >
              {selectMode ? (
                <View style={[styles.checkbox, selected ? styles.checkboxChecked : null]}>
                  {selected ? <Icon name="Check" size={14} color={colors.textOnPrimary} /> : null}
                </View>
              ) : null}
              <View style={styles.cardRowText}>
                <Text style={styles.cardForm}>{card.form}</Text>
                {card.translation ? <Text style={styles.cardMeaning}>{card.translation}</Text> : null}
              </View>
              <View style={styles.cardRowRight}>
                {card.hasCloze ? (
                  <View style={styles.clozeBadge}>
                    <Icon name="SquarePen" size={12} color={colors.warning} />
                  </View>
                ) : null}
                {card.cefrLevel ? <CefrBadge level={card.cefrLevel} /> : null}
                {selectMode ? null : <Icon name="ChevronRight" size={16} color={colors.textMuted} />}
              </View>
            </Card>
          )
        })}
        {cards.length === 0 ? (
          <Text style={styles.footnote}>{t('No cards yet - add words from Search.')}</Text>
        ) : null}
      </ScrollView>

      {selectMode ? (
        <View style={styles.selectionBar}>
          <Pressable onPress={cancelSelectMode} hitSlop={8}>
            <Text style={styles.selectionCancel}>{t('Cancel')}</Text>
          </Pressable>
          <Button
            testID="bulk-delete-cards-button"
            label={removeCards.isPending ? t('Removing...') : t('Remove {{count}}', { count: selectedCardIds.size })}
            icon="Trash2"
            variant="danger"
            small
            onPress={confirmRemoveSelected}
            disabled={removeCards.isPending || selectedCardIds.size === 0}
          />
        </View>
      ) : null}

      {selectMode ? null : (
        <Pressable
          testID="add-card-fab"
          style={styles.fab}
          onPress={() => router.push({ pathname: '/deck/add-card', params: { deckId: id } })}
        >
          <Icon name="Plus" size={28} color={colors.textOnPrimary} />
        </Pressable>
      )}

      {/* ── Deck actions menu ── */}
      <Modal visible={menuOpen} animationType="fade" transparent onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuOpen(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>{deck.name}</Text>
            <Text style={styles.menuSubtitle}>{t('{{count}} cards in deck', { count: cards.length })}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalSheetScrollContent}>
          {/* Quick Action Grid (2x2) */}
          <View style={styles.menuActionGrid}>
            <Pressable
              style={styles.gridActionTile}
              onPress={() => {
                setMenuOpen(false)
                router.push({ pathname: '/deck/add-card', params: { deckId: id } })
              }}
            >
              <View style={styles.gridActionIcon}>
                <Icon name="CirclePlus" size={20} color={colors.primary} />
              </View>
              <Text style={styles.gridActionLabel}>{t('Add Card')}</Text>
            </Pressable>

            <Pressable
              style={styles.gridActionTile}
              onPress={() => {
                setMenuOpen(false)
                router.push({ pathname: '/deck/table', params: { deckId: deck.id, deckName: deck.name } })
              }}
            >
              <View style={styles.gridActionIcon}>
                <Icon name="LayoutGrid" size={20} color={colors.primary} />
              </View>
              <Text style={styles.gridActionLabel}>{t('Table View')}</Text>
            </Pressable>

            <Pressable style={styles.gridActionTile} onPress={showImport}>
              <View style={styles.gridActionIcon}>
                <Icon name="Download" size={20} color={colors.primary} />
              </View>
              <Text style={styles.gridActionLabel}>{t('Import')}</Text>
            </Pressable>

            <Pressable style={styles.gridActionTile} onPress={showExport}>
              <View style={styles.gridActionIcon}>
                <Icon name="CloudDownload" size={20} color={colors.primary} />
              </View>
              <Text style={styles.gridActionLabel}>{t('Export')}</Text>
            </Pressable>
          </View>

          {/* Sleek Row Menu Group */}
          <View style={styles.menuListGroup}>
            <Pressable
              style={styles.menuRowItem}
              onPress={() => {
                setMenuOpen(false)
                setSelectMode(true)
              }}
            >
              <Icon name="CircleCheckBig" size={18} color={colors.textSecondary} />
              <Text style={styles.menuRowLabel}>{t('Select cards')}</Text>
              <Icon name="ChevronRight" size={14} color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={styles.menuRowItem}
              onPress={() => {
                setMenuOpen(false)
                setRenameValue(deck.name)
                setRenameOpen(true)
              }}
            >
              <Icon name="Pencil" size={18} color={colors.textSecondary} />
              <Text style={styles.menuRowLabel}>{t('Rename deck')}</Text>
              <Icon name="ChevronRight" size={14} color={colors.textMuted} />
            </Pressable>

            <Pressable style={styles.menuRowItem} onPress={showMove}>
              <Icon name="FolderOpen" size={18} color={colors.textSecondary} />
              <Text style={styles.menuRowLabel}>{t('Move deck')}</Text>
              <Icon name="ChevronRight" size={14} color={colors.textMuted} />
            </Pressable>

            <Pressable style={styles.menuRowItem} onPress={showMerge}>
              <Icon name="GitMerge" size={18} color={colors.textSecondary} />
              <Text style={styles.menuRowLabel}>{t('Merge into another deck')}</Text>
              <Icon name="ChevronRight" size={14} color={colors.textMuted} />
            </Pressable>

            <Pressable style={styles.menuRowItem} onPress={confirmResetProgress} disabled={resetProgress.isPending}>
              <Icon name="RefreshCw" size={18} color={colors.warning} />
              <Text style={[styles.menuRowLabel, { color: colors.warning }]}>
                {resetProgress.isPending ? t('Resetting...') : t('Reset progress')}
              </Text>
            </Pressable>

            <Pressable style={[styles.menuRowItem, styles.menuRowItemLast]} onPress={confirmDelete} disabled={remove.isPending}>
              <Icon name="Trash2" size={18} color={colors.danger} />
              <Text style={[styles.menuRowLabel, { color: colors.danger }]}>
                {remove.isPending ? t('Deleting...') : t('Delete deck')}
              </Text>
            </Pressable>
          </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Rename centered dialog popup window ── */}
      <Modal visible={renameOpen} animationType="fade" transparent onRequestClose={() => setRenameOpen(false)}>
        <KeyboardAvoidingView
          style={styles.centerModalKeyboardAvoider}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdropAbsolute} onPress={() => setRenameOpen(false)} />
          <View style={styles.centerModalCard}>
            <Text style={styles.modalTitle}>{t('Rename deck')}</Text>
            <TextInput
              testID="rename-deck-input"
              style={styles.inputField}
              value={renameValue}
              onChangeText={setRenameValue}
              autoFocus
            />
            {rename.isError ? <Text style={styles.errorLabel}>{String(rename.error)}</Text> : null}
            <View style={styles.centerModalActions}>
              <Button label={t('Cancel')} variant="ghost" onPress={() => setRenameOpen(false)} disabled={rename.isPending} />
              <Button
                label={rename.isPending ? t('Saving...') : t('Save')}
                disabled={rename.isPending || renameValue.trim() === ''}
                onPress={() => rename.mutate()}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Move/merge deck picker centered dialog popup window ── */}
      <Modal visible={pickerMode !== null} animationType="fade" transparent onRequestClose={() => setPickerMode(null)}>
        <KeyboardAvoidingView
          style={styles.centerModalKeyboardAvoider}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdropAbsolute} onPress={() => setPickerMode(null)} />
          <View style={styles.centerModalCard}>
            <Text style={styles.modalTitle}>
              {pickerMode === 'move'
                ? t('Move "{{name}}" to...', { name: deck.name })
                : t('Merge "{{name}}" into...', { name: deck.name })}
            </Text>
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {pickerMode === 'move' ? (
                <Pressable
                  style={styles.deckRow}
                  onPress={() => move.mutate(null)}
                  disabled={move.isPending || deck.parentId === undefined}
                >
                  <Icon name="LayoutGrid" size={18} color={colors.textSecondary} />
                  <Text style={styles.deckRowLabel}>{t('Top level (no parent)')}</Text>
                </Pressable>
              ) : null}
              {allDecksQuery.isPending ? (
                <Spinner />
              ) : allDecksQuery.isError ? (
                <ErrorState message={String(allDecksQuery.error)} onRetry={() => void allDecksQuery.refetch()} />
              ) : pickerTargets.length === 0 ? (
                <Text style={styles.hint}>
                  {pickerMode === 'move'
                    ? t('No other deck to nest this one under.')
                    : t('No other deck to merge into.')}
                </Text>
              ) : (
                pickerTargets.map((target) => (
                  <Pressable
                    key={target.id}
                    style={styles.deckRow}
                    onPress={() => handlePickTarget(target)}
                    disabled={move.isPending || merge.isPending}
                  >
                    <Icon name="BookOpen" size={18} color={colors.primary} />
                    <Text style={styles.deckRowLabel}>{target.name}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
            {move.isError ? <Text style={styles.errorLabel}>{String(move.error)}</Text> : null}
            {merge.isError ? <Text style={styles.errorLabel}>{String(merge.error)}</Text> : null}
            <View style={styles.centerModalActions}>
              <Button label={t('Cancel')} variant="ghost" onPress={() => setPickerMode(null)} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ImportFormatSheet
        visible={importSheetOpen}
        onClose={() => setImportSheetOpen(false)}
        onSelect={handleImportSelect}
        title={t('Import into "{{name}}"', { name: deck.name })}
      />

      <ExportFormatSheet
        visible={exportSheetOpen}
        onClose={() => setExportSheetOpen(false)}
        onSelect={handleExportSelect}
        title={t('Export "{{name}}"', { name: deck.name })}
      />

      <ExportNameModal
        visible={exportPending !== null}
        defaultName={defaultExportFileName(deck.name)}
        onCancel={() => setExportPending(null)}
        onConfirm={(fileName) => {
          const format = exportPending
          setExportPending(null)
          if (format) runDeckExport(format, fileName)
        }}
      />

      <AlertModal
        visible={exportNotice !== null}
        title={exportNotice?.title ?? ''}
        message={exportNotice?.message ?? ''}
        onClose={() => setExportNotice(null)}
      />

      <ConfirmModal
        visible={deleteConfirmOpen}
        title={t('Delete deck?')}
        message={t('Cards that are only in this deck are deleted with it. Cards in other decks stay there.')}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false)
          remove.mutate()
        }}
        confirmLabel={t('Delete')}
        destructive
      />

      <ConfirmModal
        visible={resetConfirmOpen}
        title={t('Reset progress?')}
        message={t('Every card in this deck goes back to "new" - word-meaning review and cloze practice both restart from scratch. Your review history is kept. This cannot be undone.')}
        onCancel={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          setResetConfirmOpen(false)
          resetProgress.mutate()
        }}
        confirmLabel={t('Reset')}
        destructive
      />

      <ConfirmModal
        visible={removeSelectedConfirmOpen}
        title={t('Remove {{count}} cards from this deck?', { count: selectedCardIds.size })}
        message={t('This only removes them from this deck - cards that live in other decks too stay there.')}
        onCancel={() => setRemoveSelectedConfirmOpen(false)}
        onConfirm={() => {
          setRemoveSelectedConfirmOpen(false)
          removeCards.mutate(Array.from(selectedCardIds))
        }}
        confirmLabel={t('Remove')}
        destructive
      />

      <ConfirmModal
        visible={mergeConfirmTarget !== null}
        title={mergeConfirmTarget ? t('Merge into "{{name}}"?', { name: mergeConfirmTarget.name }) : ''}
        message={
          mergeConfirmTarget
            ? t('This deletes "{{source}}" and moves all its cards into "{{target}}". This cannot be undone.', {
                source: deckQuery.data?.deck.name ?? t('this deck'),
                target: mergeConfirmTarget.name,
              })
            : ''
        }
        onCancel={() => setMergeConfirmTarget(null)}
        onConfirm={() => {
          const target = mergeConfirmTarget
          setMergeConfirmTarget(null)
          if (target) merge.mutate(target.id)
        }}
        confirmLabel={t('Merge')}
        destructive
      />
    </>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    fab: {
      position: 'absolute',
      right: spacing.xl,
      bottom: spacing.xl,
      width: 56,
      height: 56,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    statsRow: { flexDirection: 'row', gap: spacing.sm },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
    statValue: { fontSize: type.heading, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: type.micro, color: colors.textSecondary, marginTop: 2 },
    reviewButton: { marginTop: spacing.lg },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      paddingVertical: spacing.md,
    },
    cardRowText: { flex: 1, marginRight: spacing.md },
    cardForm: { fontSize: type.body, fontWeight: '700', color: colors.text },
    cardMeaning: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
    cardRowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    clozeBadge: {
      width: 20,
      height: 20,
      borderRadius: radius.full,
      backgroundColor: colors.warningSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footnote: { fontSize: type.micro, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: radius.full,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
    selectionBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    selectionCancel: { fontSize: type.body, fontWeight: '700', color: colors.textSecondary },
    modalBackdrop: { flex: 1, backgroundColor: '#00000066' },
    modalSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.xl,
      gap: spacing.md,
      maxHeight: '85%',
    },
    modalSheetScrollContent: { gap: spacing.md },
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
    deckRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
    deckRowLabel: { flex: 1, fontSize: type.body, fontWeight: '600', color: colors.text },
    deckEmoji: { fontSize: 20 },
    hint: { fontSize: type.caption, color: colors.textMuted, paddingVertical: spacing.md },
    menuHeader: { alignItems: 'center', marginBottom: spacing.xs },
    menuTitle: { fontSize: type.subheading, fontWeight: '800', color: colors.text, textAlign: 'center' },
    menuSubtitle: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
    menuActionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
    gridActionTile: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      gap: spacing.xs,
    },
    gridActionIcon: {
      width: 38,
      height: 38,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridActionLabel: { fontSize: type.caption, fontWeight: '700', color: colors.text },
    menuListGroup: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      overflow: 'hidden',
      marginTop: spacing.sm,
    },
    menuRowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuRowItemLast: { borderBottomWidth: 0 },
    menuRowLabel: { flex: 1, fontSize: type.body, fontWeight: '600', color: colors.text },
    centerModalKeyboardAvoider: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    centerModalCard: {
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.xl,
      gap: spacing.md,
    },
    centerModalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
    modalBackdropAbsolute: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00000066' },
  })
