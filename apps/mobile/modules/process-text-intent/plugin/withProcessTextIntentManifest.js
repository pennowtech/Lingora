const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins')

// The label shown as the entry in Android's text-selection toolbar (long-press a word in any
// app -> Copy / Web search / "Search in Lemony"). Without an explicit label Android would fall
// back to the whole app name, which reads oddly in that specific menu.
const PROCESS_TEXT_LABEL = 'Search in Lemony'

/**
 * Registers MainActivity as a handler for Android's ACTION_PROCESS_TEXT intent, so Lemony shows
 * up in the system text-selection toolbar everywhere on the device. Paired with
 * `modules/process-text-intent`'s native module, which is what actually reads the selected text
 * back out of the intent once this filter routes it to MainActivity — see that module's own doc
 * comment for the cold-start vs. already-running delivery paths.
 *
 * `expo prebuild` regenerates android/ from scratch, so this has to be a plugin, not a one-off
 * hand-edit of the generated AndroidManifest.xml.
 */
function withProcessTextIntentManifest(config) {
  return withAndroidManifest(config, (config) => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults)
    mainActivity['intent-filter'] = (mainActivity['intent-filter'] ?? []).concat([
      {
        $: { 'android:label': PROCESS_TEXT_LABEL },
        action: [{ $: { 'android:name': 'android.intent.action.PROCESS_TEXT' } }],
        category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
        data: [{ $: { 'android:mimeType': 'text/plain' } }],
      },
    ])
    return config
  })
}

module.exports = withProcessTextIntentManifest
