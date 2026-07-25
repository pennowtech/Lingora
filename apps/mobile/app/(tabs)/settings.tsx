import { Ionicons } from '@expo/vector-icons'
import type { CefrLevel } from '@lingora/types'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useRef, useState, type JSX } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Card, Chip, SectionHeader } from '../../components/ui'
import { STORE_KEYS, useServices } from '../../lib/services'
import { cefrColors, colors, radius, spacing, type } from '../../lib/theme'

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
type TranslationProvider = 'deepl' | 'google' | 'openai'

/**
 * Settings: provider configuration (translation + generation slots),
 * default CEFR level, data tools, and app info.
 *
 * Keys and preferences live in Expo SecureStore — never in plain storage.
 * Saving a key rebuilds the AI pipeline (reloadServices), so the tier and
 * every generate button react immediately.
 */
export default function SettingsScreen(): JSX.Element {
  const { tier, reloadServices } = useServices()
  const [translationProvider, setTranslationProvider] = useState<TranslationProvider>('google')
  const [openAiKey, setOpenAiKey] = useState('')
  const [deeplKey, setDeeplKey] = useState('')
  const [cefr, setCefrState] = useState<CefrLevel>('B1')
  const [loaded, setLoaded] = useState(false)
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const load = async (): Promise<void> => {
      const [storedProvider, storedOpenAi, storedDeepl, storedCefr] = await Promise.all([
        SecureStore.getItemAsync(STORE_KEYS.translationProvider),
        SecureStore.getItemAsync(STORE_KEYS.openaiKey),
        SecureStore.getItemAsync(STORE_KEYS.deeplKey),
        SecureStore.getItemAsync(STORE_KEYS.defaultCefr),
      ])
      if (storedProvider === 'deepl' || storedProvider === 'google' || storedProvider === 'openai') {
        setTranslationProvider(storedProvider)
      }
      setOpenAiKey(storedOpenAi ?? '')
      setDeeplKey(storedDeepl ?? '')
      if ((CEFR_LEVELS as string[]).includes(storedCefr ?? '')) {
        setCefrState(storedCefr as CefrLevel)
      }
      setLoaded(true)
    }
    void load()
  }, [])

  /** Persist + rebuild the pipeline, debounced so typing a key isn't N rebuilds. */
  const persist = (storeKey: string, value: string): void => {
    void SecureStore.setItemAsync(storeKey, value)
    if (reloadTimer.current) clearTimeout(reloadTimer.current)
    reloadTimer.current = setTimeout(() => void reloadServices(), 600)
  }

  const changeOpenAiKey = (value: string): void => {
    setOpenAiKey(value)
    persist(STORE_KEYS.openaiKey, value.trim())
  }
  const changeDeeplKey = (value: string): void => {
    setDeeplKey(value)
    persist(STORE_KEYS.deeplKey, value.trim())
  }
  const changeProvider = (value: TranslationProvider): void => {
    setTranslationProvider(value)
    persist(STORE_KEYS.translationProvider, value)
  }
  const setCefr = (level: CefrLevel): void => {
    setCefrState(level)
    persist(STORE_KEYS.defaultCefr, level)
  }

  const limitedMode = loaded && tier !== 'full'

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
          label="Google Translate"
          detail="Free tier, no key needed — active"
          selected={translationProvider === 'google'}
          onPress={() => changeProvider('google')}
        />
        <ProviderOption
          label="DeepL"
          detail="Best German↔English quality — adapter coming soon"
          selected={translationProvider === 'deepl'}
          onPress={() => changeProvider('deepl')}
        />
        <ProviderOption
          label="OpenAI"
          detail="Uses your generation key for translation too"
          selected={translationProvider === 'openai'}
          onPress={() => changeProvider('openai')}
        />
        {translationProvider === 'deepl' ? (
          <TextInput
            style={styles.keyInput}
            placeholder="DeepL API key (stored for when the adapter lands)"
            placeholderTextColor={colors.textMuted}
            value={deeplKey}
            onChangeText={changeDeeplKey}
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
          onChangeText={changeOpenAiKey}
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
