const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Vendored epub.js/JSZip browser bundles (components/EbookReader.tsx) are stored as .txt so
// Metro treats them as opaque static assets — read via expo-asset + expo-file-system and inlined
// into the reader's WebView HTML — instead of trying to parse the minified UMD bundle as a
// source module.
if (!config.resolver.assetExts.includes('txt')) {
  config.resolver.assetExts.push('txt')
}

module.exports = config
