import type { LanguageCode } from '@lingora/types'
import { VoiceQuality, type Voice } from 'expo-speech'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type JSX } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button, Card, Chip, Dropdown, SectionHeader, Spinner } from '../../components/ui'
import { speak } from '../../lib/speech'
import {
  DEFAULT_TTS_PITCH,
  DEFAULT_TTS_RATE,
  getAvailableVoices,
  getTtsSettings,
  setTtsPitch,
  setTtsRate,
  setTtsVoice,
} from '../../lib/ttsSettings'
import { colors, spacing, type } from '../../lib/theme'

const RATE_OPTIONS = [0.75, 1.0, 1.25, 1.5]
const PITCH_OPTIONS = [0.75, 1.0, 1.25, 1.5]

/** German is the target language everything is actually pronounced in — the one voice/rate/pitch setting worth exposing per v1. */
const LANGUAGE: LanguageCode = 'de'
const SAMPLE_TEXT = 'Ich habe viel über die Kultur erfahren.'

/**
 * Pronunciation settings: rate, pitch, and voice for the device's built-in
 * TTS (see lib/speech.ts, lib/ttsSettings.ts). Every speaker button in the
 * app (word detail, review session) reads these at speak-time.
 */
export default function TtsSettingsScreen(): JSX.Element {
  const queryClient = useQueryClient()
  const [testing, setTesting] = useState(false)

  const settingsQuery = useQuery({
    queryKey: ['tts-settings', LANGUAGE],
    queryFn: () => getTtsSettings(LANGUAGE),
  })
  const voicesQuery = useQuery({
    queryKey: ['tts-voices', LANGUAGE],
    queryFn: () => getAvailableVoices(LANGUAGE),
  })

  const settings = settingsQuery.data ?? { rate: DEFAULT_TTS_RATE, pitch: DEFAULT_TTS_PITCH, voice: null }
  const voices: Voice[] = voicesQuery.data ?? []

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['tts-settings', LANGUAGE] })
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

  const handleTest = (): void => {
    setTesting(true)
    speak(SAMPLE_TEXT, LANGUAGE)
    setTimeout(() => setTesting(false), 2000)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <SectionHeader title="Speaking rate" />
      <Card>
        <View style={styles.chipRow}>
          {RATE_OPTIONS.map((rate) => (
            <Chip
              key={rate}
              label={`${rate}×`}
              selected={settings.rate === rate}
              onPress={() => handleRate(rate)}
            />
          ))}
        </View>
      </Card>

      <SectionHeader title="Pitch" />
      <Card>
        <View style={styles.chipRow}>
          {PITCH_OPTIONS.map((pitch) => (
            <Chip
              key={pitch}
              label={pitch === 1.0 ? 'Normal' : `${pitch}×`}
              selected={settings.pitch === pitch}
              onPress={() => handlePitch(pitch)}
            />
          ))}
        </View>
      </Card>

      <SectionHeader title="Voice (German)" />
      <Card>
        {voicesQuery.isPending ? (
          <Spinner />
        ) : voices.length === 0 ? (
          <Text style={styles.hint}>No German voices are installed on this device.</Text>
        ) : (
          <Dropdown
            placeholder="Device default"
            clearable
            value={settings.voice}
            onChange={handleVoice}
            options={voices.map((v) => ({ label: `${v.name}${v.quality === VoiceQuality.Enhanced ? ' (Enhanced)' : ''}`, value: v.identifier }))}
          />
        )}
        <Text style={styles.hint}>
          Voices come from the device's own text-to-speech engine — install more from your phone's
          system settings if you don't see the one you want.
        </Text>
      </Card>

      <Button
        label={testing ? 'Playing…' : 'Test'}
        icon="volume-high"
        variant="secondary"
        onPress={handleTest}
        disabled={testing}
        style={styles.testButton}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hint: { fontSize: type.micro, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 16 },
  testButton: { marginTop: spacing.md },
})
