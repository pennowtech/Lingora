package expo.modules.processtextintent

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import expo.modules.core.interfaces.ReactActivityLifecycleListener

/**
 * Cold-start capture: if the Intent that actually launched MainActivity is a PROCESS_TEXT intent
 * (app wasn't already running), stash it so the JS side can pick it up once mounted. The
 * already-running case doesn't need this — MainActivity is `singleTask`, so Android delivers a
 * new PROCESS_TEXT intent via `onNewIntent` instead, which `ProcessTextIntentModule`'s own
 * `OnNewIntent` handles directly without going through this listener at all.
 */
class ProcessTextIntentReactActivityLifecycleListener(activityContext: Context) : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity?, savedInstanceState: Bundle?) {
    if (activity?.intent?.action == Intent.ACTION_PROCESS_TEXT) {
      ProcessTextIntentSingleton.intent = activity.intent
      ProcessTextIntentSingleton.isPending = true
    }
  }
}
