import { logger } from '@lingora/observability'
import { createAudioPlayer, type AudioPlayer } from 'expo-audio'
import { File, Paths } from 'expo-file-system'
import type { CloudAudioProviderName } from './audioProviderMeta'
import { synthesizeSpeech } from './cloudTtsProviders'

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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function synthesizeAndPlay(provider: CloudAudioProviderName, text: string, apiKey: string, voice: string, speed?: number): Promise<void> {
  cleanupActive()
  const bytes = await synthesizeSpeech(provider, { text, apiKey, voice, ...(speed !== undefined && { speed }) })
  const file = new File(Paths.cache, `lingora-tts-${Date.now()}.mp3`)
  file.create()
  file.write(new Uint8Array(bytes))
  activeFile = file

  const player = createAudioPlayer(file.uri)
  activePlayer = player
  player.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) cleanupActive()
  })
  player.play()
}

/** Fetches speech audio from `provider` and plays it — the cloud-TTS half of lib/speech.ts#speak().
 * Writes the response to a temp file in the cache directory (expo-audio needs a URI, not raw
 * bytes) and deletes it once playback finishes.
 *
 * Retries once on failure (same convention as lib/speech.ts's device-TTS retry): observed in
 * practice as an occasional first-attempt-only failure right after switching a cloud provider's
 * voice, symptom consistent with expo-audio's native player still finishing its async load of the
 * freshly-written file when play() is called — a transient race, not a real synthesis/key problem,
 * so silently retrying once is more useful than surfacing it as an error. */
export async function playCloudSpeech(
  provider: CloudAudioProviderName,
  text: string,
  apiKey: string,
  voice: string,
  speed?: number,
): Promise<void> {
  try {
    await synthesizeAndPlay(provider, text, apiKey, voice, speed)
  } catch (error) {
    log.warn('app.cloud_speech_playback_failed', {
      message: 'Cloud TTS audio failed to start playing, retrying once',
      metadata: { provider },
    })
    cleanupActive()
    await wait(250)
    try {
      await synthesizeAndPlay(provider, text, apiKey, voice, speed)
    } catch (retryError) {
      log.warn('app.cloud_speech_playback_failed', {
        message: 'Cloud TTS audio failed to start playing on retry',
        metadata: { provider, retryCount: 1 },
      })
      cleanupActive()
      throw retryError
    }
  }
}

export function stopCloudSpeech(): void {
  cleanupActive()
}
