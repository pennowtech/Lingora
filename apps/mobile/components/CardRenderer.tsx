import type { JSX } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import WebView from 'react-native-webview'
import { colors } from '../lib/theme'

/**
 * Renders one rendered card side (already-built HTML string from
 * `lib/templates.ts#renderCardHtml`) inside a WebView, so `Template.styles`
 * CSS actually applies — used by both the review session and the template
 * editor's live preview, so what an editor sees while editing is exactly
 * what the review session renders.
 */
export function CardRenderer(props: { html: string; style?: object }): JSX.Element {
  return (
    <View style={[styles.container, props.style]}>
      <WebView
        source={{ html: props.html }}
        style={styles.webview}
        scrollEnabled={false}
        originWhitelist={['*']}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
})
