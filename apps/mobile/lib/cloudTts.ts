import { logger } from '@lingora/observability'
import { createAudioPlayer, type AudioPlayer } from 'expo-audio'
import { File, Paths } from 'expo-file-system'
import { playCloudSpeech as playCloudSpeechShared, stopCloudSpeech as stopCloudSpeechShared, type AudioPlayback, type CloudAudioProviderName } from '@lingora/core'
import { recordCloudAudioUsage } from './ttsSettings'

const log = logger.child({ feature: 'app', component: 'cloudTts' })

// One in-flight player/file at a time — a second speaker-button tap while the first is still
// talking replaces it, same behavior lib/speech.ts's device-TTS path already has.
let activePlayer: AudioPlayer | null = null
let activeFile: File | null = null

function cleanupActive(): void {
  if (activePlayer) {
    activePlayer.remove()
    activePlayer = null
  }
  if (activeFile) {
    if (activeFile.exists) activeFile.delete()
    activeFile = null
  }
}

/** expo-audio's implementation of @lingora/core's AudioPlayback — its player only accepts a URI,
 * not raw bytes, so play() writes a temp file to the cache directory first (deleted on stop or
 * once playback finishes). The fetch-then-play-then-retry-once orchestration itself lives in
 * @lingora/core's playCloudSpeech, shared with the desktop app. */
const expoAudioPlayback: AudioPlayback = {
  play(bytes: Uint8Array, _mimeType: string): Promise<void> {
    cleanupActive()
    const file = new File(Paths.cache, `lingora-tts-${Date.now()}.mp3`)
    file.create()
    file.write(bytes)
    activeFile = file

    const player = createAudioPlayer(file.uri)
    activePlayer = player
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) cleanupActive()
    })
    player.play()
    return Promise.resolve()
  },
  stop(): void {
    cleanupActive()
  },
}

/** Fetches speech audio from `provider` and plays it — the cloud-TTS half of lib/speech.ts#speak().
 * Delegates the fetch-then-play-then-retry-once orchestration to @lingora/core's playCloudSpeech;
 * this wrapper only supplies the expo-audio playback and logs a failure after the shared retry is
 * exhausted. */
export async function playCloudSpeech(provider: CloudAudioProviderName, text: string, apiKey: string, voice: string, speed?: number, model?: string): Promise<void> {
  try {
    await playCloudSpeechShared(expoAudioPlayback, provider, text, apiKey, voice, speed, undefined, model)
    // Device-observed only (see AUDIO_USAGE_STORE_KEYS' doc comment) — a real synthesis call
    // succeeded, so it counts even though this device can't see the provider's own billing meter.
    void recordCloudAudioUsage(provider, text.length).catch(() => undefined)
  } catch (error) {
    log.warn('app.cloud_speech_playback_failed', {
      message: 'Cloud TTS audio failed to start playing after retry',
      metadata: { provider, retryCount: 1 },
    })
    throw error
  }
}

export function stopCloudSpeech(): void {
  stopCloudSpeechShared(expoAudioPlayback)
}
