import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { WebView } from 'react-native-webview'
import * as ScreenOrientation from 'expo-screen-orientation'
import { DEFAULT_HELP_VIDEO_ID, extractYouTubeVideoId, sanitizeVideoTitle } from '@lingora/core'
import { Icon } from './Icon'
import { IconButton } from './ui'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

interface HelpVideoPlayerModalProps {
  visible: boolean
  onClose: () => void
  videoId?: string
  title?: string
}

export function HelpVideoPlayerModal({
  visible,
  onClose,
  videoId = DEFAULT_HELP_VIDEO_ID,
  title,
}: HelpVideoPlayerModalProps): JSX.Element {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)
  const colors = useColors()
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const controlsOpacity = useRef(new Animated.Value(1)).current
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Animated.Value has no JS-readable "current value" - this parallel boolean is what actually
  // gates the tap-to-reveal layer below (rendered only once truly faded out), and is the missing
  // half of the reveal mechanism: flashControls() existed before but was never called from
  // anywhere, so once the controls faded there was no way to bring them back except knowing to
  // tap the exact ~36x36 corner icon at 15% opacity - reported as "min/close not working".
  const [controlsVisible, setControlsVisible] = useState(true)

  const cleanId = extractYouTubeVideoId(videoId) ?? DEFAULT_HELP_VIDEO_ID
  const displayTitle = sanitizeVideoTitle(title)

  const scheduleHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      Animated.timing(controlsOpacity, {
        toValue: 0.35,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setControlsVisible(false))
    }, 3000)
  }

  const flashControls = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setControlsVisible(true)
    Animated.timing(controlsOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start()
    scheduleHide()
  }

  // Lock/unlock orientation
  useEffect(() => {
    if (!visible) {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
      setFullscreen(false)
      return
    }
    if (fullscreen) {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
      // Show controls briefly when entering fullscreen
      setControlsVisible(true)
      Animated.timing(controlsOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start()
      scheduleHide()
    } else {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      setControlsVisible(true)
      Animated.timing(controlsOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen, visible])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  const handleClose = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
    setFullscreen(false)
    onClose()
  }

  const iframeHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; background-color: #000000; }
          html, body { width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center; }
          iframe { width: 100%; height: 100%; border: 0; }
        </style>
      </head>
      <body>
        <iframe
          src="https://www.youtube-nocookie.com/embed/${cleanId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&controls=1&enablejsapi=1&fs=0"
          title="Video Player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
      </body>
    </html>
  `

  if (fullscreen) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent={false}
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        {/* Black canvas — plain View so WebView can receive touches */}
        <View style={styles.fullscreenCanvas}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>{t('Loading video...')}</Text>
            </View>
          )}

          <WebView
            style={styles.webview}
            originWhitelist={['*']}
            // baseUrl gives the WebView a real https:// origin instead of the null/about:blank
            // one it has when loading a raw HTML string with none set - YouTube's embedded
            // player validates the embedding page's origin before it'll play, and a null origin
            // gets rejected with "Video player configuration error" (YouTube error 153), even
            // though the video plays fine everywhere else (the real app, a browser tab) since
            // those always have a real origin. Any real https:// origin satisfies the check;
            // youtube.com's own domain is the safest choice since it's unambiguously allowed.
            source={{ html: iframeHtml, baseUrl: 'https://www.youtube.com' }}
            allowsFullscreenVideo={false}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            onLoadEnd={() => setLoading(false)}
          />

          {/*
           * Tap-to-reveal: only mounted once the floating controls have actually faded out, so it
           * never intercepts a tap meant for YouTube's own in-iframe controls (preferred for real
           * playback - see WebView's controls=1 above) while ours are already visible. The one tap
           * that reveals them is "spent" on that alone, same as YouTube's own app behavior, rather
           * than also reaching the iframe underneath.
           */}
          {!controlsVisible ? <Pressable style={StyleSheet.absoluteFill} onPress={flashControls} /> : null}

          {/*
           * Floating controls — pointerEvents="box-none" means the View itself
           * is invisible to touches but its children (buttons) receive them fine.
           * This lets the WebView underneath stay interactive.
           */}
          <Animated.View
            style={[styles.floatingControls, { opacity: controlsOpacity }]}
            pointerEvents="box-none"
          >
            {/* ⊟  Minimize → exit fullscreen, return to portrait card */}
            <TouchableOpacity
              style={styles.ytBtn}
              onPress={() => { setFullscreen(false) }}
              activeOpacity={0.7}
            >
              <Icon name="Minimize2" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.ytDivider} />

            {/* ✕  Close → close player entirely */}
            <TouchableOpacity
              style={styles.ytBtn}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Icon name="X" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    )
  }

  // ── Portrait / card mode ────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.titleText} numberOfLines={1}>
              {displayTitle}
            </Text>
            <View style={styles.headerActions}>
              {/* YouTube-style fullscreen button */}
              <TouchableOpacity
                style={styles.ytBtnDark}
                onPress={() => setFullscreen(true)}
                activeOpacity={0.7}
              >
                <Icon name="Maximize2" size={16} color={colors.text} />
              </TouchableOpacity>
              <IconButton icon="X" onPress={handleClose} />
            </View>
          </View>

          {/* Player */}
          <View style={styles.playerContainer}>
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>{t('Loading video...')}</Text>
              </View>
            )}
            <WebView
              style={styles.webview}
              originWhitelist={['*']}
              // baseUrl gives the WebView a real https:// origin instead of the null/about:blank
            // one it has when loading a raw HTML string with none set - YouTube's embedded
            // player validates the embedding page's origin before it'll play, and a null origin
            // gets rejected with "Video player configuration error" (YouTube error 153), even
            // though the video plays fine everywhere else (the real app, a browser tab) since
            // those always have a real origin. Any real https:// origin satisfies the check;
            // youtube.com's own domain is the safest choice since it's unambiguously allowed.
            source={{ html: iframeHtml, baseUrl: 'https://www.youtube.com' }}
              allowsFullscreenVideo={false}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
              onLoadEnd={() => setLoading(false)}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    // ── Portrait card ─────────────────────────────────────
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'center',
      padding: spacing.md,
    },
    container: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    titleText: {
      fontSize: type.body,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      marginRight: spacing.sm,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    // YouTube-style button for portrait header
    ytBtnDark: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playerContainer: {
      width: '100%',
      aspectRatio: 16 / 9,
      backgroundColor: '#000000',
      position: 'relative',
    },

    // ── Fullscreen ────────────────────────────────────────
    fullscreenCanvas: {
      flex: 1,
      backgroundColor: '#000000',
    },
    // Floating pill (top-right) — YouTube-style dark pill with icon buttons
    floatingControls: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.65)',
      borderRadius: 10,
      paddingHorizontal: 4,
      paddingVertical: 4,
      gap: 2,
    },
    ytBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ytDivider: {
      width: 1,
      height: 20,
      backgroundColor: 'rgba(255,255,255,0.25)',
    },

    // ── Shared ────────────────────────────────────────────
    webview: {
      flex: 1,
      backgroundColor: '#000000',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000000',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      zIndex: 10,
    },
    loadingText: {
      fontSize: type.caption,
      color: '#FFFFFF',
      fontWeight: '600',
    },
  })
