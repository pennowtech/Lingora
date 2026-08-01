import type { LanguageCode } from '@lingora/types'
import { VoiceQuality, type Voice } from 'expo-speech'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button, Card, Chip, Dropdown, SectionHeader, Spinner } from '../../components/ui'
import {
  AUDIO_PROVIDERS,
  AUDIO_PROVIDER_META,
  CLOUD_AUDIO_PROVIDERS,
  OPENAI_RECOMMENDED_VOICES,
  OPENAI_TTS_VOICES,
  type AudioProviderName,
  type CloudAudioProviderName,
} from '../../lib/audioProviderMeta'
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
  setCloudAudioVoice,
  setTtsPitch,
  setTtsRate,
  setTtsVoice,
} from '../../lib/ttsSettings'
import { colors, radius, spacing, type } from '../../lib/theme'

const RATE_OPTIONS = [0.75, 1.0, 1.25, 1.5]
const PITCH_OPTIONS = [0.75, 1.0, 1.25, 1.5]

/** German is the target language everything is actually pronounced in — the one voice/rate/pitch setting worth exposing per v1. */
const LANGUAGE: LanguageCode = 'de'
const SAMPLE_TEXT = 'Ich habe viel über die Kultur erfahren.'

/**
 * Audio Settings: which engine speaks (device or a cloud TTS provider — see
 * lib/audioProviderMeta.ts, lib/cloudTts.ts) plus rate/pitch/voice for the
 * device engine. The provider choice is a single app-wide setting — every
 * speaker button reads it through lib/speech.ts#speak(), so switching it
 * here changes pronunciation everywhere uniformly rather than per screen.
 */
export default function AudioSettingsScreen(): JSX.Element {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [testing, setTesting] = useState(false)

  const providerQuery = useQuery({ queryKey: ['audio-provider'], queryFn: getAudioProvider })
  const settingsQuery = useQuery({
    queryKey: ['tts-settings', LANGUAGE],
    queryFn: () => getTtsSettings(LANGUAGE),
  })
  const voicesQuery = useQuery({
    queryKey: ['tts-voices', LANGUAGE],
    queryFn: () => getAvailableVoices(LANGUAGE),
  })
  const cloudConfigsQuery = useQuery({
    queryKey: ['cloud-audio-configs'],
    queryFn: async () => {
      const entries = await Promise.all(CLOUD_AUDIO_PROVIDERS.map(async (name) => [name, await getCloudAudioConfig(name)] as const))
      return Object.fromEntries(entries) as Record<CloudAudioProviderName, { apiKey: string; voice: string }>
    },
  })

  const provider = providerQuery.data ?? 'device'
  const settings = settingsQuery.data ?? { rate: DEFAULT_TTS_RATE, pitch: DEFAULT_TTS_PITCH, voice: null }
  const voices: Voice[] = voicesQuery.data ?? []
  const cloudConfigs = cloudConfigsQuery.data

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['tts-settings', LANGUAGE] })
  }

  const handleProvider = (next: AudioProviderName): void => {
    setAudioProvider(next)
      .then(() => queryClient.invalidateQueries({ queryKey: ['audio-provider'] }))
      .catch(() => undefined)
  }
  const handleRate = (rate: number): void => {
    setTtsRate(rate)
      .then(refresh)
      .catch(() => undefined)
  }
  const handlePitch = (pitch: number): void => {
    setTtsPitch(pitch)
      .then(refresh)
      .catch(() => undefined)
  }
  const handleVoice = (voiceId: string | null): void => {
    setTtsVoice(LANGUAGE, voiceId)
      .then(refresh)
      .catch(() => undefined)
  }
  const handleCloudKey = (name: CloudAudioProviderName, apiKey: string): void => {
    queryClient.setQueryData(['cloud-audio-configs'], (prev: typeof cloudConfigs) =>
      prev ? { ...prev, [name]: { ...prev[name], apiKey } } : prev,
    )
    setCloudAudioKey(name, apiKey.trim()).catch(() => undefined)
  }
  const handleCloudVoice = (name: CloudAudioProviderName, voice: string): void => {
    queryClient.setQueryData(['cloud-audio-configs'], (prev: typeof cloudConfigs) =>
      prev ? { ...prev, [name]: { ...prev[name], voice } } : prev,
    )
    setCloudAudioVoice(name, voice.trim()).catch(() => undefined)
  }

  const handleTest = (): void => {
    setTesting(true)
    speak(SAMPLE_TEXT, LANGUAGE)
    setTimeout(() => setTesting(false), 2000)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <SectionHeader title={t('Speech engine')} />
      <Card>
        <View style={styles.chipRow}>
          {AUDIO_PROVIDERS.map((name) => (
            <Chip key={name} label={AUDIO_PROVIDER_META[name].label} selected={provider === name} onPress={() => handleProvider(name)} />
          ))}
        </View>
        <Text style={styles.hint}>{t(AUDIO_PROVIDER_META[provider].description)}</Text>
      </Card>

      {CLOUD_AUDIO_PROVIDERS.includes(provider as CloudAudioProviderName) ? (
        <CloudProviderConfig
          provider={provider as CloudAudioProviderName}
          config={cloudConfigs?.[provider as CloudAudioProviderName] ?? { apiKey: '', voice: '' }}
          onChangeKey={(value) => handleCloudKey(provider as CloudAudioProviderName, value)}
          onChangeVoice={(value) => handleCloudVoice(provider as CloudAudioProviderName, value)}
        />
      ) : (
        <>
          <SectionHeader title={t('Speaking rate')} />
          <Card>
            <View style={styles.chipRow}>
              {RATE_OPTIONS.map((rate) => (
                <Chip key={rate} label={`${rate}×`} selected={settings.rate === rate} onPress={() => handleRate(rate)} />
              ))}
            </View>
          </Card>

          <SectionHeader title={t('Pitch')} />
          <Card>
            <View style={styles.chipRow}>
              {PITCH_OPTIONS.map((pitch) => (
                <Chip
                  key={pitch}
                  label={pitch === 1.0 ? t('Normal') : `${pitch}×`}
                  selected={settings.pitch === pitch}
                  onPress={() => handlePitch(pitch)}
                />
              ))}
            </View>
          </Card>

          <SectionHeader title={t('Voice (German)')} />
          <Card>
            {voicesQuery.isPending ? (
              <Spinner />
            ) : voices.length === 0 ? (
              <Text style={styles.hint}>{t('No German voices are installed on this device.')}</Text>
            ) : (
              <Dropdown
                placeholder={t('Device default')}
                clearable
                value={settings.voice}
                onChange={handleVoice}
                options={voices.map((v) => ({ label: `${v.name}${v.quality === VoiceQuality.Enhanced ? ` (${t('Enhanced')})` : ''}`, value: v.identifier }))}
              />
            )}
            <Text style={styles.hint}>
              {t("Voices come from the device's own text-to-speech engine — install more from your phone's system settings if you don't see the one you want.")}
            </Text>
          </Card>
        </>
      )}

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

function CloudProviderConfig(props: {
  provider: CloudAudioProviderName
  config: { apiKey: string; voice: string }
  onChangeKey: (value: string) => void
  onChangeVoice: (value: string) => void
}): JSX.Element {
  const { t } = useTranslation()
  const { provider, config } = props
  const meta = AUDIO_PROVIDER_META[provider]

  return (
    <>
      <SectionHeader title={t('{{provider}} API key', { provider: meta.label })} />
      <Card>
        <TextInput
          style={styles.input}
          placeholder={t('Paste your {{provider}} API key…', { provider: meta.label })}
          placeholderTextColor={colors.textMuted}
          value={config.apiKey}
          onChangeText={props.onChangeKey}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Card>

      <SectionHeader title={provider === 'openai' ? t('Voice') : provider === 'elevenlabs' ? t('Voice ID') : t('Model')} />
      <Card>
        {provider === 'openai' ? (
          <View style={styles.chipRow}>
            {OPENAI_TTS_VOICES.map((voice) => (
              <Chip
                key={voice}
                label={OPENAI_RECOMMENDED_VOICES.includes(voice) ? `${voice} ★` : voice}
                selected={(config.voice || 'marin') === voice}
                onPress={() => props.onChangeVoice(voice)}
              />
            ))}
          </View>
        ) : (
          <TextInput
            style={styles.input}
            placeholder={provider === 'elevenlabs' ? t('e.g. 21m00Tcm4TlvDq8ikWAM') : t('e.g. aura-2-thalia-en')}
            placeholderTextColor={colors.textMuted}
            value={config.voice}
            onChangeText={props.onChangeVoice}
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
        <Text style={styles.hint}>{t(meta.description)}</Text>
      </Card>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hint: { fontSize: type.micro, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: type.caption,
    color: colors.text,
    backgroundColor: colors.background,
  },
  testButton: { marginTop: spacing.md },
})
