import type { JSX } from 'react'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button, Card, SectionHeader } from '../../components/ui'
import { colors, spacing, type } from '../../lib/theme'

/**
 * Basic card template editor (LiquidJS syntax).
 *
 * TODO(phase5): render the preview through the real LiquidJS engine with a
 * sample card's data, persist via the templates repository, and add the
 * font/color/field-visibility controls from the roadmap.
 */
export default function TemplatesScreen(): JSX.Element {
  const [front, setFront] = useState('{{ word }}')
  const [back, setBack] = useState('{{ meaning }}\n<hr>\n{{ example }}')
  const noop = (): void => undefined

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.intro}>
        Templates use LiquidJS placeholders like {'{{ word }}'}, {'{{ meaning }}'}, {'{{ example }}'}{' '}
        — and support conditions such as {'{% if card.partOfSpeech == "noun" %}'}.
      </Text>

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

      <SectionHeader title="Preview" />
      {/* TODO(phase5): real LiquidJS render with dummy card data */}
      <Card style={styles.preview}>
        <Text style={styles.previewFront}>ausgehen</Text>
        <View style={styles.previewDivider} />
        <Text style={styles.previewBack}>to go out</Text>
        <Text style={styles.previewExample}>Wir gehen heute Abend aus.</Text>
      </Card>

      <View style={styles.actions}>
        <Button label="Save template" icon="save" onPress={noop} />
        <Button label="Reset to default" variant="ghost" onPress={noop} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 19 },
  editor: {
    fontFamily: 'monospace',
    fontSize: type.caption,
    color: colors.text,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  preview: { alignItems: 'center', paddingVertical: spacing.xl, backgroundColor: colors.surfaceMuted },
  previewFront: { fontSize: type.heading, fontWeight: '800', color: colors.text },
  previewDivider: { alignSelf: 'stretch', height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  previewBack: { fontSize: type.subheading, fontWeight: '700', color: colors.primary },
  previewExample: { fontSize: type.caption, color: colors.textSecondary, marginTop: spacing.sm },
  actions: { marginTop: spacing.xl, gap: spacing.sm },
})
