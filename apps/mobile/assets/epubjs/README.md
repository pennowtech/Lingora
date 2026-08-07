# Vendored reader engine bundles

`components/EbookReader.tsx` renders `.epub` files inside a `react-native-webview`, using
[epub.js](https://github.com/futurepress/epub.js/) as the rendering engine. epub.js needs a
`JSZip` global to unzip the EPUB container, and both used to be loaded via `<script src="https://...">`
from `cdnjs`/`jsdelivr` at runtime — meaning the reader required network access just to open a
book, and was pinned to whatever those CDN URLs currently served rather than a version this repo
actually controls.

These two files are local copies instead, inlined directly into the reader's WebView HTML
(`EbookReader.tsx`'s `readerHtml`) via `expo-asset` + `expo-file-system`. `.txt` rather than `.js`
so Metro treats them as opaque static assets instead of trying to parse the minified UMD bundle as
a source module (see `metro.config.js`'s `resolver.assetExts`).

| File | Source | Pinned version |
| --- | --- | --- |
| `jszip.min.js.txt` | `jszip`'s own `dist/jszip.min.js` | matches this app's own `jszip` dependency in `package.json` |
| `epub.min.js.txt` | `epubjs`'s own `dist/epub.min.js` | matches this app's own `epubjs` dependency in `package.json` |

## Re-vendoring after a version bump

If either `jszip` or `epubjs` is upgraded in `apps/mobile/package.json`, re-copy the matching
`dist/*.min.js` file from that package's installed `node_modules` output over the corresponding
`.txt` file here — there's no build step that does this automatically.
