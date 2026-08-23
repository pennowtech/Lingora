import type { ExportableCard } from '@lingora/database'
import { getExportableCards } from '@lingora/database'
import { useQuery } from '@tanstack/react-query'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useMemo, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { Chip, EmptyState, ErrorState, Spinner } from '../../components/ui'
import { useServices } from '../../lib/services'
import { spacing } from '../../lib/theme'
import { useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

/** The flashcard template only ever renders a card's first 2 synonyms (see lib/templates.ts) —
 * matching that here so the table reflects what actually shows up on the card, not a longer list
 * that reads as a mismatch. CSV/Anki/Markdown export is unaffected: those still include every
 * mapped synonym, not just these two. */
const MAX_SYNONYMS_SHOWN = 2

function synonymsCell(card: ExportableCard): string {
  if (card.synonyms.length === 0) return '-'
  const shown = card.synonyms.slice(0, MAX_SYNONYMS_SHOWN).join(', ')
  const remaining = card.synonyms.length - MAX_SYNONYMS_SHOWN
  return remaining > 0 ? `${shown} (+${remaining})` : shown
}

// Two column sets rather than one table with both Example and Cloze side by side — a deck mixing
// both card types would otherwise show a wall of "—" in whichever column doesn't apply to a given
// row. Word cards never have `cloze` set and cloze cards never have `example` set (see
// export-shared.ts), so each set only keeps the columns that are ever populated for its rows.
const WORD_COLUMNS: DataTableColumn<ExportableCard>[] = [
  { label: 'Word', width: 140, cell: (c) => c.word },
  { label: 'Meaning', width: 160, cell: (c) => c.meaning || '-' },
  { label: 'Example', width: 240, cell: (c) => c.example ?? '-' },
  { label: 'Example translation', width: 220, cell: (c) => c.exampleTranslation ?? '-' },
  { label: 'Synonyms', width: 180, cell: synonymsCell },
  { label: 'Tags', width: 160, cell: (c) => c.tags.join(', ') || '-' },
  { label: 'Part of speech', width: 130, cell: (c) => c.partOfSpeech },
  { label: 'CEFR', width: 70, cell: (c) => c.cefrLevel },
]

const CLOZE_COLUMNS: DataTableColumn<ExportableCard>[] = [
  { label: 'Word', width: 140, cell: (c) => c.word },
  { label: 'Meaning', width: 160, cell: (c) => c.meaning || '-' },
  // clozeMarkup, not cloze: a type:'basic' card the AI pipeline also gave a cloze variant has
  // `cloze` forced null (that field is export-format shaping — see ExportableCard's doc comment),
  // but `clozeMarkup` is set whenever cloze content actually exists, regardless of card type.
  { label: 'Cloze', width: 260, cell: (c) => c.clozeMarkup ?? '-' },
  { label: 'Example translation', width: 220, cell: (c) => c.clozeVariantTranslation ?? '-' },
  { label: 'Synonyms', width: 180, cell: synonymsCell },
  { label: 'Tags', width: 160, cell: (c) => c.tags.join(', ') || '-' },
  { label: 'CEFR', width: 70, cell: (c) => c.cefrLevel },
]

/**
 * Read-only tabular view of every card in a deck — reached from the deck detail screen's "⋯"
 * menu. Reuses `getExportableCards` (the same query CSV/Markdown/Anki export already read from)
 * for the data, and `DataTable` (the same table the CSV/Anki/.lin import wizards' "Preview" step
 * renders) for the view. Word and cloze cards get separate tables (see WORD_COLUMNS/CLOZE_COLUMNS)
 * switched via a Word/Cloze toggle — the toggle itself only shows up when the deck actually has
 * cloze cards, same reasoning as the deck detail screen's "Practice cloze" button.
 */
export default function DeckTableScreen(): JSX.Element {
  const { deckId, deckName } = useLocalSearchParams<{ deckId: string; deckName?: string }>()
  const { db } = useServices()
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)
  const [tab, setTab] = useState<'word' | 'cloze'>('word')

  const cardsQuery = useQuery({
    queryKey: ['deck-table', deckId],
    queryFn: () => getExportableCards(db, { deckId }),
    enabled: (deckId ?? '') !== '',
  })

  // Word tab excludes pure cloze-type cards (isCloze) — they have no real word/meaning content of
  // their own. Cloze tab includes anything with a cloze variant at all (hasClozeVariant), which
  // also catches a type:'basic' AI-generated card that carries a cloze variant alongside its
  // regular example — such a card shows up in BOTH tabs, matching that it's usable both ways.
  const wordCards = useMemo(() => cardsQuery.data?.filter((c) => !c.isCloze) ?? [], [cardsQuery.data])
  const clozeCards = useMemo(() => cardsQuery.data?.filter((c) => c.hasClozeVariant) ?? [], [cardsQuery.data])
  const activeTab = clozeCards.length === 0 ? 'word' : tab

  return (
    <>
      <Stack.Screen options={{ title: deckName ? t('{{name}} - all cards', { name: deckName }) : t('All cards') }} />
      {cardsQuery.isPending ? (
        <Spinner />
      ) : cardsQuery.isError ? (
        <ErrorState message={String(cardsQuery.error)} onRetry={() => void cardsQuery.refetch()} />
      ) : cardsQuery.data.length === 0 ? (
        <EmptyState
          icon="grid-outline"
          title={t('No cards yet')}
          message={t('Add words from Search or import a file to see them here.')}
        />
      ) : (
        <>
          {clozeCards.length > 0 ? (
            <View style={styles.tabRow}>
              <Chip label={t('Word cards ({{count}})', { count: wordCards.length })} selected={activeTab === 'word'} onPress={() => setTab('word')} />
              <Chip label={t('Cloze cards ({{count}})', { count: clozeCards.length })} selected={activeTab === 'cloze'} onPress={() => setTab('cloze')} />
            </View>
          ) : null}
          <DataTable
            columns={activeTab === 'cloze' ? CLOZE_COLUMNS : WORD_COLUMNS}
            data={activeTab === 'cloze' ? clozeCards : wordCards}
            keyExtractor={(card) => card.cardId}
            showRowNumber
          />
        </>
      )}
    </>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    tabRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.background },
  })
