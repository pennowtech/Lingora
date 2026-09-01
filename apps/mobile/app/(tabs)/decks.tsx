import type { Deck, QuestionType } from '@lingora/types'
import {
  createDeck,
  deleteDeck,
  getAllDecks,
  getDeckCounts,
  getDueCardsCount,
  getRetentionRate,
  getTotalCardCount,
  mergeDecks,
  moveDeck,
  renameDeck,
  resetDeckProgress,
  type DatabaseAdapter,
} from '@lingora/database'
import { logger } from '@lingora/observability'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useFocusEffect } from 'expo-router'
import { useCallback, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { Icon } from '../../components/Icon'
import { DeckPickerModal } from '../../components/DeckPickerModal'
import { ExportNameModal } from '../../components/ExportNameModal'
import { ReviewModesPicker } from '../../components/ReviewModesPicker'
import { DEFAULT_ENABLED_QUESTION_TYPES, QUESTION_TYPE_META, toggleQuestionType } from '../../lib/reviewTypes'
import {
  AlertModal,
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  ErrorState,
  ExportFormatSheet,
  IconButton,
  ImportFormatSheet,
  Spinner,
  type ImportFormat,
} from '../../components/ui'
import { CloudSyncNotConfiguredError, requestCloudSync, useCloudSync } from '../../lib/cloudSync'
import { collectDescendantIds } from '@lingora/core'
import { defaultExportFileName, runExport, type ExportFormat } from '../../lib/export'
import { useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'export', screen: 'DecksScreen' })

const IMPORT_ROUTES: Record<ImportFormat, '/settings/csv-import' | '/settings/apkg-import' | '/settings/lem-import'> = {
  csv: '/settings/csv-import',
  apkg: '/settings/apkg-import',
  lem: '/settings/lem-import',
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'nesting',
    title: 'Decks and sub-decks',
    icon: 'Layers',
    paragraphs: [
      'Decks can be nested - a deck moved under another shows indented in this list. Card counts on a parent deck include everything in its children.',
      'Tap a deck to open it; the "+" button creates a new one, or adds a card/imports a file into an existing one.',
    ],
  },
  {
    id: 'menu',
    title: 'The "..." menu',
    icon: 'EllipsisVertical',
    paragraphs: [
      'Long-press or tap the "..." on a deck for rename, move, merge, export, reset progress, and delete - delete always asks for confirmation first.',
    ],
  },
  {
    id: 'modes',
    title: 'Review modes',
    icon: 'SquareCheck',
    paragraphs: [
      'Each deck uses its own mix of review formats (word, reverse, cloze, true/false, multiple choice). Choose them when creating the deck, and Review will include every selected format that the card can support.',
      '**True/false requires at least 1 other saved card** and **multiple choice requires at least 3 other saved cards** to provide meaningful wrong answers. Those cards can come from any deck. A format is skipped when there are not enough suitable cards yet.',
      '**True/false and multiple choice are graded automatically:** a correct answer counts as **Good**, and an incorrect answer counts as **Again**. They do not show the Again, Hard, Good, and Easy rating buttons.',
    ],
  },
]

/** A deck with its computed counts and resolved children. */
interface DeckNode {
  deck: Deck
  cardCount: number
  dueCount: number
  children: DeckNode[]
}

interface DecksTreeStats {
  tree: DeckNode[]
  totalCards: number
  totalDue: number
  totalDecks: number
  retentionRate: number
}

async function loadDeckTreeWithStats(db: DatabaseAdapter): Promise<DecksTreeStats> {
  const [decks, counts, totalCards, totalDue, retentionRate] = await Promise.all([
    getAllDecks(db),
    getDeckCounts(db),
    getTotalCardCount(db),
    getDueCardsCount(db),
    getRetentionRate(db, 30),
  ])
  const countByDeck = new Map(counts.map((c) => [c.deckId, c]))

  const toNode = (deck: Deck): DeckNode => ({
    deck,
    cardCount: countByDeck.get(deck.id)?.cardCount ?? 0,
    dueCount: countByDeck.get(deck.id)?.dueCount ?? 0,
    children: decks.filter((d) => d.parentId === deck.id).map(toNode),
  })

  return {
    tree: decks.filter((d) => !d.parentId).map(toNode),
    totalCards,
    totalDue,
    totalDecks: decks.length,
    retentionRate,
  }
}

/**
 * Deck list with nesting and due badges; the FAB creates a deck. Each row's
 * "⋮" menu offers import/export/rename/delete for that specific deck.
 */
export default function DecksScreen(): JSX.Element {
  const { db } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const queryClient = useQueryClient()
  const sync = useCloudSync()
  const help = useHelpAccordion('nesting')
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  // Which review formats the new deck practices with - defaults to the same starting point as
  // Settings -> Learning's global picker, overridable per deck right here at creation time.
  const [newQuestionTypes, setNewQuestionTypes] = useState<QuestionType[]>([...DEFAULT_ENABLED_QUESTION_TYPES])
  const [menuDeck, setMenuDeck] = useState<Deck | null>(null)
  const [importDeck, setImportDeck] = useState<Deck | null>(null)
  const [exportDeck, setExportDeck] = useState<Deck | null>(null)
  const [exportPending, setExportPending] = useState<{ deck: Deck; format: ExportFormat } | null>(null)
  const [exportNotice, setExportNotice] = useState<{ title: string; message: string } | null>(null)
  const [renameDeckTarget, setRenameDeckTarget] = useState<Deck | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [pickerDeck, setPickerDeck] = useState<Deck | null>(null)
  const [pickerMode, setPickerMode] = useState<'move' | 'merge' | null>(null)
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [addCardPickerOpen, setAddCardPickerOpen] = useState(false)
  const [importPickerOpen, setImportPickerOpen] = useState(false)
  const [deleteConfirmDeck, setDeleteConfirmDeck] = useState<Deck | null>(null)
  const [resetConfirmDeck, setResetConfirmDeck] = useState<Deck | null>(null)
  const [mergeConfirmTarget, setMergeConfirmTarget] = useState<Deck | null>(null)
  const showError = (title: string, error: unknown): void => setExportNotice({ title, message: String(error) })

  const decksQuery = useQuery({ queryKey: ['deck-counts'], queryFn: () => loadDeckTreeWithStats(db) })
  const allDecksQuery = useQuery({
    queryKey: ['decks'],
    queryFn: () => getAllDecks(db),
    enabled: pickerDeck !== null,
  })

  useFocusEffect(
    useCallback(() => {
      void decksQuery.refetch()
    }, []),
  )

  const invalidateDecks = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['deck-counts'] })
    await queryClient.invalidateQueries({ queryKey: ['decks'] })
    await queryClient.invalidateQueries({ queryKey: ['home-stats'] })
  }

  const create = useMutation({
    mutationFn: async () => {
      const name = newName.trim()
      if (name === '') throw new Error(t('Give the deck a name.'))
      const now = Date.now()
      await createDeck(db, {
        id: crypto.randomUUID(),
        name,
        enabledQuestionTypes: newQuestionTypes,
        createdAt: now,
        updatedAt: now,
      })
    },
    onSuccess: async () => {
      setCreateOpen(false)
      setNewName('')
      setNewQuestionTypes([...DEFAULT_ENABLED_QUESTION_TYPES])
      await invalidateDecks()
    },
  })

  // Backs the "Add card" menu item's deck picker — creating a deck here (rather than reusing
  // `create` above, which is wired to the "New deck" modal's own open/close state) goes straight
  // on to the add-card screen instead of just closing the picker, since the whole point of this
  // flow is getting a card written, not just having a deck to put it in later.
  const createDeckForAddCard = useMutation({
    mutationFn: async ({ name, questionTypes }: { name: string; questionTypes: QuestionType[] }) => {
      const id = crypto.randomUUID()
      const now = Date.now()
      await createDeck(db, { id, name, enabledQuestionTypes: questionTypes, createdAt: now, updatedAt: now })
      return id
    },
    onSuccess: async (id) => {
      setAddCardPickerOpen(false)
      await invalidateDecks()
      router.push({ pathname: '/deck/add-card', params: { deckId: id } })
    },
  })

  // Same shape as createDeckForAddCard, but for the "Import" menu item's deck picker — hands off
  // to the existing showImport/ImportFormatSheet flow instead of the add-card screen.
  const createDeckForImport = useMutation({
    mutationFn: async ({ name, questionTypes }: { name: string; questionTypes: QuestionType[] }) => {
      const id = crypto.randomUUID()
      const now = Date.now()
      const deck: Deck = { id, name, enabledQuestionTypes: questionTypes, createdAt: now, updatedAt: now }
      await createDeck(db, deck)
      return deck
    },
    onSuccess: async (deck) => {
      setImportPickerOpen(false)
      await invalidateDecks()
      showImport(deck)
    },
  })

  const rename = useMutation({
    mutationFn: async () => {
      if (!renameDeckTarget) return
      const name = renameValue.trim()
      if (name === '') throw new Error(t('Give the deck a name.'))
      await renameDeck(db, renameDeckTarget.id, name)
    },
    onSuccess: async () => {
      setRenameDeckTarget(null)
      await invalidateDecks()
    },
  })

  const remove = useMutation({
    mutationFn: async (deckId: string) => deleteDeck(db, deckId),
    onSuccess: async () => {
      await invalidateDecks()
    },
    onError: (error: unknown) => showError(t('Could not delete deck'), error),
  })

  const confirmDelete = (deck: Deck): void => {
    setMenuDeck(null)
    setDeleteConfirmDeck(deck)
  }

  const resetProgress = useMutation({
    mutationFn: (deckId: string) => resetDeckProgress(db, deckId),
    onSuccess: async () => {
      await invalidateDecks()
    },
    onError: (error: unknown) => showError(t('Could not reset progress'), error),
  })

  const confirmResetProgress = (deck: Deck): void => {
    setMenuDeck(null)
    setResetConfirmDeck(deck)
  }

  const move = useMutation({
    mutationFn: (newParentId: string | null) => {
      if (!pickerDeck) throw new Error(t('No deck selected.'))
      return moveDeck(db, pickerDeck.id, newParentId)
    },
    onSuccess: async () => {
      setPickerDeck(null)
      setPickerMode(null)
      await invalidateDecks()
    },
    onError: (error: unknown) => showError(t('Could not move deck'), error),
  })

  const merge = useMutation({
    mutationFn: (targetDeckId: string) => {
      if (!pickerDeck) throw new Error(t('No deck selected.'))
      return mergeDecks(db, pickerDeck.id, targetDeckId)
    },
    onSuccess: async () => {
      setPickerDeck(null)
      setPickerMode(null)
      await invalidateDecks()
    },
    onError: (error: unknown) => showError(t('Could not merge deck'), error),
  })

  const showMove = (deck: Deck): void => {
    setMenuDeck(null)
    setPickerDeck(deck)
    setPickerMode('move')
  }

  const showMerge = (deck: Deck): void => {
    setMenuDeck(null)
    setPickerDeck(deck)
    setPickerMode('merge')
  }

  const handlePickTarget = (target: Deck): void => {
    if (!pickerDeck) return
    if (pickerMode === 'move') {
      move.mutate(target.id)
      return
    }
    if (pickerMode === 'merge') {
      setMergeConfirmTarget(target)
    }
  }

  const showImport = (deck: Deck): void => {
    setMenuDeck(null)
    setImportDeck(deck)
  }

  const handleImportSelect = (format: ImportFormat): void => {
    if (!importDeck) return
    const deck = importDeck
    setImportDeck(null)
    router.push({
      pathname: IMPORT_ROUTES[format],
      params: { deckId: deck.id },
    })
  }

  const runDeckExport = (deck: Deck, format: ExportFormat, fileName: string): void => {
    runExport(db, format, { deckId: deck.id, deckName: deck.name, fileName })
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

  const showExport = (deck: Deck): void => {
    setMenuDeck(null)
    setExportDeck(deck)
  }

  // Picking a format opens the file-name prompt next, not the export itself — see
  // ExportNameModal's doc comment for why that's a separate step from the native folder picker
  // saveExportFile triggers once a name is confirmed.
  const handleExportSelect = (format: ExportFormat): void => {
    if (!exportDeck) return
    setExportPending({ deck: exportDeck, format })
    setExportDeck(null)
  }

  // Unlike the Sync settings screen, this header icon has no disabled state to fall back on when
  // no account is connected - check up front so tapping it shows a helpful nudge instead of
  // round-tripping into CloudSyncNotConfiguredError's technical message (also kept as a fallback
  // in the catch below, in case the account signs out between this check and the request).
  const handleSyncNow = (): void => {
    if (!sync.account) {
      setExportNotice({
        title: t('Sync not connected'),
        message: t('Connect your Google account under Settings > Sync to start syncing your decks and review progress across devices.'),
      })
      return
    }
    requestCloudSync(db)
      .then(async (summary) => {
        await invalidateDecks()
        setExportNotice({
          title: t('Synced'),
          message: t('{{pulled}} pulled · {{pushed}} pushed · {{deleted}} deleted', { ...summary }),
        })
      })
      .catch((error: unknown) => {
        if (error instanceof CloudSyncNotConfiguredError) {
          setExportNotice({
            title: t('Sync not connected'),
            message: t('Connect your Google account under Settings > Sync to start syncing your decks and review progress across devices.'),
          })
          return
        }
        showError(t('Sync failed'), error)
      })
  }

  const allDecks = allDecksQuery.data ?? []
  const pickerTargets = pickerDeck
    ? (() => {
        const excludedIds = collectDescendantIds(allDecks, pickerDeck.id)
        excludedIds.add(pickerDeck.id)
        return allDecks.filter((d) => !excludedIds.has(d.id))
      })()
    : []

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              {sync.phase === 'syncing' ? (
                <View style={styles.syncButton}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <IconButton testID="deck-sync-now-button" icon="RefreshCw" onPress={handleSyncNow} />
              )}
              <IconButton icon="CircleQuestionMark" size={24} color={colors.primary} onPress={() => help.openSection('nesting')} />
            </View>
          ),
        }}
      />
      {decksQuery.isPending ? (
        <Spinner />
      ) : decksQuery.isError ? (
        <ErrorState message={String(decksQuery.error)} onRetry={() => void decksQuery.refetch()} />
      ) : (decksQuery.data?.totalDecks ?? 0) === 0 ? (
        <EmptyState
          icon="Layers"
          title={t('No decks yet')}
          message={t('Create your first deck with the + button.')}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── Editorial Mastery Hero Banner ── */}
          <View style={styles.masteryHero}>
            <View style={styles.masteryHeroTop}>
              <View style={styles.masteryTextGroup}>
                <Text style={styles.masteryTitle}>{t('Mastery & Retention')}</Text>
                <Text style={styles.masterySubtitle}>
                  {decksQuery.data?.totalDue === 0
                    ? t('All caught up across {{decks}} study collections.', { decks: decksQuery.data?.totalDecks ?? 0 })
                    : t('{{due}} cards due across {{decks}} study collections today.', {
                        due: decksQuery.data?.totalDue ?? 0,
                        decks: decksQuery.data?.totalDecks ?? 0,
                      })}
                </Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, Math.max(8, decksQuery.data?.retentionRate ?? 0))}%` },
                ]}
              />
            </View>
          </View>

          {/* ── Section Title Row ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('Your Study Decks')}</Text>
            <Pressable
              style={styles.newDeckHeaderButton}
              onPress={() => setCreateOpen(true)}
            >
              <Icon name="Plus" size={14} color={colors.primary} />
              <Text style={styles.newDeckHeaderButtonLabel}>{t('New Deck')}</Text>
            </Pressable>
          </View>

          {decksQuery.data?.tree.map((node) => (
            <DeckRow key={node.deck.id} node={node} depth={0} onOpenMenu={setMenuDeck} />
          ))}
        </ScrollView>
      )}

      <Pressable testID="create-deck-fab" style={styles.fab} onPress={() => setActionMenuOpen(true)}>
        <Icon name="Plus" size={28} color={colors.textOnPrimary} />
      </Pressable>

      {/* ── "+" action menu — add deck, add card, or import a file ── */}
      <Modal visible={actionMenuOpen} animationType="fade" transparent onRequestClose={() => setActionMenuOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setActionMenuOpen(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          {/* Capped + scrollable (see modalSheet's maxHeight) — at large system font/display
              scaling this content can grow taller than the screen, and without a scroll container
              the overflow was simply unreachable, cut off at the screen edge. */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalSheetScrollContent}>
            <Button
              testID="action-menu-add-deck"
              label={t('Add deck')}
              icon="Layers"
              variant="secondary"
              onPress={() => {
                setActionMenuOpen(false)
                setCreateOpen(true)
              }}
            />
            <Button
              testID="action-menu-add-card"
              label={t('Add card')}
              icon="CirclePlus"
              variant="secondary"
              onPress={() => {
                setActionMenuOpen(false)
                setAddCardPickerOpen(true)
              }}
            />
            <Button
              testID="action-menu-import"
              label={t('Import file')}
              icon="Download"
              variant="secondary"
              onPress={() => {
                setActionMenuOpen(false)
                setImportPickerOpen(true)
              }}
            />
          </ScrollView>
        </View>
      </Modal>

      <DeckPickerModal
        db={db}
        visible={addCardPickerOpen}
        onClose={() => setAddCardPickerOpen(false)}
        title={t('Add card to which deck?')}
        onSelectDeck={(deck) => {
          setAddCardPickerOpen(false)
          router.push({ pathname: '/deck/add-card', params: { deckId: deck.id } })
        }}
        onCreateDeck={(name, questionTypes) => createDeckForAddCard.mutate({ name, questionTypes })}
        creating={createDeckForAddCard.isPending}
        {...(createDeckForAddCard.isError && { createError: String(createDeckForAddCard.error) })}
      />

      <DeckPickerModal
        db={db}
        visible={importPickerOpen}
        onClose={() => setImportPickerOpen(false)}
        title={t('Import into which deck?')}
        onSelectDeck={(deck) => {
          setImportPickerOpen(false)
          showImport(deck)
        }}
        onCreateDeck={(name, questionTypes) => createDeckForImport.mutate({ name, questionTypes })}
        creating={createDeckForImport.isPending}
        {...(createDeckForImport.isError && { createError: String(createDeckForImport.error) })}
      />

      {/* ── New deck modal — a web/desktop app styled dialog ── */}
      <Modal visible={createOpen} animationType="fade" transparent onRequestClose={() => setCreateOpen(false)}>
        <KeyboardAvoidingView
          style={styles.centerModalKeyboardAvoider}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdropAbsolute} onPress={() => setCreateOpen(false)} />
          <View style={styles.centerModalCard}>
            <View style={styles.formHeaderRow}>
              <Text style={styles.formTitle}>{t('Create New Study Deck')}</Text>
              <IconButton icon="X" size={20} onPress={() => setCreateOpen(false)} disabled={create.isPending} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('DECK TITLE')}</Text>
              <TextInput
                testID="new-deck-name-input"
                style={styles.inputField}
                placeholder={t('e.g. German Verbs')}
                placeholderTextColor={colors.textMuted}
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('REVIEW MODES')}</Text>
              <ReviewModesPicker
                value={newQuestionTypes}
                onToggle={(qt) => setNewQuestionTypes((prev) => toggleQuestionType(prev, qt))}
              />
              <Text style={styles.formHelperText}>
                {t('Only cards matching these types can be saved into this deck.')}
              </Text>
            </View>

            {create.isError ? <Text style={styles.errorLabel}>{String(create.error)}</Text> : null}

            <View style={styles.centerModalActions}>
              <Button label={t('Cancel')} variant="ghost" onPress={() => setCreateOpen(false)} disabled={create.isPending} />
              <Button
                label={create.isPending ? t('Creating...') : t('Create Deck')}
                icon="Plus"
                disabled={create.isPending || newName.trim() === ''}
                onPress={() => create.mutate()}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Per-deck actions menu sheet ── */}
      <Modal visible={menuDeck !== null} animationType="fade" transparent onRequestClose={() => setMenuDeck(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuDeck(null)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          {/* Capped + scrollable (see modalSheet's maxHeight) — the 2x2 quick-action grid plus the
              5-row list group is already a lot of vertical content, and at large system
              font/display scaling it can grow taller than the screen. Without a scroll container
              here the overflow was simply unreachable, cut off at the screen edge. */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalSheetScrollContent}>
          {menuDeck ? (
            <>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>{menuDeck.name}</Text>
              </View>

              {/* Quick Action Grid (2x2) */}
              <View style={styles.menuActionGrid}>
                <Pressable
                  style={styles.gridActionTile}
                  onPress={() => {
                    const deckId = menuDeck.id
                    setMenuDeck(null)
                    router.push({ pathname: '/deck/add-card', params: { deckId } })
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
                    const deckId = menuDeck.id
                    const name = menuDeck.name
                    setMenuDeck(null)
                    router.push({ pathname: '/deck/[id]', params: { id: deckId } })
                  }}
                >
                  <View style={styles.gridActionIcon}>
                    <Icon name="FolderOpen" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.gridActionLabel}>{t('Open Deck')}</Text>
                </Pressable>

                <Pressable style={styles.gridActionTile} onPress={() => showImport(menuDeck)}>
                  <View style={styles.gridActionIcon}>
                    <Icon name="Download" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.gridActionLabel}>{t('Import')}</Text>
                </Pressable>

                <Pressable style={styles.gridActionTile} onPress={() => showExport(menuDeck)}>
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
                    setRenameValue(menuDeck.name)
                    setRenameDeckTarget(menuDeck)
                    setMenuDeck(null)
                  }}
                >
                  <Icon name="Pencil" size={18} color={colors.textSecondary} />
                  <Text style={styles.menuRowLabel}>{t('Rename deck')}</Text>
                  <Icon name="ChevronRight" size={14} color={colors.textMuted} />
                </Pressable>

                <Pressable style={styles.menuRowItem} onPress={() => showMove(menuDeck)}>
                  <Icon name="FolderOpen" size={18} color={colors.textSecondary} />
                  <Text style={styles.menuRowLabel}>{t('Move deck')}</Text>
                  <Icon name="ChevronRight" size={14} color={colors.textMuted} />
                </Pressable>

                <Pressable style={styles.menuRowItem} onPress={() => showMerge(menuDeck)}>
                  <Icon name="GitMerge" size={18} color={colors.textSecondary} />
                  <Text style={styles.menuRowLabel}>{t('Merge into another deck')}</Text>
                  <Icon name="ChevronRight" size={14} color={colors.textMuted} />
                </Pressable>

                <Pressable style={styles.menuRowItem} onPress={() => confirmResetProgress(menuDeck)}>
                  <Icon name="RefreshCw" size={18} color={colors.warning} />
                  <Text style={[styles.menuRowLabel, { color: colors.warning }]}>{t('Reset progress')}</Text>
                </Pressable>

                <Pressable style={[styles.menuRowItem, styles.menuRowItemLast]} onPress={() => confirmDelete(menuDeck)}>
                  <Icon name="Trash2" size={18} color={colors.danger} />
                  <Text style={[styles.menuRowLabel, { color: colors.danger }]}>{t('Delete deck')}</Text>
                </Pressable>
              </View>
            </>
          ) : null}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Rename centered dialog popup window ── */}
      <Modal
        visible={renameDeckTarget !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setRenameDeckTarget(null)}
      >
        <KeyboardAvoidingView
          style={styles.centerModalKeyboardAvoider}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdropAbsolute} onPress={() => setRenameDeckTarget(null)} />
          <View style={styles.centerModalCard}>
            <Text style={styles.modalTitle}>{t('Rename deck')}</Text>
            <TextInput style={styles.inputField} value={renameValue} onChangeText={setRenameValue} autoFocus />
            {rename.isError ? <Text style={styles.errorLabel}>{String(rename.error)}</Text> : null}
            <View style={styles.centerModalActions}>
              <Button label={t('Cancel')} variant="ghost" onPress={() => setRenameDeckTarget(null)} disabled={rename.isPending} />
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
      <Modal
        visible={pickerDeck !== null}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setPickerDeck(null)
          setPickerMode(null)
        }}
      >
        <KeyboardAvoidingView
          style={styles.centerModalKeyboardAvoider}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={styles.modalBackdropAbsolute}
            onPress={() => {
              setPickerDeck(null)
              setPickerMode(null)
            }}
          />
          <View style={styles.centerModalCard}>
            {pickerDeck ? (
              <>
                <Text style={styles.modalTitle}>
                  {pickerMode === 'move'
                    ? t('Move "{{name}}" to...', { name: pickerDeck.name })
                    : t('Merge "{{name}}" into...', { name: pickerDeck.name })}
                </Text>
                <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                  {pickerMode === 'move' ? (
                    <Pressable
                      style={styles.pickerRow}
                      onPress={() => move.mutate(null)}
                      disabled={move.isPending || pickerDeck.parentId === undefined}
                    >
                      <Icon name="LayoutGrid" size={18} color={colors.textSecondary} />
                      <Text style={styles.pickerRowLabel}>{t('Top level (no parent)')}</Text>
                    </Pressable>
                  ) : null}
                  {allDecksQuery.isPending ? (
                    <Spinner />
                  ) : allDecksQuery.isError ? (
                    <ErrorState message={String(allDecksQuery.error)} onRetry={() => void allDecksQuery.refetch()} />
                  ) : pickerTargets.length === 0 ? (
                    <Text style={styles.hint}>
                      {pickerMode === 'move' ? t('No other deck to nest this one under.') : t('No other deck to merge into.')}
                    </Text>
                  ) : (
                    pickerTargets.map((target) => (
                      <Pressable
                        key={target.id}
                        style={styles.pickerRow}
                        onPress={() => handlePickTarget(target)}
                        disabled={move.isPending || merge.isPending}
                      >
                        <Icon name="BookOpen" size={18} color={colors.primary} />
                        <Text style={styles.pickerRowLabel}>{target.name}</Text>
                      </Pressable>
                    ))
                  )}
                </ScrollView>
                {move.isError ? <Text style={styles.errorLabel}>{String(move.error)}</Text> : null}
                {merge.isError ? <Text style={styles.errorLabel}>{String(merge.error)}</Text> : null}
                <View style={styles.centerModalActions}>
                  <Button
                    label={t('Cancel')}
                    variant="ghost"
                    onPress={() => {
                      setPickerDeck(null)
                      setPickerMode(null)
                    }}
                  />
                </View>
              </>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ImportFormatSheet
        visible={importDeck !== null}
        onClose={() => setImportDeck(null)}
        onSelect={handleImportSelect}
        {...(importDeck && { title: t('Import into "{{name}}"', { name: importDeck.name }) })}
      />

      <ExportFormatSheet
        visible={exportDeck !== null}
        onClose={() => setExportDeck(null)}
        onSelect={handleExportSelect}
        {...(exportDeck && { title: t('Export "{{name}}"', { name: exportDeck.name }) })}
      />

      <ExportNameModal
        visible={exportPending !== null}
        defaultName={defaultExportFileName(exportPending?.deck.name)}
        onCancel={() => setExportPending(null)}
        onConfirm={(fileName) => {
          const pending = exportPending
          setExportPending(null)
          if (pending) runDeckExport(pending.deck, pending.format, fileName)
        }}
      />

      <AlertModal
        visible={exportNotice !== null}
        title={exportNotice?.title ?? ''}
        message={exportNotice?.message ?? ''}
        onClose={() => setExportNotice(null)}
      />

      <ConfirmModal
        visible={deleteConfirmDeck !== null}
        title={t('Delete deck?')}
        message={t('Cards that are only in this deck are deleted with it. Cards in other decks stay there.')}
        onCancel={() => setDeleteConfirmDeck(null)}
        onConfirm={() => {
          const deck = deleteConfirmDeck
          setDeleteConfirmDeck(null)
          if (deck) remove.mutate(deck.id)
        }}
        confirmLabel={t('Delete')}
        destructive
      />

      <ConfirmModal
        visible={resetConfirmDeck !== null}
        title={t('Reset progress?')}
        message={
          resetConfirmDeck
            ? t('Every card in "{{name}}" goes back to "new" - word-meaning review and cloze practice both restart from scratch. Your review history is kept. This cannot be undone.', {
                name: resetConfirmDeck.name,
              })
            : ''
        }
        onCancel={() => setResetConfirmDeck(null)}
        onConfirm={() => {
          const deck = resetConfirmDeck
          setResetConfirmDeck(null)
          if (deck) resetProgress.mutate(deck.id)
        }}
        confirmLabel={t('Reset')}
        destructive
      />

      <ConfirmModal
        visible={mergeConfirmTarget !== null}
        title={mergeConfirmTarget ? t('Merge into "{{name}}"?', { name: mergeConfirmTarget.name }) : ''}
        message={
          mergeConfirmTarget && pickerDeck
            ? t('This deletes "{{source}}" and moves all its cards into "{{target}}". This cannot be undone.', {
                source: pickerDeck.name,
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
        title={t('Decks help')}
        sections={HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={(id) => help.setSectionId(help.sectionId === id ? null : id)}
        translate={t}
      />
    </View>
  )
}

function getModeDisplayLabel(type: QuestionType): string {
  switch (type) {
    case 'cloze':
      return 'Cloze'
    case 'vocab':
      return 'Vocab'
    case 'reverse':
      return 'Reverse'
    case 'mcq':
      return 'MCQ'
    case 'trueFalse':
      return 'True/False'
  }
}

function getModeTagTheme(type: QuestionType, colors: ThemeColors) {
  switch (type) {
    case 'cloze':
      return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc' }
    case 'vocab':
    case 'reverse':
      return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa' }
    case 'mcq':
      return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' }
    case 'trueFalse':
      return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' }
    default:
      return { bg: colors.surfaceMuted, text: colors.textSecondary }
  }
}

function DeckRow(props: { node: DeckNode; depth: number; onOpenMenu: (deck: Deck) => void }): JSX.Element {
  const { node, depth, onOpenMenu } = props
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const questionTypes = node.deck.enabledQuestionTypes ?? DEFAULT_ENABLED_QUESTION_TYPES

  return (
    <View style={[styles.deckRowContainer, depth > 0 && { marginLeft: depth * spacing.lg }]}>
      {depth > 0 ? <View style={styles.subDeckIndicator} /> : null}
      <Pressable
        style={styles.deckCard}
        onPress={() => router.push({ pathname: '/deck/[id]', params: { id: node.deck.id } })}
      >
        <View style={styles.deckCardTopRow}>
          <View style={styles.deckHeaderInfo}>
            <Text style={styles.deckName} numberOfLines={1}>
              {node.deck.name}
            </Text>
            <View style={styles.modesRow}>
              {questionTypes.map((type) => {
                const label = getModeDisplayLabel(type)
                const tagTheme = getModeTagTheme(type, colors)
                return (
                  <View key={type} style={[styles.modeMiniBadge, { backgroundColor: tagTheme.bg }]}>
                    <Text style={[styles.modeMiniBadgeLabel, { color: tagTheme.text }]}>{label}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          <View style={styles.deckTopRightGroup}>
            {node.dueCount > 0 ? (
              <View style={styles.dueCountHeroBox}>
                <Text style={styles.dueCountHeroNumber}>{node.dueCount}</Text>
                <Text style={styles.dueCountHeroLabel}>{t('due')}</Text>
              </View>
            ) : (
              <View style={styles.upToDateHeroBox}>
                <Icon name="CircleCheck" size={18} color={colors.success} />
              </View>
            )}
            <IconButton
              icon="EllipsisVertical"
              size={18}
              onPress={() => onOpenMenu(node.deck)}
              accessibilityLabel={t('Deck options')}
            />
          </View>
        </View>

        <View style={styles.deckCardDivider} />

        <View style={styles.deckCardBottomRow}>
          <Text style={styles.cardCountText}>
            {t('{{count}} cards registered', { count: node.cardCount.toLocaleString() })}
          </Text>
          <View style={styles.viewDeckArrow}>
            <Icon name="ChevronRight" size={16} color={colors.textMuted} />
          </View>
        </View>
      </Pressable>
      {node.children.map((child) => (
        <DeckRow key={child.deck.id} node={child} depth={depth + 1} onOpenMenu={onOpenMenu} />
      ))}
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    syncButton: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
    scroll: { padding: spacing.lg, paddingBottom: 96 },
    masteryHero: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      gap: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    masteryHeroTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    masteryTextGroup: { flex: 1, gap: 4 },
    masteryTitle: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
    masterySubtitle: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
    progressTrack: {
      height: 6,
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: radius.full,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    sectionTitle: { fontSize: type.body, fontWeight: '800', color: colors.text, letterSpacing: 0.2 },
    newDeckHeaderButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primarySoft,
      paddingVertical: 5,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.full,
    },
    newDeckHeaderButtonLabel: { fontSize: type.micro, fontWeight: '700', color: colors.primary },
    deckRowContainer: { position: 'relative', marginBottom: spacing.md },
    subDeckIndicator: {
      position: 'absolute',
      left: -12,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: colors.border,
      borderRadius: radius.full,
    },
    deckCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    deckCardTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    deckHeaderInfo: { flex: 1, gap: 6 },
    deckName: { fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
    modesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    modeMiniBadge: {
      borderRadius: radius.full,
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    modeMiniBadgeLabel: {
      fontSize: 11,
      fontWeight: '500',
    },
    deckTopRightGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    dueCountHeroBox: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: radius.md,
      minWidth: 36,
    },
    dueCountHeroNumber: { fontSize: 15, fontWeight: '800', color: colors.primary },
    dueCountHeroLabel: { fontSize: 9, fontWeight: '800', color: colors.primary, textTransform: 'uppercase' },
    upToDateHeroBox: {
      padding: 6,
    },
    deckCardDivider: { height: 1, backgroundColor: colors.border },
    deckCardBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardCountText: { fontSize: type.caption, color: colors.textSecondary, fontWeight: '500' },
    viewDeckArrow: { paddingLeft: spacing.xs },
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
      shadowOffset: { width: 0, height: 4 },
    },
    modalKeyboardAvoider: { flex: 1, justifyContent: 'flex-end' },
    centerModalKeyboardAvoider: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    centerModalCard: {
      width: '100%',
      maxWidth: 440,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      gap: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    formHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
    formTitle: { flex: 1, fontSize: type.subheading, fontWeight: '800', color: colors.text },
    formGroup: { gap: spacing.xs },
    formLabel: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
    formHelperText: { fontSize: type.micro, color: colors.textMuted, marginTop: 2 },
    centerModalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
    modalBackdropAbsolute: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00000066' },
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
    pickerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
    pickerRowLabel: { flex: 1, fontSize: type.body, fontWeight: '600', color: colors.text },
    hint: { fontSize: type.caption, color: colors.textMuted, paddingVertical: spacing.md },
    menuHeader: { alignItems: 'center', marginBottom: spacing.xs },
    menuTitle: { fontSize: type.subheading, fontWeight: '800', color: colors.text, textAlign: 'center' },
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
  })
