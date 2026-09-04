package expo.modules.playinappupdate

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.install.model.UpdateAvailability
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PlayInAppUpdateModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context not found")

  override fun definition() = ModuleDefinition {
    Name("PlayInAppUpdate")

    AsyncFunction("checkPlayStoreUpdate") { promise: Promise ->
      try {
        val appUpdateManager: AppUpdateManager = AppUpdateManagerFactory.create(context)
        val task = appUpdateManager.appUpdateInfo

        task.addOnSuccessListener { appUpdateInfo: AppUpdateInfo ->
          val availability = appUpdateInfo.updateAvailability()
          val isAvailable = availability == UpdateAvailability.UPDATE_AVAILABLE
          val availableVersionCode = appUpdateInfo.availableVersionCode()
          val stalenessDays = appUpdateInfo.clientVersionStalenessDays() ?: 0

          val result = mapOf(
            "updateAvailable" to isAvailable,
            "availableVersionCode" to availableVersionCode,
            "stalenessDays" to stalenessDays,
            "availabilityCode" to availability
          )
          promise.resolve(result)
        }.addOnFailureListener { exception ->
          promise.resolve(mapOf(
            "updateAvailable" to false,
            "error" to (exception.message ?: "Failed to query Play Store")
          ))
        }
      } catch (e: Exception) {
        promise.resolve(mapOf(
          "updateAvailable" to false,
          "error" to (e.message ?: "Unexpected error")
        ))
      }
    }

    AsyncFunction("openPlayStoreListing") { promise: Promise ->
      try {
        val packageName = context.packageName
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$packageName")).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
        promise.resolve(true)
      } catch (e: Exception) {
        try {
          val packageName = context.packageName
          val webIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=$packageName")).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          context.startActivity(webIntent)
          promise.resolve(true)
        } catch (err: Exception) {
          promise.reject("PLAY_STORE_ERROR", "Could not open Play Store", err)
        }
      }
    }
  }
}
