import { Ionicons } from '@expo/vector-icons'
import type { CefrLevel } from '@lingora/types'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useRef, useState, type JSX, type ReactNode } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { Card, Chip, SectionHeader } from '../../components/ui'
import {
  DEFAULT_MODELS,
  GENERATION_PROVIDERS,
  STORE_KEYS,
  TRANSLATION_PROVIDERS,
  useServices,
  type GenerationProviderName,
  type TranslationProviderName,
} from '../../lib/services'
import {
  validateClaudeKey,
  validateGeminiKey,
  validateMistralKey,
  validateOpenAIKey,
  type ValidationResult,
} from '../../lib/providerValidation'
import { clearUsage, getUsage, type UsageSnapshot } from '../../lib/providerUsage'
import { cefrColors, colors, radius, spacing, type } from '../../lib/theme'

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const ZERO_USAGE: UsageSnapshot = { requests: 0, tokensUsed: 0 }

interface ProviderMeta {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  models: readonly string[]
  usageUrl: string
  description: string
}

const PROVIDER_META: Record<GenerationProviderName, ProviderMeta> = {
  openai: {
    label: 'OpenAI',
    icon: 'sparkles-outline',
    color: colors.primary,
    models: ['gpt-4.1-mini', 'gpt-4.1'],
    usageUrl: 'https://platform.openai.com/usage',
    description: 'Meanings, examples, clusters, phrases, and cloze — the default generation provider.',
  },
  mistral: {
    label: 'Mistral',
    icon: 'flash-outline',
    color: '#F97316',
    models: ['mistral-small-latest', 'mistral-medium-latest'],
    usageUrl: 'https://console.mistral.ai/usage',
    description: 'BYOK alternative for card generation and translation.',
  },
  gemini: {
    label: 'Gemini',
    icon: 'logo-google',
    color: '#4285F4',
    models: ['gemini-2.5-flash', 'gemini-2.5-flash-lite'],
    usageUrl: 'https://aistudio.google.com/usage',
    description: 'Google Gemini BYOK for card generation and translation.',
  },
  anthropic: {
    label: 'Claude',
    icon: 'chatbubble-ellipses-outline',
    color: '#D97757',
    models: ['claude-haiku-4-5-20251001', 'claude-sonnet-5'],
    usageUrl: 'https://platform.claude.com/settings/usage',
    description: 'Claude BYOK for card generation and translation.',
  },
}

const PROVIDER_STORE_KEYS: Record<GenerationProviderName, { key: string; enabled: string; model: string }> = {
  openai: { key: STORE_KEYS.openaiKey, enabled: STORE_KEYS.openaiEnabled, model: STORE_KEYS.openaiModel },
  mistral: { key: STORE_KEYS.mistralKey, enabled: STORE_KEYS.mistralEnabled, model: STORE_KEYS.mistralModel },
  gemini: { key: STORE_KEYS.geminiKey, enabled: STORE_KEYS.geminiEnabled, model: STORE_KEYS.geminiModel },
  anthropic: { key: STORE_KEYS.claudeKey, enabled: STORE_KEYS.claudeEnabled, model: STORE_KEYS.claudeModel },
}

const VALIDATORS: Record<GenerationProviderName, (key: string, model: string) => Promise<ValidationResult>> = {
  openai: validateOpenAIKey,
  mistral: validateMistralKey,
  gemini: validateGeminiKey,
  anthropic: validateClaudeKey,
}

interface ProviderFormState {
  apiKey: string
  model: string
  enabled: boolean
}

const emptyProviderState = (name: GenerationProviderName): ProviderFormState => ({
  apiKey: '',
  model: DEFAULT_MODELS[name],
  enabled: true,
})

/**
 * Settings: per-provider AI configuration (generation + translation slots),
 * default CEFR level, data tools, and app info.
 *
 * Keys and preferences live in Expo SecureStore — never in plain storage.
 * Saving a key rebuilds the AI pipeline (reloadServices), so the tier and
 * every generate button react immediately.
 */
export default function SettingsScreen(): JSX.Element {
  const { tier, reloadServices } = useServices()

  const [translationProvider, setTranslationProviderState] = useState<TranslationProviderName>('google')
  const [generationProvider, setGenerationProviderState] = useState<GenerationProviderName | null>(null)
  const [deeplKey, setDeeplKey] = useState('')
  const [cefr, setCefrState] = useState<CefrLevel>('B1')
  const [loaded, setLoaded] = useState(false)
  const [expandedProvider, setExpandedProvider] = useState<GenerationProviderName | null>(null)
  const [showKey, setShowKey] = useState<Partial<Record<GenerationProviderName, boolean>>>({})
  const [validating, setValidating] = useState<Partial<Record<GenerationProviderName, boolean>>>({})

  const [providers, setProviders] = useState<Record<GenerationProviderName, ProviderFormState>>({
    openai: emptyProviderState('openai'),
    mistral: emptyProviderState('mistral'),
    gemini: emptyProviderState('gemini'),
    anthropic: emptyProviderState('anthropic'),
  })
  const [usage, setUsage] = useState<Record<GenerationProviderName, UsageSnapshot>>({
    openai: ZERO_USAGE,
    mistral: ZERO_USAGE,
    gemini: ZERO_USAGE,
    anthropic: ZERO_USAGE,
  })

  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const load = async (): Promise<void> => {
      const entries = await Promise.all(
        GENERATION_PROVIDERS.map(async (name) => {
          const keys = PROVIDER_STORE_KEYS[name]
          const [apiKey, model, enabledRaw, providerUsage] = await Promise.all([
            SecureStore.getItemAsync(keys.key),
            SecureStore.getItemAsync(keys.model),
            SecureStore.getItemAsync(keys.enabled),
            getUsage(name),
          ])
          return [
            name,
            { apiKey: apiKey ?? '', model: model ?? DEFAULT_MODELS[name], enabled: enabledRaw !== 'false' },
            providerUsage,
          ] as const
        }),
      )
      const [storedTranslation, storedGeneration, storedDeepl, storedCefr] = await Promise.all([
        SecureStore.getItemAsync(STORE_KEYS.translationProvider),
        SecureStore.getItemAsync(STORE_KEYS.generationProvider),
        SecureStore.getItemAsync(STORE_KEYS.deeplKey),
        SecureStore.getItemAsync(STORE_KEYS.defaultCefr),
      ])

      setProviders((prev) => {
        const next = { ...prev }
        for (const [name, state] of entries) next[name] = state
        return next
      })
      setUsage((prev) => {
        const next = { ...prev }
        for (const [name, , providerUsage] of entries) next[name] = providerUsage
        return next
      })
      if ((TRANSLATION_PROVIDERS as readonly string[]).includes(storedTranslation ?? '')) {
        setTranslationProviderState(storedTranslation as TranslationProviderName)
      }
      if ((GENERATION_PROVIDERS as readonly string[]).includes(storedGeneration ?? '')) {
        setGenerationProviderState(storedGeneration as GenerationProviderName)
      }
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

  const updateProvider = (name: GenerationProviderName, patch: Partial<ProviderFormState>): void => {
    setProviders((prev) => ({ ...prev, [name]: { ...prev[name], ...patch } }))
  }

  const changeApiKey = (name: GenerationProviderName, value: string): void => {
    updateProvider(name, { apiKey: value })
    persist(PROVIDER_STORE_KEYS[name].key, value.trim())
  }
  const changeModel = (name: GenerationProviderName, value: string): void => {
    updateProvider(name, { model: value })
    persist(PROVIDER_STORE_KEYS[name].model, value)
  }
  const changeEnabled = (name: GenerationProviderName, value: boolean): void => {
    updateProvider(name, { enabled: value })
    persist(PROVIDER_STORE_KEYS[name].enabled, value ? 'true' : 'false')
  }
  const changeGenerationProvider = (name: GenerationProviderName): void => {
    setGenerationProviderState(name)
    persist(STORE_KEYS.generationProvider, name)
  }
  const changeTranslationProvider = (value: TranslationProviderName): void => {
    setTranslationProviderState(value)
    persist(STORE_KEYS.translationProvider, value)
  }
  const changeDeeplKey = (value: string): void => {
    setDeeplKey(value)
    persist(STORE_KEYS.deeplKey, value.trim())
  }
  const setCefr = (level: CefrLevel): void => {
    setCefrState(level)
    persist(STORE_KEYS.defaultCefr, level)
  }

  const validate = (name: GenerationProviderName): void => {
    const { apiKey, model } = providers[name]
    if (!apiKey.trim()) return
    setValidating((prev) => ({ ...prev, [name]: true }))
    void VALIDATORS[name](apiKey, model)
      .then((result) => {
        Alert.alert(
          result.ok ? 'Connected' : result.networkUnavailable ? 'No internet connection' : `${PROVIDER_META[name].label} validation failed`,
          result.message,
        )
      })
      .finally(() => {
        setValidating((prev) => ({ ...prev, [name]: false }))
        void getUsage(name).then((snapshot) => setUsage((prev) => ({ ...prev, [name]: snapshot })))
      })
  }

  const clearProviderKey = (name: GenerationProviderName): void => {
    updateProvider(name, { apiKey: '' })
    persist(PROVIDER_STORE_KEYS[name].key, '')
    void clearUsage(name).then(() => setUsage((prev) => ({ ...prev, [name]: ZERO_USAGE })))
  }

  const deleteAllKeys = (): void => {
    Alert.alert(
      'Delete all API keys?',
      'This removes every provider key from this device. Vocabulary and progress are unaffected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            for (const name of GENERATION_PROVIDERS) {
              updateProvider(name, { apiKey: '' })
              void SecureStore.setItemAsync(PROVIDER_STORE_KEYS[name].key, '')
              void clearUsage(name)
            }
            setUsage({ openai: ZERO_USAGE, mistral: ZERO_USAGE, gemini: ZERO_USAGE, anthropic: ZERO_USAGE })
            setDeeplKey('')
            void SecureStore.setItemAsync(STORE_KEYS.deeplKey, '')
            void reloadServices()
          },
        },
      ],
    )
  }

  const configuredProviders = GENERATION_PROVIDERS.filter(
    (name) => providers[name].enabled && providers[name].apiKey.trim() !== '',
  )
  const activeGenerationProvider =
    generationProvider && configuredProviders.includes(generationProvider) ? generationProvider : configuredProviders[0]

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
              Without a generation key, card creation with AI is disabled. Translation and manual cards still
              work. Add a key to one of the providers below for the full experience.
            </Text>
          </View>
        </View>
      ) : null}

      {/* ── Generation provider slot ── */}
      <SectionHeader title="Generation" />
      <Card style={styles.providerCard}>
        <Text style={styles.fieldHint}>
          Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is
          configured and enabled. Bring your own API key — nothing is sent until you generate a card.
        </Text>

        {configuredProviders.length > 1 ? (
          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.fieldLabel}>Active provider</Text>
            <View style={styles.chipRow}>
              {configuredProviders.map((name) => (
                <Chip
                  key={name}
                  label={PROVIDER_META[name].label}
                  selected={name === activeGenerationProvider}
                  onPress={() => changeGenerationProvider(name)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {GENERATION_PROVIDERS.map((name) => (
          <ProviderCard
            key={name}
            meta={PROVIDER_META[name]}
            state={providers[name]}
            active={name === activeGenerationProvider}
            expanded={expandedProvider === name}
            showKey={showKey[name] ?? false}
            validating={validating[name] ?? false}
            usage={usage[name]}
            onToggleExpanded={() => setExpandedProvider((prev) => (prev === name ? null : name))}
            onToggleEnabled={(value) => changeEnabled(name, value)}
            onToggleShowKey={() => setShowKey((prev) => ({ ...prev, [name]: !prev[name] }))}
            onChangeApiKey={(value) => changeApiKey(name, value)}
            onChangeModel={(value) => changeModel(name, value)}
            onValidate={() => validate(name)}
            onClearKey={() => clearProviderKey(name)}
          />
        ))}
      </Card>

      {/* ── Translation provider slot ── */}
      <SectionHeader title="Translation" />
      <Card style={styles.providerCard}>
        <ProviderOption
          label="Google Translate"
          detail="Free tier, no key needed"
          selected={translationProvider === 'google'}
          onPress={() => changeTranslationProvider('google')}
        />
        <ProviderOption
          label="DeepL"
          detail="Best German↔English quality — adapter coming soon"
          selected={translationProvider === 'deepl'}
          onPress={() => changeTranslationProvider('deepl')}
        />
        {GENERATION_PROVIDERS.map((name) => {
          const available = configuredProviders.includes(name)
          return (
            <ProviderOption
              key={name}
              label={PROVIDER_META[name].label}
              detail={available ? 'Uses this provider’s key above' : 'Add a key above to enable'}
              selected={translationProvider === name}
              disabled={!available}
              onPress={() => changeTranslationProvider(name)}
            />
          )
        })}
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

      {/* ── Privacy ── */}
      <SectionHeader title="Privacy" />
      <Card style={{ gap: spacing.md }}>
        <Row>
          <Ionicons name="shield-checkmark-outline" size={17} color={colors.success} />
          <Text style={styles.privacyText}>
            API keys stay on this device (Expo SecureStore) and are never included in exports or backups.
          </Text>
        </Row>
        <Pressable style={styles.dangerButton} onPress={deleteAllKeys}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={styles.dangerButtonLabel}>Delete all API keys</Text>
        </Pressable>
      </Card>

      {/* ── About ── */}
      <SectionHeader title="About" />
      <Card>
        <LinkRow icon="information-circle" label="Lingora" detail="v0.0.1 · offline-first · your data stays on device" onPress={() => undefined} />
      </Card>
    </ScrollView>
  )
}

function ProviderCard(props: {
  meta: ProviderMeta
  state: ProviderFormState
  active: boolean
  expanded: boolean
  showKey: boolean
  validating: boolean
  usage: UsageSnapshot
  onToggleExpanded: () => void
  onToggleEnabled: (value: boolean) => void
  onToggleShowKey: () => void
  onChangeApiKey: (value: string) => void
  onChangeModel: (value: string) => void
  onValidate: () => void
  onClearKey: () => void
}): JSX.Element {
  const { meta, state, active, expanded, showKey, validating, usage } = props
  const hasKey = state.apiKey.trim() !== ''

  return (
    <View style={styles.providerBlock}>
      <Pressable style={styles.providerHeader} onPress={props.onToggleExpanded}>
        <View style={[styles.providerIcon, { backgroundColor: `${meta.color}1A` }]}>
          <Ionicons name={meta.icon} size={18} color={meta.color} />
        </View>
        <View style={styles.optionText}>
          <View style={styles.providerNameRow}>
            <Text style={styles.optionLabel}>{meta.label}</Text>
            {active ? (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeLabel}>Active</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.optionDetail}>{meta.description}</Text>
        </View>
        <Switch value={state.enabled && hasKey} onValueChange={props.onToggleEnabled} disabled={!hasKey} />
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </Pressable>

      {expanded ? (
        <View style={styles.providerBody}>
          <Text style={styles.fieldLabel}>Model</Text>
          <View style={styles.chipRow}>
            {meta.models.map((model) => (
              <Chip key={model} label={model} selected={model === state.model} onPress={() => props.onChangeModel(model)} />
            ))}
          </View>

          <View style={styles.keyInputWrap}>
            <TextInput
              style={styles.keyInputWithIcon}
              placeholder={`Paste your ${meta.label} API key…`}
              placeholderTextColor={colors.textMuted}
              value={state.apiKey}
              onChangeText={props.onChangeApiKey}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showKey ? `Hide ${meta.label} API key` : `Show ${meta.label} API key`}
              onPress={props.onToggleShowKey}
              style={styles.keyInputEye}
            >
              <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.providerActionsRow}>
            <Pressable
              style={[styles.secondaryButton, (validating || !hasKey) && styles.secondaryButtonDisabled]}
              onPress={props.onValidate}
              disabled={validating || !hasKey}
            >
              {validating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.secondaryButtonLabel}>Validate key</Text>
              )}
            </Pressable>
            <Pressable style={[styles.secondaryButton, !hasKey && styles.secondaryButtonDisabled]} onPress={props.onClearKey} disabled={!hasKey}>
              <Text style={[styles.secondaryButtonLabel, { color: colors.danger }]}>Clear</Text>
            </Pressable>
          </View>

          <View style={styles.usageBox}>
            <Text style={styles.usageLabel}>Device-observed usage</Text>
            <Text style={styles.usageDetail}>
              {usage.requests.toLocaleString()} request{usage.requests === 1 ? '' : 's'} ·{' '}
              {usage.tokensUsed.toLocaleString()} tokens
            </Text>
            <Pressable onPress={() => void Linking.openURL(meta.usageUrl)}>
              <Text style={styles.usageLink}>Open {meta.label} usage ↗</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  )
}

function Row(props: { children: ReactNode }): JSX.Element {
  return <View style={styles.row}>{props.children}</View>
}

function ProviderOption(props: {
  label: string
  detail: string
  selected: boolean
  disabled?: boolean
  onPress: () => void
}): JSX.Element {
  return (
    <Pressable style={[styles.option, props.disabled && styles.optionDisabled]} onPress={props.onPress} disabled={props.disabled}>
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
  providerCard: { gap: 0 },
  providerBlock: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md },
  providerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  providerIcon: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  providerNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  activeBadge: { backgroundColor: colors.successSoft, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 1 },
  activeBadgeLabel: { fontSize: type.micro, fontWeight: '700', color: colors.success },
  providerBody: { marginTop: spacing.md, gap: spacing.sm },
  providerActionsRow: { flexDirection: 'row', gap: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  optionDisabled: { opacity: 0.45 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: type.body, fontWeight: '600', color: colors.text },
  optionDetail: { fontSize: type.micro, color: colors.textMuted, marginTop: 1 },
  keyInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: type.caption,
    color: colors.text,
    backgroundColor: colors.background,
    marginTop: spacing.sm,
  },
  keyInputWrap: { position: 'relative' },
  keyInputWithIcon: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: 44,
    fontSize: type.caption,
    color: colors.text,
    backgroundColor: colors.background,
  },
  keyInputEye: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonDisabled: { opacity: 0.45 },
  secondaryButtonLabel: { fontSize: type.caption, fontWeight: '700', color: colors.primary },
  usageBox: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing.md, gap: 2 },
  usageLabel: { fontSize: type.micro, fontWeight: '700', color: colors.textSecondary },
  usageDetail: { fontSize: type.caption, color: colors.textSecondary },
  usageLink: { fontSize: type.micro, fontWeight: '700', color: colors.primary, marginTop: 2 },
  fieldLabel: { fontSize: type.body, fontWeight: '700', color: colors.text },
  fieldHint: { fontSize: type.micro, color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  privacyText: { flex: 1, fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.dangerSoft,
    backgroundColor: colors.dangerSoft,
  },
  dangerButtonLabel: { fontSize: type.caption, fontWeight: '700', color: colors.danger },
})
