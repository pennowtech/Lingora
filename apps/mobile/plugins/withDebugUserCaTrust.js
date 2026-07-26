const { withDangerousMod } = require('@expo/config-plugins')
const fs = require('fs')
const path = require('path')

const NETWORK_SECURITY_CONFIG_XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
  <debug-overrides>
    <trust-anchors>
      <certificates src="user" />
    </trust-anchors>
  </debug-overrides>
</network-security-config>
`

const DEBUG_MANIFEST_XML = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <application android:networkSecurityConfig="@xml/network_security_config" />
</manifest>
`

// Debug-build-only: trusts user-installed CA certificates (e.g. a corporate
// Zscaler TLS-inspection root) in addition to the system store, so AI
// provider API calls succeed on a network that does TLS interception.
// `expo prebuild` regenerates android/ from scratch, so this can't just be
// hand-edited once — it has to be a plugin that recreates the debug source
// set every time. Never apply this to the release manifest/config.
function withDebugUserCaTrust(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const debugDir = path.join(config.modRequest.platformProjectRoot, 'app/src/debug')
      const xmlDir = path.join(debugDir, 'res/xml')
      fs.mkdirSync(xmlDir, { recursive: true })
      fs.writeFileSync(path.join(xmlDir, 'network_security_config.xml'), NETWORK_SECURITY_CONFIG_XML)
      fs.writeFileSync(path.join(debugDir, 'AndroidManifest.xml'), DEBUG_MANIFEST_XML)
      return config
    },
  ])
}

module.exports = withDebugUserCaTrust
