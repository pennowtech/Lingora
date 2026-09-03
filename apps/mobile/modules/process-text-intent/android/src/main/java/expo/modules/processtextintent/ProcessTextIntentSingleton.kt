package expo.modules.processtextintent

import android.content.Intent

/**
 * Holds a PROCESS_TEXT intent received before the JS side had a chance to ask for it — the cold
 * start case (user long-presses text in another app, taps "Search in Lemony" in the selection
 * toolbar, and Lemony wasn't already running). `ProcessTextIntentReactActivityLifecycleListener`
 * populates this from `Activity.onCreate`; `ProcessTextIntentModule#getInitialProcessText` drains
 * it once the JS side is ready. The already-running case never touches this — it's handled by the
 * module's own `OnNewIntent` straight away, no singleton hand-off needed.
 */
object ProcessTextIntentSingleton {
  var intent: Intent? = null
  var isPending: Boolean = false
}
