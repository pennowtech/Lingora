import { Ionicons } from '@expo/vector-icons'
import { readAsStringAsync, EncodingType } from 'expo-file-system'
import { useEffect, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
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

export function EbookReader(props: EbookReaderProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const webViewRef = useRef<WebView>(null)
  const [base64Data, setBase64Data] = useState<string | null>(null)
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
        case 'init':
          // WebView is ready, send the book base64 data
          if (base64Data && webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({ type: 'loadBook', base64: base64Data }))
          }
          break
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

  // HTML reader bundle with ePUB.js engine embedded from CDN
  const readerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js"></script>
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

      window.onerror = function(msg, url, line) {
        sendToRN({ type: 'error', message: 'Script error: ' + msg + ' (line ' + line + ')' });
      };

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

      function initBook(base64Data) {
        try {
          var arrayBuffer = base64ToArrayBuffer(base64Data);
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
      }

      function handleMessage(event) {
        try {
          var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data && data.type === 'loadBook' && data.base64) {
            initBook(data.base64);
          }
        } catch(e) {
          sendToRN({ type: 'error', message: 'Failed to process book message: ' + e.message });
        }
      }

      document.addEventListener('message', handleMessage);
      window.addEventListener('message', handleMessage);

      // Signal React Native that WebView is ready to receive data
      setTimeout(function() {
        sendToRN({ type: 'init' });
      }, 100);
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
      {base64Data ? (
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
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    webView: { flex: 1, backgroundColor: 'transparent' },
    errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
    errorText: { fontSize: type.body, color: colors.danger, textAlign: 'center' },
  })
