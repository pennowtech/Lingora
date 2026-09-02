import { Stack } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { logger } from '@lingora/observability'
import { Icon } from '../../components/Icon'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { AlertModal, Card, ConfirmModal, IconButton } from '../../components/ui'
import { CardSourceIcon } from '../../lib/cardSource'
import {
  emptyProviderState,
  PROVIDER_META,
  PROVIDER_MODEL_PROFILES,
  PROVIDER_PORTAL_URLS,
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
    id: 'how-to-get-key',
    title: 'How to get an API key',
    icon: 'Key',
    paragraphs: [
      "Getting an API key takes about a minute. Each provider has a developer portal where you sign up, create a key, and copy it into Lingora. You can tap the **Get key from... ↗** link on any card to open that provider's official portal directly in your browser.",
      "**Free-tier options**: If you want to start without adding a payment method, **Google Gemini** (via Google AI Studio) and **Groq** (via Groq Console) offer generous free-tier quotas suitable for daily vocabulary lookups.",
      "**Pay-as-you-go options**: Providers like **OpenAI**, **Anthropic (Claude)**, **Mistral**, and **DeepSeek** use pay-as-you-go billing with prepaid balances. Generating a full vocabulary card typically costs less than a tenth of a cent ($0.0001 - $0.001 per card), so a small credit can last for thousands of words.",
      "Once a key is validated, the developer portal link remains readily accessible anytime under **Advanced Engine & Custom Models**.",
    ],
  },
  {
    id: 'active-and-fallback',
    title: 'Active provider & automatic fallback',
    icon: 'SlidersHorizontal',
    paragraphs: [
      "**Active** is the primary engine currently generating your cards and word explanations. Only one provider is Active at a time, and tapping **Activate** on any validated card sets it as primary immediately.",
      "As soon as you test and validate an API key, that provider is ready to use and automatically joins your fallback pool.",
      "If your Active key runs out of credits or encounters an unexpected rate limit, Lingora automatically falls back to your other validated providers so your card creation never fails.",
    ],
  },
  {
    id: 'setup',
    title: 'Adding and validating a key',
    icon: 'Key',
    paragraphs: [
      "Tap a provider's card to open its settings, paste in your API key, and pick a model if you want something other than the default. Then hit **Test & Save Key** - this sends one small real request to confirm the key actually works before you rely on it for word generation.",
      "A provider becomes eligible to be Active as soon as its key validates successfully. That's deliberate - it stops a typo'd or expired key from silently becoming the one thing standing between you and a new card.",
      "**Clear** removes the key from this device entirely (and resets its validation and usage history). Nothing is stored anywhere except this device's secure storage - not in Lingora's own servers, not synced anywhere, unless you back up and restore it yourself.",
    ],
  },
  {
    id: 'engines',
    title: 'Engine profiles and custom models',
    icon: 'Cpu',
    paragraphs: [
      "Each provider offers curated **preset engine profiles** tagged with their strengths (such as speed, reasoning, or multilingual quality) so you can pick the best balance for your learning.",
      "Under **Advanced Engine & Custom Models**, you can also access provider portal links or enter a **Custom Model Identifier** (e.g. newly released checkpoints, preview models, or private fine-tunes). Setting a custom model identifier automatically overrides the preset profiles.",
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
 * The "AI Providers" screen:
 * Displays providers in a dashboard layout:
 * - Active provider is highlighted with an ACTIVE badge
 * - Inactive validated providers display an "Activate" pill button
 * - Inactive unconfigured/unvalidated providers display status subtext
 * - Tapping any card unfolds the progressive configuration inspector.
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
  const [savedModels, setSavedModels] = useState<Record<GenerationProviderName, string>>({ ...DEFAULT_MODELS })
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
        const savedModelMap: Record<GenerationProviderName, string> = { ...DEFAULT_MODELS }
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
            savedModelMap[name] = loadedModel
            const isVal =
              loadedKey.trim() !== '' &&
              validatedKeyRaw != null &&
              validatedKeyRaw !== 'invalid' &&
              validatedKeyRaw !== '' &&
              (validatedKeyRaw === `${loadedKey.trim()}:::${loadedModel}` ||
                validatedKeyRaw === loadedKey.trim() ||
                validatedKeyRaw.startsWith(`${loadedKey.trim()}:::`))
            if (isVal) {
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

        setSavedModels(savedModelMap)
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
  }
  const changeGenerationProvider = (name: GenerationProviderName): void => {
    setGenerationProviderState(name)
    void SecureStore.setItemAsync(STORE_KEYS.generationProvider, name).then(() => {
      void reloadServices()
    })
    log.info('settings.generation_provider_changed', {
      message: 'Active generation provider changed',
      metadata: { provider: name },
    })
  }

  const validate = (name: GenerationProviderName): void => {
    const { apiKey, model } = providers[name]
    const key = apiKey.trim()
    if (!key) return
    setValidating((prev) => ({ ...prev, [name]: true }))
    void VALIDATORS[name](key, model)
      .then(async (result) => {
        if (result.ok) {
          await Promise.all([
            SecureStore.setItemAsync(PROVIDER_STORE_KEYS[name].key, key),
            SecureStore.setItemAsync(PROVIDER_STORE_KEYS[name].validatedKey, `${key}:::${model}`),
            SecureStore.setItemAsync(PROVIDER_STORE_KEYS[name].model, model),
            SecureStore.setItemAsync(STORE_KEYS.generationProvider, name),
          ])
          setSavedModels((prev) => ({ ...prev, [name]: model }))
          setValidated((prev) => ({ ...prev, [name]: true }))
          setGenerationProviderState(name)
          setNotice({
            title: t('Connected & Active'),
            message: result.message,
          })
        } else {
          if (!validated[name]) {
            await SecureStore.setItemAsync(PROVIDER_STORE_KEYS[name].validatedKey, 'invalid')
            setValidated((prev) => ({ ...prev, [name]: false }))
          }
          setNotice({
            title: result.networkUnavailable ? t('No internet connection') : t('{{provider}} validation failed', { provider: PROVIDER_META[name].label }),
            message: result.message,
          })
        }
        await reloadServices()
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
  const providersWithKey = GENERATION_PROVIDERS.filter(
    (name) => providers[name].enabled && providers[name].apiKey.trim() !== '',
  )
  const activeGenerationProvider =
    generationProvider && (configuredProviders.includes(generationProvider) || providersWithKey.includes(generationProvider))
      ? generationProvider
      : configuredProviders[0] ?? providersWithKey[0]
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
            const isValidated = Boolean(validated[name])
            const isActive = name === activeGenerationProvider
            const isPreviewed = expandedProvider === name

            return (
              <View
                key={name}
                style={[
                  styles.providerCardContainer,
                  isActive && styles.providerCardContainerActive,
                  isPreviewed && styles.providerCardContainerExpanded,
                ]}
              >
                <Pressable
                  testID={`provider-grid-${name}`}
                  style={[
                    styles.gridCardHeader,
                    isPreviewed && styles.gridCardHeaderExpanded,
                  ]}
                  onPress={() => {
                    setExpandedProvider((prev) => (prev === name ? null : name))
                  }}
                >
                  <View style={[styles.gridCardIcon, { backgroundColor: `${meta.color}1A` }]}>
                    <CardSourceIcon source={name} size={22} />
                  </View>

                  <View style={styles.gridCardBody}>
                    <Text style={styles.gridCardLabel} numberOfLines={1}>{meta.label}</Text>
                    <Text style={styles.gridCardSubtitle} numberOfLines={1}>
                      {isActive
                        ? t('Connected & Active')
                        : isValidated
                        ? t('Validated')
                        : hasKey
                        ? t('Key saved')
                        : t('No key pasted yet')}
                    </Text>
                  </View>

                  {/* Right Action: ACTIVE pill or Activate button or Chevron */}
                  <View style={styles.gridCardRightAction}>
                    {isActive ? (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeLabel}>{t('ACTIVE')}</Text>
                      </View>
                    ) : hasKey ? (
                      <Pressable
                        style={styles.activatePillButton}
                        onPress={(e) => {
                          e.stopPropagation()
                          changeGenerationProvider(name)
                        }}
                      >
                        <Text style={styles.activatePillButtonText}>{t('Activate')}</Text>
                      </Pressable>
                    ) : null}
                    <Icon name={isPreviewed ? 'ChevronUp' : 'ChevronDown'} size={18} color={colors.textMuted} />
                  </View>
                </Pressable>

                {isPreviewed ? (
                  <ProviderDetailBody
                    name={name}
                    state={state}
                    active={isActive}
                    showKey={showKey[name] ?? false}
                    validating={validating[name] ?? false}
                    validated={isValidated}
                    savedModel={savedModels[name]}
                    usage={usage[name]}
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

      {/* Alert Notices */}
      <AlertModal
        visible={notice !== null}
        title={notice?.title ?? ''}
        message={notice?.message ?? ''}
        onClose={() => setNotice(null)}
      />

      {/* Delete All Confirm Modal */}
      <ConfirmModal
        visible={deleteAllConfirmOpen}
        title={t('Delete all AI provider keys?')}
        message={t('This removes every OpenAI/Mistral/Gemini/Claude/DeepSeek/Groq key from this device. Vocabulary and progress are unaffected.')}
        confirmLabel={t('Delete')}
        cancelLabel={t('Cancel')}
        destructive={true}
        onConfirm={() => {
          setDeleteAllConfirmOpen(false)
          deleteAllProviderKeys()
        }}
        onCancel={() => setDeleteAllConfirmOpen(false)}
      />

      {/* Help sheet */}
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

/**
 * Collapsible Provider Detail Body:
 * - Active Model Summary badge with draft indicator
 * - Key input with direct portal link and integrated Paste button
 * - Primary [Test & Save Key] / [Test & Switch Model] button
 * - Collapsible "Advanced Engine & Custom Models" drawer with curated profiles & custom model input
 * - Sleek telemetry footer
 */
function ProviderDetailBody(props: {
  name: GenerationProviderName
  state: ProviderFormState
  active: boolean
  showKey: boolean
  validating: boolean
  validated: boolean
  savedModel: string
  usage: UsageSnapshot
  onToggleShowKey: () => void
  onChangeApiKey: (value: string) => void
  onChangeModel: (value: string) => void
  onValidate: () => void
  onClearKey: () => void
}): JSX.Element {
  const { name, state, active, showKey, validating, validated, savedModel, usage } = props
  const meta = PROVIDER_META[name]
  const portal = PROVIDER_PORTAL_URLS[name]
  const profiles = PROVIDER_MODEL_PROFILES[name] ?? []
  const hasKey = state.apiKey.trim() !== ''
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const isKeyReady = validated || active

  const isModelModified = validated && state.model !== savedModel
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const isCustomModel = !profiles.some((p) => p.id === state.model)
  const [customInput, setCustomInput] = useState(isCustomModel ? state.model : '')

  const activeProfile = profiles.find((p) => p.id === (validated ? savedModel : state.model))
  const selectedProfile = profiles.find((p) => p.id === state.model)

  const handlePaste = async (): Promise<void> => {
    try {
      const text = await Clipboard.getStringAsync()
      if (text && text.trim()) {
        props.onChangeApiKey(text.trim())
      }
    } catch {
      // Ignore clipboard read errors
    }
  }

  return (
    <View style={styles.detailPanel}>
      <View style={styles.providerBody}>
        {/* Active Model Subtitle Strip */}
        <View style={styles.currentModelSummary}>
          <Text style={styles.currentModelLabel}>{validated ? t('Active Model') : t('Selected Model')}:</Text>
          <Text style={styles.currentModelName}>
            {activeProfile ? `${activeProfile.label}${activeProfile.isDefault ? ` (${t('Default')})` : ''}` : (validated ? savedModel : state.model)}
          </Text>
          {isModelModified ? (
            <View style={styles.unvalidatedPill}>
              <Text style={styles.unvalidatedPillText}>
                {t('Pending: {{model}}', { model: selectedProfile?.label ?? state.model })}
              </Text>
            </View>
          ) : !validated && hasKey ? (
            <View style={styles.unvalidatedPill}>
              <Text style={styles.unvalidatedPillText}>{t('Needs Key Validation')}</Text>
            </View>
          ) : null}
        </View>

        {/* API Key Header with direct Portal Link when not yet validated/active */}
        <View style={styles.keyHeaderRow}>
          <Text style={styles.fieldLabel} numberOfLines={1}>
            {t('{{provider}} API Key', { provider: meta.label })}
          </Text>
          {!isKeyReady && portal ? (
            <Pressable
              onPress={() => void Linking.openURL(portal.url)}
              hitSlop={8}
              style={styles.portalLinkPressable}
            >
              <Text style={styles.portalLinkText} numberOfLines={1}>
                {t('Get key from {{portal}} ↗', { portal: portal.label })}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* API Key Input with embedded Paste and Eye buttons */}
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
          <View style={styles.keyActionsInside}>
            <Pressable style={styles.pasteButton} onPress={handlePaste}>
              <Text style={styles.pasteButtonText}>{t('Paste')}</Text>
            </Pressable>
            <Pressable
              testID={`provider-show-key-${name}`}
              accessibilityRole="button"
              accessibilityLabel={showKey ? t('Hide {{provider}} API key', { provider: meta.label }) : t('Show {{provider}} API key', { provider: meta.label })}
              onPress={props.onToggleShowKey}
              style={styles.keyInputEye}
            >
              <Icon name={showKey ? 'EyeOff' : 'Eye'} size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Primary Action Buttons */}
        <View style={styles.providerActionsRow}>
          <Pressable
            testID={`provider-validate-${name}`}
            style={[
              styles.primaryValidateButton,
              validated && !isModelModified && !validating && styles.primaryButtonValidated,
              (validating || !hasKey) && styles.primaryButtonDisabled,
            ]}
            onPress={props.onValidate}
            disabled={validating || !hasKey}
          >
            {validating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : isModelModified ? (
              <View style={styles.validatedRow}>
                <Icon name="Zap" size={16} color="#fff" />
                <Text style={styles.primaryButtonLabel}>{t('Test & Switch Model')}</Text>
              </View>
            ) : validated ? (
              <View style={styles.validatedRow}>
                <Icon name="CircleCheck" size={16} color={colors.success} />
                <Text style={styles.validatedButtonLabel}>{t('Key Validated')}</Text>
              </View>
            ) : (
              <View style={styles.validatedRow}>
                <Icon name="Zap" size={16} color="#fff" />
                <Text style={styles.primaryButtonLabel}>{t('Test & Save Key')}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={[styles.clearButton, !hasKey && styles.clearButtonDisabled]}
            onPress={props.onClearKey}
            disabled={!hasKey}
          >
            <Text style={styles.clearButtonLabel}>{t('Clear')}</Text>
          </Pressable>
        </View>

        {/* Advanced Model Settings Expander */}
        <View style={styles.advancedExpanderContainer}>
          <Pressable
            style={styles.advancedToggleHeader}
            onPress={() => setAdvancedOpen((prev) => !prev)}
          >
            <View style={styles.advancedToggleTitleRow}>
              <Icon name="SlidersHorizontal" size={15} color={colors.textSecondary} />
              <Text style={styles.advancedToggleTitle}>{t('Advanced Engine & Custom Models')}</Text>
            </View>
            <Icon name={advancedOpen ? 'ChevronUp' : 'ChevronDown'} size={16} color={colors.textSecondary} />
          </Pressable>

          {advancedOpen ? (
            <View style={styles.advancedBody}>
              {/* Model Profile Cards */}
              <View style={styles.modelProfilesList}>
                {profiles.map((profile) => {
                  const isSelected = state.model === profile.id
                  return (
                    <Pressable
                      key={profile.id}
                      style={[styles.modelProfileCard, isSelected && styles.modelProfileCardSelected]}
                      onPress={() => {
                        props.onChangeModel(profile.id)
                        setCustomInput('')
                      }}
                    >
                      <View style={styles.modelProfileInfo}>
                        <View style={styles.modelProfileTitleRow}>
                          <Text style={[styles.modelProfileTitle, isSelected && { color: colors.primary }]}>
                            {profile.label}
                          </Text>
                          {profile.speedTag ? (
                            <View style={[styles.speedTagBadge, isSelected && styles.speedTagBadgeSelected]}>
                              <Text style={[styles.speedTagBadgeText, isSelected && styles.speedTagBadgeTextSelected]}>
                                {t(profile.speedTag)}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        {profile.description ? (
                          <Text style={styles.modelProfileDesc}>{t(profile.description)}</Text>
                        ) : null}
                      </View>
                      <View style={[styles.modelRadioDot, isSelected && styles.modelRadioDotSelected]}>
                        {isSelected ? <View style={styles.modelRadioInner} /> : null}
                      </View>
                    </Pressable>
                  )
                })}
              </View>

              {/* Custom Model Input Override */}
              <View style={styles.customModelContainer}>
                <View style={styles.customModelHeaderRow}>
                  <Text style={styles.customModelLabel}>{t('Custom Model Identifier')}</Text>
                  {isCustomModel ? (
                    <Text style={styles.customActiveBadge}>{t('Active')}</Text>
                  ) : null}
                </View>
                <TextInput
                  style={styles.customModelTextInput}
                  placeholder={t('e.g. {{defaultModel}}, custom fine-tune...', { defaultModel: meta.models[0] ?? '' })}
                  placeholderTextColor={colors.textMuted}
                  value={customInput}
                  onChangeText={(val) => {
                    setCustomInput(val)
                    if (val.trim()) {
                      props.onChangeModel(val.trim())
                    }
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Portal Key Management Link (when key is already validated or active) */}
              {isKeyReady && portal ? (
                <Pressable
                  onPress={() => void Linking.openURL(portal.url)}
                  style={styles.advancedPortalLinkRow}
                >
                  <Text style={styles.portalLinkText} numberOfLines={1}>
                    {t('Get key from {{portal}} ↗', { portal: portal.label })}
                  </Text>
                  <Icon name="ExternalLink" size={14} color={colors.primary} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Telemetry Strip */}
        <View style={styles.telemetryStrip}>
          <Text style={styles.telemetryText}>
            📊 {t('{{count}} cards generated', { count: usage.requests.toLocaleString() })} ({t('{{count}} tokens', { count: usage.tokensUsed.toLocaleString() })})
          </Text>
          <Pressable onPress={() => void Linking.openURL(meta.usageUrl)}>
            <Text style={styles.telemetryLink}>{t('Usage Console ↗')}</Text>
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
    providerCardContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    providerCardContainerActive: {
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    providerCardContainerExpanded: {
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    gridCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      backgroundColor: colors.surface,
    },
    gridCardHeaderExpanded: {
      backgroundColor: colors.primarySoft,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    gridCardIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    gridCardBody: { flex: 1, gap: 3 },
    gridCardLabel: { fontSize: type.body, fontWeight: '700', color: colors.text, flexShrink: 1 },
    gridCardSubtitle: { fontSize: type.caption, color: colors.textSecondary },

    gridCardRightAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    activeBadge: {
      backgroundColor: colors.successSoft,
      borderWidth: 1,
      borderColor: colors.success,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
    },
    activeBadgeLabel: { fontSize: 11, fontWeight: '800', color: colors.success, letterSpacing: 0.5 },
    activatePillButton: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
    },
    activatePillButtonText: { fontSize: 12, fontWeight: '700', color: colors.text },

    detailPanel: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    providerBody: { marginTop: spacing.md, gap: spacing.md },

    /* Current Model Summary */
    currentModelSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flexWrap: 'wrap',
      paddingBottom: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    currentModelLabel: { fontSize: type.micro, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
    currentModelName: { fontSize: type.caption, fontWeight: '700', color: colors.text },
    unvalidatedPill: {
      backgroundColor: colors.warningSoft ?? '#FFFBEB',
      borderWidth: 1,
      borderColor: colors.warning ?? '#F59E0B',
      borderRadius: radius.sm,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    unvalidatedPillText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.warning ?? '#D97706',
    },

    /* Key Header & Input */
    keyHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
      flexWrap: 'wrap',
    },
    fieldLabel: {
      fontSize: type.caption,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      flexShrink: 1,
    },
    portalLinkPressable: {
      flexShrink: 1,
    },
    portalLinkText: {
      fontSize: type.caption,
      fontWeight: '700',
      color: colors.primary,
    },
    keyInputWrap: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
    },
    keyInputWithIcon: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingLeft: spacing.md,
      paddingRight: 96,
      fontSize: type.caption,
      color: colors.text,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    keyActionsInside: {
      position: 'absolute',
      right: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    pasteButton: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.sm,
    },
    pasteButtonText: { fontSize: type.micro, fontWeight: '700', color: colors.text },
    keyInputEye: {
      padding: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },

    /* Action Buttons */
    providerActionsRow: { flexDirection: 'row', gap: spacing.sm },
    primaryValidateButton: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      gap: spacing.xs,
    },
    primaryButtonValidated: {
      backgroundColor: colors.successSoft,
      borderWidth: 1,
      borderColor: colors.success,
    },
    primaryButtonDisabled: { opacity: 0.45 },
    primaryButtonLabel: { fontSize: type.caption, fontWeight: '800', color: colors.textOnPrimary },
    validatedButtonLabel: { fontSize: type.caption, fontWeight: '800', color: colors.success },
    validatedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    clearButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
    },
    clearButtonDisabled: { opacity: 0.45 },
    clearButtonLabel: { fontSize: type.caption, fontWeight: '700', color: colors.danger },

    /* Advanced Expander */
    advancedExpanderContainer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.sm,
    },
    advancedToggleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
    },
    advancedToggleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    advancedToggleTitle: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary },
    advancedBody: {
      marginTop: spacing.sm,
      gap: spacing.sm,
    },

    /* Model Profiles List */
    modelProfilesList: { gap: spacing.xs },
    modelProfileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.sm,
    },
    modelProfileCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    modelProfileInfo: { flex: 1, gap: 2 },
    modelProfileTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
    modelProfileTitle: { fontSize: type.caption, fontWeight: '700', color: colors.text },
    speedTagBadge: {
      backgroundColor: colors.surface,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    speedTagBadgeSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    speedTagBadgeText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
    speedTagBadgeTextSelected: { color: colors.textOnPrimary },
    modelProfileDesc: { fontSize: type.micro, color: colors.textMuted, lineHeight: 15 },
    modelRadioDot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modelRadioDotSelected: {
      borderColor: colors.primary,
    },
    modelRadioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },

    /* Custom Model Box */
    customModelContainer: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    customModelHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    customModelLabel: { fontSize: type.caption, fontWeight: '700', color: colors.text },
    customActiveBadge: { fontSize: type.micro, fontWeight: '700', color: colors.primary, backgroundColor: colors.primarySoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    customModelTextInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: type.caption,
      color: colors.text,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    advancedPortalLinkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },

    /* Telemetry Strip */
    telemetryStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
      flexWrap: 'wrap',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },
    telemetryText: { fontSize: type.micro, color: colors.textSecondary, fontWeight: '600', flexShrink: 1 },
    telemetryLink: { fontSize: type.micro, fontWeight: '700', color: colors.primary, flexShrink: 0 },

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
    secondaryButtonDisabled: { opacity: 0.45 },
  })
