import type { JSX } from 'react'
import { useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from 'react-native'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

const COLORS = ['#D64545', '#2E7D32', '#1565C0', '#6A1B9A']

/**
 * A minimal Gmail-style formatting toolbar (bold/italic/normal/color) over a plain multiline
 * TextInput — React Native has no real rich-text/selection-styling primitive, so this tracks the
 * current selection via onSelectionChange and wraps it with the exact HTML tags the card renderer
 * already knows how to render (LiquidJS output goes straight into a WebView as HTML, and
 * lib/templates.ts#escapeHtmlShell has a matching whitelist so these specific tags survive the
 * target-word highlight pass instead of getting escaped into visible text).
 *
 * Only meant for the example-sentence field on a manually-added word card — see
 * app/deck/add-card.tsx. Tapping a tool with nothing selected is a no-op, not an insert-at-cursor,
 * since an empty `<b></b>` pair serves no purpose here.
 */
export function FormattableTextInput(props: {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  testID?: string
}): JSX.Element {
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  const wrapSelection = (before: string, after: string): void => {
    const { start, end } = selection
    if (start === end) return
    const next =
      props.value.slice(0, start) + before + props.value.slice(start, end) + after + props.value.slice(end)
    props.onChangeText(next)
  }

  const clearFormatting = (): void => {
    const { start, end } = selection
    if (start === end) return
    const selected = props.value.slice(start, end)
    const stripped = selected.replace(/<\/?(?:b|i|span[^>]*)>/g, '')
    props.onChangeText(props.value.slice(0, start) + stripped + props.value.slice(end))
  }

  return (
    <View>
      <TextInput
        testID={props.testID}
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        onSelectionChange={(e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) =>
          setSelection(e.nativeEvent.selection)
        }
        placeholder={props.placeholder}
        placeholderTextColor={colors.textMuted}
        // contextMenuHidden looked like the fix for Android's Smart Text Selection bar
        // (Translate/Copy/Share/"Listen") competing with the toolbar below, but on Android it
        // turned out to suppress selection itself, not just the menu — the selection handles
        // never appeared at all, so there was nothing left to format. Reverted: the native menu
        // showing alongside the toolbar is a smaller problem than selection not working.
        multiline
      />
      <View style={styles.toolbar}>
        <Pressable style={styles.toolButton} onPress={() => wrapSelection('<b>', '</b>')} hitSlop={4}>
          <Text style={styles.boldGlyph}>B</Text>
        </Pressable>
        <Pressable style={styles.toolButton} onPress={() => wrapSelection('<i>', '</i>')} hitSlop={4}>
          <Text style={styles.italicGlyph}>I</Text>
        </Pressable>
        <Pressable style={styles.toolButton} onPress={clearFormatting} hitSlop={4}>
          <Text style={styles.normalGlyph}>N</Text>
        </Pressable>
        {COLORS.map((color) => (
          <Pressable
            key={color}
            style={styles.toolButton}
            onPress={() => wrapSelection(`<span style="color:${color}">`, '</span>')}
            hitSlop={4}
          >
            <View style={[styles.colorSwatch, { backgroundColor: color }]} />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    // Spans the full width of the field, with buttons spread across it (not bunched at one end) —
    // that spare width goes straight into bigger touch targets, easier to hit accurately than a
    // tight row of small icons.
    toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
    toolButton: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    boldGlyph: { fontWeight: '800', fontSize: 20, color: colors.text },
    italicGlyph: { fontStyle: 'italic', fontSize: 20, color: colors.text },
    normalGlyph: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
    colorSwatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: colors.border },
    input: {
      minHeight: 70,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
      color: colors.text,
      fontSize: type.body,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      textAlignVertical: 'top',
    },
  })
