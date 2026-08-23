package expo.modules.processtextintent

import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Bridges Android's "Process Text" intent — the entry Lemmory adds to the system text-selection
 * toolbar (long-press a word in any app -> "Search in Lemmory") — into JS. See
 * `plugin/withProcessTextIntentManifest.js` for the AndroidManifest intent-filter this depends on,
 * and `index.ts` for the JS-side API this backs.
 *
 * Two delivery paths, matching how Android actually delivers the intent:
 *  - Cold start (Lemmory wasn't running): MainActivity's own `onCreate` receives it, captured by
 *    `ProcessTextIntentReactActivityLifecycleListener` into `ProcessTextIntentSingleton` before JS
 *    even exists yet — `getInitialProcessText` drains it once JS is ready.
 *  - Already running: MainActivity is `singleTask`, so Android calls `onNewIntent` on the existing
 *    instance instead — handled directly below via `OnNewIntent`, emitted as `onProcessText`.
 */
class ProcessTextIntentModule : Module() {
  companion object {
    private var instance: ProcessTextIntentModule? = null

    private fun extractText(intent: Intent): String? {
      if (intent.action != Intent.ACTION_PROCESS_TEXT) return null
      return intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT)?.toString()?.trim()?.takeIf { it.isNotEmpty() }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ProcessTextIntent")

    Events("onProcessText")

    AsyncFunction("getInitialProcessText") {
      ProcessTextIntentSingleton.isPending = false
      val intent = ProcessTextIntentSingleton.intent
      ProcessTextIntentSingleton.intent = null
      intent?.let { extractText(it) }
    }

    OnNewIntent { intent ->
      extractText(intent)?.let { text ->
        instance?.sendEvent("onProcessText", mapOf("text" to text))
      }
    }

    OnCreate {
      instance = this@ProcessTextIntentModule
    }

    OnDestroy {
      instance = null
    }
  }
}
