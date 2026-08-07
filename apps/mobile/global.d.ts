// Expo/Metro resolve image imports at bundle time; normally `expo start`/`expo run` generates a
// matching `.expo/types/**/*.d.ts` declaration automatically, but that only exists after Metro
// has actually run at least once on this machine. Declared by hand so typecheck works
// standalone (`tsc --noEmit`) too, not just inside a running dev session.
declare module '*.png' {
  const value: import('react-native').ImageSourcePropType
  export default value
}

// Vendored non-image assets (see components/EbookReader.tsx's epub.js/JSZip bundles) resolve to
// the same opaque asset module id every other Metro-bundled asset does — Asset.fromModule (expo-
// asset) takes it from there.
declare module '*.txt' {
  const value: number
  export default value
}
