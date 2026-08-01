import { Ionicons } from '@expo/vector-icons'
import type { LanguageCode } from '@lingora/types'
import { VoiceQuality, type Voice } from 'expo-speech'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { Button, Card, Chip, Dropdown, Spinner } from '../../components/ui'
import {
  AUDIO_PROVIDERS,
  AUDIO_PROVIDER_META,
  AUDIO_SPEED_OPTIONS,
  CLOUD_AUDIO_PROVIDERS,
  DEFAULT_AUDIO_SPEED,
  OPENAI_RECOMMENDED_VOICES,
  OPENAI_TTS_VOICES,
  SPEED_CAPABLE_PROVIDERS,
  type AudioProviderName,
  type CloudAudioProviderName,
} from '../../lib/audioProviderMeta'
import { validateAudioProviderKey } from '../../lib/audioProviderValidation'
import { speak } from '../../lib/speech'
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

/** German is the target language everything is actually pronounced in — the one voice/rate/pitch setting worth exposing per v1. */
const LANGUAGE: LanguageCode = 'de'
const SAMPLE_TEXT = 'Ich habe viel über die Kultur erfahren.'

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
  const queryClient = useQueryClient()
  const styles = useThemedStyles(createStyles)
  const [testing, setTesting] = useState(false)

  const [activeProvider, setActiveProviderState] = useState<AudioProviderName>('device')
  const [loaded, setLoaded] = useState(false)
  const [expandedProvider, setExpandedProvider] = useState<AudioProviderName | null>(null)
  const [showKey, setShowKey] = useState<Partial<Record<CloudAudioProviderName, boolean>>>({})
  const [validating, setValidating] = useState<Partial<Record<CloudAudioProviderName, boolean>>>({})
  const [validated, setValidated] = useState<Partial<Record<CloudAudioProviderName, boolean>>>({})
  const [cloudProviders, setCloudProviders] = useState<Record<CloudAudioProviderName, CloudProviderFormState>>({
    openai: EMPTY_CLOUD_PROVIDER,
    elevenlabs: EMPTY_CLOUD_PROVIDER,
    deepgram: EMPTY_CLOUD_PROVIDER,
  })

  useEffect(() => {
    const load = async (): Promise<void> => {
      const [provider, entries] = await Promise.all([
        getAudioProvider(),
        Promise.all(CLOUD_AUDIO_PROVIDERS.map(async (name) => [name, await getCloudAudioConfig(name)] as const)),
      ])
      setActiveProviderState(provider)
      setCloudProviders((prev) => {
        const next = { ...prev }
        for (const [name, config] of entries) next[name] = config
        return next
      })
      setLoaded(true)
    }
    void load()
  }, [])

  const settingsQuery = useQuery({
    queryKey: ['tts-settings', LANGUAGE],
    queryFn: () => getTtsSettings(LANGUAGE),
  })
  const voicesQuery = useQuery({
    queryKey: ['tts-voices', LANGUAGE],
    queryFn: () => getAvailableVoices(LANGUAGE),
  })

  const deviceSettings = settingsQuery.data ?? { rate: DEFAULT_TTS_RATE, pitch: DEFAULT_TTS_PITCH, voice: null }
  const voices: Voice[] = voicesQuery.data ?? []

  const refreshDeviceSettings = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['tts-settings', LANGUAGE] })
  }
  const handleRate = (rate: number): void => {
    setTtsRate(rate).then(refreshDeviceSettings).catch(() => undefined)
  }
  const handlePitch = (pitch: number): void => {
    setTtsPitch(pitch).then(refreshDeviceSettings).catch(() => undefined)
  }
  const handleVoice = (voiceId: string | null): void => {
    setTtsVoice(LANGUAGE, voiceId).then(refreshDeviceSettings).catch(() => undefined)
  }

  const changeActiveProvider = (name: AudioProviderName): void => {
    setActiveProviderState(name)
    void setAudioProvider(name)
  }

  const updateCloudProvider = (name: CloudAudioProviderName, patch: Partial<CloudProviderFormState>): void => {
    setCloudProviders((prev) => ({ ...prev, [name]: { ...prev[name], ...patch } }))
  }
  const changeApiKey = (name: CloudAudioProviderName, value: string): void => {
    updateCloudProvider(name, { apiKey: value })
    void setCloudAudioKey(name, value.trim())
    setValidated((prev) => ({ ...prev, [name]: false }))
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
    const apiKey = cloudProviders[name].apiKey
    if (!apiKey.trim()) return
    setValidating((prev) => ({ ...prev, [name]: true }))
    void validateAudioProviderKey(name, apiKey)
      .then((result) => {
        setValidated((prev) => ({ ...prev, [name]: result.ok }))
        Alert.alert(
          result.ok
            ? t('Connected')
            : result.networkUnavailable
              ? t('No internet connection')
              : t('{{provider}} validation failed', { provider: AUDIO_PROVIDER_META[name].label }),
          result.message,
        )
      })
      .finally(() => setValidating((prev) => ({ ...prev, [name]: false })))
  }
  const clearKey = (name: CloudAudioProviderName): void => {
    updateCloudProvider(name, { apiKey: '' })
    void setCloudAudioKey(name, '')
    setValidated((prev) => ({ ...prev, [name]: false }))
  }

  const handleTest = (): void => {
    setTesting(true)
    speak(SAMPLE_TEXT, LANGUAGE)
    setTimeout(() => setTesting(false), 2000)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Card style={styles.providerCard}>
        <Text style={styles.fieldHint}>
          {t('Every speaker button in the app uses whichever engine is active below. Cloud providers are bring-your-own-key — nothing is sent until you tap a speaker icon.')}
        </Text>

        {AUDIO_PROVIDERS.map((name) => (
          <AudioProviderCard
            key={name}
            name={name}
            active={activeProvider === name}
            loaded={loaded}
            expanded={expandedProvider === name}
            onToggleExpanded={() => setExpandedProvider((prev) => (prev === name ? null : name))}
            onActivate={() => changeActiveProvider(name)}
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
                    state: cloudProviders[name as CloudAudioProviderName],
                    showKey: showKey[name as CloudAudioProviderName] ?? false,
                    validating: validating[name as CloudAudioProviderName] ?? false,
                    validated: validated[name as CloudAudioProviderName] ?? false,
                    onToggleShowKey: () =>
                      setShowKey((prev) => ({ ...prev, [name]: !prev[name as CloudAudioProviderName] })),
                    onChangeApiKey: (value) => changeApiKey(name as CloudAudioProviderName, value),
                    onChangeVoice: (value) => changeVoice(name as CloudAudioProviderName, value),
                    onChangeSpeed: (value) => changeSpeed(name as CloudAudioProviderName, value),
                    onValidate: () => validate(name as CloudAudioProviderName),
                    onClearKey: () => clearKey(name as CloudAudioProviderName),
                  }
                : undefined
            }
          />
        ))}
      </Card>

      <Button
        label={testing ? t('Playing…') : t('Test')}
        icon="volume-high"
        variant="secondary"
        onPress={handleTest}
        disabled={testing}
        style={styles.testButton}
      />
    </ScrollView>
  )
}

function AudioProviderCard(props: {
  name: AudioProviderName
  active: boolean
  loaded: boolean
  expanded: boolean
  onToggleExpanded: () => void
  onActivate: () => void
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
        onToggleShowKey: () => void
        onChangeApiKey: (value: string) => void
        onChangeVoice: (value: string) => void
        onChangeSpeed: (value: number) => void
        onValidate: () => void
        onClearKey: () => void
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

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>{t('Voice (German)')}</Text>
          {props.device.voicesLoading ? (
            <Spinner />
          ) : props.device.voices.length === 0 ? (
            <Text style={styles.hint}>{t('No German voices are installed on this device.')}</Text>
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
          <Text style={styles.hint}>
            {t("Voices come from the device's own text-to-speech engine — install more from your phone's system settings if you don't see the one you want.")}
          </Text>
        </View>
      ) : null}

      {expanded && props.cloud ? (
        <View style={styles.providerBody}>
          <View style={styles.keyInputWrap}>
            <TextInput
              testID={`audio-provider-key-input-${name}`}
              style={styles.keyInputWithIcon}
              placeholder={t('Paste your {{provider}} API key…', { provider: t(meta.label) })}
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
            {name === 'openai' ? t('Voice') : name === 'elevenlabs' ? t('Voice ID') : t('Model')}
          </Text>
          {name === 'openai' ? (
            <View style={styles.chipRow}>
              {OPENAI_TTS_VOICES.map((voice) => (
                <Chip
                  key={voice}
                  label={OPENAI_RECOMMENDED_VOICES.includes(voice) ? `${voice} ★` : voice}
                  selected={(props.cloud?.state.voice || 'marin') === voice}
                  onPress={() => props.cloud?.onChangeVoice(voice)}
                />
              ))}
            </View>
          ) : (
            <TextInput
              style={styles.keyInputWithIcon}
              placeholder={name === 'elevenlabs' ? t('e.g. 21m00Tcm4TlvDq8ikWAM') : t('e.g. aura-2-thalia-en')}
              placeholderTextColor={colors.textMuted}
              value={props.cloud.state.voice}
              onChangeText={props.cloud.onChangeVoice}
              autoCapitalize="none"
              autoCorrect={false}
            />
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
            <Text style={styles.hint}>{t('Speaking speed isn’t configurable for this provider yet.')}</Text>
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
        </View>
      ) : null}
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    providerCard: { gap: 0 },
    fieldHint: { fontSize: type.micro, color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm },
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
