import { Ionicons } from '@expo/vector-icons'
import type { LanguageCode } from '@lingora/types'
import { VoiceQuality, type Voice } from 'expo-speech'
import { Stack } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { AlertModal, Button, Card, Chip, Dropdown, IconButton, Spinner } from '../../components/ui'
import * as SecureStore from 'expo-secure-store'
import {
  AUDIO_PROVIDERS,
  AUDIO_PROVIDER_META,
  AUDIO_SPEED_OPTIONS,
  AUDIO_STORE_KEYS,
  CLOUD_AUDIO_PROVIDERS,
  DEFAULT_AUDIO_SPEED,
  getDefaultCloudVoice,
  OPENAI_RECOMMENDED_VOICES,
  OPENAI_TTS_VOICES,
  SPEED_CAPABLE_PROVIDERS,
  type AudioProviderName,
  type CloudAudioProviderName,
} from '../../lib/audioProviderMeta'
import { validateAudioProviderKey } from '../../lib/audioProviderValidation'
import { fetchProviderVoices, type ProviderVoiceOption } from '../../lib/audioProviderVoices'
import { playCloudSpeech, stopCloudSpeech } from '../../lib/cloudTts'
import { CloudTtsError } from '../../lib/cloudTtsProviders'
import { speak } from '../../lib/speech'
import { useServices } from '../../lib/services'
import {
  DEFAULT_TTS_PITCH,
  DEFAULT_TTS_RATE,
  getAudioProvider,
  getAvailableVoices,
  getCloudAudioConfig,
  getTtsSettings,
  setAudioProvider,
  setCloudAudioKey,
  setCloudAudioSpeed,
  setCloudAudioVoice,
  setTtsPitch,
  setTtsRate,
  setTtsVoice,
} from '../../lib/ttsSettings'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const RATE_OPTIONS = [0.75, 1.0, 1.25, 1.5]
const PITCH_OPTIONS = [0.75, 1.0, 1.25, 1.5]

const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  de: 'German',
  ja: 'Japanese',
  es: 'Spanish',
  fr: 'French',
  vi: 'Vietnamese',
  hi: 'Hindi',
}

/** Default "Test phrase" per learning language — same sentence in each supported language, so the
 * Test phrase reflects what's set under Settings > Learning > "I'm learning" by default rather
 * than always defaulting to German regardless of what the user is actually learning. */
const DEFAULT_SAMPLE_TEXTS: Record<LanguageCode, string> = {
  de: 'Ich habe viel über die Kultur erfahren.',
  en: 'I learned a lot about the culture.',
  es: 'Aprendí mucho sobre la cultura.',
  fr: "J'ai beaucoup appris sur la culture.",
  ja: '文化についてたくさん学びました。',
  vi: 'Tôi đã học được nhiều điều về văn hóa.',
  hi: 'मैंने संस्कृति के बारे में बहुत कुछ सीखा।',
}

/** Help content — one accordion section per engine, plus overview/testing — same shape and
 * pattern as templates.tsx's HELP_SECTIONS, kept as data so every section renders uniformly
 * behind one "?" button instead of scattering explanatory paragraphs across the screen. */
const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'overview',
    title: 'How Audio Settings works',
    icon: 'information-circle',
    paragraphs: [
      'Every speaker button in the app uses whichever engine is marked Active below.',
      'Cloud providers are bring-your-own-key - nothing is sent to them until you tap a speaker icon or press Test.',
      'If a cloud key is invalid, the provider is unreachable, or a request fails, playback falls back to the device voice automatically - you\'re never left with silence.',
    ],
  },
  {
    id: 'test',
    title: 'Testing a voice',
    icon: 'volume-high',
    paragraphs: [
      '"Test active engine" plays the Test phrase through whichever engine is marked Active - the same thing any real speaker button in the app does.',
      'Each provider\'s own "Test this provider" button plays through that card\'s current key/voice/speed directly, regardless of which engine is Active - use it to check a setup before switching to it.',
    ],
  },
  {
    id: 'device',
    title: 'Device (built-in)',
    icon: 'phone-portrait',
    paragraphs: [
      'Uses your phone\'s own text-to-speech engine - offline, free, no API key.',
      'The voice list follows whatever language is set under Settings > Learning > "I\'m learning".',
      'Install more voices from your phone\'s system settings if the one you want isn\'t listed.',
    ],
  },
  {
    id: 'openai',
    title: 'OpenAI',
    icon: 'sparkles',
    paragraphs: [
      'gpt-4o-mini-tts. Marin and Cedar (★) are OpenAI\'s newest, most natural-sounding voices.',
      'If Validate says a project doesn\'t have access to gpt-4o-mini-tts, but the model works fine on platform.openai.com, your API key is scoped to a specific OpenAI Project that hasn\'t enabled it.',
      'Go to platform.openai.com > Settings > Projects > select the project this key belongs to > Models > enable gpt-4o-mini-tts for that project.',
      'Alternatively, generate a new key from a project that already has it enabled (or the "Default project" if you have one).',
    ],
  },
  {
    id: 'elevenlabs',
    title: 'ElevenLabs',
    icon: 'mic',
    paragraphs: [
      'eleven_multilingual_v2. Once your key is entered, choose from your own ElevenLabs voice library, or switch to manual entry to paste a voice ID directly.',
      'If no voice is picked, a known-good multilingual default voice is used automatically.',
    ],
  },
  {
    id: 'deepgram',
    title: 'Deepgram',
    icon: 'radio',
    paragraphs: [
      'Aura-2. Once your key is entered, choose from Deepgram\'s available models, or switch to manual entry to enter a model name directly (see Deepgram\'s docs for exact names).',
      'If no model is picked, a default is chosen to match whatever language is set under Settings > Learning > "I\'m learning" (English, German, Spanish, or French) - other languages fall back to an English voice until you pick one manually.',
    ],
  },
]

interface CloudProviderFormState {
  apiKey: string
  voice: string
  speed: number
}

const EMPTY_CLOUD_PROVIDER: CloudProviderFormState = { apiKey: '', voice: '', speed: DEFAULT_AUDIO_SPEED }

/**
 * Audio Settings: which engine speaks (device or a cloud TTS provider — see
 * lib/audioProviderMeta.ts, lib/cloudTts.ts) plus per-provider configuration. Every speaker button
 * reads the active provider through lib/speech.ts#speak(), so switching it here changes
 * pronunciation everywhere uniformly rather than per screen. Cloud provider cards mirror
 * Settings > AI Providers' layout (expand/collapse, show/hide key, validate, clear, active toggle)
 * for a consistent provider-management pattern across the app.
 */
export default function AudioSettingsScreen(): JSX.Element {
  const { t } = useTranslation()
  const { targetLanguage } = useServices()
  const queryClient = useQueryClient()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const [testing, setTesting] = useState(false)

  const [activeProvider, setActiveProviderState] = useState<AudioProviderName>('device')
  const [loaded, setLoaded] = useState(false)
  const [expandedProvider, setExpandedProvider] = useState<AudioProviderName | null>(null)
  const [showKey, setShowKey] = useState<Partial<Record<CloudAudioProviderName, boolean>>>({})
  const [validating, setValidating] = useState<Partial<Record<CloudAudioProviderName, boolean>>>({})
  const [validated, setValidated] = useState<Partial<Record<CloudAudioProviderName, boolean>>>({})
  const [testingCloud, setTestingCloud] = useState<Partial<Record<CloudAudioProviderName, boolean>>>({})
  const [sampleText, setSampleText] = useState(() => DEFAULT_SAMPLE_TEXTS[targetLanguage])
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null)
  /** 'manual' forces the free-text field even when a fetched voice list is available — lets a
   * user paste an ID the picker didn't return (e.g. a cloned ElevenLabs voice on another list
   * page). Undefined means "let the picker take over automatically once voices load". */
  const [voiceEntryMode, setVoiceEntryMode] = useState<Partial<Record<CloudAudioProviderName, 'picker' | 'manual'>>>({})
  const [cloudProviders, setCloudProviders] = useState<Record<CloudAudioProviderName, CloudProviderFormState>>({
    openai: EMPTY_CLOUD_PROVIDER,
    elevenlabs: EMPTY_CLOUD_PROVIDER,
    deepgram: EMPTY_CLOUD_PROVIDER,
  })
  const help = useHelpAccordion('overview')

  useEffect(() => {
    const load = async (): Promise<void> => {
      const [provider, entries, validatedEntries] = await Promise.all([
        getAudioProvider(),
        Promise.all(CLOUD_AUDIO_PROVIDERS.map(async (name) => [name, await getCloudAudioConfig(name)] as const)),
        Promise.all(
          CLOUD_AUDIO_PROVIDERS.map(async (name) => {
            const validatedKey = await SecureStore.getItemAsync(AUDIO_STORE_KEYS[name].validatedKey)
            return [name, validatedKey] as const
          }),
        ),
      ])
      setCloudProviders((prev) => {
        const next = { ...prev }
        for (const [name, config] of entries) next[name] = config
        return next
      })
      const validatedMap: Partial<Record<CloudAudioProviderName, boolean>> = {}
      for (const [name, config] of entries) {
        const validatedKey = validatedEntries.find(([n]) => n === name)?.[1]
        if ((config.apiKey ?? '').trim() !== '' && validatedKey === config.apiKey.trim()) {
          validatedMap[name] = true
        }
      }
      setValidated(validatedMap)
      // A cloud provider can only be active if it still has a key — guards against a stale
      // stored provider whose key was cleared elsewhere (or never set), so Device is always the
      // one actually speaking when nothing else is configured, not just visually implied.
      const activeConfig = entries.find(([name]) => name === provider)?.[1]
      const stillConfigured = provider === 'device' || (activeConfig?.apiKey.trim() ?? '') !== ''
      const resolvedProvider = stillConfigured ? provider : 'device'
      setActiveProviderState(resolvedProvider)
      if (resolvedProvider !== provider) void setAudioProvider(resolvedProvider)
      setLoaded(true)
    }
    void load()
  }, [])

  const settingsQuery = useQuery({
    queryKey: ['tts-settings', targetLanguage],
    queryFn: () => getTtsSettings(targetLanguage),
  })
  const voicesQuery = useQuery({
    queryKey: ['tts-voices', targetLanguage],
    queryFn: () => getAvailableVoices(targetLanguage),
  })
  // One query per fetchable-voice-list cloud provider (OpenAI's list is static, see
  // audioProviderMeta.ts#OPENAI_TTS_VOICES, so it has none) — only runs once that provider's card
  // is expanded and has a key, and re-runs if the key changes.
  const elevenLabsVoicesQuery = useQuery({
    queryKey: ['provider-voices', 'elevenlabs', cloudProviders.elevenlabs.apiKey],
    queryFn: () => fetchProviderVoices('elevenlabs', cloudProviders.elevenlabs.apiKey),
    enabled: expandedProvider === 'elevenlabs' && cloudProviders.elevenlabs.apiKey.trim() !== '',
  })
  const deepgramVoicesQuery = useQuery({
    queryKey: ['provider-voices', 'deepgram', cloudProviders.deepgram.apiKey],
    queryFn: () => fetchProviderVoices('deepgram', cloudProviders.deepgram.apiKey),
    enabled: expandedProvider === 'deepgram' && cloudProviders.deepgram.apiKey.trim() !== '',
  })
  const voiceOptionsQueries = { elevenlabs: elevenLabsVoicesQuery, deepgram: deepgramVoicesQuery }

  const deviceSettings = settingsQuery.data ?? { rate: DEFAULT_TTS_RATE, pitch: DEFAULT_TTS_PITCH, voice: null }
  const voices: Voice[] = voicesQuery.data ?? []

  const refreshDeviceSettings = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['tts-settings', targetLanguage] })
  }
  const handleRate = (rate: number): void => {
    setTtsRate(rate).then(refreshDeviceSettings).catch(() => undefined)
  }
  const handlePitch = (pitch: number): void => {
    setTtsPitch(pitch).then(refreshDeviceSettings).catch(() => undefined)
  }
  const handleVoice = (voiceId: string | null): void => {
    setTtsVoice(targetLanguage, voiceId).then(refreshDeviceSettings).catch(() => undefined)
  }

  const changeActiveProvider = (name: AudioProviderName): void => {
    setActiveProviderState(name)
    void setAudioProvider(name)
  }

  const updateCloudProvider = (name: CloudAudioProviderName, patch: Partial<CloudProviderFormState>): void => {
    setCloudProviders((prev) => ({ ...prev, [name]: { ...prev[name], ...patch } }))
  }
  const invalidateCloudKey = (name: CloudAudioProviderName): void => {
    void SecureStore.setItemAsync(AUDIO_STORE_KEYS[name].validatedKey, '')
    setValidated((prev) => ({ ...prev, [name]: false }))
  }
  const changeApiKey = (name: CloudAudioProviderName, value: string): void => {
    updateCloudProvider(name, { apiKey: value })
    void setCloudAudioKey(name, value.trim())
    invalidateCloudKey(name)
  }
  const changeVoice = (name: CloudAudioProviderName, value: string): void => {
    updateCloudProvider(name, { voice: value })
    void setCloudAudioVoice(name, value.trim())
  }
  const changeSpeed = (name: CloudAudioProviderName, value: number): void => {
    updateCloudProvider(name, { speed: value })
    void setCloudAudioSpeed(name, value)
  }
  const validate = (name: CloudAudioProviderName): void => {
    const { apiKey, voice, speed } = cloudProviders[name]
    if (!apiKey.trim()) return
    setValidating((prev) => ({ ...prev, [name]: true }))
    void validateAudioProviderKey(name, apiKey, getDefaultCloudVoice(name, targetLanguage, voice), speed)
      .then((result) => {
        if (result.ok) {
          void SecureStore.setItemAsync(AUDIO_STORE_KEYS[name].validatedKey, apiKey.trim())
        } else {
          void SecureStore.setItemAsync(AUDIO_STORE_KEYS[name].validatedKey, '')
        }
        setValidated((prev) => ({ ...prev, [name]: result.ok }))
        setNotice({
          title: result.ok
            ? t('Connected')
            : result.networkUnavailable
              ? t('No internet connection')
              : t('{{provider}} validation failed', { provider: AUDIO_PROVIDER_META[name].label }),
          message: result.message,
        })
      })
      .finally(() => setValidating((prev) => ({ ...prev, [name]: false })))
  }
  /** Tests exactly this card's current key/voice/speed by playing real audio through it —
   * bypasses getAudioProvider()/getCloudAudioConfig() entirely, so it always tests what's on
   * screen right now regardless of which engine is actually "Active". The global Test button
   * below tests the active engine specifically (matching what a real speaker-button tap does,
   * including its silent fallback-to-device) — this one is for checking a provider's own
   * configuration directly, and surfaces the real error instead of silently falling back. */
  const testCloudProvider = (name: CloudAudioProviderName): void => {
    const { apiKey, voice, speed } = cloudProviders[name]
    if (!apiKey.trim()) return
    stopCloudSpeech()
    setTestingCloud((prev) => ({ ...prev, [name]: true }))
    void playCloudSpeech(name, sampleText, apiKey, getDefaultCloudVoice(name, targetLanguage, voice), speed)
      .catch((error: unknown) => {
        setNotice({
          title: t('{{provider}} playback failed', { provider: t(AUDIO_PROVIDER_META[name].label) }),
          message: error instanceof CloudTtsError || error instanceof Error ? error.message : t('Unknown error'),
        })
      })
      .finally(() => setTestingCloud((prev) => ({ ...prev, [name]: false })))
  }

  const clearKey = (name: CloudAudioProviderName): void => {
    updateCloudProvider(name, { apiKey: '' })
    void setCloudAudioKey(name, '')
    invalidateCloudKey(name)
    // Can't leave the active engine without a key — Device is always the fallback.
    if (activeProvider === name) changeActiveProvider('device')
  }

  const handleTest = (): void => {
    setTesting(true)
    speak(sampleText, targetLanguage)
    setTimeout(() => setTesting(false), 2000)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Help lives in the native header, next to the "Audio Settings" title (set by
          app/_layout.tsx), not inline in the body — see the header-right pattern shared with
          Search, Mine, word/[form], and the other Settings screens that have a help sheet. */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton icon="help-circle-outline" onPress={() => help.openSection('overview')} color={colors.primary} size={22} />
          ),
        }}
      />
      <Text style={styles.fieldLabel}>{t('Speech engine')}</Text>
      <Card style={styles.providerCard}>
        {AUDIO_PROVIDERS.map((name) => (
          <AudioProviderCard
            key={name}
            name={name}
            active={activeProvider === name}
            loaded={loaded}
            expanded={expandedProvider === name}
            targetLanguage={targetLanguage}
            onToggleExpanded={() => setExpandedProvider((prev) => (prev === name ? null : name))}
            onActivate={() => changeActiveProvider(name)}
            onOpenHelp={() => help.openSection(name)}
            device={
              name === 'device'
                ? {
                    settings: deviceSettings,
                    voices,
                    voicesLoading: voicesQuery.isPending,
                    onChangeRate: handleRate,
                    onChangePitch: handlePitch,
                    onChangeVoice: handleVoice,
                  }
                : undefined
            }
            cloud={
              name !== 'device'
                ? {
                    state: cloudProviders[name],
                    showKey: showKey[name] ?? false,
                    validating: validating[name] ?? false,
                    validated: validated[name] ?? false,
                    testing: testingCloud[name] ?? false,
                    onToggleShowKey: () => setShowKey((prev) => ({ ...prev, [name]: !prev[name] })),
                    onChangeApiKey: (value) => changeApiKey(name, value),
                    onChangeVoice: (value) => changeVoice(name, value),
                    onChangeSpeed: (value) => changeSpeed(name, value),
                    onValidate: () => validate(name),
                    onClearKey: () => clearKey(name),
                    onTest: () => testCloudProvider(name),
                    ...(name in voiceOptionsQueries && {
                      voiceOptions: voiceOptionsQueries[name as keyof typeof voiceOptionsQueries].data ?? [],
                      voiceOptionsLoading: voiceOptionsQueries[name as keyof typeof voiceOptionsQueries].isFetching,
                      voiceEntryMode: voiceEntryMode[name],
                      onToggleVoiceEntryMode: () =>
                        setVoiceEntryMode((prev) => ({
                          ...prev,
                          [name]: prev[name] === 'manual' ? 'picker' : 'manual',
                        })),
                    }),
                  }
                : undefined
            }
          />
        ))}
      </Card>

      <Card>
        <Text style={styles.fieldLabel}>{t('Test phrase')}</Text>
        <TextInput
          style={styles.keyInputWithIcon}
          value={sampleText}
          onChangeText={setSampleText}
          multiline
          placeholder={t('Text to speak when testing')}
          placeholderTextColor={colors.textMuted}
        />
      </Card>

      <Button
        label={testing ? t('Playing...') : t('Test active engine')}
        icon="volume-high"
        variant="secondary"
        onPress={handleTest}
        disabled={testing}
        style={styles.testButton}
      />

      <HelpAccordionSheet
        visible={help.visible}
        onClose={help.close}
        title={t('Audio Settings help')}
        sections={HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={(id) => help.setSectionId(help.sectionId === id ? null : id)}
        translate={t}
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

function AudioProviderCard(props: {
  name: AudioProviderName
  active: boolean
  loaded: boolean
  expanded: boolean
  targetLanguage: LanguageCode
  onToggleExpanded: () => void
  onActivate: () => void
  onOpenHelp: () => void
  device?:
    | {
        settings: { rate: number; pitch: number; voice: string | null }
        voices: Voice[]
        voicesLoading: boolean
        onChangeRate: (rate: number) => void
        onChangePitch: (pitch: number) => void
        onChangeVoice: (voiceId: string | null) => void
      }
    | undefined
  cloud?:
    | {
        state: CloudProviderFormState
        showKey: boolean
        validating: boolean
        validated: boolean
        testing: boolean
        onToggleShowKey: () => void
        onChangeApiKey: (value: string) => void
        onChangeVoice: (value: string) => void
        onChangeSpeed: (value: number) => void
        onValidate: () => void
        onClearKey: () => void
        onTest: () => void
        voiceOptions?: ProviderVoiceOption[]
        voiceOptionsLoading?: boolean
        voiceEntryMode?: 'picker' | 'manual'
        onToggleVoiceEntryMode?: () => void
      }
    | undefined
}): JSX.Element {
  const { name, active, expanded } = props
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const meta = AUDIO_PROVIDER_META[name]
  const hasKey = props.cloud ? props.cloud.state.apiKey.trim() !== '' : true
  const canActivate = name === 'device' || hasKey
  const speedCapable = (SPEED_CAPABLE_PROVIDERS as readonly string[]).includes(name)

  return (
    <View style={styles.providerBlock}>
      {/* Switch kept as a sibling of the expand-toggle Pressable — see ai-providers.tsx's
          ProviderCard for why a Switch nested inside a Pressable is an Android touch-target bug. */}
      <View style={styles.providerHeader}>
        <Pressable testID={`audio-provider-header-${name}`} style={styles.providerHeaderMain} onPress={props.onToggleExpanded}>
          <View style={styles.providerIcon}>
            <Ionicons name={meta.icon} size={18} color={colors.primary} />
          </View>
          <View style={styles.optionText}>
            <View style={styles.providerNameRow}>
              <Text style={styles.optionLabel}>{t(meta.label)}</Text>
              {active ? (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeLabel}>{t('Active')}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.optionDetail}>{t(meta.description)}</Text>
          </View>
        </Pressable>
        <IconButton
          testID={`audio-provider-help-${name}`}
          icon="help-circle-outline"
          size={20}
          onPress={props.onOpenHelp}
        />
        <Switch
          testID={`audio-provider-toggle-${name}`}
          value={active}
          onValueChange={(value) => {
            if (value) props.onActivate()
          }}
          disabled={active || !canActivate}
        />
        <Pressable onPress={props.onToggleExpanded} hitSlop={8}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      {expanded && props.device ? (
        <View style={styles.providerBody}>
          <Text style={styles.fieldLabel}>{t('Speaking rate')}</Text>
          <View style={styles.chipRow}>
            {RATE_OPTIONS.map((rate) => (
              <Chip key={rate} label={`${rate}×`} selected={props.device?.settings.rate === rate} onPress={() => props.device?.onChangeRate(rate)} />
            ))}
          </View>

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>{t('Pitch')}</Text>
          <View style={styles.chipRow}>
            {PITCH_OPTIONS.map((pitch) => (
              <Chip
                key={pitch}
                label={pitch === 1.0 ? t('Normal') : `${pitch}×`}
                selected={props.device?.settings.pitch === pitch}
                onPress={() => props.device?.onChangePitch(pitch)}
              />
            ))}
          </View>

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>
            {t('Voice ({{language}})', { language: t(LANGUAGE_LABELS[props.targetLanguage]) })}
          </Text>
          {props.device.voicesLoading ? (
            <Spinner />
          ) : props.device.voices.length === 0 ? (
            <Text style={styles.hint}>
              {t('No {{language}} voices are installed on this device.', { language: t(LANGUAGE_LABELS[props.targetLanguage]) })}
            </Text>
          ) : (
            <Dropdown
              placeholder={t('Device default')}
              clearable
              value={props.device.settings.voice}
              onChange={props.device.onChangeVoice}
              options={props.device.voices.map((v) => ({
                label: `${v.name}${v.quality === VoiceQuality.Enhanced ? ` (${t('Enhanced')})` : ''}`,
                value: v.identifier,
              }))}
            />
          )}
        </View>
      ) : null}

      {expanded && props.cloud ? (
        <View style={styles.providerBody}>
          <View style={styles.keyInputWrap}>
            <TextInput
              testID={`audio-provider-key-input-${name}`}
              style={styles.keyInputWithIcon}
              placeholder={t('Paste your {{provider}} API key...', { provider: t(meta.label) })}
              placeholderTextColor={colors.textMuted}
              value={props.cloud.state.apiKey}
              onChangeText={props.cloud.onChangeApiKey}
              secureTextEntry={!props.cloud.showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              testID={`audio-provider-show-key-${name}`}
              accessibilityRole="button"
              accessibilityLabel={props.cloud.showKey ? t('Hide {{provider}} API key', { provider: t(meta.label) }) : t('Show {{provider}} API key', { provider: t(meta.label) })}
              onPress={props.cloud.onToggleShowKey}
              style={styles.keyInputEye}
            >
              <Ionicons name={props.cloud.showKey ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>
            {name === 'openai' ? t('Voice') : name === 'elevenlabs' ? t('Voice') : t('Model')}
          </Text>
          {name === 'openai' ? (
            <View style={styles.chipRow}>
              {OPENAI_TTS_VOICES.map((voice) => (
                <Chip
                  key={voice}
                  label={OPENAI_RECOMMENDED_VOICES.includes(voice) ? `${voice} ★` : voice}
                  selected={(props.cloud?.state.voice ?? 'marin') === voice}
                  onPress={() => props.cloud?.onChangeVoice(voice)}
                />
              ))}
            </View>
          ) : (
            (() => {
              const fetched = props.cloud?.voiceOptions ?? []
              const mode = props.cloud?.voiceEntryMode ?? (fetched.length > 0 ? 'picker' : 'manual')
              if (props.cloud?.voiceOptionsLoading && fetched.length === 0) {
                return <Spinner />
              }
              if (mode === 'picker' && fetched.length > 0) {
                const effectiveDefault = getDefaultCloudVoice(name as CloudAudioProviderName, props.targetLanguage, '')
                const displayValue = props.cloud?.state.voice || (fetched.some((v) => v.id === effectiveDefault) ? effectiveDefault : null)
                return (
                  <>
                    <Dropdown
                      placeholder={t('Choose a voice...')}
                      value={displayValue}
                      onChange={(value) => props.cloud?.onChangeVoice(value ?? '')}
                      options={fetched.map((v) => ({
                        label: v.description ? `${v.label} - ${v.description}` : v.label,
                        value: v.id,
                      }))}
                    />
                    <Pressable onPress={props.cloud?.onToggleVoiceEntryMode} hitSlop={4}>
                      <Text style={styles.linkText}>{t('Or enter an ID manually')}</Text>
                    </Pressable>
                  </>
                )
              }
              return (
                <>
                  <TextInput
                    style={styles.keyInputWithIcon}
                    placeholder={t('Default: {{voice}}', {
                      voice: getDefaultCloudVoice(name as CloudAudioProviderName, props.targetLanguage, ''),
                    })}
                    placeholderTextColor={colors.textMuted}
                    value={props.cloud?.state.voice}
                    onChangeText={props.cloud?.onChangeVoice}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {fetched.length > 0 ? (
                    <Pressable onPress={props.cloud?.onToggleVoiceEntryMode} hitSlop={4}>
                      <Text style={styles.linkText}>{t('Choose from your {{provider}} voices instead', { provider: t(meta.label) })}</Text>
                    </Pressable>
                  ) : null}
                </>
              )
            })()
          )}

          {speedCapable ? (
            <>
              <Text style={[styles.fieldLabel, styles.fieldSpacing]}>{t('Speaking speed')}</Text>
              <View style={styles.chipRow}>
                {AUDIO_SPEED_OPTIONS.map((speedOption) => (
                  <Chip
                    key={speedOption}
                    label={speedOption === 1.0 ? t('Normal') : `${speedOption}×`}
                    selected={(props.cloud?.state.speed ?? DEFAULT_AUDIO_SPEED) === speedOption}
                    onPress={() => props.cloud?.onChangeSpeed(speedOption)}
                  />
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.hint}>{t('Speaking speed isn\'t configurable for this provider yet.')}</Text>
          )}

          <View style={styles.providerActionsRow}>
            <Pressable
              testID={`audio-provider-validate-${name}`}
              style={[
                styles.secondaryButton,
                props.cloud.validated && styles.secondaryButtonValidated,
                (props.cloud.validating || !hasKey) && styles.secondaryButtonDisabled,
              ]}
              onPress={props.cloud.onValidate}
              disabled={props.cloud.validating || !hasKey}
            >
              {props.cloud.validating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : props.cloud.validated ? (
                <View style={styles.validatedRow}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                  <Text style={[styles.secondaryButtonLabel, { color: colors.success }]}>{t('Key validated')}</Text>
                </View>
              ) : (
                <Text style={styles.secondaryButtonLabel}>{t('Validate key')}</Text>
              )}
            </Pressable>
            <Pressable style={[styles.secondaryButton, !hasKey && styles.secondaryButtonDisabled]} onPress={props.cloud.onClearKey} disabled={!hasKey}>
              <Text style={[styles.secondaryButtonLabel, { color: colors.danger }]}>{t('Clear')}</Text>
            </Pressable>
          </View>
          <View style={styles.providerActionsRow}>
            <Pressable
              testID={`audio-provider-test-${name}`}
              style={[styles.secondaryButton, (props.cloud.testing || !hasKey) && styles.secondaryButtonDisabled]}
              onPress={props.cloud.onTest}
              disabled={props.cloud.testing || !hasKey}
            >
              {props.cloud.testing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.secondaryButtonLabel}>{t('Test this provider')}</Text>
              )}
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
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
    providerCard: { gap: 0 },
    providerBlock: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md },
    providerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    providerHeaderMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    providerIcon: {
      width: 34,
      height: 34,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    providerNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    activeBadge: { backgroundColor: colors.successSoft, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 1 },
    activeBadgeLabel: { fontSize: type.micro, fontWeight: '700', color: colors.success },
    providerBody: { marginTop: spacing.md, gap: spacing.sm },
    providerActionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
    optionText: { flex: 1 },
    optionLabel: { fontSize: type.body, fontWeight: '600', color: colors.text },
    optionDetail: { fontSize: type.micro, color: colors.textMuted, marginTop: 1 },
    fieldLabel: { fontSize: type.body, fontWeight: '700', color: colors.text },
    fieldSpacing: { marginTop: spacing.md },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
    hint: { fontSize: type.micro, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 16 },
    linkText: { fontSize: type.micro, fontWeight: '700', color: colors.primary, marginTop: spacing.sm },
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
    testButton: { marginTop: spacing.md },
  })
