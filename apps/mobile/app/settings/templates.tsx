import type { JSX } from 'react'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button, Card, Chip, SectionHeader } from '../../components/ui'
import { colors, spacing, type } from '../../lib/theme'

/**
 * Card template editor (LiquidJS syntax): front, back, and styles (CSS),
 * with a live preview rendered from sample card data.
 *
 * TODO(phase5): replace with the real pipeline — getAllTemplates()/
 * createTemplate()/updateTemplate() from @lingora/database, LiquidJS
 * rendering (conditionals, loops), and a WebView-based preview so the
 * styles CSS actually applies. The preview below is a plain-text
 * approximation: placeholders are substituted, <hr> becomes a divider,
 * CSS is stored but not applied.
 */

/** Sample card data used to render the preview. TODO(phase5): real card via repositories. */
const SAMPLE_DATA: Record<string, string> = {
  word: 'ausgehen',
  meaning: 'to go out',
  example: 'Wir gehen heute Abend aus.',
  translation: 'We are going out tonight.',
  sentence: 'Wir gehen heute Abend ___.',
  answer: 'aus',
  gender: '—',
}

/** TODO(phase5): load from the templates table (getAllTemplates). */
const DUMMY_TEMPLATES = [
  {
    id: 'template-default',
    name: 'Default',
    front: '{{ word }}',
    back: '{{ meaning }}\n<hr>\n{{ example }}',
    styles: '.front, .back {\n  font-size: 1.4rem;\n  text-align: center;\n}',
  },
  {
    id: 'template-cloze',
    name: 'Minimal cloze',
    front: '{{ sentence }}',
    back: '{{ answer }}\n<hr>\n{{ translation }}',
    styles: '.front {\n  font-style: italic;\n}',
  },
] as const

/**
 * Substitute {{ placeholders }} with sample data and split on <hr> tags.
 * Deliberately tiny — NOT a LiquidJS implementation (no {% if %}, no loops).
 */
function renderPreviewSegments(template: string): string[] {
  const substituted = template.replace(
    /\{\{\s*([\w.]+)\s*\}\}/g,
    (_, key: string) => SAMPLE_DATA[key.replace('card.', '')] ?? `{{ ${key} }}`,
  )
  return substituted
    .split(/<hr\s*\/?>/i)
    .map((segment) => segment.replace(/<[^>]+>/g, '').trim())
    .filter((segment) => segment !== '')
}

export default function TemplatesScreen(): JSX.Element {
  const [activeId, setActiveId] = useState<string>(DUMMY_TEMPLATES[0].id)
  const [front, setFront] = useState<string>(DUMMY_TEMPLATES[0].front)
  const [back, setBack] = useState<string>(DUMMY_TEMPLATES[0].back)
  const [styles_, setStyles_] = useState<string>(DUMMY_TEMPLATES[0].styles)
  const noop = (): void => undefined

  const loadTemplate = (id: string): void => {
    const tpl = DUMMY_TEMPLATES.find((t) => t.id === id)
    if (!tpl) return
    setActiveId(id)
    setFront(tpl.front)
    setBack(tpl.back)
    setStyles_(tpl.styles)
  }

  const frontSegments = renderPreviewSegments(front)
  const backSegments = renderPreviewSegments(back)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.intro}>
        Templates use LiquidJS placeholders — {'{{ word }}'}, {'{{ meaning }}'}, {'{{ example }}'},{' '}
        {'{{ sentence }}'}, {'{{ answer }}'} — and will support conditions like{' '}
        {'{% if card.partOfSpeech == "noun" %}'} once the real renderer lands.
      </Text>

      {/* Template picker. TODO(phase5): list from getAllTemplates() with create/delete */}
      <View style={styles.pickerRow}>
        {DUMMY_TEMPLATES.map((tpl) => (
          <Chip key={tpl.id} label={tpl.name} selected={tpl.id === activeId} onPress={() => loadTemplate(tpl.id)} />
        ))}
        <Chip label="+ New" onPress={noop} />
      </View>

      <SectionHeader title="Front" />
      <Card>
        <TextInput
          style={styles.editor}
          value={front}
          onChangeText={setFront}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Card>

      <SectionHeader title="Back" />
      <Card>
        <TextInput
          style={styles.editor}
          value={back}
          onChangeText={setBack}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Card>

      <SectionHeader title="Styles (CSS)" />
      <Card>
        <TextInput
          style={styles.editor}
          value={styles_}
          onChangeText={setStyles_}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.editorHint}>
          Applied to both sides in the real card renderer (WebView). The preview below is a plain
          approximation and does not apply CSS yet.
        </Text>
      </Card>

      <SectionHeader title="Live preview" />
      <Card style={styles.preview}>
        <Text style={styles.previewSideLabel}>front</Text>
        {frontSegments.length > 0 ? (
          frontSegments.map((segment, i) => (
            <Text key={`f-${i}`} style={styles.previewFront}>
              {segment}
            </Text>
          ))
        ) : (
          <Text style={styles.previewEmpty}>front template is empty</Text>
        )}

        <View style={styles.previewDivider} />

        <Text style={styles.previewSideLabel}>back</Text>
        {backSegments.length > 0 ? (
          backSegments.map((segment, i) => (
            <Text key={`b-${i}`} style={i === 0 ? styles.previewBack : styles.previewExample}>
              {segment}
            </Text>
          ))
        ) : (
          <Text style={styles.previewEmpty}>back template is empty</Text>
        )}
      </Card>

      <View style={styles.actions}>
        {/* TODO(phase5): updateTemplate() / reset from the default template row */}
        <Button label="Save template" icon="save" onPress={noop} />
        <Button label="Reset to default" variant="ghost" onPress={() => loadTemplate(activeId)} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 19 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  editor: {
    fontFamily: 'monospace',
    fontSize: type.caption,
    color: colors.text,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  editorHint: {
    fontSize: type.micro,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 15,
  },
  preview: { alignItems: 'center', paddingVertical: spacing.xl, backgroundColor: colors.surfaceMuted },
  previewSideLabel: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  previewFront: { fontSize: type.heading, fontWeight: '800', color: colors.text, textAlign: 'center' },
  previewBack: { fontSize: type.subheading, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  previewExample: { fontSize: type.caption, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  previewEmpty: { fontSize: type.caption, color: colors.textMuted, fontStyle: 'italic' },
  previewDivider: { alignSelf: 'stretch', height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  actions: { marginTop: spacing.xl, gap: spacing.sm },
})
