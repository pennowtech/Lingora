import { Ionicons } from '@expo/vector-icons'
import type { CefrLevel, LanguageCode } from '@lingora/types'
import { useState, type JSX, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import type { ExportFormat } from '../lib/export'
import { speak } from '../lib/speech'
import { cefrColors, radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

/**
 * Shared UI primitives used across every screen.
 *
 * TODO(phase6): promote these into packages/ui so the Tauri desktop app
 * (React Native Web) reuses them, per the roadmap's shared-UI plan.
 */

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card(props: {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  onPress?: () => void
  onLongPress?: () => void
  onLayout?: (event: LayoutChangeEvent) => void
}): JSX.Element {
  const { children, style, onPress, onLongPress, onLayout } = props
  const styles = useThemedStyles(createStyles)
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onLayout={onLayout}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}
      >
        {children}
      </Pressable>
    )
  }
  return (
    <View style={[styles.card, style]} onLayout={onLayout}>
      {children}
    </View>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

export function SectionHeader(props: { title: string; action?: string; onAction?: () => void }): JSX.Element {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{props.title}</Text>
      {props.action ? (
        <Pressable onPress={props.onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{props.action}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

export function Button(props: {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  icon?: keyof typeof Ionicons.glyphMap
  small?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
}): JSX.Element {
  const { label, onPress, variant = 'primary', icon, small, disabled, style, testID } = props
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.dangerSoft
        : variant === 'secondary'
          ? colors.primarySoft
          : 'transparent'
  const fg =
    variant === 'primary'
      ? colors.textOnPrimary
      : variant === 'danger'
        ? colors.danger
        : colors.primary

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg },
        pressed && { opacity: 0.75 },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={small ? 15 : 18} color={fg} /> : null}
      <Text style={[styles.buttonLabel, small && styles.buttonLabelSmall, { color: fg }]}>
        {label}
      </Text>
    </Pressable>
  )
}

export function IconButton(props: {
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
  color?: string
  size?: number
  disabled?: boolean
  testID?: string
}): JSX.Element {
  const colors = useColors()
  return (
    <Pressable
      testID={props.testID}
      onPress={props.onPress}
      disabled={props.disabled}
      hitSlop={8}
      style={({ pressed }) => [props.disabled && { opacity: 0.4 }, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={props.icon} size={props.size ?? 22} color={props.color ?? colors.textSecondary} />
    </Pressable>
  )
}

/** A small speaker icon that reads `text` aloud via the device's TTS engine — see lib/speech.ts. */
export function SpeakerButton(props: {
  text: string
  language: LanguageCode
  size?: number
  color?: string
}): JSX.Element {
  const colors = useColors()
  return (
    <IconButton
      icon="volume-medium-outline"
      size={props.size ?? 20}
      color={props.color ?? colors.primary}
      onPress={() => speak(props.text, props.language)}
    />
  )
}

/**
 * The four-icon row shown under a revealed card: explanation ("book"),
 * translation visibility toggle, edit, and "look up in Google". Shared
 * between the review session's flipped card and the word detail screen so
 * both offer the same controls.
 */
export function CardActionBar(props: {
  onExplain: () => void
  explainVisible: boolean
  explainLoading?: boolean
  /** "Explain" for a dictionary/word-guide card's toggle-a-lookup behavior (the default); "More
   * info" for an AI card, where the explanation already shows inline and this opens the
   * follow-up sheet instead. */
  explainLabel?: string
  explainIcon?: keyof typeof Ionicons.glyphMap
  onEdit: () => void
  onLookup: () => void
  /** "Ask AI" — a follow-up question popup, separate from Explain/More info. Optional because not
   * every card-rendering context (e.g. a bare preview) wants it. */
  onAskAI?: () => void
  /** "Regenerate" — replaces the whole card's AI-generated content from scratch. Optional and
   * AI-cards-only; the caller is responsible for confirming before calling this (destructive). */
  onRegenerate?: () => void
  regenerateLoading?: boolean
}): JSX.Element {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.cardActionBar}>
      <CardActionButton
        icon={props.explainIcon ?? (props.explainVisible ? 'book' : 'book-outline')}
        label={props.explainLabel ?? 'Explain'}
        active={props.explainVisible}
        onPress={props.onExplain}
        {...(props.explainLoading !== undefined && { loading: props.explainLoading })}
      />
      {props.onAskAI ? (
        <CardActionButton icon="chatbubble-ellipses-outline" label="Ask AI" onPress={props.onAskAI} />
      ) : null}
      {props.onRegenerate ? (
        <CardActionButton
          icon="refresh-circle-outline"
          label="Regenerate"
          onPress={props.onRegenerate}
          {...(props.regenerateLoading !== undefined && { loading: props.regenerateLoading })}
        />
      ) : null}
      <CardActionButton icon="pencil-outline" label="Edit" onPress={props.onEdit} />
      <CardActionButton icon="logo-google" label="Look up" onPress={props.onLookup} />
    </View>
  )
}

function CardActionButton(props: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  active?: boolean
  loading?: boolean
  onPress: () => void
}): JSX.Element {
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  return (
    <Pressable style={styles.cardActionButton} onPress={props.onPress} disabled={props.loading} hitSlop={4}>
      {props.loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons name={props.icon} size={20} color={props.active ? colors.primary : colors.textSecondary} />
      )}
      <Text style={[styles.cardActionLabel, props.active && { color: colors.primary }]}>{props.label}</Text>
    </Pressable>
  )
}

// ─── Chips ────────────────────────────────────────────────────────────────────

export function Chip(props: {
  label: string
  selected?: boolean
  onPress?: () => void
  color?: { fg: string; bg: string }
  testID?: string
}): JSX.Element {
  const { label, selected = false, onPress, color } = props
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const bg = selected ? (color?.fg ?? colors.primary) : (color?.bg ?? colors.surfaceMuted)
  const fg = selected ? colors.textOnPrimary : (color?.fg ?? colors.textSecondary)
  return (
    <Pressable
      testID={props.testID}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.chip, { backgroundColor: bg }, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.chipLabel, { color: fg }]}>{label}</Text>
    </Pressable>
  )
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────

export interface DropdownOption {
  label: string
  value: string
}

/**
 * A tappable field showing the current selection, opening a bottom-sheet
 * list of options — for a single choice among many (e.g. "which column is
 * the word?"), where a `Chip` row would otherwise wrap across several lines.
 * `clearable` adds a "None" row at the top, calling `onChange(null)` — for
 * an optional field that can be left unmapped.
 */
export function Dropdown(props: {
  label?: string
  placeholder?: string
  value: string | null
  options: DropdownOption[]
  onChange: (value: string | null) => void
  clearable?: boolean
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const selected = props.options.find((o) => o.value === props.value)

  const choose = (value: string | null): void => {
    props.onChange(value)
    setOpen(false)
  }

  return (
    <>
      <Pressable style={styles.dropdownField} onPress={() => setOpen(true)}>
        <Text style={[styles.dropdownValue, !selected && styles.dropdownPlaceholder]} numberOfLines={1}>
          {selected?.label ?? props.placeholder ?? 'Select…'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.dropdownBackdrop} onPress={() => setOpen(false)} />
        <View style={styles.dropdownSheet}>
          <View style={styles.modalHandle} />
          {props.label ? <Text style={styles.dropdownSheetTitle}>{props.label}</Text> : null}
          <ScrollView style={styles.dropdownList}>
            {props.clearable ? (
              <Pressable style={styles.dropdownOption} onPress={() => choose(null)}>
                <Text style={styles.dropdownOptionLabel}>None</Text>
                {props.value === null ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              </Pressable>
            ) : null}
            {props.options.map((opt) => (
              <Pressable key={opt.value} style={styles.dropdownOption} onPress={() => choose(opt.value)}>
                <Text style={styles.dropdownOptionLabel} numberOfLines={2}>
                  {opt.label}
                </Text>
                {props.value === opt.value ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  )
}

// ─── Export format sheet ────────────────────────────────────────────────────

interface ExportFormatOption {
  format: ExportFormat
  label: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
}

const EXPORT_FORMAT_OPTIONS: ExportFormatOption[] = [
  { format: 'csv', label: 'CSV', description: 'Re-importable spreadsheet — word, meaning, example, and more.', icon: 'grid' },
  { format: 'apkg', label: 'Anki (.apkg)', description: 'Study in Anki/AnkiDroid/AnkiMobile. Cards start fresh.', icon: 'albums' },
  { format: 'markdown', label: 'Markdown', description: 'A readable word — meaning — example list. Not re-importable.', icon: 'document-text' },
  { format: 'lin', label: 'Lingora (.lin)', description: 'Full-fidelity backup, export-only for a single deck.', icon: 'cloud-download' },
]

/**
 * A proper bottom-sheet list of export formats — replaces an earlier
 * `Alert.alert` with one button per format, which silently dropped a
 * format past Android's practical ~3-button limit and read as a bare
 * message box rather than a real menu.
 */
export function ExportFormatSheet(props: {
  visible: boolean
  onClose: () => void
  onSelect: (format: ExportFormat) => void
  title?: string
}): JSX.Element {
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  return (
    <Modal visible={props.visible} animationType="fade" transparent onRequestClose={props.onClose}>
      <Pressable style={styles.dropdownBackdrop} onPress={props.onClose} />
      <View style={styles.dropdownSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.dropdownSheetTitle}>{props.title ?? 'Export as…'}</Text>
        {EXPORT_FORMAT_OPTIONS.map((opt) => (
          <Pressable key={opt.format} style={styles.exportOptionRow} onPress={() => props.onSelect(opt.format)}>
            <View style={styles.exportOptionIcon}>
              <Ionicons name={opt.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.exportOptionText}>
              <Text style={styles.exportOptionLabel}>{opt.label}</Text>
              <Text style={styles.exportOptionDescription}>{opt.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </Modal>
  )
}

// ─── Import format sheet ────────────────────────────────────────────────────

export type ImportFormat = 'csv' | 'apkg' | 'lin'

interface ImportFormatOption {
  format: ImportFormat
  label: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
}

const IMPORT_FORMAT_OPTIONS: ImportFormatOption[] = [
  { format: 'csv', label: 'CSV', description: 'A spreadsheet with word/meaning columns you map yourself.', icon: 'grid' },
  { format: 'apkg', label: 'Anki (.apkg)', description: 'Bring an existing Anki deck — including Cloze notes.', icon: 'albums' },
  { format: 'lin', label: 'Lingora (.lin)', description: 'A deck someone shared from Lingora — full fidelity, including review history.', icon: 'sparkles' },
]

/** The import-side twin of `ExportFormatSheet` — one "Import" entry per deck menu instead of one button per format. */
export function ImportFormatSheet(props: {
  visible: boolean
  onClose: () => void
  onSelect: (format: ImportFormat) => void
  title?: string
}): JSX.Element {
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  return (
    <Modal visible={props.visible} animationType="fade" transparent onRequestClose={props.onClose}>
      <Pressable style={styles.dropdownBackdrop} onPress={props.onClose} />
      <View style={styles.dropdownSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.dropdownSheetTitle}>{props.title ?? 'Import from…'}</Text>
        {IMPORT_FORMAT_OPTIONS.map((opt) => (
          <Pressable key={opt.format} style={styles.exportOptionRow} onPress={() => props.onSelect(opt.format)}>
            <View style={styles.exportOptionIcon}>
              <Ionicons name={opt.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.exportOptionText}>
              <Text style={styles.exportOptionLabel}>{opt.label}</Text>
              <Text style={styles.exportOptionDescription}>{opt.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </Modal>
  )
}

export function CefrBadge(props: { level: CefrLevel }): JSX.Element {
  const styles = useThemedStyles(createStyles)
  const c = cefrColors[props.level]
  return (
    <View style={[styles.cefrBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.cefrBadgeLabel, { color: c.fg }]}>{props.level}</Text>
    </View>
  )
}

/** A tappable icon + label/detail + chevron row — the standard shape for a settings menu entry
 * that navigates elsewhere (a screen, an external link). `detail` doubles as a one-line summary
 * of the destination's current state (e.g. "2 of 4 configured") when the caller has one handy. */
export function LinkRow(props: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  detail?: string
  onPress: () => void
  divider?: boolean
  testID?: string
}): JSX.Element {
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  return (
    <Pressable
      testID={props.testID}
      style={[styles.linkRow, props.divider && styles.rowDivider]}
      onPress={props.onPress}
    >
      <Ionicons name={props.icon} size={20} color={colors.primary} />
      <View style={styles.optionText}>
        <Text style={styles.optionLabel}>{props.label}</Text>
        {props.detail ? <Text style={styles.optionDetail}>{props.detail}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  )
}

// ─── Feedback / evaluation controls ───────────────────────────────────────────

/**
 * Thumbs up / down / report / regenerate, shown on every generated item.
 * `activeRating` highlights whichever thumb reflects the item's current
 * evaluation, so feedback state is visible rather than write-only.
 */
export function EvalBar(props: {
  activeRating?: 'up' | 'down' | undefined
  onUp?: () => void
  onDown?: () => void
  onReport?: () => void
  onRegen?: () => void
}): JSX.Element {
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const noop = (): void => undefined
  return (
    <View style={styles.evalBar}>
      <IconButton
        icon={props.activeRating === 'up' ? 'thumbs-up' : 'thumbs-up-outline'}
        size={17}
        onPress={props.onUp ?? noop}
        {...(props.activeRating === 'up' && { color: colors.success })}
      />
      <IconButton
        icon={props.activeRating === 'down' ? 'thumbs-down' : 'thumbs-down-outline'}
        size={17}
        onPress={props.onDown ?? noop}
        {...(props.activeRating === 'down' && { color: colors.danger })}
      />
      {props.onReport ? <IconButton icon="flag-outline" size={17} onPress={props.onReport} /> : null}
      {props.onRegen ? <IconButton icon="refresh-outline" size={17} onPress={props.onRegen} /> : null}
    </View>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function EmptyState(props: {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  message: string
}): JSX.Element {
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={props.icon} size={32} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{props.title}</Text>
      <Text style={styles.emptyMessage}>{props.message}</Text>
    </View>
  )
}

// ─── Alert modal ──────────────────────────────────────────────────────────────

/**
 * A centered popup for one-shot result notifications ("Export ready", "Import failed", "Could
 * not save your changes") — the in-app replacement for `Alert.alert`, which renders as an OS
 * native dialog on Android, visually inconsistent with the rest of the app's own modal styling
 * (see the import-complete popup this mirrors). Deliberately single-button (`OK`/`onClose`) — for
 * a real yes/no decision before a destructive action (delete/merge/etc.), the native `Alert.alert`
 * confirm dialog is still the right tool, not this.
 */
export function AlertModal(props: {
  visible: boolean
  title: string
  message: string
  onClose: () => void
  icon?: keyof typeof Ionicons.glyphMap
  /** Defaults to "OK" — pass a translated label from the caller (ui.tsx components don't call
   * `t()` themselves; see ExportFormatSheet's `title` prop for the same convention). */
  closeLabel?: string
}): JSX.Element {
  const styles = useThemedStyles(createStyles)
  return (
    <Modal visible={props.visible} animationType="fade" transparent onRequestClose={props.onClose}>
      <View style={styles.alertModalContainer}>
        <Pressable style={styles.alertModalBackdrop} onPress={props.onClose} />
        <View style={styles.alertModalCard}>
          {props.icon ? <EmptyState icon={props.icon} title={props.title} message={props.message} /> : (
            <>
              <Text style={styles.alertModalTitle}>{props.title}</Text>
              <Text style={styles.alertModalMessage}>{props.message}</Text>
            </>
          )}
          <Button label={props.closeLabel ?? 'OK'} onPress={props.onClose} />
        </View>
      </View>
    </Modal>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

export function ProgressBar(props: { progress: number }): JSX.Element {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.round(props.progress * 100)}%` }]} />
    </View>
  )
}

// ─── Loading / error states ───────────────────────────────────────────────────

/** Centered loading indicator for query-backed screens. */
export function Spinner(props: { message?: string }): JSX.Element {
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.spinner}>
      <ActivityIndicator size="large" color={colors.primary} />
      {props.message ? <Text style={styles.spinnerMessage}>{props.message}</Text> : null}
    </View>
  )
}

/** Query/mutation failure with an optional retry. */
export function ErrorState(props: { message: string; onRetry?: () => void }): JSX.Element {
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
      </View>
      <Text style={styles.emptyTitle}>Something went wrong</Text>
      <Text style={styles.emptyMessage}>{props.message}</Text>
      {props.onRetry ? (
        <View style={styles.errorRetry}>
          <Button label="Try again" onPress={props.onRetry} variant="secondary" small />
        </View>
      ) : null}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
    rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
    optionText: { flex: 1 },
    optionLabel: { fontSize: type.body, fontWeight: '600', color: colors.text },
    optionDetail: { fontSize: type.micro, color: colors.textMuted, marginTop: 1 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    },
    cardPressed: {
      opacity: 0.85,
    },
    cardActionBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    cardActionButton: { alignItems: 'center', gap: 2, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
    cardActionLabel: { fontSize: type.micro, color: colors.textSecondary, fontWeight: '600' },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xl,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: type.subheading,
      fontWeight: '700',
      color: colors.text,
    },
    sectionAction: {
      fontSize: type.caption,
      fontWeight: '600',
      color: colors.primary,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: 14,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.md,
    },
    buttonSmall: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    buttonLabel: {
      fontSize: type.body,
      fontWeight: '600',
    },
    buttonLabelSmall: {
      fontSize: type.caption,
    },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
    },
    chipLabel: {
      fontSize: type.caption,
      fontWeight: '600',
    },
    dropdownField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    dropdownValue: { fontSize: type.body, fontWeight: '600', color: colors.text, flex: 1, marginRight: spacing.sm },
    dropdownPlaceholder: { color: colors.textMuted, fontWeight: '400' },
    dropdownBackdrop: { flex: 1, backgroundColor: '#00000066' },
    dropdownSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.xl,
      maxHeight: '70%',
    },
    modalHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: radius.full,
      backgroundColor: colors.border,
      marginBottom: spacing.md,
    },
    dropdownSheetTitle: { fontSize: type.subheading, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
    dropdownList: { flexGrow: 0 },
    dropdownOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownOptionLabel: { fontSize: type.body, color: colors.text, flex: 1, marginRight: spacing.sm },
    exportOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    exportOptionIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    exportOptionText: { flex: 1 },
    exportOptionLabel: { fontSize: type.body, fontWeight: '700', color: colors.text },
    exportOptionDescription: { fontSize: type.micro, color: colors.textSecondary, marginTop: 1 },
    cefrBadge: {
      paddingVertical: 2,
      paddingHorizontal: 7,
      borderRadius: radius.sm,
    },
    cefrBadgeLabel: {
      fontSize: type.micro,
      fontWeight: '700',
    },
    evalBar: {
      flexDirection: 'row',
      gap: spacing.lg,
      alignItems: 'center',
    },
    empty: {
      alignItems: 'center',
      paddingVertical: spacing.xxl * 2,
      paddingHorizontal: spacing.xl,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontSize: type.subheading,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    emptyMessage: {
      fontSize: type.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
    },
    progressTrack: {
      height: 6,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceMuted,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    spinner: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl * 2,
      gap: spacing.md,
    },
    spinnerMessage: {
      fontSize: type.body,
      color: colors.textSecondary,
    },
    errorRetry: {
      marginTop: spacing.lg,
    },
    alertModalContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    alertModalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00000066' },
    alertModalCard: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.xl,
      gap: spacing.md,
    },
    alertModalTitle: { fontSize: type.subheading, fontWeight: '800', color: colors.text },
    alertModalMessage: { fontSize: type.body, color: colors.textSecondary, lineHeight: 20 },
  })
