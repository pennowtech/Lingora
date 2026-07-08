import { Ionicons } from '@expo/vector-icons'
import type { CefrLevel } from '@lingora/types'
import { router } from 'expo-router'
import { useState, type JSX } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Card, Chip, SectionHeader } from '../../components/ui'
import { cefrColors, colors, radius, spacing, type } from '../../lib/theme'

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
type TranslationProvider = 'deepl' | 'google' | 'openai'

/**
 * Settings: provider configuration (translation + generation slots),
 * default CEFR level, data tools, and app info.
 *
 * TODO(phase3): persist keys in Expo SecureStore / Tauri Store — never in
 * plain storage; wire the provider slots to @lingora/ai; the limited-mode
 * banner derives from which keys are actually configured.
 */
export default function SettingsScreen(): JSX.Element {
  const [translationProvider, setTranslationProvider] = useState<TranslationProvider>('deepl')
  const [openAiKey, setOpenAiKey] = useState('')
  const [deeplKey, setDeeplKey] = useState('')
  const [cefr, setCefr] = useState<CefrLevel>('B1')

  // TODO(phase3): computed from configured keys (none | translation | full)
  const limitedMode = openAiKey === ''

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Limited-mode banner */}
      {limitedMode ? (
        <View style={styles.banner}>
          <Ionicons name="lock-closed" size={16} color={colors.warning} />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Limited mode</Text>
            <Text style={styles.bannerMessage}>
              Without a generation key, card creation with AI is disabled. Translation and manual
              cards still work. Add an OpenAI key below for the full experience.
            </Text>
          </View>
        </View>
      ) : null}

      {/* ── Translation provider slot ── */}
      <SectionHeader title="Translation" />
      <Card style={styles.providerCard}>
        <ProviderOption
          label="DeepL"
          detail="Best German↔English quality — recommended"
          selected={translationProvider === 'deepl'}
          onPress={() => setTranslationProvider('deepl')}
        />
        <ProviderOption
          label="Google Translate"
          detail="Free tier — used as fallback"
          selected={translationProvider === 'google'}
          onPress={() => setTranslationProvider('google')}
        />
        <ProviderOption
          label="OpenAI"
          detail="Uses your generation key for translation too"
          selected={translationProvider === 'openai'}
          onPress={() => setTranslationProvider('openai')}
        />
        {translationProvider === 'deepl' ? (
          <TextInput
            style={styles.keyInput}
            placeholder="DeepL API key"
            placeholderTextColor={colors.textMuted}
            value={deeplKey}
            onChangeText={setDeeplKey}
            secureTextEntry
            autoCapitalize="none"
          />
        ) : null}
      </Card>

      {/* ── Generation provider slot ── */}
      <SectionHeader title="Generation" />
      <Card style={styles.providerCard}>
        <ProviderOption label="OpenAI" detail="Meanings, examples, clusters, cloze" selected onPress={() => undefined} />
        <Text style={styles.comingSoon}>Anthropic Claude, Google Gemini, and local Ollama — coming later</Text>
        <TextInput
          style={styles.keyInput}
          placeholder="OpenAI API key (sk-…)"
          placeholderTextColor={colors.textMuted}
          value={openAiKey}
          onChangeText={setOpenAiKey}
          secureTextEntry
          autoCapitalize="none"
        />
      </Card>

      {/* ── Learning ── */}
      <SectionHeader title="Learning" />
      <Card>
        <Text style={styles.fieldLabel}>Default CEFR level</Text>
        <Text style={styles.fieldHint}>Examples and explanations are calibrated to this level.</Text>
        <View style={styles.chipRow}>
          {CEFR_LEVELS.map((level) => (
            <Chip
              key={level}
              label={level}
              selected={level === cefr}
              color={cefrColors[level]}
              onPress={() => setCefr(level)}
            />
          ))}
        </View>
      </Card>

      {/* ── Data ── */}
      <SectionHeader title="Data" />
      <Card>
        <LinkRow icon="swap-vertical" label="Import & export" detail="Anki, CSV, JSON backup" onPress={() => router.push('/settings/import-export')} />
        <LinkRow icon="color-palette" label="Card templates" detail="Customize card layouts" onPress={() => router.push('/settings/templates')} divider />
      </Card>

      {/* ── About ── */}
      <SectionHeader title="About" />
      <Card>
        <LinkRow icon="information-circle" label="Lingora" detail="v0.0.1 · offline-first · your data stays on device" onPress={() => undefined} />
      </Card>
    </ScrollView>
  )
}

function ProviderOption(props: {
  label: string
  detail: string
  selected: boolean
  onPress: () => void
}): JSX.Element {
  return (
    <Pressable style={styles.option} onPress={props.onPress}>
      <Ionicons
        name={props.selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={props.selected ? colors.primary : colors.textMuted}
      />
      <View style={styles.optionText}>
        <Text style={styles.optionLabel}>{props.label}</Text>
        <Text style={styles.optionDetail}>{props.detail}</Text>
      </View>
    </Pressable>
  )
}

function LinkRow(props: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  detail: string
  onPress: () => void
  divider?: boolean
}): JSX.Element {
  return (
    <Pressable style={[styles.linkRow, props.divider && styles.rowDivider]} onPress={props.onPress}>
      <Ionicons name={props.icon} size={20} color={colors.primary} />
      <View style={styles.optionText}>
        <Text style={styles.optionLabel}>{props.label}</Text>
        <Text style={styles.optionDetail}>{props.detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  banner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: type.body, fontWeight: '700', color: colors.warning },
  bannerMessage: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  providerCard: { gap: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  optionText: { flex: 1 },
  optionLabel: { fontSize: type.body, fontWeight: '600', color: colors.text },
  optionDetail: { fontSize: type.micro, color: colors.textMuted, marginTop: 1 },
  comingSoon: { fontSize: type.micro, color: colors.textMuted, fontStyle: 'italic' },
  keyInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: type.caption,
    color: colors.text,
    backgroundColor: colors.background,
  },
  fieldLabel: { fontSize: type.body, fontWeight: '700', color: colors.text },
  fieldHint: { fontSize: type.micro, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
})
