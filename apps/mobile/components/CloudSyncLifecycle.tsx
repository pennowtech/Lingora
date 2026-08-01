import { useEffect, type JSX } from 'react'
import { startCloudSyncLifecycle } from '../lib/cloudSync'
import { useServices } from '../lib/services'

/** Mounted once at the app root (app/_layout.tsx) — wires automatic background sync to the app's
 * lifecycle regardless of which screen is on top. Renders nothing. */
export function CloudSyncLifecycle(): JSX.Element | null {
  const { db } = useServices()

  useEffect(() => {
    return startCloudSyncLifecycle(db)
  }, [db])

  return null
}
