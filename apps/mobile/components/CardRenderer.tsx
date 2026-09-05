import type { JSX } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import WebView, { type WebViewMessageEvent } from 'react-native-webview'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

// Template CSS sizes everything in `rem`, relative to the document's root font size - which
// itself follows the system accessibility font-size setting (unset here, so the WebView's own
// default applies). At a large system font size that can render taller than this WebView's fixed
// RN-assigned box, and since the WebView doesn't scroll (`scrollEnabled={false}` - deliberately,
// see below), the excess used to be silently invisible. Rather than growing the box (tried,
// reverted - conflicts with the review screen's swipe-to-rate gesture, which needs a fixed,
// non-scrolling surface) or freezing card text at a fixed size (defeats the point of a system
// font-size setting for what's often the most important text on the screen), this shrinks the
// root font size step by step, purely inside the WebView's own DOM, until the content fits the
// space it's actually been given - text still grows with system settings, up to whatever the
// available card space can hold, instead of overflowing past it unseen. Never shrinks below
// the un-scaled design baseline (16px), so this only ever gives back growth the space couldn't
// fit - it never makes a card smaller than a non-accessibility user would see.
const SHRINK_TO_FIT_SCRIPT = `
(function () {
  function fitContent() {
    var docEl = document.documentElement;
    var minFontSize = 16;
    var available = window.innerHeight;
    var currentSize = parseFloat(getComputedStyle(docEl).fontSize) || minFontSize;
    var guard = 0;
    while (docEl.scrollHeight > available && currentSize > minFontSize && guard < 40) {
      currentSize = Math.max(minFontSize, currentSize - 1);
      docEl.style.fontSize = currentSize + 'px';
      guard++;
    }
  }
  if (document.readyState === 'complete') {
    fitContent();
  } else {
    window.addEventListener('load', fitContent);
  }
  true;
})();
`

/**
 * Renders one rendered card side (already-built HTML string from
 * `lib/templates.ts#renderCardHtml`) inside a WebView, so `Template.styles`
 * CSS actually applies — used by both the review session and the template
 * editor's live preview, so what an editor sees while editing is exactly
 * what the review session renders.
 *
 * `onMessage` is an optional bridge for template-embedded interactive elements. Pronunciation
 * controls intentionally remain native UI outside templates so their icon, accessibility, and
 * behavior stay consistent regardless of the user's card HTML/CSS.
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
        injectedJavaScript={SHRINK_TO_FIT_SCRIPT}
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
