import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { Icon } from './Icon'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

export interface DataTableColumn<T> {
  label: string
  width: number
  cell: (row: T) => string
  /** Per-row, per-column style override — e.g. coloring a "Status" or "Issues" cell. */
  cellStyle?: (row: T) => TextStyle | undefined
}

export interface DataTableSelection<T> {
  isSelected: (row: T) => boolean
  onToggle: (row: T) => void
  allSelected: boolean
  onToggleAll: () => void
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  keyExtractor: (row: T, index: number) => string
  /** Adds a checkbox column on the left, header checkbox toggles all. Omit for a read-only table. */
  selection?: DataTableSelection<T>
  /** Adds a leading "#" column with the row's 1-based position. */
  showRowNumber?: boolean
  /** Per-row background/border override, layered under the alternating-row tint — e.g.
   * highlighting rows that share a word/lemma with another row in the same import preview. */
  rowStyle?: (row: T) => ViewStyle | undefined
}

const SELECT_COLUMN_WIDTH = 48
const ROW_NUMBER_COLUMN_WIDTH = 40

/**
 * The "Preview" table shared by the CSV/Anki/.lin import wizards (pick → map → **preview** →
 * confirm) and the deck detail screen's read-only "View all cards" table — one column-header row
 * pinned above a vertically-scrolling body, both wrapped in a single horizontal ScrollView so
 * columns stay aligned when scrolling sideways. Selection (the checkbox column + row tap-to-toggle)
 * is opt-in via `selection`, since the deck table is read-only and has none.
 */
export function DataTable<T>(props: DataTableProps<T>): JSX.Element {
  const { columns, data, keyExtractor, selection, showRowNumber, rowStyle } = props
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  return (
    <ScrollView horizontal style={styles.outerScroll} showsHorizontalScrollIndicator>
      <View style={styles.flexColumn}>
        <View style={styles.headerRow}>
          {selection ? (
            <Pressable style={[styles.headerCheckboxCell, { width: SELECT_COLUMN_WIDTH }]} onPress={selection.onToggleAll}>
              <Icon
                name={selection.allSelected ? 'SquareCheck' : 'Square'}
                size={18}
                color={selection.allSelected ? colors.primary : colors.textMuted}
              />
            </Pressable>
          ) : null}
          {showRowNumber ? <Text style={[styles.headerCell, { width: ROW_NUMBER_COLUMN_WIDTH }]}>{t('#')}</Text> : null}
          {columns.map((col) => (
            <Text key={col.label} style={[styles.headerCell, { width: col.width }]}>
              {t(col.label)}
            </Text>
          ))}
        </View>
        <FlatList
          style={styles.bodyScroll}
          data={data}
          keyExtractor={keyExtractor}
          windowSize={7}
          maxToRenderPerBatch={20}
          initialNumToRender={20}
          removeClippedSubviews
          renderItem={({ item: row, index: rowIndex }) => (
            <View style={[styles.row, rowIndex % 2 === 1 ? styles.rowAlt : null, rowStyle?.(row)]}>
              {selection ? (
                <Pressable
                  style={[styles.checkboxCell, { width: SELECT_COLUMN_WIDTH }]}
                  onPress={() => selection.onToggle(row)}
                >
                  <Icon
                    name={selection.isSelected(row) ? 'SquareCheck' : 'Square'}
                    size={18}
                    color={selection.isSelected(row) ? colors.primary : colors.textMuted}
                  />
                </Pressable>
              ) : null}
              {showRowNumber ? (
                <Text style={[styles.cell, { width: ROW_NUMBER_COLUMN_WIDTH }]}>{rowIndex + 1}</Text>
              ) : null}
              {columns.map((col) => (
                <Text key={col.label} style={[styles.cell, { width: col.width }, col.cellStyle?.(row)]} numberOfLines={4}>
                  {col.cell(row)}
                </Text>
              ))}
            </View>
          )}
        />
      </View>
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    outerScroll: { flex: 1 },
    flexColumn: { flex: 1 },
    bodyScroll: { flex: 1 },
    headerRow: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceMuted,
      borderTopLeftRadius: radius.sm,
      borderTopRightRadius: radius.sm,
    },
    headerCheckboxCell: { alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
    headerCell: {
      fontSize: type.caption,
      fontWeight: '700',
      color: colors.textSecondary,
      paddingVertical: 2,
      paddingHorizontal: spacing.sm,
    },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
    rowAlt: { backgroundColor: colors.surfaceMuted },
    checkboxCell: { alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
    cell: {
      fontSize: type.caption,
      color: colors.text,
      paddingVertical: 2,
      paddingHorizontal: spacing.sm,
    },
  })
