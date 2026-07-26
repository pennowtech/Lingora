module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    // react-native-worklets/plugin must be last (Reanimated 4 delegates
    // worklet compilation to react-native-worklets, not its own plugin).
    plugins: ['react-native-worklets/plugin'],
  }
}
