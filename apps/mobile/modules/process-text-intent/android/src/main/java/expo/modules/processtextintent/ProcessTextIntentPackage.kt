package expo.modules.processtextintent

import android.content.Context
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class ProcessTextIntentPackage : Package {
  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> {
    return listOf(ProcessTextIntentReactActivityLifecycleListener(activityContext))
  }
}
