import type { JSX } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import WebView, { type WebViewMessageEvent } from 'react-native-webview'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

/**
 * Renders one rendered card side (already-built HTML string from
 * `lib/templates.ts#renderCardHtml`) inside a WebView, so `Template.styles`
 * CSS actually applies — used by both the review session and the template
 * editor's live preview, so what an editor sees while editing is exactly
 * what the review session renders.
 *
 * `onMessage` is the bridge back out of the WebView for template-embedded
 * interactive elements (currently just the speaker button baked into
 * DEFAULT_BACK_TEMPLATE/CLOZE_BACK_TEMPLATE, which calls
 * `window.ReactNativeWebView.postMessage('speak')` on tap) — a plain
 * string payload, not JSON, since there's only ever been one message kind
 * so far. The template editor's own preview doesn't pass this prop, so
 * tapping the speaker there is a harmless no-op.
 */
export function CardRenderer(props: {
  html: string
  style?: object
  onMessage?: (data: string) => void
}): JSX.Element {
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  return (
    <View style={[styles.container, props.style]}>
      <WebView
        source={{ html: props.html }}
        style={styles.webview}
        scrollEnabled={false}
        originWhitelist={['*']}
        startInLoadingState
        {...(props.onMessage && { onMessage: (e: WebViewMessageEvent) => props.onMessage?.(e.nativeEvent.data) })}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      />
    </View>
  )
}

const createStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    webview: { flex: 1, backgroundColor: 'transparent' },
    loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  })
