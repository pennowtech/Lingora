import { randomUUID } from 'expo-crypto'

// This RN/Hermes build has no global `crypto.randomUUID` — packages/database and packages/ai call
// it directly everywhere (see CLAUDE.md "IDs: crypto.randomUUID()"), so without this the app throws
// `ReferenceError: Property 'crypto' doesn't exist` the moment any card, deck, or generation row is
// created (first hit: prompt-version seeding when the AI pipeline is built). Polyfilled once, here,
// before any other module loads.
if (typeof global.crypto === 'undefined') {
  global.crypto = {}
}
if (typeof global.crypto.randomUUID === 'undefined') {
  global.crypto.randomUUID = randomUUID
}
