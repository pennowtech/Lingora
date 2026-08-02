import { Ionicons } from '@expo/vector-icons'
import type { Template, TemplateType } from '@lingora/types'
import { createTemplate, getAllTemplates, updateTemplate } from '@lingora/database'
import { logger } from '@lingora/observability'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { CardRenderer } from '../../components/CardRenderer'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { AlertModal, Button, Card, Chip, ConfirmModal, ErrorState, IconButton, SectionHeader, Spinner } from '../../components/ui'
import {
  CLOZE_BACK_TEMPLATE,
  CLOZE_FRONT_TEMPLATE,
  CLOZE_SAMPLE_CONTEXT,
  CLOZE_STYLES,
  CLOZE_TEMPLATE_VARIABLES,
  CONDITIONAL_EXAMPLE,
  DEFAULT_BACK_TEMPLATE,
  DEFAULT_FRONT_TEMPLATE,
  DEFAULT_STYLES,
  hasTemplateField,
  highlightWord,
  LOOP_TEMPLATE_FIELDS,
  renderCardHtml,
  TEMPLATE_VARIABLES,
  type CardTemplateContext,
} from '../../lib/templates'
import { useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'srs', screen: 'TemplatesScreen' })

/** Sample data for the live preview — the same word shown in the design reference sketches. */
const SAMPLE_CONTEXT: CardTemplateContext = {
  word: 'ausgehen',
  gender: 'verb · separable',
  meaning: 'to go out',
  other_meanings: ['to run out (supplies)'],
  example: 'Wir gehen heute Abend aus.',
  example_highlighted: highlightWord('Wir gehen heute Abend aus.', 'ausgehen'),
  translation: 'We are going out tonight.',
  synonyms: [{ word: 'weggehen', nuance: 'more casual', formality: 'neutral' }],
  phrases: [{ expression: 'davon ausgehen', meaning: 'to assume / take it that' }],
  audio: '',
  image: '',
  cloze: '',
  cloze_blanked: '',
  cloze_revealed: '',
  context_hint: 'verb · separable',
}

const ACCENT_COLORS = ['#534AB7', '#2E9E5B', '#D64545', '#D97706', '#2D7FF9', '#C43F8E', '#5F5E6A']
const ACCENT_PATTERN = /:root\{--accent:(#[0-9a-fA-F]{6});\}/

/** Reads the accent color previously upserted into the styles text, if any. */
function readAccentColor(styles: string): string | null {
  return ACCENT_PATTERN.exec(styles)?.[1] ?? null
}

/** Upserts (or removes) the `:root{--accent:...}` line the accent-color picker manages. */
function withAccentColor(styles: string, color: string | null): string {
  const withoutAccent = styles.replace(ACCENT_PATTERN, '').trim()
  if (!color) return withoutAccent
  const line = `:root{--accent:${color};}`
  return withoutAccent ? `${line}\n${withoutAccent}` : line
}

type Tab = 'fields' | 'style' | 'preview' | 'code'
type Side = 'front' | 'back'

/**
 * Help content — one accordion section per editor tab, plus a dedicated
 * "HTML & CSS" deep-dive. Kept as data (not JSX) so each section's body is a
 * plain list of paragraphs/code lines the accordion renders uniformly.
 */
const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'fields',
    title: 'Fields tab',
    icon: 'list',
    paragraphs: [
      { text: 'Each row is one piece of card data. Tap "Front" or "Back" to show that field on that side — a field can appear on both, on neither, or on just one.' },
      { text: 'Turning a field on inserts the minimum Liquid needed for it at the end of that side\'s template: a plain field becomes {{ word }}; a list field (Other meanings, Synonyms, Related phrases) becomes a {% for %} loop, because a list can\'t be printed directly.' },
      { text: 'Turning a field off removes exactly that {{ variable }} or {% for %}...{% endfor %} block wherever it appears — nothing else in the template is touched.' },
      { text: 'The toggles read the template text itself (no hidden markers) — they work reliably for templates built through the toggles. If you hand-write unusual formatting in the Code tab, a toggle may not detect it; edit the Code tab directly in that case.' },
    ],
  },
  {
    id: 'style',
    title: 'Style tab',
    icon: 'color-palette',
    paragraphs: [
      { text: 'The CSS box applies to both the front and back — there is one stylesheet per template, not one per side.' },
      { text: 'Accent color swatches write a custom property at the top of your CSS:' },
      { text: ':root{--accent:#534AB7;}', code: true },
      { text: 'Reference it anywhere in your own CSS rules, e.g.:' },
      { text: 'color: var(--accent);\nborder-color: var(--accent);', code: true },
      { text: 'Picking a swatch again (or none) removes the line — it never conflicts with CSS you write by hand elsewhere in the box.' },
    ],
  },
  {
    id: 'preview',
    title: 'Preview tab',
    icon: 'eye',
    paragraphs: [
      { text: 'Front and Back are separate — the chip above the card switches which side is rendered, so you always know exactly which side you\'re looking at.' },
      { text: 'The card fills the available screen space exactly (no scrolling) and the caption above it shows its real, on-device measured width and height in points — the same size a card gets during an actual review session.' },
      { text: 'Rendering goes through the exact same LiquidJS + WebView pipeline the review session uses, with one fixed sample word ("ausgehen") standing in for your real vocabulary.' },
    ],
  },
  {
    id: 'code',
    title: 'Code tab',
    icon: 'code-slash',
    paragraphs: [
      { text: 'Front and Back are raw Liquid templates — anything valid Liquid works here, not just what the Fields toggles generate.' },
      { text: '{{ variable }} prints a value. {% if gender %}...{% endif %} shows content only when a field has one — good for optional fields. {% for s in synonyms %}...{% endfor %} loops a list; add "limit:2" to cap it, and {% unless forloop.last %}...{% endunless %} to add a separator between items but not after the last one.', code: true },
      { text: 'The "Available template variables" card lists every field name you can reference, with a one-line description of what it holds.' },
      { text: 'The conditional example at the bottom is a worked, copy-pasteable snippet combining {% if %} and {% for ... limit %}.' },
    ],
  },
  {
    id: 'htmlcss',
    title: 'HTML & CSS without extra elements',
    icon: 'construct',
    paragraphs: [
      { text: 'Fields added via the toggles are never auto-wrapped in a <div> or <span> — {{ word }} renders as bare text directly inside the card body. That keeps generated templates minimal, but it means a rule like ".word { ... }" has nothing to match unless you add that class yourself.' },
      { text: 'Selectors that work with zero extra markup (they target the card body itself or elements this app already emits):' },
      { text: '.front { ... }         — everything on the front, only\n.back { ... }          — everything on the back, only\nbody { ... }           — both sides at once\nhr { ... }             — the divider some starter templates use\n:root { --accent: }    — the custom property the accent picker sets\n* { ... }               — every element, including bare text runs', code: true },
      { text: '.front and .back work because this app stamps that class onto the card\'s own outer container automatically — the same one CSS box styles both sides, and .front/.back is how you tell them apart without adding a wrapper element yourself.' },
      { text: 'To style one field on its own — e.g. make the word bigger than the rest — wrap just that field in your own element in the Code tab, then target the class you chose:' },
      { text: '<span class="word">{{ word }}</span>\n\n/* in the CSS box: */\n.word { font-size: 2rem; font-weight: 800; color: var(--accent); }', code: true },
      { text: 'List fields (Other meanings, Synonyms, Related phrases) already need a {% for %} loop to render at all — that loop is structurally required, not a styling choice. To style each item individually, wrap the item inside the loop:' },
      { text: '{% for s in synonyms %}<span class="syn">{{ s.word }}</span>{% unless forloop.last %}, {% endunless %}{% endfor %}\n\n.syn { color: var(--accent); }', code: true },
      { text: 'Everything renders inside a real WebView, so standard CSS applies as on any web page — flexbox, custom fonts via @font-face, transitions, etc. all work; there is no special "app CSS" subset to learn beyond this.' },
    ],
  },
]

// No wrapper element (no <div>, no comment marker) is added unless the
// syntax structurally requires one — a scalar field is just `{{ word }}`.
// Array-typed fields (synonyms, phrases, other_meanings) can't be printed
// directly (a bare {{ synonyms }} prints "[object Object]" for a list of
// objects) so they need a real {% for %} loop; that loop is the minimum
// HTML/Liquid required, not a stylistic <div> choice.
function fieldSnippet(variable: string): string {
  switch (variable) {
    case 'other_meanings':
      return '{% for m in other_meanings %}{{ m }}{% unless forloop.last %}; {% endunless %}{% endfor %}'
    case 'synonyms':
      return '{% for s in synonyms %}{{ s.word }}{% unless forloop.last %}, {% endunless %}{% endfor %}'
    case 'phrases':
      return '{% for p in phrases %}{{ p.expression }} — {{ p.meaning }}{% unless forloop.last %}<br/>{% endunless %}{% endfor %}'
    default:
      return `{{ ${variable} }}`
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function withField(template: string, variable: string, enabled: boolean): string {
  if (enabled) {
    if (hasTemplateField(template, variable)) return template
    const snippet = fieldSnippet(variable)
    return template.trim() ? `${template} ${snippet}` : snippet
  }
  const pattern = LOOP_TEMPLATE_FIELDS.has(variable)
    ? new RegExp(`\\{%\\s*for\\s+\\w+\\s+in\\s+${escapeRegExp(variable)}\\b[\\s\\S]*?\\{%\\s*endfor\\s*%\\}`, 'g')
    : new RegExp(`\\{\\{\\s*${escapeRegExp(variable)}\\s*\\}\\}`, 'g')
  return template.replace(pattern, '').replace(/[ \t]+/g, ' ').trim()
}

/**
 * Card template editor — Fields / Style / Preview / Code tabs, matching
 * `LingoraDocs/images/FlashCardTemplate.png` and `FlashCardTemplate_2.png`.
 * Renders through the same `renderCardHtml`/`CardRenderer` the review
 * session uses, so what's previewed here is exactly what studying looks
 * like — not a separate approximation.
 *
 * The Fields tab's toggles are a simple heuristic over the raw Liquid text
 * (does this side's template already contain `{{ variable }}`?) rather than
 * a structured field model with true drag-reorder — reordering is a
 * documented v1 simplification (see PHASE_5_STATUS.md); hand-written
 * templates with unusual formatting should be edited directly in the Code
 * tab instead of via the toggles.
 */
export default function TemplatesScreen(): JSX.Element {
  const { db } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const [previewCardSize, setPreviewCardSize] = useState<{ width: number; height: number } | null>(null)
  const queryClient = useQueryClient()

  const templatesQuery = useQuery({ queryKey: ['templates'], queryFn: () => getAllTemplates(db) })

  const [templateType, setTemplateType] = useState<TemplateType>('vocab')
  const [frontTemplate, setFrontTemplate] = useState('')
  const [backTemplate, setBackTemplate] = useState('')
  const [styles_, setStyles_] = useState('')
  const [tab, setTab] = useState<Tab>('fields')
  const [previewSide, setPreviewSide] = useState<Side>('front')
  const [errorNotice, setErrorNotice] = useState<{ title: string; message: string } | null>(null)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const help = useHelpAccordion('fields')

  const allTemplates = templatesQuery.data ?? []
  const templates = allTemplates.filter((t) => t.type === templateType)
  // Exactly one template per type — no multi-template management, so the first (and only) row
  // for this type, ordered is_default DESC by getAllTemplates, is simply "the" template.
  const active = templates[0]
  const templateVariables = templateType === 'cloze' ? CLOZE_TEMPLATE_VARIABLES : TEMPLATE_VARIABLES
  const sampleContext = templateType === 'cloze' ? CLOZE_SAMPLE_CONTEXT : SAMPLE_CONTEXT
  const defaultFront = templateType === 'cloze' ? CLOZE_FRONT_TEMPLATE : DEFAULT_FRONT_TEMPLATE
  const defaultBack = templateType === 'cloze' ? CLOZE_BACK_TEMPLATE : DEFAULT_BACK_TEMPLATE
  const defaultStyles = templateType === 'cloze' ? CLOZE_STYLES : DEFAULT_STYLES
  // Never shown/edited (no naming UI any more) — just needs some value for the DB's NOT NULL column.
  const templateName = templateType === 'cloze' ? 'Cloze' : 'Vocabulary'

  // Load the template's fields into the editor whenever the underlying row changes (a different
  // type's template, or the very first save turning "no row yet" into a real one) — not on every
  // keystroke.
  useEffect(() => {
    if (!active) return
    setFrontTemplate(active.frontTemplate)
    setBackTemplate(active.backTemplate)
    setStyles_(active.styles ?? '')
  }, [active?.id])

  const isDirty =
    !!active &&
    (frontTemplate !== active.frontTemplate || backTemplate !== active.backTemplate || styles_ !== (active.styles ?? ''))

  /** Creates (first time) or updates (every time after) this type's one template. Takes explicit
   * values rather than reading frontTemplate/backTemplate/styles_ from closure state, so a caller
   * that just called setFrontTemplate/etc. (e.g. resetToDefault) doesn't race React's async state
   * update — the values it persists are exactly the values it was given, not last render's. */
  const persistTemplate = useMutation({
    mutationFn: async (values: { front: string; back: string; styles: string }) => {
      const now = Date.now()
      if (active) {
        const updated: Template = { ...active, name: templateName, frontTemplate: values.front, backTemplate: values.back, styles: values.styles, updatedAt: now }
        await updateTemplate(db, updated)
        return updated
      }
      const created: Template = {
        id: crypto.randomUUID(),
        name: templateName,
        type: templateType,
        frontTemplate: values.front,
        backTemplate: values.back,
        styles: values.styles,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      }
      await createTemplate(db, created)
      return created
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: (error: unknown) => {
      log.error('srs.template_save_failed', error, { message: 'Saving a card template failed' })
      setErrorNotice({ title: t('Could not save template'), message: String(error) })
    },
  })

  const resetToDefault = (): void => {
    setFrontTemplate(defaultFront)
    setBackTemplate(defaultBack)
    setStyles_(defaultStyles)
    persistTemplate.mutate({ front: defaultFront, back: defaultBack, styles: defaultStyles })
  }

  const accentColor = readAccentColor(styles_)

  if (templatesQuery.isPending) {
    return (
      <View style={styles.container}>
        <Spinner />
      </View>
    )
  }
  if (templatesQuery.isError) {
    return (
      <View style={styles.container}>
        <ErrorState message={String(templatesQuery.error)} onRetry={() => void templatesQuery.refetch()} />
      </View>
    )
  }

  const previewHtml = renderCardHtml(previewSide === 'front' ? frontTemplate : backTemplate, styles_, sampleContext, previewSide)

  return (
    <View style={styles.container}>
      {/* Vocabulary/Cloze type toggle — each has exactly one template */}
      <View style={styles.typeRow}>
        <Chip label={t('Vocabulary')} selected={templateType === 'vocab'} onPress={() => setTemplateType('vocab')} />
        <Chip label={t('Cloze')} selected={templateType === 'cloze'} onPress={() => setTemplateType('cloze')} />
      </View>

      {/* Help lives in the native header, next to the "Card Templates" title (set by
          app/_layout.tsx), not inline next to the tab row — see the header-right pattern shared
          with Search, Mine, word/[form], and the other Settings screens that have a help sheet.
          Still opens whichever section matches the active tab, same as before. */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton icon="help-circle-outline" onPress={() => help.openSection(tab)} color={colors.primary} size={24} />
          ),
        }}
      />
      <View style={styles.tabRow}>
        {(['fields', 'style', 'preview', 'code'] as Tab[]).map((tabName) => (
          <Chip key={tabName} label={tabName[0]!.toUpperCase() + tabName.slice(1)} selected={tab === tabName} onPress={() => setTab(tabName)} />
        ))}
      </View>

      {tab === 'preview' ? (
        // No ScrollView here on purpose — the card fills exactly the space
        // available (flex:1) so its size matches the real review card, and
        // nothing scrolls (a scrollable preview would misrepresent what
        // fits on one screen during an actual review).
        <View style={styles.previewPane}>
          <View style={styles.previewTabRow}>
            <Chip label={t('Front')} selected={previewSide === 'front'} onPress={() => setPreviewSide('front')} />
            <Chip label={t('Back')} selected={previewSide === 'back'} onPress={() => setPreviewSide('back')} />
          </View>
          <Text style={styles.dimensionCaption}>
            {previewCardSize ? `${Math.round(previewCardSize.width)} × ${Math.round(previewCardSize.height)} pt` : '—'}
            {' — '}
            {t('actual review card size on this device')}
          </Text>
          <Card
            style={[styles.previewCard, styles.previewCardFlex]}
            onLayout={(e) => setPreviewCardSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
          >
            <CardRenderer html={previewHtml} style={styles.previewRenderer} />
          </Card>
          <Text style={styles.editorHint}>
            {templateType === 'cloze'
              ? t('Rendered with a sample cloze sentence through the same engine the review session uses.')
              : t('Rendered with sample data ("ausgehen") through the same engine the review session uses.')}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {tab === 'fields' ? (
          <>
            <SectionHeader title={t('Fields')} />
            <Text style={styles.fieldsHint}>
              {t('Tap "Front" or "Back" to show a field on that side — a field can appear on both, or neither.')}
            </Text>
            <Card style={styles.fieldList}>
              {templateVariables.map((v, i) => {
                const onFront = hasTemplateField(frontTemplate, v.name)
                const onBack = hasTemplateField(backTemplate, v.name)
                return (
                  <View key={v.name} style={[styles.fieldRow, i > 0 && styles.rowDivider]}>
                    <View style={styles.fieldIcon}>
                      <Ionicons name={v.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.primary} />
                    </View>
                    <View style={styles.fieldText}>
                      <Text style={styles.fieldLabel}>{v.label}</Text>
                      <Text style={styles.fieldDescription}>{v.description}</Text>
                    </View>
                    <View style={styles.fieldToggles}>
                      <Chip
                        label={t('Front')}
                        selected={onFront}
                        onPress={() => setFrontTemplate((prev) => withField(prev, v.name, !onFront))}
                      />
                      <Chip
                        label={t('Back')}
                        selected={onBack}
                        onPress={() => setBackTemplate((prev) => withField(prev, v.name, !onBack))}
                      />
                    </View>
                  </View>
                )
              })}
            </Card>
          </>
        ) : null}

        {tab === 'style' ? (
          <>
            <SectionHeader title={t('Accent color')} />
            <Card>
              <View style={styles.chipRow}>
                {ACCENT_COLORS.map((color) => (
                  <View key={color} style={[styles.swatchWrap, accentColor === color && styles.swatchWrapSelected]}>
                    <IconButton
                      icon="ellipse"
                      color={color}
                      size={32}
                      onPress={() => setStyles_((prev) => withAccentColor(prev, accentColor === color ? null : color))}
                    />
                  </View>
                ))}
              </View>
              <Text style={styles.editorHint}>
                {t('Stored as a')} <Text style={styles.mono}>:root{'{--accent:...}'}</Text> {t('rule — reference it in your CSS below as')} <Text style={styles.mono}>var(--accent)</Text>.
              </Text>
            </Card>

            <SectionHeader title={t('CSS')} />
            <Card>
              <TextInput
                style={styles.editor}
                value={styles_}
                onChangeText={setStyles_}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.editorHint}>{t('Applied to both sides in the real WebView renderer.')}</Text>
            </Card>
          </>
        ) : null}

        {tab === 'code' ? (
          <>
            <SectionHeader title={t('Front')} />
            <Card>
              <TextInput
                style={styles.editor}
                value={frontTemplate}
                onChangeText={setFrontTemplate}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Card>

            <SectionHeader title={t('Back')} />
            <Card>
              <TextInput
                style={styles.editor}
                value={backTemplate}
                onChangeText={setBackTemplate}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Card>

            <SectionHeader title={t('Available template variables')} />
            <Card>
              {templateVariables.map((v, i) => (
                <View key={v.name} style={[styles.variableRow, i > 0 && styles.rowDivider]}>
                  <Text style={styles.mono}>{`{{ ${v.name} }}`}</Text>
                  <Text style={styles.fieldDescription}>
                    {v.label} — {v.description}
                  </Text>
                </View>
              ))}
            </Card>

            <SectionHeader title={t('Conditional example')} />
            <Card>
              <Text style={styles.codeBlock}>{CONDITIONAL_EXAMPLE}</Text>
            </Card>
          </>
        ) : null}
        </ScrollView>
      )}

      <View style={styles.actions}>
        <Button
          label={t('Reset to default')}
          variant="ghost"
          small
          onPress={() => setResetConfirmOpen(true)}
          disabled={persistTemplate.isPending}
        />
        <Button
          label={persistTemplate.isPending ? t('Saving…') : t('Save changes')}
          icon="save"
          small
          onPress={() => persistTemplate.mutate({ front: frontTemplate, back: backTemplate, styles: styles_ })}
          disabled={persistTemplate.isPending || (!!active && !isDirty)}
        />
      </View>

      <HelpAccordionSheet
        visible={help.visible}
        onClose={help.close}
        title={t('Template editor help')}
        sections={HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={(id) => help.setSectionId(help.sectionId === id ? null : id)}
        translate={t}
      />

      <ConfirmModal
        visible={resetConfirmOpen}
        title={t('Reset to default?')}
        message={t('This replaces the fields, layout, and style with the built-in default, and saves immediately. This cannot be undone.')}
        onCancel={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          setResetConfirmOpen(false)
          resetToDefault()
        }}
        confirmLabel={t('Reset')}
        destructive
      />

      <AlertModal
        visible={errorNotice !== null}
        title={errorNotice?.title ?? ''}
        message={errorNotice?.message ?? ''}
        onClose={() => setErrorNotice(null)}
      />
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  typeRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: 0 },
  tabRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  fieldsHint: { fontSize: type.micro, color: colors.textMuted, marginBottom: spacing.sm, lineHeight: 16 },
  fieldList: { gap: 0 },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  fieldIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldText: { flex: 1, minWidth: 120 },
  fieldLabel: { fontSize: type.body, fontWeight: '700', color: colors.text },
  fieldDescription: { fontSize: type.micro, color: colors.textSecondary, marginTop: 1 },
  fieldToggles: { flexDirection: 'row', gap: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  swatchWrap: { borderRadius: radius.full, padding: 2 },
  swatchWrapSelected: { borderWidth: 2, borderColor: colors.text },
  editor: {
    fontFamily: 'monospace',
    fontSize: type.caption,
    color: colors.text,
    minHeight: 96,
    textAlignVertical: 'top',
  },
  editorHint: { fontSize: type.micro, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 16 },
  mono: { fontFamily: 'monospace', fontSize: type.caption, color: colors.primary },
  previewPane: { flex: 1, padding: spacing.lg, paddingBottom: spacing.md },
  previewTabRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  dimensionCaption: { fontSize: type.micro, color: colors.textMuted, marginBottom: spacing.md },
  previewCard: { alignSelf: 'stretch', padding: 0, overflow: 'hidden' },
  previewCardFlex: { flex: 1 },
  previewRenderer: { borderRadius: radius.lg },
  variableRow: { paddingVertical: spacing.sm },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  codeBlock: {
    fontFamily: 'monospace',
    fontSize: type.micro,
    color: colors.text,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
})
