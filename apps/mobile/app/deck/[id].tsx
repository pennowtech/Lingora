import type { Deck, QuestionType } from '@lingora/types'
import {
  deleteDeck,
  getAllDecks,
  getCardCountForDeck,
  getCardsDueForReview,
  getCardsForDeck,
  getClozeCardCountForDeck,
  getDeckById,
  getDueCardsCount,
  getUniqueWordCountForDeck,
  mergeDecks,
  moveDeck,
  removeCardFromDeck,
  renameDeck,
  resetDeckProgress,
  type CardListItem,
  type DatabaseAdapter,
} from '@lingora/database'
import { logger } from '@lingora/observability'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useMemo, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  AlertModal,
  Button,
  Card,
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
import { Icon, type IconName } from '../../components/Icon'
import { ExportNameModal } from '../../components/ExportNameModal'
import { collectDescendantIds, getDeckQuestionTypes } from '@lingora/core'
import { QUESTION_TYPE_META } from '../../lib/reviewTypes'
import { defaultExportFileName, runExport, type ExportFormat } from '../../lib/export'
import { useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useTheme, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const MODE_META: Record<QuestionType, { label: string; icon: IconName }> = {
  vocab: { label: 'Vocab', icon: 'ArrowLeftRight' },
  reverse: { label: 'Reverse', icon: 'CornerUpLeft' },
  cloze: { label: 'Cloze', icon: 'Pencil' },
  trueFalse: { label: 'True/False', icon: 'CircleCheckBig' },
  mcq: { label: 'MCQ', icon: 'List' },
}

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
      'The three top boxes track your deck metrics at a glance:',
      '• **Cards**: Unique words multiplied by the review formats that actually have content to test - Cloze only counts here if the deck has real Cloze cards, so enabling Cloze mode on an import with none of it does not inflate this number.',
      '• **Unique**: Number of distinct vocabulary words / unique cards saved in this deck.',
      '• **Due**: Number of unique words/phrases scheduled and ready for review right now under spaced repetition - not raw cards. A word only leaves Due once every one of its review modes has actually been reviewed.',
      'Retention now lives on the Statistics screen (tap Stats from Home or a deck) alongside your full recall history, instead of repeating a global number on every deck.',
    ],
  },
  {
    id: 'status',
    title: 'Card status badges',
    icon: 'CircleCheckBig',
    paragraphs: [
      'Each word in the list below shows one of three statuses:',
      '• **Due**: New, or scheduled and ready for review right now.',
      '• **REV · Xh / Xd**: Reviewed - comes back due again in that many hours or days.',
      '• **Learned**: Reviewed with strong, mature retention.',
      'A word only moves from Due to REV once every one of its review modes has been answered in the same session - answering some formats and leaving others does not remove it from Due.',
    ],
  },
  {
    id: 'practice',
    title: 'Review',
    icon: 'Play',
    paragraphs: [
      'Review presents this deck\'s due words in every eligible format selected when the deck was created, such as word, reverse, cloze, true/false, or multiple choice.',
      'All of a word\'s formats - and any sibling card sharing that word - are reviewed together in the same session; a word is not marked reviewed and removed from Due until every one of them has been answered.',
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

function getCardReviewStatus(card: CardListItem, now: number): {
  type: 'due' | 'rev' | 'learned'
  label: string
} {
  const isDue =
    !card.state ||
    card.state === 'new' ||
    (card.nextReviewDate !== undefined && card.nextReviewDate <= now)
  if (isDue) {
    return { type: 'due', label: 'Due' }
  }

  // Mature / learned card: graduated with solid retention (e.g. state is review and stability >= 21 or reps >= 3)
  const isLearned = card.state === 'review' && ((card.stability ?? 0) >= 21 || (card.reps ?? 0) >= 3)
  if (isLearned) {
    return { type: 'learned', label: 'Learned' }
  }

  const msRemaining = (card.nextReviewDate ?? now) - now
  const days = Math.ceil(msRemaining / (24 * 60 * 60 * 1000))
  if (days <= 1) {
    const hours = Math.max(1, Math.ceil(msRemaining / (60 * 60 * 1000)))
    return { type: 'rev', label: `REV · ${hours}h` }
  }
  return { type: 'rev', label: `REV · ${days}d` }
}

async function loadDeckDetail(db: DatabaseAdapter, deckId: string) {
  const deck = await getDeckById(db, deckId)
  if (!deck) return null
  const [cardCount, dueCount, uniqueCount, clozeCardCount, cards, dueCards] = await Promise.all([
    getCardCountForDeck(db, deckId),
    getDueCardsCount(db, deckId),
    // Its own COUNT query, not cards.length below - getCardsForDeck pages its result for the
    // on-screen list, so relying on that array's length here silently understated "Unique" for
    // any deck with more words than one page.
    getUniqueWordCountForDeck(db, deckId),
    // Whether Cloze actually has any real content in this deck - see "Cards" below. Vocab/Reverse
    // always have content (every card gets a meaning) and mcq/trueFalse are generated live from
    // that same meaning data at review time, so Cloze is the one enabled mode that can be
    // completely unbacked (an import with no cloze markup at all, e.g.).
    getClozeCardCountForDeck(db, deckId),
    // This screen treats the full card list as already in memory (client-side sort, multi-select,
    // "N cards in deck" subtitle) - pass a high limit rather than the function's conservative
    // default so a large deck's list isn't silently truncated with no way to see the rest.
    getCardsForDeck(db, deckId, Number.MAX_SAFE_INTEGER),
    getCardsDueForReview(db, deckId),
  ])
  const dueCardIds = new Set(dueCards.map((c) => c.id))
  return { deck, cardCount, dueCount, uniqueCount, clozeCardCount, cards, dueCardIds }
}

/**
 * Deck detail: header stats, card list, rename/delete actions.
 */
export default function DeckDetailScreen(): JSX.Element {
  const insets = useSafeAreaInsets()
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0)
  const { id } = useLocalSearchParams<{ id: string }>()
  const { db } = useServices()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isDark = theme.mode === 'dark'
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const queryClient = useQueryClient()
  const help = useHelpAccordion('stats')
  const [sortBy, setSortBy] = useState<'due' | 'alpha' | 'recent'>('due')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
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

  const queryCards = deckQuery.data?.cards
  const now = Date.now()
  const sortedCards = useMemo(() => {
    if (!queryCards) return []
    const list = [...queryCards]
    if (sortBy === 'due') {
      return list.sort((a, b) => {
        const aDue = !a.state || a.state === 'new' || (a.nextReviewDate !== undefined && a.nextReviewDate <= now) ? 1 : 0
        const bDue = !b.state || b.state === 'new' || (b.nextReviewDate !== undefined && b.nextReviewDate <= now) ? 1 : 0
        if (aDue !== bDue) {
          return sortOrder === 'desc' ? bDue - aDue : aDue - bDue
        }
        const aTime = a.nextReviewDate ?? 0
        const bTime = b.nextReviewDate ?? 0
        if (aTime !== bTime) {
          return sortOrder === 'desc' ? bTime - aTime : aTime - bTime
        }
        return sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
      })
    }
    if (sortBy === 'alpha') {
      return list.sort((a, b) =>
        sortOrder === 'asc'
          ? a.form.localeCompare(b.form)
          : b.form.localeCompare(a.form)
      )
    }
    return list.sort((a, b) =>
      sortOrder === 'desc'
        ? b.createdAt - a.createdAt
        : a.createdAt - b.createdAt
    )
  }, [queryCards, now, sortBy, sortOrder])

  const handleSortPress = (field: 'due' | 'alpha' | 'recent') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder(field === 'alpha' ? 'asc' : 'desc')
    }
  }

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

  // One toggle button in the toolbar (see below) flips between these depending on whether
  // everything currently visible (sorted/filtered) is already selected. Both stay in select mode
  // (unlike Cancel below, which also exits it).
  const selectAllCards = (): void => {
    setSelectedCardIds(new Set(sortedCards.map((c) => c.cardId)))
  }
  const deselectAllCards = (): void => {
    setSelectedCardIds(new Set())
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
      <View style={[styles.container, { paddingTop: topInset }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.screenHeader}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('Go back')}
            style={styles.backButton}
          >
            <Icon name="ArrowLeft" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Spinner message={t('Loading deck...')} />
      </View>
    )
  }

  if (deckQuery.isError || !deckQuery.data) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.screenHeader}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('Go back')}
            style={styles.backButton}
          >
            <Icon name="ArrowLeft" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <ErrorState
          message={deckQuery.isError ? String(deckQuery.error) : t('This deck no longer exists.')}
          {...(deckQuery.isError && { onRetry: () => void deckQuery.refetch() })}
        />
      </View>
    )
  }

  const { deck, cardCount, dueCount, uniqueCount, clozeCardCount, cards } = deckQuery.data
  const questionTypes = getDeckQuestionTypes(deck)
  // "Cards" = unique words × enabled formats that actually have content to test - not just
  // however many formats the deck happens to be configured for. Vocab/Reverse and mcq/trueFalse
  // are always backed (every card has a real meaning, and mcq/trueFalse are generated live from
  // that same data), but Cloze is only real if the deck actually has Cloze content - enabling
  // Cloze mode on a deck imported with none of it shouldn't inflate this number for a format that
  // will never actually show up in review.
  const backedModeCount = questionTypes.filter((qt) => qt !== 'cloze' || clozeCardCount > 0).length
  const totalPracticeCards = uniqueCount * backedModeCount

  const allDecks = allDecksQuery.data ?? []
  const excludedIds = collectDescendantIds(allDecks, deck.id)
  excludedIds.add(deck.id)
  const pickerTargets = allDecks.filter((d) => !excludedIds.has(d.id))

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: topInset }]}>
        {/* ── Screen Header ── */}
        <View style={styles.screenHeader}>
          <View style={styles.headerLeftMeta}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('Go back')}
              style={styles.backButton}
            >
              <Icon name="ArrowLeft" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.deckName} numberOfLines={1}>
              {deck.name}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.actionIconBtn, styles.helpBtn]}
              onPress={() => help.openSection('stats')}
              accessibilityLabel={t('Help')}
            >
              <Text style={styles.helpBtnText}>?</Text>
            </Pressable>
            <Pressable
              testID="deck-menu-button"
              style={styles.actionIconBtn}
              onPress={() => setMenuOpen(true)}
              accessibilityLabel={t('Deck options')}
            >
              <Icon name="Ellipsis" size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* ── Scrollable Screen Canvas ──
            A FlatList, not a ScrollView+.map() - a big deck (hundreds of cards) used to mount
            every single row on open regardless of how many actually fit on screen; this only ever
            mounts what's visible plus a small window around it, same windowing DataTable.tsx
            already uses for Table View. Everything above the card list becomes the list header,
            so it scrolls away with the cards exactly as it did before; the multi-select bar/FAB/
            sheets below stay siblings of the list, unchanged. */}
        <FlatList
          style={styles.scrollContainer}
          contentContainerStyle={styles.scroll}
          data={sortedCards}
          keyExtractor={(card) => card.cardId}
          windowSize={7}
          maxToRenderPerBatch={20}
          initialNumToRender={20}
          removeClippedSubviews
          ItemSeparatorComponent={() => <View style={styles.cardRowSeparator} />}
          ListHeaderComponent={
            <View style={styles.listHeaderStack}>
              {/* ── 1. Editorial 4-Box Stats Card with Hairline Dividers ── */}
              <View style={styles.editorialStatsPanel}>
                <View style={styles.statCol}>
                  <Text style={styles.statDigit}>{totalPracticeCards}</Text>
                  <Text style={styles.statTag}>{t('Cards')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statDigit}>{uniqueCount}</Text>
                  <Text style={styles.statTag}>{t('Unique')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={[styles.statDigit, dueCount > 0 && styles.statDigitDue]}>
                    {dueCount}
                  </Text>
                  <Text style={styles.statTag}>{t('Due')}</Text>
                </View>
              </View>

              {/* ── 2. Active Review Modes Strip ── */}
              {questionTypes.length > 0 ? (
                <View style={styles.reviewModesStrip}>
                  <Text style={styles.modesStripTitle}>{t('Mode')}</Text>
                  <View style={styles.modesCapsulesGroup}>
                    {questionTypes.map((type) => {
                      const meta = MODE_META[type]
                      const iconName = meta?.icon
                      const tagTheme = getModeTagTheme(type, isDark)
                      if (!iconName) return null
                      return (
                        <View
                          key={type}
                          style={[
                            styles.miniCapsule,
                            { backgroundColor: tagTheme.bg, borderColor: tagTheme.border },
                          ]}
                        >
                          <Icon name={iconName} size={10.5} strokeWidth={2.4} color={tagTheme.text} />
                          <Text
                            style={[styles.miniCapsuleText, { color: tagTheme.text }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                          >
                            {t(meta?.label ?? type)}
                          </Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              ) : null}

              {/* ── 3. Full Row View "Review" Button (Exact Hero Action) ── */}
              {cardCount > 0 ? (
                <View style={styles.reviewHeroButtonRow}>
                  <Pressable
                    testID="deck-review-button"
                    style={({ pressed }) => [
                      styles.fullReviewBtn,
                      pressed && styles.fullReviewBtnPressed,
                    ]}
                    onPress={() =>
                      router.push({ pathname: '/review/[deckId]', params: { deckId: deck.id, mode: 'mixed' } })
                    }
                  >
                    <View style={styles.playIconBox}>
                      <Icon name="Play" size={10} color="#ffffff" />
                    </View>
                    <Text style={styles.fullReviewBtnText}>
                      {t('Start Review')}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {/* ── 4. Pro HUD Sorting Toolbar ── */}
              <View style={styles.hudSortingToolbar}>
                <Text style={styles.toolbarSectionTitle}>
                  {selectMode
                    ? t('{{count}} selected', { count: selectedCardIds.size })
                    : t('Cards')}
                </Text>
                {selectMode ? (
                  <Pressable
                    onPress={selectedCardIds.size >= sortedCards.length ? deselectAllCards : selectAllCards}
                    hitSlop={8}
                  >
                    <Text style={styles.selectAllAction}>
                      {selectedCardIds.size >= sortedCards.length ? t('Deselect All') : t('Select All')}
                    </Text>
                  </Pressable>
                ) : null}
                {!selectMode && cards.length > 1 ? (
                  <View style={styles.sortPillsCluster}>
                    <Pressable
                      onPress={() => handleSortPress('due')}
                      style={[styles.sortPill, sortBy === 'due' && styles.sortPillActive]}
                      accessibilityRole="button"
                      accessibilityLabel={`${t('Due Date')} (${sortOrder === 'desc' ? t('Descending') : t('Ascending')})`}
                    >
                      <Text
                        style={[
                          styles.sortPillText,
                          sortBy === 'due' && { color: isDark ? '#38bdf8' : colors.primary },
                        ]}
                      >
                        {t('Due Date')}
                      </Text>
                      {sortBy === 'due' ? (
                        <Icon
                          name={sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'}
                          size={10.5}
                          strokeWidth={2.4}
                          color={isDark ? '#38bdf8' : colors.primary}
                        />
                      ) : null}
                    </Pressable>
                    <Pressable
                      onPress={() => handleSortPress('alpha')}
                      style={[styles.sortPill, sortBy === 'alpha' && styles.sortPillActive]}
                      accessibilityRole="button"
                      accessibilityLabel={`${t('A–Z')} (${sortOrder === 'desc' ? t('Descending') : t('Ascending')})`}
                    >
                      <Text
                        style={[
                          styles.sortPillText,
                          sortBy === 'alpha' && { color: isDark ? '#38bdf8' : colors.primary },
                        ]}
                      >
                        {sortBy === 'alpha' && sortOrder === 'desc' ? t('Z–A') : t('A–Z')}
                      </Text>
                      {sortBy === 'alpha' ? (
                        <Icon
                          name={sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'}
                          size={10.5}
                          strokeWidth={2.4}
                          color={isDark ? '#38bdf8' : colors.primary}
                        />
                      ) : null}
                    </Pressable>
                    <Pressable
                      onPress={() => handleSortPress('recent')}
                      style={[styles.sortPill, sortBy === 'recent' && styles.sortPillActive]}
                      accessibilityRole="button"
                      accessibilityLabel={`${t('Recent')} (${sortOrder === 'desc' ? t('Descending') : t('Ascending')})`}
                    >
                      <Text
                        style={[
                          styles.sortPillText,
                          sortBy === 'recent' && { color: isDark ? '#38bdf8' : colors.primary },
                        ]}
                      >
                        {t('Recent')}
                      </Text>
                      {sortBy === 'recent' ? (
                        <Icon
                          name={sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'}
                          size={10.5}
                          strokeWidth={2.4}
                          color={isDark ? '#38bdf8' : colors.primary}
                        />
                      ) : null}
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          }
          renderItem={({ item: card }) => {
            const selected = selectedCardIds.has(card.cardId)
            const status = getCardReviewStatus(card, now)
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.editorialVocabCard,
                  pressed && styles.editorialVocabCardPressed,
                  selected && styles.editorialVocabCardSelected,
                ]}
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
                <View style={styles.vocabCardLeft}>
                  <View style={styles.wordTitleRow}>
                    <Text style={styles.cardHeadword}>{card.form}</Text>
                  </View>
                  {card.translation ? (
                    <Text style={styles.cardDefinition} numberOfLines={1}>
                      {card.translation}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.vocabCardRight}>
                  {status.type === 'due' ? (
                    <View style={styles.duePillTag}>
                      <Text style={styles.duePillText}>{t('Due')}</Text>
                    </View>
                  ) : status.type === 'learned' ? (
                    <View style={styles.okPillTag}>
                      <Text style={styles.okPillText}>{t('Learned')}</Text>
                    </View>
                  ) : (
                    <View style={styles.revPillTag}>
                      <Text style={styles.revPillText}>{status.label}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            )
          }}
          ListFooterComponent={
            cards.length === 0 ? <Text style={styles.footnote}>{t('No cards yet - add words from Search.')}</Text> : null
          }
        />

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
            <Icon name="Plus" size={26} color="#ffffff" />
          </Pressable>
        )}
      </View>

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

      <HelpAccordionSheet
        visible={help.visible}
        onClose={help.close}
        title={t('Deck Detail')}
        sections={HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={help.setSectionId}
        translate={t}
      />
    </>
  )
}

function getModeTagTheme(type: QuestionType, isDark: boolean) {
  if (isDark) {
    switch (type) {
      case 'cloze':
        return {
          bg: 'rgba(168, 85, 247, 0.22)',
          text: '#e9d5ff',
          border: 'rgba(192, 132, 252, 0.45)',
        }
      case 'vocab':
        return {
          bg: 'rgba(59, 130, 246, 0.22)',
          text: '#bfdbfe',
          border: 'rgba(147, 197, 253, 0.45)',
        }
      case 'reverse':
        return {
          bg: 'rgba(99, 102, 241, 0.22)',
          text: '#c7d2fe',
          border: 'rgba(165, 180, 252, 0.45)',
        }
      case 'mcq':
        return {
          bg: 'rgba(245, 158, 11, 0.22)',
          text: '#fde68a',
          border: 'rgba(252, 211, 77, 0.45)',
        }
      case 'trueFalse':
        return {
          bg: 'rgba(16, 185, 129, 0.22)',
          text: '#a7f3d0',
          border: 'rgba(110, 231, 183, 0.45)',
        }
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.2)',
          text: '#f1f5f9',
          border: 'rgba(148, 163, 184, 0.35)',
        }
    }
  }

  // Light theme: crisp, high-contrast, saturated borders and text
  switch (type) {
    case 'cloze':
      return {
        bg: 'rgba(168, 85, 247, 0.12)',
        text: '#6b21a8',
        border: 'rgba(168, 85, 247, 0.45)',
      }
    case 'vocab':
      return {
        bg: 'rgba(59, 130, 246, 0.12)',
        text: '#1d4ed8',
        border: 'rgba(59, 130, 246, 0.45)',
      }
    case 'reverse':
      return {
        bg: 'rgba(99, 102, 241, 0.12)',
        text: '#3730a3',
        border: 'rgba(99, 102, 241, 0.45)',
      }
    case 'mcq':
      return {
        bg: 'rgba(245, 158, 11, 0.14)',
        text: '#b45309',
        border: 'rgba(245, 158, 11, 0.45)',
      }
    case 'trueFalse':
      return {
        bg: 'rgba(16, 185, 129, 0.14)',
        text: '#047857',
        border: 'rgba(16, 185, 129, 0.45)',
      }
    default:
      return {
        bg: 'rgba(100, 116, 139, 0.1)',
        text: '#334155',
        border: 'rgba(100, 116, 139, 0.35)',
      }
  }
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContainer: { flex: 1 },
    // No `gap` here anymore - a FlatList's header/items/footer are all one flex column under this
    // contentContainerStyle, so a uniform gap would apply the same spacing between header-and-
    // first-card as between every pair of cards. listHeaderStack's own paddingBottom and
    // cardRowSeparator below reproduce the old (16px around sections, 9px between cards) split.
    scroll: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 90 },
    listHeaderStack: { gap: 16, paddingBottom: 16 },
    cardRowSeparator: { height: 9 },
    screenHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sm,
      paddingVertical: 10,
      backgroundColor: colors.background,
      minHeight: 56,
    },
    headerLeftMeta: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginRight: 12,
    },
    backButton: {
      padding: spacing.xs,
    },
    deckName: {
      flex: 1,
      fontSize: type.heading,
      fontWeight: '700',
      color: colors.text,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionIconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    helpBtn: {},
    helpBtnText: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.primary,
    },
    editorialStatsPanel: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingVertical: 14,
      paddingHorizontal: 6,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 2,
    },
    statCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      height: 28,
      backgroundColor: colors.border,
      alignSelf: 'center',
    },
    statDigit: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 21,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
      lineHeight: 25,
      marginBottom: 4,
    },
    statDigitDue: {
      color: colors.warning ?? '#f97316',
    },
    statTag: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    reviewModesStrip: {
      flexDirection: 'column',
      alignItems: 'stretch',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: 10,
      paddingHorizontal: 12,
      gap: 8,
    },
    modesStripTitle: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: colors.textMuted,
    },
    modesCapsulesGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 5,
      width: '100%',
    },
    miniCapsule: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1,
      minWidth: 0,
      gap: 3.5,
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    miniCapsuleText: {
      fontSize: 10.5,
      fontWeight: '700',
      flexShrink: 1,
    },
    reviewHeroButtonRow: {
      flexDirection: 'column',
      gap: 6,
    },
    fullReviewBtn: {
      width: '100%',
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 15,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 5,
    },
    fullReviewBtnPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    playIconBox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fullReviewBtnText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    hudSortingToolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      paddingHorizontal: 2,
    },
    toolbarSectionTitle: {
      fontSize: 13,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: colors.textSecondary,
    },
    selectAllAction: {
      fontSize: type.caption,
      fontWeight: '700',
      color: colors.primary,
    },
    sortPillsCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.full,
      padding: 3,
    },
    sortPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3.5,
      paddingVertical: 4,
      paddingHorizontal: 9,
      borderRadius: radius.full,
    },
    sortPillActive: {
      backgroundColor: colors.surfaceMuted,
    },
    sortPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    sortPillTextActive: {
      color: colors.primary,
    },
    editorialVocabCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: 13,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    editorialVocabCardPressed: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.primary,
    },
    editorialVocabCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    vocabCardLeft: {
      flex: 1,
      flexDirection: 'column',
      marginRight: spacing.md,
      gap: 2,
    },
    wordTitleRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    cardHeadword: {
      fontSize: 16.5,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
    },
    cardDefinition: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
      marginTop: 2,
    },
    vocabCardRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    duePillTag: {
      paddingVertical: 3,
      paddingHorizontal: 7,
      borderRadius: 6,
      backgroundColor: 'rgba(249, 115, 22, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(249, 115, 22, 0.3)',
    },
    duePillText: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 10,
      fontWeight: '800',
      color: colors.warning ?? '#f97316',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    okPillTag: {
      paddingVertical: 3,
      paddingHorizontal: 7,
      borderRadius: 6,
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    okPillText: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 10,
      fontWeight: '700',
      color: colors.success ?? '#10b981',
    },
    revPillTag: {
      paddingVertical: 3,
      paddingHorizontal: 7,
      borderRadius: 6,
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.35)',
    },
    revPillText: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 10,
      fontWeight: '700',
      color: colors.primary ?? '#38bdf8',
      letterSpacing: 0.3,
    },
    fab: {
      position: 'absolute',
      right: 22,
      bottom: 22,
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 5,
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
