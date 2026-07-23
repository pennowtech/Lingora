/**
 * Globals that exist at runtime but aren't in the React Native TS libs.
 *
 * `crypto` is provided by expo-modules-core's WebCrypto polyfill (and used
 * throughout @lingora/database for UUIDs). Node and browser environments get
 * it from their own libs; this declaration covers the RN typecheck only.
 */
declare const crypto: {
  randomUUID(): string
  getRandomValues<T extends ArrayBufferView>(array: T): T
}
