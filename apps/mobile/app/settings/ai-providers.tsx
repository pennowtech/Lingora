import { Stack } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { logger } from '@lingora/observability'
import { Icon } from '../../components/Icon'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { AlertModal, Card, Chip, ConfirmModal, IconButton } from '../../components/ui'
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

/** Behind a single "?" in the header instead of a paragraph at the top of the screen — same
 * pattern as settings/learning.tsx and settings/tts.tsx (see components/HelpAccordion.tsx). */
const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'overview',
    title: 'How AI Providers works',
    icon: 'Sparkles',
    paragraphs: [
      "This is where a new word turns into a full card - meanings, example sentences, semantic clusters, and more. Whenever you look up a word Lingora doesn't already know, it hands that word to whichever provider you've marked **Active** below and asks it to build the card.",
      "It's **bring-your-own-key**: Lingora doesn't ship with a shared AI subscription, so nothing gets generated until you paste in your own API key from one of the providers below. That also means nothing is ever sent anywhere until you actually look up a word - just having a key saved doesn't trigger any requests.",
      "You don't need every provider filled in. One working, validated key is all it takes - pick whichever service you already have an account with, or whichever one you're curious to try, and start there.",
    ],
  },
  {
    id: 'active-vs-enabled',
    title: '"Active" vs "Enabled" - what\'s the difference?',
    icon: 'SlidersHorizontal',
    paragraphs: [
      "**Active** is the one provider actually doing the work right now - the engine that responds when you look up a word. Only one provider can be Active at a time, and tapping a validated provider's card here switches to it immediately.",
      "**Enabled** is a softer flag, tucked inside a provider's own settings panel. It controls whether that provider is allowed to be picked at all (including as a fallback, and as an option elsewhere in the app like Settings > Translation) - flip it off if you want to keep a key saved for later without it being usable right now.",
      "If a key gets cleared or fails validation while its provider is Active, Lingora quietly falls back to the next best option - whichever provider is both enabled and has a validated key - so you're never stuck without generation just because one key went stale.",
    ],
  },
  {
    id: 'setup',
    title: 'Adding and validating a key',
    icon: 'Key',
    paragraphs: [
      "Tap a provider's card to open its settings, paste in your API key, and pick a model if you want something other than the default. Then hit **Validate** - this sends one small real request to confirm the key actually works before you rely on it for word generation.",
      "A provider only becomes eligible to be Active once its key has validated successfully. That's deliberate - it stops a typo'd or expired key from silently becoming the one thing standing between you and a new card.",
      "**Clear** removes the key from this device entirely (and resets its validation and usage history). Nothing is stored anywhere except this device's secure storage - not in Lingora's own servers, not synced anywhere, unless you back up and restore it yourself.",
    ],
  },
  {
    id: 'providers',
    title: 'Which provider should I pick?',
    icon: 'Sparkles',
    paragraphs: [
      "**OpenAI** is the default and a safe general-purpose choice - reliable structured output, widely used, easy to get a key for at `platform.openai.com`.",
      "**Groq** runs open models (like the gpt-oss family) on very fast custom hardware - if speed matters more to you than picking a specific model family, this is usually the quickest of the bunch to respond.",
      "**Mistral** is a solid European alternative with its own models, good if you'd rather not depend on a US-based provider or just want a second option in the mix.",
      "**Gemini** (Google) tends to be generous on free-tier usage limits if you're just trying this out without committing to a paid key yet.",
      "**Claude** (Anthropic) is known for careful, well-reasoned output - a good pick if you find another provider's example sentences or meanings feel a little off and want to compare.",
      "**DeepSeek** is capable and inexpensive, but tends to run noticeably slower than the others for a full word generation - worth knowing going in so a longer wait doesn't feel like something's broken.",
      "Whichever you choose, the model picker under each provider lets you trade off speed, cost, and quality without needing to leave this screen.",
    ],
  },
  {
    id: 'usage',
    title: 'What the usage numbers mean',
    icon: 'ChartColumn',
    paragraphs: [
      "Each provider's panel shows a **device-observed usage** box - request and token counts this specific device has actually sent through that key. It's a convenience, not a bill: it only counts what happened here, so it won't match a key shared across multiple devices or apps.",
      "For the real, authoritative numbers - and anything to do with billing or rate limits - use the \"Open usage\" link, which takes you straight to that provider's own dashboard.",
    ],
  },
]

/**
 * The "AI Providers" sub-screen (formerly the Settings screen's own "Generation" section) —
 * split out so the top-level Settings menu isn't a single mega-scroll. Fully self-contained: loads
 * its own slice of SecureStore on mount rather than receiving it from the parent menu.
 *
 * Layout mirrors the desktop app's Settings > AI Providers exactly: a grid of compact provider
 * cards (tap to preview + activate) plus a single detail box below for whichever card was tapped —
 * not an always-rendered accordion row per provider. Nothing shows in the detail area until a card
 * is tapped, and tapping a different card swaps it rather than stacking multiple open sections.
 */
export default function AiProvidersScreen(): JSX.Element {
  const { reloadServices } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const help = useHelpAccordion('overview')

  const [generationProvider, setGenerationProviderState] = useState<GenerationProviderName | null>(null)
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
    deepseek: emptyProviderState('deepseek'),
    groq: emptyProviderState('groq'),
  })
  const [usage, setUsage] = useState<Record<GenerationProviderName, UsageSnapshot>>({
    openai: ZERO_USAGE,
    mistral: ZERO_USAGE,
    gemini: ZERO_USAGE,
    anthropic: ZERO_USAGE,
    deepseek: ZERO_USAGE,
    groq: ZERO_USAGE,
  })

  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const validatedMap: Partial<Record<GenerationProviderName, boolean>> = {}
        const entries = await Promise.all(
          GENERATION_PROVIDERS.map(async (name) => {
            const keys = PROVIDER_STORE_KEYS[name]
            const [apiKey, model, enabledRaw, validatedKeyRaw, providerUsage] = await Promise.all([
              SecureStore.getItemAsync(keys.key),
              SecureStore.getItemAsync(keys.model),
              SecureStore.getItemAsync(keys.enabled),
              SecureStore.getItemAsync(keys.validatedKey),
              getUsage(name),
            ])
            const loadedKey = apiKey ?? ''
            const loadedModel = model ?? DEFAULT_MODELS[name]
            if (loadedKey.trim() !== '' && validatedKeyRaw === `${loadedKey.trim()}:::${loadedModel}`) {
              validatedMap[name] = true
            }
            return [
              name,
              { apiKey: loadedKey, model: loadedModel, enabled: enabledRaw !== 'false' },
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
        setValidated(validatedMap)
        if ((GENERATION_PROVIDERS as readonly string[]).includes(storedGeneration ?? '')) {
          setGenerationProviderState(storedGeneration as GenerationProviderName)
        }
      } catch (error) {
        log.error('settings.load_failed', error, { message: 'Failed to load stored AI provider settings' })
        setLoadError(String(error))
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

  const invalidateProviderKey = (name: GenerationProviderName): void => {
    void SecureStore.setItemAsync(PROVIDER_STORE_KEYS[name].validatedKey, '')
    setValidated((prev) => ({ ...prev, [name]: false }))
  }

  const changeApiKey = (name: GenerationProviderName, value: string): void => {
    updateProvider(name, { apiKey: value })
    persist(PROVIDER_STORE_KEYS[name].key, value.trim())
    invalidateProviderKey(name)
  }
  const changeModel = (name: GenerationProviderName, value: string): void => {
    updateProvider(name, { model: value })
    persist(PROVIDER_STORE_KEYS[name].model, value)
    invalidateProviderKey(name)
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
      .then(async (result) => {
        if (result.ok) {
          await SecureStore.setItemAsync(PROVIDER_STORE_KEYS[name].validatedKey, `${apiKey.trim()}:::${model}`)
        } else {
          await SecureStore.setItemAsync(PROVIDER_STORE_KEYS[name].validatedKey, 'invalid')
        }
        setValidated((prev) => ({ ...prev, [name]: result.ok }))
        await reloadServices()
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
    invalidateProviderKey(name)
    void clearUsage(name).then(() => setUsage((prev) => ({ ...prev, [name]: ZERO_USAGE })))
    log.info('settings.provider_key_cleared', {
      message: 'Provider API key cleared',
      metadata: { provider: name },
    })
  }

  const deleteAllProviderKeys = (): void => {
    for (const name of GENERATION_PROVIDERS) {
      updateProvider(name, { apiKey: '' })
      void SecureStore.setItemAsync(PROVIDER_STORE_KEYS[name].key, '')
      void SecureStore.setItemAsync(PROVIDER_STORE_KEYS[name].validatedKey, '')
      void clearUsage(name)
    }
    setUsage({ openai: ZERO_USAGE, mistral: ZERO_USAGE, gemini: ZERO_USAGE, anthropic: ZERO_USAGE, deepseek: ZERO_USAGE, groq: ZERO_USAGE })
    setValidated({})
    void reloadServices()
    log.info('settings.all_provider_keys_deleted', {
      message: 'User deleted every AI provider API key from this device',
      metadata: { itemCount: GENERATION_PROVIDERS.length },
    })
  }

  const configuredProviders = GENERATION_PROVIDERS.filter(
    (name) => providers[name].enabled && providers[name].apiKey.trim() !== '' && validated[name],
  )
  const activeGenerationProvider =
    generationProvider && configuredProviders.includes(generationProvider) ? generationProvider : configuredProviders[0]
  const anyKeyPresent = GENERATION_PROVIDERS.some((name) => providers[name].apiKey.trim() !== '')

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton icon="CircleQuestionMark" onPress={() => help.openSection('overview')} color={colors.primary} size={22} />
          ),
        }}
      />
      {loadError ? (
        <View style={styles.banner}>
          <Icon name="CircleAlert" size={16} color={colors.danger} />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>{t("Couldn't load saved settings")}</Text>
            <Text style={styles.bannerMessage}>{loadError}</Text>
          </View>
        </View>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>{t('Active Generation Provider')}</Text>
        <Text style={styles.sectionSubtitle}>
          {t('Select which AI engine is used for context disambiguation, word package generation, and CEFR example sentence creation.')}
        </Text>
        <View style={styles.grid}>
          {GENERATION_PROVIDERS.map((name) => {
            const state = providers[name]
            const meta = PROVIDER_META[name]
            const hasKey = state.apiKey.trim() !== ''
            const isActive = name === activeGenerationProvider
            const isPreviewed = expandedProvider === name
            return (
              <View key={name}>
                <Pressable
                  testID={`provider-grid-${name}`}
                  style={[styles.gridCard, isPreviewed && styles.gridCardPreviewed]}
                  onPress={() => {
                    if (validated[name]) changeGenerationProvider(name)
                    setExpandedProvider((prev) => (prev === name ? null : name))
                  }}
                >
                  <View style={[styles.gridCardIcon, { backgroundColor: `${meta.color}1A` }]}>
                    <CardSourceIcon source={name} size={20} />
                  </View>
                  <View style={styles.gridCardBody}>
                    <View style={styles.gridCardHeader}>
                      <Text style={styles.gridCardLabel} numberOfLines={1}>{meta.label}</Text>
                      {isActive ? (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeLabel}>{t('Active')}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.gridCardModel} numberOfLines={1}>{t('Model')}: {state.model}</Text>
                    <Text
                      style={[
                        styles.gridCardStatus,
                        validated[name] && styles.gridCardStatusSuccess,
                        hasKey && !validated[name] && styles.gridCardStatusWarning,
                      ]}
                    >
                      {validated[name] ? t('Validated') : hasKey ? t('Key configured') : t('No key set')}
                    </Text>
                  </View>
                  <Icon name={isPreviewed ? 'ChevronUp' : 'ChevronDown'} size={18} color={colors.textMuted} />
                </Pressable>

                {isPreviewed ? (
                  <ProviderDetailBody
                    name={name}
                    state={state}
                    active={isActive}
                    showKey={showKey[name] ?? false}
                    validating={validating[name] ?? false}
                    validated={validated[name] ?? false}
                    usage={usage[name]}
                    onToggleEnabled={(value) => changeEnabled(name, value)}
                    onToggleShowKey={() => setShowKey((prev) => ({ ...prev, [name]: !prev[name] }))}
                    onChangeApiKey={(value) => changeApiKey(name, value)}
                    onChangeModel={(value) => changeModel(name, value)}
                    onValidate={() => validate(name)}
                    onClearKey={() => clearProviderKey(name)}
                  />
                ) : null}
              </View>
            )
          })}
        </View>
      </Card>

      <Card style={styles.dangerCard}>
        <Pressable
          testID="delete-all-provider-keys"
          style={[styles.dangerButton, !anyKeyPresent && styles.secondaryButtonDisabled]}
          onPress={() => setDeleteAllConfirmOpen(true)}
          disabled={!anyKeyPresent}
        >
          <Icon name="Trash2" size={16} color={colors.danger} />
          <Text style={styles.dangerButtonLabel}>{t('Delete All AI Providers Keys')}</Text>
        </Pressable>
      </Card>

      <ConfirmModal
        visible={deleteAllConfirmOpen}
        title={t('Delete all AI provider keys?')}
        message={t('This removes every OpenAI/Mistral/Gemini/Claude/DeepSeek/Groq key from this device. Vocabulary and progress are unaffected.')}
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

      <HelpAccordionSheet
        visible={help.visible}
        onClose={help.close}
        title={t('AI Providers')}
        sections={HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={help.setSectionId}
        translate={t}
      />
    </ScrollView>
  )
}

/** The config panel that unfolds directly beneath a tapped provider row, merged visually into the
 * same box rather than a separate card at the bottom of the list — model chips, API key,
 * Enabled/Validate/Clear, device-observed usage. */
function ProviderDetailBody(props: {
  name: GenerationProviderName
  state: ProviderFormState
  active: boolean
  showKey: boolean
  validating: boolean
  validated: boolean
  usage: UsageSnapshot
  onToggleEnabled: (value: boolean) => void
  onToggleShowKey: () => void
  onChangeApiKey: (value: string) => void
  onChangeModel: (value: string) => void
  onValidate: () => void
  onClearKey: () => void
}): JSX.Element {
  const { name, state, showKey, validating, validated, usage } = props
  const meta = PROVIDER_META[name]
  const hasKey = state.apiKey.trim() !== ''
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.detailPanel}>
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
            placeholder={t('Paste your {{provider}} API key...', { provider: meta.label })}
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
            <Icon name={showKey ? 'EyeOff' : 'Eye'} size={19} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.enabledRow}>
          <Text style={styles.fieldLabel}>{t('Enabled')}</Text>
          <Switch
            testID={`provider-toggle-${name}`}
            value={state.enabled && hasKey}
            onValueChange={props.onToggleEnabled}
            disabled={!hasKey}
          />
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
                <Icon name="CircleCheck" size={15} color={colors.success} />
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
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
  banner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: type.body, fontWeight: '700', color: colors.danger },
  bannerMessage: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  sectionTitle: { fontSize: type.subheading, fontWeight: '700', color: colors.text },
  sectionSubtitle: { fontSize: type.caption, color: colors.textMuted, marginTop: 4, marginBottom: spacing.lg, lineHeight: 19 },
  grid: { gap: spacing.md },
  gridCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  gridCardPreviewed: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  gridCardIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  gridCardBody: { flex: 1, gap: 3 },
  gridCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  gridCardLabel: { fontSize: type.body, fontWeight: '700', color: colors.text, flexShrink: 1 },
  gridCardModel: { fontSize: type.caption, color: colors.textSecondary },
  gridCardStatus: { fontSize: type.caption, color: colors.textMuted },
  gridCardStatusSuccess: { color: colors.success },
  gridCardStatusWarning: { color: colors.warning },
  detailPanel: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.primary,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  activeBadge: { backgroundColor: colors.successSoft, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  activeBadgeLabel: { fontSize: type.micro, fontWeight: '700', color: colors.success },
  providerBody: { marginTop: spacing.md, gap: spacing.md },
  providerActionsRow: { flexDirection: 'row', gap: spacing.sm },
  enabledRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  usageBox: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.lg, gap: 4 },
  dangerCard: { marginTop: 0 },
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  })
