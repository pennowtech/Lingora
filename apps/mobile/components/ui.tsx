import type { CefrLevel, LanguageCode } from '@lingora/types'
import { useEffect, useState, type JSX, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon, type IconName } from './Icon'
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
  disabled?: boolean
}): JSX.Element {
  const { children, style, onPress, onLongPress, onLayout, disabled } = props
  const styles = useThemedStyles(createStyles)
  if (onPress) {
    return (
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onLongPress={onLongPress}
        onLayout={onLayout}
        style={({ pressed }) => [styles.card, pressed && !disabled && styles.cardPressed, style]}
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
  icon?: IconName
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
      {icon ? <Icon name={icon} size={small ? 15 : 18} color={fg} /> : null}
      <Text
        maxFontSizeMultiplier={1.25}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.buttonLabel, small && styles.buttonLabelSmall, { color: fg }]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export function IconButton(props: {
  icon: IconName
  onPress: () => void
  color?: string
  size?: number
  disabled?: boolean
  testID?: string
  /** An icon-only button has nothing else for a screen reader to announce — worth setting whenever
   * the icon alone (e.g. "Undo2") wouldn't be obvious out of context. */
  accessibilityLabel?: string
}): JSX.Element {
  const colors = useColors()
  return (
    <Pressable
      testID={props.testID}
      onPress={props.onPress}
      disabled={props.disabled}
      hitSlop={8}
      accessibilityRole="button"
      {...(props.accessibilityLabel !== undefined && { accessibilityLabel: props.accessibilityLabel })}
      style={({ pressed }) => [props.disabled && { opacity: 0.4 }, pressed && { opacity: 0.6 }]}
    >
      <Icon name={props.icon} size={props.size ?? 22} color={props.color ?? colors.textSecondary} />
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
      icon="Volume1"
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
  explainIcon?: IconName
  /** Optional — omitted for AI-generated cards, which already have Regenerate (whole-card redo)
   * and per-field regenerate actions instead of a manual text editor. */
  onEdit?: () => void
  onLookup: () => void
  /** "Listen" — speaks the example or word aloud via TTS. */
  onListen?: () => void
  /** "Ask AI" — a follow-up question popup, separate from Explain/More info. Optional because not
   * every card-rendering context (e.g. a bare preview) wants it. */
  onAskAI?: () => void
  /** "Regenerate" — replaces the whole card's AI-generated content from scratch. Optional; the
   * caller is responsible for confirming before calling this (destructive). Available on every
   * card, not just already-AI ones — regenerating a dictionary/word-guide card upgrades it to a
   * full AI card in place. */
  onRegenerate?: () => void
  regenerateLoading?: boolean
  /** Disables Explain/More info, Ask AI, and Regenerate together — the three actions that read or
   * rewrite this card's AI content — while some other AI write is already in flight for it (e.g.
   * background auto-enrichment just after creation). Doesn't affect Listen/Edit/Delete/Look up,
   * which don't touch AI-generated content. */
  aiActionsDisabled?: boolean
  /** "Delete" — permanently deletes this generated card. */
  onDelete?: () => void
  deleteLoading?: boolean
  /** "Add to Deck" / "In Deck" star button */
  onAddToDeck?: () => void
  isDecked?: boolean
  deckLabel?: string
}): JSX.Element {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.cardActionBar}>
      {props.onAddToDeck ? (
        <CardActionButton
          icon="Star"
          label={props.deckLabel ?? t('Deck')}
          {...(props.isDecked !== undefined && { active: props.isDecked })}
          onPress={props.onAddToDeck}
        />
      ) : null}
      {props.onListen ? (
        <CardActionButton
          icon="Volume1"
          label={t('Listen')}
          onPress={props.onListen}
        />
      ) : null}
      <CardActionButton
        icon={
          props.explainIcon ??
          (props.explainVisible ? 'Book' : 'BookOpen')
        }
        label={props.explainLabel ?? t('Explain')}
        active={props.explainVisible}
        onPress={props.onExplain}
        {...(props.explainLoading !== undefined && { loading: props.explainLoading })}
        {...(props.aiActionsDisabled !== undefined && { disabled: props.aiActionsDisabled })}
      />
      {props.onAskAI ? (
        <CardActionButton
          icon="MessageCircle"
          label={t('Ask AI')}
          onPress={props.onAskAI}
          {...(props.aiActionsDisabled !== undefined && { disabled: props.aiActionsDisabled })}
        />
      ) : null}
      {props.onRegenerate ? (
        <CardActionButton
          icon="RefreshCw"
          label={t('Regenerate')}
          onPress={props.onRegenerate}
          {...(props.regenerateLoading !== undefined && { loading: props.regenerateLoading })}
          {...(props.aiActionsDisabled !== undefined && { disabled: props.aiActionsDisabled })}
        />
      ) : null}
      {props.onEdit ? (
        <CardActionButton icon="Pencil" label={t('Edit')} onPress={props.onEdit} />
      ) : null}
      {props.onDelete ? (
        <CardActionButton
          icon="Trash2"
          label={t('Delete')}
          destructive
          onPress={props.onDelete}
          {...(props.deleteLoading !== undefined && { loading: props.deleteLoading })}
        />
      ) : null}
      <CardActionButton icon="Globe" label={t('Look up')} onPress={props.onLookup} />
    </View>
  )
}

function CardActionButton(props: {
  icon: IconName
  label: string
  active?: boolean
  destructive?: boolean
  loading?: boolean
  disabled?: boolean
  onPress: () => void
}): JSX.Element {
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const textColor = props.destructive
    ? colors.danger
    : props.active
      ? colors.primary
      : colors.textSecondary
  const isDisabled = props.loading === true || props.disabled === true

  return (
    <Pressable
      style={[styles.cardActionButton, isDisabled && styles.cardActionButtonDisabled]}
      onPress={props.onPress}
      disabled={isDisabled}
      hitSlop={4}
    >
      {props.loading ? (
        <ActivityIndicator size="small" color={props.destructive ? colors.danger : colors.primary} />
      ) : (
        <Icon name={props.icon} size={20} color={textColor} />
      )}
      <Text numberOfLines={1} style={[styles.cardActionLabel, { color: textColor }]}>
        {props.label}
      </Text>
    </Pressable>
  )
}

// ─── Chips ────────────────────────────────────────────────────────────────────

export function Chip(props: {
  label?: string
  /** An alternative to `label` for a "direction" chip (e.g. Word -> Meaning) — renders as
   * "{from} [arrow icon] {to}" instead of embedding a literal "->" in translatable text. Exactly
   * one of `label`/`arrow` should be set. */
  arrow?: { from: string; to: string }
  selected?: boolean
  onPress?: () => void
  color?: { fg: string; bg: string }
  testID?: string
}): JSX.Element {
  const { label, arrow, selected = false, onPress, color } = props
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
      {arrow ? (
        <View style={styles.chipArrowRow}>
          <Text style={[styles.chipLabel, { color: fg }]}>{arrow.from}</Text>
          <Icon name="ArrowRight" size={16} color={fg} strokeWidth={2.5} />
          <Text style={[styles.chipLabel, { color: fg }]}>{arrow.to}</Text>
        </View>
      ) : (
        <Text style={[styles.chipLabel, { color: fg }]}>{label}</Text>
      )}
    </Pressable>
  )
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────

export interface DropdownOption {
  label: string
  value: string
  icon?: IconName
  badgeCount?: number
}

/**
 * A tappable field showing the current selection, opening a bottom-sheet
 * list of options — for a single choice among many (e.g. "which column is
 * the word?"), where a `Chip` row would otherwise wrap across several lines.
 * `clearable` adds a "None" row at the top, calling `onChange(null)` — for
 * an optional field that can be left unmapped. Supports icons and badges for options.
 */
export function Dropdown(props: {
  label?: string
  placeholder?: string
  value: string | null
  options: DropdownOption[]
  onChange: (value: string | null) => void
  clearable?: boolean
}): JSX.Element {
  const { t } = useTranslation()
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
        <View style={styles.dropdownValueRow}>
          {selected?.icon ? (
            <View style={styles.dropdownSelectedIconWrap}>
              <Icon name={selected.icon} size={13} color={colors.primary} />
            </View>
          ) : null}
          <Text style={[styles.dropdownValue, !selected && styles.dropdownPlaceholder]} numberOfLines={1}>
            {selected?.label ?? props.placeholder ?? t('Select...')}
          </Text>
          {selected?.badgeCount !== undefined ? (
            <View style={styles.dropdownBadge}>
              <Text style={styles.dropdownBadgeText}>{selected.badgeCount}</Text>
            </View>
          ) : null}
        </View>
        <Icon name="ChevronDown" size={14} color={colors.textMuted} />
      </Pressable>
      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.dropdownBackdrop} onPress={() => setOpen(false)} />
        <View style={styles.dropdownSheet}>
          <View style={styles.modalHandle} />
          {props.label ? <Text style={styles.dropdownSheetTitle}>{props.label}</Text> : null}
          <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
            {props.clearable ? (
              <Pressable
                style={[styles.dropdownOption, props.value === null && styles.dropdownOptionSelected]}
                onPress={() => choose(null)}
              >
                <Text style={[styles.dropdownOptionLabel, props.value === null && styles.dropdownOptionLabelSelected]}>
                  {t('None')}
                </Text>
                {props.value === null ? (
                  <View style={styles.dropdownCheckCircle}>
                    <Icon name="Check" size={12} color="#FFFFFF" />
                  </View>
                ) : null}
              </Pressable>
            ) : null}
            {props.options.map((opt) => {
              const isSelected = props.value === opt.value
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                  onPress={() => choose(opt.value)}
                >
                  <View style={styles.dropdownOptionLeft}>
                    {opt.icon ? (
                      <View style={[styles.dropdownOptionIconWrap, isSelected && styles.dropdownOptionIconWrapSelected]}>
                        <Icon name={opt.icon} size={16} color={isSelected ? colors.primary : colors.textSecondary} />
                      </View>
                    ) : null}
                    <Text style={[styles.dropdownOptionLabel, isSelected && styles.dropdownOptionLabelSelected]} numberOfLines={2}>
                      {opt.label}
                    </Text>
                    {opt.badgeCount !== undefined ? (
                      <View style={[styles.dropdownOptionBadge, isSelected && styles.dropdownOptionBadgeSelected]}>
                        <Text style={[styles.dropdownOptionBadgeText, isSelected && styles.dropdownOptionBadgeTextSelected]}>
                          {opt.badgeCount}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {isSelected ? (
                    <View style={styles.dropdownCheckCircle}>
                      <Icon name="Check" size={12} color="#FFFFFF" />
                    </View>
                  ) : null}
                </Pressable>
              )
            })}
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
  icon: IconName
}

const EXPORT_FORMAT_OPTIONS: ExportFormatOption[] = [
  { format: 'csv', label: 'CSV', description: 'Re-importable spreadsheet - word, meaning, example, and more.', icon: 'LayoutGrid' },
  { format: 'apkg', label: 'Anki (.apkg)', description: 'Study in Anki/AnkiDroid/AnkiMobile. Cards start fresh.', icon: 'Layers' },
  { format: 'markdown', label: 'Markdown', description: 'A readable word - meaning - example list. Not re-importable.', icon: 'FileText' },
  { format: 'lem', label: 'Lemony (.lem)', description: 'Full-fidelity backup, export-only for a single deck.', icon: 'CloudDownload' },
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
        <Text style={styles.dropdownSheetTitle}>{props.title ?? 'Export as...'}</Text>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {EXPORT_FORMAT_OPTIONS.map((opt) => (
            <Pressable key={opt.format} style={styles.exportOptionRow} onPress={() => props.onSelect(opt.format)}>
              <View style={styles.exportOptionIcon}>
                <Icon name={opt.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.exportOptionText}>
                <Text style={styles.exportOptionLabel}>{opt.label}</Text>
                <Text style={styles.exportOptionDescription}>{opt.description}</Text>
              </View>
              <Icon name="ChevronRight" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  )
}

// ─── Import format sheet ────────────────────────────────────────────────────

export type ImportFormat = 'csv' | 'apkg' | 'lem'

interface ImportFormatOption {
  format: ImportFormat
  label: string
  description: string
  icon: IconName
}

const IMPORT_FORMAT_OPTIONS: ImportFormatOption[] = [
  { format: 'csv', label: 'CSV', description: 'A spreadsheet with word/meaning columns you map yourself.', icon: 'LayoutGrid' },
  { format: 'apkg', label: 'Anki (.apkg)', description: 'Bring an existing Anki deck - including Cloze notes.', icon: 'Layers' },
  { format: 'lem', label: 'Lemony (.lem)', description: 'A deck someone shared from Lemony - full fidelity, including review history.', icon: 'Sparkles' },
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
        <Text style={styles.dropdownSheetTitle}>{props.title ?? 'Import from...'}</Text>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {IMPORT_FORMAT_OPTIONS.map((opt) => (
            <Pressable key={opt.format} style={styles.exportOptionRow} onPress={() => props.onSelect(opt.format)}>
              <View style={styles.exportOptionIcon}>
                <Icon name={opt.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.exportOptionText}>
                <Text style={styles.exportOptionLabel}>{opt.label}</Text>
                <Text style={styles.exportOptionDescription}>{opt.description}</Text>
              </View>
              <Icon name="ChevronRight" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  )
}

export function CefrBadge(props: { level?: CefrLevel | null | undefined }): JSX.Element | null {
  const styles = useThemedStyles(createStyles)
  if (!props.level || props.level === 'unknown') return null
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
  icon: IconName
  label: string
  detail?: string
  onPress: () => void
  divider?: boolean
  testID?: string
  /** Per-row icon tile color (e.g. lib/theme.ts's settingsCategoryColors) — omit to keep the
   * plain bare-icon-in-brand-purple look every existing LinkRow caller already has. */
  tint?: { fg: string; bg: string }
}): JSX.Element {
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  return (
    <Pressable
      testID={props.testID}
      accessibilityRole="button"
      accessibilityLabel={props.detail ? `${props.label}, ${props.detail}` : props.label}
      style={[styles.linkRow, props.divider && styles.rowDivider]}
      onPress={props.onPress}
    >
      {props.tint ? (
        <View style={[styles.linkRowIconTile, { backgroundColor: props.tint.bg }]}>
          <Icon name={props.icon} size={18} color={props.tint.fg} />
        </View>
      ) : (
        <Icon name={props.icon} size={20} color={colors.primary} />
      )}
      <View style={styles.optionText}>
        <Text style={styles.optionLabel}>{props.label}</Text>
        {props.detail ? (
          <Text style={styles.optionDetail} numberOfLines={2}>
            {props.detail}
          </Text>
        ) : null}
      </View>
      <Icon name="ChevronRight" size={16} color={colors.textMuted} />
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
        icon="ThumbsUp"
        size={17}
        onPress={props.onUp ?? noop}
        {...(props.activeRating === 'up' && { color: colors.success })}
      />
      <IconButton
        icon="ThumbsDown"
        size={17}
        onPress={props.onDown ?? noop}
        {...(props.activeRating === 'down' && { color: colors.danger })}
      />
      {props.onReport ? (
        <IconButton
          icon="Flag"
          size={17}
          onPress={props.onReport}
        />
      ) : null}
      {props.onRegen ? <IconButton icon="RefreshCw" size={17} onPress={props.onRegen} /> : null}
    </View>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function EmptyState(props: {
  icon: IconName
  title: string
  message: string
}): JSX.Element {
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={props.icon} size={32} color={colors.primary} />
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
  icon?: IconName
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

/**
 * A brief, non-blocking confirmation — "Added to My Vocabulary", "Cloze added" — for actions
 * frequent enough that `AlertModal`'s tap-to-dismiss would be more friction than the confirmation
 * is worth (adding a card/cloze to a deck, one word after another). Auto-dismisses after
 * `durationMs` (default 2200ms) or on tap; owned by the caller's own local state (`message`/
 * `onHide`), same pattern as every other one-shot notice in this app — there's no global toast
 * queue, so a caller triggering a second toast before the first hides just replaces it in place.
 */
export function Toast(props: {
  message: string | null
  onHide: () => void
  icon?: IconName
  durationMs?: number
}): JSX.Element | null {
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  // Below the status bar AND the native stack header (insets.top alone only clears the status
  // bar) — headerHeight is a reasonable fixed estimate rather than reading the real header height,
  // since screens vary and this only needs to clear it, not hug it exactly.
  const insets = useSafeAreaInsets()
  const headerHeight = Platform.OS === 'ios' ? 44 : 56

  useEffect(() => {
    if (!props.message) return
    const timer = setTimeout(props.onHide, props.durationMs ?? 2200)
    return () => clearTimeout(timer)
    // Deliberately keyed on props.message alone — re-arming the timer on every onHide/durationMs
    // identity change (most callers pass an inline arrow function) would restart the countdown
    // each render instead of once per shown message.
  }, [props.message])

  if (!props.message) return null
  return (
    <View style={[styles.toastWrap, { top: insets.top + headerHeight + spacing.sm }]} pointerEvents="box-none">
      <Pressable style={styles.toast} onPress={props.onHide}>
        <Icon name={props.icon ?? 'CircleCheck'} size={18} color={colors.textOnPrimary} />
        <Text style={styles.toastText}>{props.message}</Text>
      </Pressable>
    </View>
  )
}

/**
 * The two-button (Cancel + Confirm) counterpart to `AlertModal` — the in-app replacement for
 * `Alert.alert(title, message, [{cancel}, {confirm, style: 'destructive'}])`, for a real yes/no
 * decision before an action (delete/merge/restore/etc.), not just a result notification. Still
 * just one confirm action — a caller needing more than Cancel + one confirm button should keep
 * using `Alert.alert` directly (or pass its own custom body via `AlertModal`-style composition;
 * none of this app's ~80 Alert.alert call sites need more than two buttons as of this writing).
 */
export function ConfirmModal(props: {
  visible: boolean
  title: string
  message: string
  onCancel: () => void
  onConfirm: () => void
  /** Defaults to "Cancel"/"Confirm" — pass translated labels; see AlertModal's `closeLabel` doc. */
  cancelLabel?: string
  confirmLabel?: string
  /** Red "danger" button styling for a destructive action (delete/reset/replace) — defaults to
   * the normal primary button for a non-destructive confirm (e.g. "Sign in?"). */
  destructive?: boolean
}): JSX.Element {
  const styles = useThemedStyles(createStyles)
  return (
    <Modal visible={props.visible} animationType="fade" transparent onRequestClose={props.onCancel}>
      <View style={styles.alertModalContainer}>
        <Pressable style={styles.alertModalBackdrop} onPress={props.onCancel} />
        <View style={styles.alertModalCard}>
          <Text style={styles.alertModalTitle}>{props.title}</Text>
          <Text style={styles.alertModalMessage}>{props.message}</Text>
          <View style={styles.confirmModalActions}>
            <Button label={props.cancelLabel ?? 'Cancel'} variant="ghost" onPress={props.onCancel} />
            <Button
              label={props.confirmLabel ?? 'Confirm'}
              variant={props.destructive ? 'danger' : 'primary'}
              onPress={props.onConfirm}
            />
          </View>
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
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.dangerSoft }]}>
        <Icon name="CircleAlert" size={32} color={colors.danger} />
      </View>
      <Text style={styles.emptyTitle}>{t('Something went wrong')}</Text>
      <Text style={styles.emptyMessage}>{props.message}</Text>
      {props.onRetry ? (
        <View style={styles.errorRetry}>
          <Button label={t('Try again')} onPress={props.onRetry} variant="secondary" small />
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
    linkRowIconTile: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    optionText: { flex: 1 },
    optionLabel: { fontSize: type.body, fontWeight: '600', color: colors.text },
    optionDetail: { fontSize: type.micro, color: colors.textMuted, marginTop: 1 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      overflow: 'hidden',
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
    cardActionButton: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      gap: 2,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
    },
    cardActionButtonDisabled: { opacity: 0.4 },
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
    chipArrowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    dropdownField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 2,
      gap: spacing.xs,
    },
    dropdownValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      flex: 1,
    },
    dropdownSelectedIconWrap: {
      width: 22,
      height: 22,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropdownValue: { fontSize: type.caption, fontWeight: '700', color: colors.text, flex: 1 },
    dropdownPlaceholder: { color: colors.textMuted, fontWeight: '400' },
    dropdownBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: radius.full,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    dropdownBadgeText: { fontSize: type.micro, fontWeight: '700', color: colors.primary },
    dropdownBackdrop: { flex: 1, backgroundColor: '#00000077' },
    dropdownSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl,
      maxHeight: '75%',
    },
    modalHandle: {
      alignSelf: 'center',
      width: 36,
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
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      marginBottom: spacing.xs,
    },
    dropdownOptionSelected: {
      backgroundColor: colors.primarySoft,
    },
    dropdownOptionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    dropdownOptionIconWrap: {
      width: 32,
      height: 32,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropdownOptionIconWrapSelected: {
      backgroundColor: colors.surface,
    },
    dropdownOptionLabel: { fontSize: type.body, fontWeight: '500', color: colors.text, flex: 1 },
    dropdownOptionLabelSelected: { fontWeight: '700', color: colors.primary },
    dropdownOptionBadge: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    dropdownOptionBadgeSelected: {
      backgroundColor: colors.primary,
    },
    dropdownOptionBadgeText: { fontSize: type.micro, fontWeight: '600', color: colors.textSecondary },
    dropdownOptionBadgeTextSelected: { color: '#FFFFFF', fontWeight: '700' },
    dropdownCheckCircle: {
      width: 20,
      height: 20,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.sm,
    },
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
    confirmModalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
    toastWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      // `top` is set per-instance (safe-area insets aren't available to a style factory) — see Toast.
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.full,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      maxWidth: '100%',
      // A soft translucent outline plus a real offset+blur glow beneath it - same treatment as
      // Home's hero "Start review" button (see app/(tabs)/index.tsx's heroButton), so the toast
      // reads as the same "raised, lit" family instead of a flat pill.
      borderWidth: 1,
      borderColor: '#FFFFFF55',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    toastText: { color: colors.textOnPrimary, fontSize: type.caption, fontWeight: '600', flexShrink: 1 },
  })
