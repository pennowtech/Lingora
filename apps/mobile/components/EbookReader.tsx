import { Ionicons } from '@expo/vector-icons'
import { Asset } from 'expo-asset'
import { readAsStringAsync, EncodingType } from 'expo-file-system'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import epubjsBundle from '../assets/epubjs/epub.min.js.txt'
import jszipBundle from '../assets/epubjs/jszip.min.js.txt'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

export interface TocItem {
  id: string
  href: string
  label: string
  subitems?: TocItem[]
}

export interface EbookReaderProps {
  filePath: string
  initialCfi?: string | null
  fontSize?: number
  theme?: 'light' | 'sepia' | 'dark'
  onTocLoaded?: (toc: TocItem[]) => void
  onProgressChange?: (cfi: string, percent: number, chapterName?: string) => void
  onWordSelected?: (word: string, contextSentence?: string) => void
  onParagraphTap?: (paragraphText: string) => void
}

/** Imperative controls the reader/[id].tsx screen drives from outside the WebView — jumping to a
 * TOC entry, and injecting a translation into the DOM right under the paragraph that produced it
 * (see the WebView-side window.injectInlineTranslation in readerHtml below, which does the actual
 * DOM mutation). A ref rather than props because both are one-shot commands, not state the
 * component itself needs to render around. */
export interface EbookReaderHandle {
  jumpTo: (cfiOrHref: string) => void
  injectInlineTranslation: (paragraphText: string, translation: string) => void
}

/** A vendored bundle's own source could (in principle) contain the literal text `</script>`,
 * which would prematurely close the inline <script> tag it's embedded in and break the page —
 * neither vendored file does today, but this is cheap insurance against a future version change. */
function escapeForInlineScript(source: string): string {
  return source.replace(/<\/script/gi, '<\\/script')
}

export const EbookReader = forwardRef<EbookReaderHandle, EbookReaderProps>(function EbookReader(props, ref) {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const webViewRef = useRef<WebView>(null)
  const [base64Data, setBase64Data] = useState<string | null>(null)
  const [engineScripts, setEngineScripts] = useState<{ jszip: string; epub: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function loadFile() {
      try {
        setLoading(true)
        setError(null)
        const fileUri = props.filePath.startsWith('file://') ? props.filePath : `file://${props.filePath}`
        const content = await readAsStringAsync(fileUri, {
          encoding: EncodingType.Base64,
        })
        if (active) {
          setBase64Data(content)
        }
      } catch (err: unknown) {
        if (active) {
          setError(String(err))
          setLoading(false)
        }
      }
    }
    void loadFile()
    return () => {
      active = false
    }
  }, [props.filePath])

  // Vendored engine bundles (epub.js needs a JSZip global at parse time, plus its own engine —
  // see assets/epubjs/README.md for exactly what's vendored and why, vs. the old CDN <script
  // src>) only need loading once per app session, not per book — they don't depend on
  // props.filePath the way the book's own content does above.
  useEffect(() => {
    let active = true
    async function loadEngine() {
      try {
        const [jszipAsset, epubAsset] = await Promise.all([
          Asset.fromModule(jszipBundle).downloadAsync(),
          Asset.fromModule(epubjsBundle).downloadAsync(),
        ])
        const [jszipSource, epubSource] = await Promise.all([
          readAsStringAsync(jszipAsset.localUri ?? jszipAsset.uri),
          readAsStringAsync(epubAsset.localUri ?? epubAsset.uri),
        ])
        if (active) {
          setEngineScripts({ jszip: escapeForInlineScript(jszipSource), epub: escapeForInlineScript(epubSource) })
        }
      } catch (err: unknown) {
        if (active) {
          setError(String(err))
          setLoading(false)
        }
      }
    }
    void loadEngine()
    return () => {
      active = false
    }
  }, [])

  const fontSize = props.fontSize ?? 100
  const theme = props.theme ?? 'light'

  // Update theme & font size when props change
  useEffect(() => {
    if (!loading && webViewRef.current) {
      const script = `
        if (window.setReaderTheme) window.setReaderTheme('${theme}');
        if (window.setReaderFontSize) window.setReaderFontSize(${fontSize});
      `
      webViewRef.current.injectJavaScript(script)
    }
  }, [fontSize, theme, loading])

  // Handle incoming postMessage from WebView
  const handleMessage = (event: WebViewMessageEvent): void => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      switch (data.type) {
        case 'ready':
          setLoading(false)
          if (props.initialCfi && webViewRef.current) {
            webViewRef.current.injectJavaScript(`if (window.jumpToCfi) window.jumpToCfi('${props.initialCfi}');`)
          }
          break
        case 'toc':
          if (props.onTocLoaded && Array.isArray(data.toc)) {
            props.onTocLoaded(data.toc)
          }
          break
        case 'relocated':
          if (props.onProgressChange) {
            props.onProgressChange(data.cfi, data.percentage ?? 0, data.chapterName)
          }
          break
        case 'selected':
          if (props.onWordSelected && data.text) {
            props.onWordSelected(data.text.trim(), data.context?.trim())
          }
          break
        case 'paragraphTap':
          if (props.onParagraphTap && data.text) {
            props.onParagraphTap(data.text.trim())
          }
          break
        case 'error':
          setError(data.message ?? t('Failed to load EPUB file.'))
          setLoading(false)
          break
      }
    } catch {
      // Ignore unparseable messages
    }
  }

  // Method exposed to parent for jumping to CFI / href
  const jumpTo = (cfiOrHref: string): void => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`if (window.jumpToCfi) window.jumpToCfi('${cfiOrHref}');`)
    }
  }

  // Inject inline translation into target paragraph
  const injectInlineTranslation = (paragraphText: string, translation: string): void => {
    if (webViewRef.current) {
      const safePara = JSON.stringify(paragraphText)
      const safeTrans = JSON.stringify(translation)
      webViewRef.current.injectJavaScript(`if (window.injectInlineTranslation) window.injectInlineTranslation(${safePara}, ${safeTrans});`)
    }
  }

  useImperativeHandle(ref, () => ({ jumpTo, injectInlineTranslation }), [])

  // HTML reader bundle — JSZip and the epub.js engine are inlined directly (see engineScripts
  // above) rather than <script src="https://...">'d from a CDN, so the reader works offline and
  // isn't pinned to a mutable URL outside this repo's control.
  const readerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script>${engineScripts?.jszip ?? ''}</script>
  <script>${engineScripts?.epub ?? ''}</script>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #viewer {
      width: 100%;
      height: 100%;
    }
    .inline-translation {
      display: block;
      background: #F3F4F6;
      color: #374151;
      padding: 8px 12px;
      margin: 8px 0;
      border-left: 3px solid #2563EB;
      border-radius: 4px;
      font-style: italic;
      font-size: 0.95em;
    }
  </style>
</head>
<body>
  <div id="viewer"></div>
  <script>
    (function() {
      var book, rendition;
      var currentTheme = '${theme}';
      var currentFontSize = ${fontSize};

      function sendToRN(data) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
      }

      function base64ToArrayBuffer(base64) {
        var binary_string = window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
          bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
      }

      window.setReaderTheme = function(theme) {
        currentTheme = theme;
        if (rendition) {
          if (theme === 'dark') {
            rendition.themes.register('dark', { 'body': { 'background': '#111827 !important', 'color': '#F9FAFB !important' } });
            rendition.themes.select('dark');
            document.body.style.backgroundColor = '#111827';
          } else if (theme === 'sepia') {
            rendition.themes.register('sepia', { 'body': { 'background': '#FBF0D9 !important', 'color': '#433422 !important' } });
            rendition.themes.select('sepia');
            document.body.style.backgroundColor = '#FBF0D9';
          } else {
            rendition.themes.register('light', { 'body': { 'background': '#FFFFFF !important', 'color': '#111827 !important' } });
            rendition.themes.select('light');
            document.body.style.backgroundColor = '#FFFFFF';
          }
        }
      };

      window.setReaderFontSize = function(size) {
        currentFontSize = size;
        if (rendition) {
          rendition.themes.fontSize(size + '%');
        }
      };

      window.jumpToCfi = function(target) {
        if (rendition) {
          rendition.display(target);
        }
      };

      window.injectInlineTranslation = function(paraText, translationText) {
        if (!rendition) return;
        try {
          var contents = rendition.getContents();
          if (contents && contents[0]) {
            var doc = contents[0].document;
            var paragraphs = doc.querySelectorAll('p, div');
            for (var i = 0; i < paragraphs.length; i++) {
              if (paragraphs[i].textContent && paragraphs[i].textContent.indexOf(paraText) !== -1) {
                var next = paragraphs[i].nextElementSibling;
                if (next && next.classList.contains('inline-translation')) {
                  next.textContent = '💡 ' + translationText;
                } else {
                  var block = doc.createElement('div');
                  block.className = 'inline-translation';
                  block.textContent = '💡 ' + translationText;
                  paragraphs[i].parentNode.insertBefore(block, paragraphs[i].nextSibling);
                }
                break;
              }
            }
          }
        } catch(e) {}
      };

      try {
        var arrayBuffer = base64ToArrayBuffer("${base64Data ?? ''}");
        book = ePub(arrayBuffer);
        rendition = book.renderTo("viewer", {
          width: "100%",
          height: "100%",
          spread: "none"
        });

        rendition.display();

        book.loaded.navigation.then(function(nav) {
          var toc = nav.toc.map(function(item) {
            return { id: item.id, href: item.href, label: item.label.trim() };
          });
          sendToRN({ type: 'toc', toc: toc });
        });

        rendition.on("relocated", function(location) {
          var cfi = location.start.cfi;
          var percentage = book.locations ? Math.round(book.locations.percentageFromCfi(cfi) * 100) : 0;
          var chapterName = location.start.href;
          sendToRN({ type: 'relocated', cfi: cfi, percentage: percentage, chapterName: chapterName });
        });

        rendition.on("selected", function(cfiRange, contents) {
          book.getRange(cfiRange).then(function(range) {
            if (range) {
              var text = range.toString();
              var para = range.startContainer ? (range.startContainer.parentNode ? range.startContainer.parentNode.textContent : '') : '';
              sendToRN({ type: 'selected', text: text, context: para });
            }
          });
        });

        rendition.on("click", function(event) {
          var target = event.target;
          if (target && (target.tagName === 'P' || target.tagName === 'DIV')) {
            sendToRN({ type: 'paragraphTap', text: target.textContent });
          }
        });

        book.ready.then(function() {
          sendToRN({ type: 'ready' });
          window.setReaderTheme(currentTheme);
          window.setReaderFontSize(currentFontSize);
          return book.locations.generate(1000);
        });

      } catch(err) {
        sendToRN({ type: 'error', message: err.message });
      }
    })();
  </script>
</body>
</html>
  `

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {base64Data && engineScripts ? (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: readerHtml }}
          onMessage={handleMessage}
          style={styles.webView}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
        />
      ) : null}
    </View>
  )
})

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    webView: { flex: 1, backgroundColor: 'transparent' },
    errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
    errorText: { fontSize: type.body, color: colors.danger, textAlign: 'center' },
  })
