import type { CaptureSource } from '@lingora/types'
import { createMineEntry } from '@lingora/database'
import { logger } from '@lingora/observability'
import { useQueryClient } from '@tanstack/react-query'
import * as Linking from 'expo-linking'
import { useCallback, useEffect, useRef, useState, type JSX } from 'react'
import { useShareIntentContext } from 'expo-share-intent'
import { CaptureChooserSheet } from './CaptureChooserSheet'
import { addProcessTextListener, getInitialProcessText } from '../modules/process-text-intent'
import { getCaptureDestination } from '../lib/captureIntent'
import { useServices } from '../lib/services'

const log = logger.child({ feature: 'app', component: 'CaptureIntentHandler' })

/**
 * Navigates by building a real `lingora://` deep link and opening it, rather than calling
 * `router.push` directly — a cold app launch driven by an external intent (Process Text or share)
 * can win the race against the root navigator's own first mount, and an imperative `router.push`
 * in that window either throws ("Attempted to navigate before mounting the Root Layout") or, seen
 * once on-device, dispatches a malformed nested action nothing handles ("Do you have a route named
 * '__root'?"). `Linking.openURL` goes through Expo Router's own deep-link resolution instead — the
 * same well-tested path a real `lingora://...` link from outside the app already uses — so it's
 * correct however early it fires, cold start or not. Callers are still responsible for not calling
 * this after the component has unmounted (see `isMountedRef` below) — a share intent can make the
 * whole root remount mid-session (Android restarts the activity when it isn't the task root), and
 * this alone doesn't protect against navigating into a root that's already torn down.
 */
function openInApp(path: string, queryParams: Record<string, string>): void {
  const url = Linking.createURL(path, { queryParams })
  Linking.openURL(url).catch((error: unknown) => {
    log.error('app.capture_navigation_failed', error, { message: 'Failed to open captured text in-app' })
  })
}

/**
 * Headless — routes text captured from outside the app to wherever the user's capture-destination
 * setting (Settings > General > "Add to Lingora", see `lib/captureIntent.ts`) says it should go,
 * and renders the "Quick-add chooser" sheet when that's the active setting. Two independent
 * capture sources feed into the same `handleCapture`:
 *  - Android's "Process Text" selection-toolbar entry (`modules/process-text-intent`) — usually a
 *    single selected word.
 *  - The standard share sheet (`expo-share-intent`, wired up via `ShareIntentProvider` at the very
 *    root of app/_layout.tsx) — usually a whole sentence or paragraph.
 * Mounted once inside AppStack, alongside the other headless lifecycle components (see
 * CloudSyncLifecycle) — needs `useServices()` for the database, so it has to live inside
 * ServicesProvider, not at the true root next to ShareIntentProvider itself.
 */
export function CaptureIntentHandler(): JSX.Element | null {
  const { db } = useServices()
  const queryClient = useQueryClient()
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext()
  const [chooser, setChooser] = useState<{ text: string; source: CaptureSource } | null>(null)

  // Guards two real races, both confirmed on-device:
  //  - A share intent can make Lingora's activity non-task-root, and expo-share-intent's own
  //    native side reacts by restarting the activity (new task, finish the old one) — see its
  //    handleShareIntent — so this component can unmount mid-flight, between the `await`s below and
  //    the eventual openInApp call, while a stale continuation from the dying instance is still
  //    running. Navigating from a torn-down root throws the same "Root Layout" assertion as the
  //    cold-start race openInApp's own doc comment describes.
  //  - shareIntent's object identity isn't guaranteed stable across renders even when its `.text`
  //    hasn't changed, so the effect below could in principle re-fire for the same capture more
  //    than once before resetShareIntent's state update lands.
  const isMountedRef = useRef(true)
  useEffect(
    () => () => {
      isMountedRef.current = false
    },
    [],
  )
  const lastHandledShareText = useRef<string | null>(null)

  const addToMining = useCallback(
    async (text: string, source: CaptureSource) => {
      await createMineEntry(db, {
        id: crypto.randomUUID(),
        rawText: text,
        sourceType: source,
        status: 'pending',
        capturedAt: Date.now(),
        processed: false,
      })
      // The bottom tab bar's Mine badge and the Mine screen itself both read this same query key
      // (see BottomTabBar.tsx / app/(tabs)/mine.tsx) — without invalidating it, a query mounted
      // earlier (the badge, always present) keeps serving its pre-capture snapshot for the rest of
      // its staleTime, and the freshly-written entry doesn't show up even on a brand-new mount of
      // the Mine screen itself, since it reads the same cached result rather than the database.
      await queryClient.invalidateQueries({ queryKey: ['mine-queue'] })
      if (isMountedRef.current) openInApp('/mine', {})
    },
    [db, queryClient],
  )

  const handleCapture = useCallback(
    async (rawText: string, source: CaptureSource) => {
      const text = rawText.trim()
      if (!text) return
      log.info('app.capture_intent_received', {
        message: 'Text captured from outside the app',
        metadata: { settingKey: source },
      })
      const destination = await getCaptureDestination()
      if (!isMountedRef.current) return
      if (destination === 'chooser') {
        setChooser({ text, source })
        return
      }
      // 'search' always goes to Search; 'split' also goes to Search for a Process Text capture
      // (usually one word) and only falls through to the mining queue for a share (usually a
      // whole sentence) — see lib/captureIntent.ts's CaptureDestination doc comment.
      const goToSearch = destination === 'search' || source === 'process_text'
      if (goToSearch) {
        openInApp('/search', { q: text })
        return
      }
      await addToMining(text, source)
    },
    [addToMining],
  )

  // Process Text: cold-start (app launched by the intent) + already-running (live listener).
  useEffect(() => {
    let cancelled = false
    getInitialProcessText()
      .then((text) => {
        if (!cancelled && text) void handleCapture(text, 'process_text')
      })
      .catch((error: unknown) => {
        log.error('app.process_text_initial_failed', error, { message: 'Failed to read initial Process Text intent' })
      })
    const unsubscribe = addProcessTextListener((text) => void handleCapture(text, 'process_text'))
    return () => {
      cancelled = true
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleCapture's identity is stable enough (deps: addToMining -> db) for a mount-once listener
  }, [])

  // Share sheet: expo-share-intent already handles cold-start vs. already-running internally.
  useEffect(() => {
    if (hasShareIntent && shareIntent.text && shareIntent.text !== lastHandledShareText.current) {
      lastHandledShareText.current = shareIntent.text
      void handleCapture(shareIntent.text, 'share_sheet')
      resetShareIntent()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetShareIntent/handleCapture are re-created per render by their own hooks; only hasShareIntent/shareIntent.text should re-trigger this
  }, [hasShareIntent, shareIntent.text])

  if (!chooser) return null

  return (
    <CaptureChooserSheet
      visible
      text={chooser.text}
      onSearch={() => {
        openInApp('/search', { q: chooser.text })
        setChooser(null)
      }}
      onAddToMining={() => {
        void addToMining(chooser.text, chooser.source)
        setChooser(null)
      }}
      onClose={() => setChooser(null)}
    />
  )
}
