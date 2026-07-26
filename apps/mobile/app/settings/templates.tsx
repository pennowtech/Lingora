import { Ionicons } from '@expo/vector-icons'
import type { Template } from '@lingora/types'
import { createTemplate, deleteTemplate, getAllTemplates, updateTemplate } from '@lingora/database'
import { logger } from '@lingora/observability'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type JSX } from 'react'
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { CardRenderer } from '../../components/CardRenderer'
import { Button, Card, Chip, ErrorState, IconButton, SectionHeader, Spinner } from '../../components/ui'
import { CONDITIONAL_EXAMPLE, renderCardHtml, TEMPLATE_VARIABLES, type CardTemplateContext } from '../../lib/templates'
import { useServices } from '../../lib/services'
import { colors, radius, spacing, type } from '../../lib/theme'

const log = logger.child({ feature: 'srs', screen: 'TemplatesScreen' })

/** Sample data for the live preview — the same word shown in the design reference sketches. */
const SAMPLE_CONTEXT: CardTemplateContext = {
  word: 'ausgehen',
  gender: 'verb · separable',
  meaning: 'to go out',
  other_meanings: ['to run out (supplies)'],
  example: 'Wir gehen heute Abend aus.',
  translation: 'We are going out tonight.',
  synonyms: [{ word: 'weggehen', nuance: 'more casual', formality: 'neutral' }],
  phrases: [{ expression: 'davon ausgehen', meaning: 'to assume / take it that' }],
  audio: '',
  image: '',
  cloze: '',
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
interface HelpParagraph {
  text: string
  /** Renders in the monospace code style instead of body text. */
  code?: boolean
}
interface HelpSection {
  id: string
  title: string
  icon: keyof typeof Ionicons.glyphMap
  paragraphs: HelpParagraph[]
}

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
const LOOP_FIELDS = new Set(['other_meanings', 'synonyms', 'phrases'])

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

function hasField(template: string, variable: string): boolean {
  if (LOOP_FIELDS.has(variable)) {
    return new RegExp(`\\{%\\s*for\\s+\\w+\\s+in\\s+${escapeRegExp(variable)}\\b`).test(template)
  }
  return new RegExp(`\\{\\{\\s*${escapeRegExp(variable)}\\s*\\}\\}`).test(template)
}

function withField(template: string, variable: string, enabled: boolean): string {
  if (enabled) {
    if (hasField(template, variable)) return template
    const snippet = fieldSnippet(variable)
    return template.trim() ? `${template} ${snippet}` : snippet
  }
  const pattern = LOOP_FIELDS.has(variable)
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
  const [previewCardSize, setPreviewCardSize] = useState<{ width: number; height: number } | null>(null)
  const queryClient = useQueryClient()

  const templatesQuery = useQuery({ queryKey: ['templates'], queryFn: () => getAllTemplates(db) })

  const [activeId, setActiveId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [frontTemplate, setFrontTemplate] = useState('')
  const [backTemplate, setBackTemplate] = useState('')
  const [styles_, setStyles_] = useState('')
  const [tab, setTab] = useState<Tab>('fields')
  const [previewSide, setPreviewSide] = useState<Side>('front')
  const [helpOpen, setHelpOpen] = useState(false)
  const [helpSection, setHelpSection] = useState<string | null>('fields')

  const templates = templatesQuery.data ?? []
  const active = templates.find((t) => t.id === activeId) ?? templates[0]

  // Load the selected template's fields into the editor whenever the
  // selection changes (or the list first loads) — not on every keystroke.
  useEffect(() => {
    if (!active) return
    setActiveId(active.id)
    setName(active.name)
    setFrontTemplate(active.frontTemplate)
    setBackTemplate(active.backTemplate)
    setStyles_(active.styles ?? '')
    // Only re-sync editor fields from the template row when a different
    // template is selected (by id), not on every local edit or background refetch.
  }, [active?.id])

  const isDirty =
    !!active &&
    (name !== active.name ||
      frontTemplate !== active.frontTemplate ||
      backTemplate !== active.backTemplate ||
      styles_ !== (active.styles ?? ''))

  const save = useMutation({
    mutationFn: async () => {
      const now = Date.now()
      if (active) {
        const updated: Template = { ...active, name, frontTemplate, backTemplate, styles: styles_, updatedAt: now }
        await updateTemplate(db, updated)
        return updated
      }
      const created: Template = {
        id: crypto.randomUUID(),
        name: name || 'New template',
        frontTemplate,
        backTemplate,
        styles: styles_,
        isDefault: templates.length === 0,
        createdAt: now,
        updatedAt: now,
      }
      await createTemplate(db, created)
      return created
    },
    onSuccess: async (saved) => {
      setActiveId(saved.id)
      await queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: (error: unknown) => {
      log.error('srs.template_save_failed', error, { message: 'Saving a card template failed' })
      Alert.alert('Could not save template', String(error))
    },
  })

  const setDefault = useMutation({
    mutationFn: async () => {
      if (!active) return
      await updateTemplate(db, { ...active, isDefault: true })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
    onError: (error: unknown) => Alert.alert('Could not set default template', String(error)),
  })

  const remove = useMutation({
    mutationFn: async () => {
      if (!active) return
      await deleteTemplate(db, active.id)
    },
    onSuccess: async () => {
      setActiveId(null)
      await queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: (error: unknown) => Alert.alert('Could not delete template', String(error)),
  })

  const startNewTemplate = (): void => {
    setActiveId(null)
    setName('New template')
    setFrontTemplate('{{ word }}')
    setBackTemplate('{{ meaning }}\n<hr/>\n{{ example }}')
    setStyles_('')
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

  const previewHtml = renderCardHtml(previewSide === 'front' ? frontTemplate : backTemplate, styles_, SAMPLE_CONTEXT, previewSide)

  return (
    <View style={styles.container}>
      {/* Template picker */}
      <View style={styles.pickerRow}>
        {templates.map((t) => (
          <Chip key={t.id} label={t.isDefault ? `★ ${t.name}` : t.name} selected={t.id === activeId} onPress={() => setActiveId(t.id)} />
        ))}
        <Chip label="+ New" onPress={startNewTemplate} />
      </View>

      {/* Tabs + help */}
      <View style={styles.tabBar}>
        <View style={styles.tabRow}>
          {(['fields', 'style', 'preview', 'code'] as Tab[]).map((t) => (
            <Chip key={t} label={t[0]!.toUpperCase() + t.slice(1)} selected={tab === t} onPress={() => setTab(t)} />
          ))}
        </View>
        <IconButton
          icon="help-circle-outline"
          onPress={() => {
            setHelpSection(tab)
            setHelpOpen(true)
          }}
          color={colors.primary}
          size={24}
        />
      </View>

      {tab === 'preview' ? (
        // No ScrollView here on purpose — the card fills exactly the space
        // available (flex:1) so its size matches the real review card, and
        // nothing scrolls (a scrollable preview would misrepresent what
        // fits on one screen during an actual review).
        <View style={styles.previewPane}>
          <View style={styles.previewTabRow}>
            <Chip label="Front" selected={previewSide === 'front'} onPress={() => setPreviewSide('front')} />
            <Chip label="Back" selected={previewSide === 'back'} onPress={() => setPreviewSide('back')} />
          </View>
          <Text style={styles.dimensionCaption}>
            {previewCardSize ? `${Math.round(previewCardSize.width)} × ${Math.round(previewCardSize.height)} pt` : '—'} — actual
            review card size on this device
          </Text>
          <Card
            style={[styles.previewCard, styles.previewCardFlex]}
            onLayout={(e) => setPreviewCardSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
          >
            <CardRenderer html={previewHtml} style={styles.previewRenderer} />
          </Card>
          <Text style={styles.editorHint}>
            Rendered with sample data ("ausgehen") through the same engine the review session uses.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {tab === 'fields' ? (
          <>
            <SectionHeader title="Template name" />
            <Card>
              <TextInput style={styles.nameInput} value={name} onChangeText={setName} placeholder="Template name" />
            </Card>

            <SectionHeader title="Fields" />
            <Text style={styles.fieldsHint}>
              Tap "Front" or "Back" to show a field on that side — a field can appear on both, or neither.
            </Text>
            <Card style={styles.fieldList}>
              {TEMPLATE_VARIABLES.map((v, i) => {
                const onFront = hasField(frontTemplate, v.name)
                const onBack = hasField(backTemplate, v.name)
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
                        label="Front"
                        selected={onFront}
                        onPress={() => setFrontTemplate((prev) => withField(prev, v.name, !onFront))}
                      />
                      <Chip
                        label="Back"
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
            <SectionHeader title="Accent color" />
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
                Stored as a <Text style={styles.mono}>:root{'{--accent:...}'}</Text> rule — reference it in your CSS
                below as <Text style={styles.mono}>var(--accent)</Text>.
              </Text>
            </Card>

            <SectionHeader title="CSS" />
            <Card>
              <TextInput
                style={styles.editor}
                value={styles_}
                onChangeText={setStyles_}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.editorHint}>Applied to both sides in the real WebView renderer.</Text>
            </Card>
          </>
        ) : null}

        {tab === 'code' ? (
          <>
            <SectionHeader title="Front (Liquid)" />
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

            <SectionHeader title="Back (Liquid)" />
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

            <SectionHeader title="Available template variables" />
            <Card>
              {TEMPLATE_VARIABLES.map((v, i) => (
                <View key={v.name} style={[styles.variableRow, i > 0 && styles.rowDivider]}>
                  <Text style={styles.mono}>{`{{ ${v.name} }}`}</Text>
                  <Text style={styles.fieldDescription}>
                    {v.label} — {v.description}
                  </Text>
                </View>
              ))}
            </Card>

            <SectionHeader title="Conditional example" />
            <Card>
              <Text style={styles.codeBlock}>{CONDITIONAL_EXAMPLE}</Text>
            </Card>
          </>
        ) : null}
        </ScrollView>
      )}

      <View style={styles.actions}>
        {active && !active.isDefault ? (
          <Button label="Set default" variant="ghost" small onPress={() => setDefault.mutate()} disabled={setDefault.isPending} />
        ) : null}
        {active ? (
          <Button
            label={remove.isPending ? 'Deleting…' : 'Delete'}
            variant="danger"
            small
            onPress={() =>
              Alert.alert('Delete this template?', `"${active.name}" will be removed.`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
              ])
            }
            disabled={remove.isPending || active.isDefault}
          />
        ) : null}
        <Button
          label={save.isPending ? 'Saving…' : active ? 'Save changes' : 'Create template'}
          icon="save"
          small
          onPress={() => save.mutate()}
          disabled={save.isPending || (!!active && !isDirty)}
        />
      </View>

      {/* Help sheet */}
      <Modal visible={helpOpen} animationType="slide" transparent onRequestClose={() => setHelpOpen(false)}>
        <View style={styles.helpBackdrop}>
          <View style={styles.helpSheet}>
            <View style={styles.helpHeader}>
              <Text style={styles.helpTitle}>Template editor help</Text>
              <IconButton icon="close" onPress={() => setHelpOpen(false)} />
            </View>
            <ScrollView>
              {HELP_SECTIONS.map((section) => {
                const isOpen = helpSection === section.id
                return (
                  <View key={section.id} style={styles.helpAccordionItem}>
                    <Card onPress={() => setHelpSection(isOpen ? null : section.id)} style={styles.helpAccordionHeader}>
                      <View style={styles.helpAccordionHeaderRow}>
                        <Ionicons name={section.icon} size={18} color={colors.primary} />
                        <Text style={styles.helpSectionTitle}>{section.title}</Text>
                        <View style={styles.helpAccordionSpacer} />
                        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                      </View>
                    </Card>
                    {isOpen ? (
                      <View style={styles.helpAccordionBody}>
                        {section.paragraphs.map((p, i) => (
                          <Text key={i} style={p.code ? styles.helpCode : styles.helpBody}>
                            {p.text}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                )
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.lg, paddingBottom: 0 },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  tabRow: { flexDirection: 'row', gap: spacing.sm },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  nameInput: { fontSize: type.body, fontWeight: '700', color: colors.text },
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
  helpBackdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  helpSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  helpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  helpTitle: { fontSize: type.subheading, fontWeight: '800', color: colors.text },
  helpAccordionItem: { marginBottom: spacing.sm },
  helpAccordionHeader: { paddingVertical: spacing.sm },
  helpAccordionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  helpAccordionSpacer: { flex: 1 },
  helpAccordionBody: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.sm },
  helpSectionTitle: { fontSize: type.body, fontWeight: '700', color: colors.text },
  helpBody: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 20, marginTop: spacing.sm },
  helpCode: {
    fontFamily: 'monospace',
    fontSize: type.micro,
    color: colors.primary,
    lineHeight: 18,
    marginTop: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
})
