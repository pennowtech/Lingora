import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { logger } from '@lingora/observability'
import { AlertModal, Card, Chip, ConfirmModal } from '../../components/ui'
import { CardSourceIcon } from '../../lib/cardSource'
import {
  emptyProviderState,
  PROVIDER_META,
  PROVIDER_STORE_KEYS,
  VALIDATORS,
  ZERO_USAGE,
  type ProviderFormState,
} from '../../lib/aiProviderMeta'
import { clearUsage, getUsage, type UsageSnapshot } from '../../lib/providerUsage'
import { DEFAULT_MODELS, GENERATION_PROVIDERS, STORE_KEYS, useServices, type GenerationProviderName } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'settings', screen: 'AiProvidersScreen' })

/**
 * The "AI Providers" sub-screen (formerly the Settings screen's own "Generation" section) —
 * split out so the top-level Settings menu isn't a single mega-scroll. Fully self-contained: loads
 * its own slice of SecureStore on mount rather than receiving it from the parent menu.
 */
export default function AiProvidersScreen(): JSX.Element {
  const { reloadServices } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  const [generationProvider, setGenerationProviderState] = useState<GenerationProviderName | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [expandedProvider, setExpandedProvider] = useState<GenerationProviderName | null>(null)
  const [showKey, setShowKey] = useState<Partial<Record<GenerationProviderName, boolean>>>({})
  const [validating, setValidating] = useState<Partial<Record<GenerationProviderName, boolean>>>({})
  const [validated, setValidated] = useState<Partial<Record<GenerationProviderName, boolean>>>({})
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null)
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false)

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
      try {
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
        const storedGeneration = await SecureStore.getItemAsync(STORE_KEYS.generationProvider)

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
        if ((GENERATION_PROVIDERS as readonly string[]).includes(storedGeneration ?? '')) {
          setGenerationProviderState(storedGeneration as GenerationProviderName)
        }
      } catch (error) {
        log.error('settings.load_failed', error, { message: 'Failed to load stored AI provider settings' })
        setLoadError(String(error))
      } finally {
        setLoaded(true)
      }
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
    setValidated((prev) => ({ ...prev, [name]: false }))
  }
  const changeModel = (name: GenerationProviderName, value: string): void => {
    updateProvider(name, { model: value })
    persist(PROVIDER_STORE_KEYS[name].model, value)
    setValidated((prev) => ({ ...prev, [name]: false }))
  }
  const changeEnabled = (name: GenerationProviderName, value: boolean): void => {
    updateProvider(name, { enabled: value })
    persist(PROVIDER_STORE_KEYS[name].enabled, value ? 'true' : 'false')
    log.info('settings.provider_enabled_changed', {
      message: `${value ? 'Enabled' : 'Disabled'} a generation provider`,
      metadata: { provider: name, settingKey: 'enabled' },
    })
  }
  const changeGenerationProvider = (name: GenerationProviderName): void => {
    setGenerationProviderState(name)
    persist(STORE_KEYS.generationProvider, name)
    log.info('settings.generation_provider_changed', {
      message: 'Active generation provider changed',
      metadata: { provider: name },
    })
  }

  const validate = (name: GenerationProviderName): void => {
    const { apiKey, model } = providers[name]
    if (!apiKey.trim()) return
    setValidating((prev) => ({ ...prev, [name]: true }))
    void VALIDATORS[name](apiKey, model)
      .then((result) => {
        setValidated((prev) => ({ ...prev, [name]: result.ok }))
        setNotice({
          title: result.ok ? t('Connected') : result.networkUnavailable ? t('No internet connection') : t('{{provider}} validation failed', { provider: PROVIDER_META[name].label }),
          message: result.message,
        })
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
    setValidated((prev) => ({ ...prev, [name]: false }))
    log.info('settings.provider_key_cleared', {
      message: 'Provider API key cleared',
      metadata: { provider: name },
    })
  }

  const deleteAllProviderKeys = (): void => {
    for (const name of GENERATION_PROVIDERS) {
      updateProvider(name, { apiKey: '' })
      void SecureStore.setItemAsync(PROVIDER_STORE_KEYS[name].key, '')
      void clearUsage(name)
    }
    setUsage({ openai: ZERO_USAGE, mistral: ZERO_USAGE, gemini: ZERO_USAGE, anthropic: ZERO_USAGE })
    setValidated({})
    void reloadServices()
    log.info('settings.all_provider_keys_deleted', {
      message: 'User deleted every AI provider API key from this device',
      metadata: { itemCount: GENERATION_PROVIDERS.length },
    })
  }

  const configuredProviders = GENERATION_PROVIDERS.filter(
    (name) => providers[name].enabled && providers[name].apiKey.trim() !== '',
  )
  const activeGenerationProvider =
    generationProvider && configuredProviders.includes(generationProvider) ? generationProvider : configuredProviders[0]
  const anyKeyPresent = GENERATION_PROVIDERS.some((name) => providers[name].apiKey.trim() !== '')

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {loadError ? (
        <View style={styles.banner}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>{t("Couldn't load saved settings")}</Text>
            <Text style={styles.bannerMessage}>{loadError}</Text>
          </View>
        </View>
      ) : null}

      <Card style={styles.providerCard}>
        <Text style={styles.fieldHint}>
          {t('Card generation (meanings, examples, clusters, phrases, cloze) uses whichever provider below is configured and enabled. Bring your own API key — nothing is sent until you generate a card.')}
        </Text>

        {loaded && configuredProviders.length > 1 ? (
          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.fieldLabel}>{t('Active provider')}</Text>
            <View style={styles.chipRow}>
              {configuredProviders.map((name) => (
                <Chip
                  key={name}
                  testID={`active-provider-${name}`}
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
            name={name}
            meta={PROVIDER_META[name]}
            state={providers[name]}
            active={name === activeGenerationProvider}
            expanded={expandedProvider === name}
            showKey={showKey[name] ?? false}
            validating={validating[name] ?? false}
            validated={validated[name] ?? false}
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

      <Card style={styles.dangerCard}>
        <Pressable
          testID="delete-all-provider-keys"
          style={[styles.dangerButton, !anyKeyPresent && styles.secondaryButtonDisabled]}
          onPress={() => setDeleteAllConfirmOpen(true)}
          disabled={!anyKeyPresent}
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={styles.dangerButtonLabel}>{t('Delete All AI Providers Keys')}</Text>
        </Pressable>
      </Card>

      <ConfirmModal
        visible={deleteAllConfirmOpen}
        title={t('Delete all AI provider keys?')}
        message={t('This removes every OpenAI/Mistral/Gemini/Claude key from this device. Vocabulary and progress are unaffected.')}
        onCancel={() => setDeleteAllConfirmOpen(false)}
        onConfirm={() => {
          setDeleteAllConfirmOpen(false)
          deleteAllProviderKeys()
        }}
        confirmLabel={t('Delete')}
        destructive
      />

      <AlertModal
        visible={notice !== null}
        title={notice?.title ?? ''}
        message={notice?.message ?? ''}
        onClose={() => setNotice(null)}
      />
    </ScrollView>
  )
}

function ProviderCard(props: {
  name: GenerationProviderName
  meta: (typeof PROVIDER_META)[GenerationProviderName]
  state: ProviderFormState
  active: boolean
  expanded: boolean
  showKey: boolean
  validating: boolean
  validated: boolean
  usage: UsageSnapshot
  onToggleExpanded: () => void
  onToggleEnabled: (value: boolean) => void
  onToggleShowKey: () => void
  onChangeApiKey: (value: string) => void
  onChangeModel: (value: string) => void
  onValidate: () => void
  onClearKey: () => void
}): JSX.Element {
  const { name, meta, state, active, expanded, showKey, validating, validated, usage } = props
  const hasKey = state.apiKey.trim() !== ''
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.providerBlock}>
      {/* The Switch is a sibling of the expand-toggle Pressable, not nested inside it — a native
          Switch nested inside a Pressable/TouchableOpacity's touch region is a known Android+RN
          gotcha where the tap can land on neither the Switch nor the wrapping Pressable reliably
          (found via Maestro flow flakiness: the Switch's own AccessibilityNodeInfo reported
          clickable+enabled with correct bounds, yet taps at its center consistently didn't toggle
          it — a real touch-target overlap bug, not a test timing issue). Split into two Pressables
          (icon+text, chevron) around the Switch so the row still expands/collapses from either
          end while the Switch gets its own untouched hit region in between. */}
      <View style={styles.providerHeader}>
        <Pressable
          testID={`provider-header-${name}`}
          style={styles.providerHeaderMain}
          onPress={props.onToggleExpanded}
        >
          <View style={[styles.providerIcon, { backgroundColor: `${meta.color}1A` }]}>
            <CardSourceIcon source={name} size={20} />
          </View>
          <View style={styles.optionText}>
            <View style={styles.providerNameRow}>
              <Text style={styles.optionLabel}>{meta.label}</Text>
              {active ? (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeLabel}>{t('Active')}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.optionDetail}>{t(meta.description)}</Text>
          </View>
        </Pressable>
        <Switch
          testID={`provider-toggle-${name}`}
          value={state.enabled && hasKey}
          onValueChange={props.onToggleEnabled}
          disabled={!hasKey}
        />
        <Pressable onPress={props.onToggleExpanded} hitSlop={8}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      {expanded ? (
        <View style={styles.providerBody}>
          <Text style={styles.fieldLabel}>{t('Model')}</Text>
          <View style={styles.chipRow}>
            {meta.models.map((model) => (
              <Chip key={model} label={model} selected={model === state.model} onPress={() => props.onChangeModel(model)} />
            ))}
          </View>

          <View style={styles.keyInputWrap}>
            <TextInput
              testID={`provider-key-input-${name}`}
              style={styles.keyInputWithIcon}
              placeholder={t('Paste your {{provider}} API key…', { provider: meta.label })}
              placeholderTextColor={colors.textMuted}
              value={state.apiKey}
              onChangeText={props.onChangeApiKey}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              testID={`provider-show-key-${name}`}
              accessibilityRole="button"
              accessibilityLabel={showKey ? t('Hide {{provider}} API key', { provider: meta.label }) : t('Show {{provider}} API key', { provider: meta.label })}
              onPress={props.onToggleShowKey}
              style={styles.keyInputEye}
            >
              <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.providerActionsRow}>
            <Pressable
              testID={`provider-validate-${name}`}
              style={[
                styles.secondaryButton,
                validated && styles.secondaryButtonValidated,
                (validating || !hasKey) && styles.secondaryButtonDisabled,
              ]}
              onPress={props.onValidate}
              disabled={validating || !hasKey}
            >
              {validating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : validated ? (
                <View style={styles.validatedRow}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                  <Text style={[styles.secondaryButtonLabel, { color: colors.success }]}>{t('Key validated')}</Text>
                </View>
              ) : (
                <Text style={styles.secondaryButtonLabel}>{t('Validate key')}</Text>
              )}
            </Pressable>
            <Pressable style={[styles.secondaryButton, !hasKey && styles.secondaryButtonDisabled]} onPress={props.onClearKey} disabled={!hasKey}>
              <Text style={[styles.secondaryButtonLabel, { color: colors.danger }]}>{t('Clear')}</Text>
            </Pressable>
          </View>

          <View style={styles.usageBox}>
            <Text style={styles.usageLabel}>{t('Device-observed usage')}</Text>
            <Text style={styles.usageDetail}>
              {t('{{count}} requests', { count: usage.requests.toLocaleString() })} ·{' '}
              {t('{{count}} tokens', { count: usage.tokensUsed.toLocaleString() })}
            </Text>
            <Pressable onPress={() => void Linking.openURL(meta.usageUrl)}>
              <Text style={styles.usageLink}>{t('Open {{provider}} usage ↗', { provider: meta.label })}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  banner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: type.body, fontWeight: '700', color: colors.danger },
  bannerMessage: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  providerCard: { gap: 0 },
  providerBlock: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md },
  providerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  providerHeaderMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  providerIcon: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  providerNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  activeBadge: { backgroundColor: colors.successSoft, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 1 },
  activeBadgeLabel: { fontSize: type.micro, fontWeight: '700', color: colors.success },
  providerBody: { marginTop: spacing.md, gap: spacing.sm },
  providerActionsRow: { flexDirection: 'row', gap: spacing.sm },
  optionText: { flex: 1 },
  optionLabel: { fontSize: type.body, fontWeight: '600', color: colors.text },
  optionDetail: { fontSize: type.micro, color: colors.textMuted, marginTop: 1 },
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
  secondaryButtonValidated: { borderColor: colors.successSoft, backgroundColor: colors.successSoft },
  secondaryButtonLabel: { fontSize: type.caption, fontWeight: '700', color: colors.primary },
  validatedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  usageBox: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing.md, gap: 2 },
  dangerCard: { marginTop: spacing.lg },
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
  usageLabel: { fontSize: type.micro, fontWeight: '700', color: colors.textSecondary },
  usageDetail: { fontSize: type.caption, color: colors.textSecondary },
  usageLink: { fontSize: type.micro, fontWeight: '700', color: colors.primary, marginTop: 2 },
  fieldLabel: { fontSize: type.body, fontWeight: '700', color: colors.text },
  fieldHint: { fontSize: type.micro, color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  })
