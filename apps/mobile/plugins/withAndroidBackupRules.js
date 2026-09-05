const { withDangerousMod, withAndroidManifest } = require('expo/config-plugins')
const fs = require('fs')
const path = require('path')

// expo-secure-store ships its own backup rules (android/src/main/res/xml/secure_store_*.xml)
// that only ever mention the `sharedpref` domain - excluding its own encrypted keys (correctly,
// since Android Keystore-backed values can't be decrypted after a restore onto different key
// material) but saying nothing about our SQLite database. Android's Auto Backup / Cloud Backup /
// Device Transfer therefore includes files/SQLite/lingora.db(+-wal/-shm) by default, and - because
// the database runs in WAL mode and this app has no BackupAgent to force a checkpoint first - a
// backup can capture the main .db file without the WAL's not-yet-checkpointed transactions. A
// later restore (a "clone/restore my data" flow around a reinstall or OS-triggered app-data
// backup, seen so far as one rare, single-device, non-reproducible report) then reopens the app
// with an older-than-expected database: decks and recently-added words that were only in the WAL
// silently missing. Same fix in both cases: point the app's own backup rules at the database
// directory too, replicating expo-secure-store's sharedpref exclusion so its behavior is
// unaffected. The app has its own explicit, user-controlled backup (.lem export) already -
// there's no upside to also letting the OS silently back up a WAL-mode SQLite file.
const BACKUP_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- Auto Backup configuration for Android 11 and lower -->
<full-backup-content>
  <include domain="sharedpref" path="."/>
  <exclude domain="sharedpref" path="SecureStore"/>
  <exclude domain="file" path="SQLite/"/>
</full-backup-content>
`

const DATA_EXTRACTION_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- Auto Backup / Device Transfer configuration for Android 12 and higher -->
<data-extraction-rules>
  <cloud-backup>
    <include domain="sharedpref" path="."/>
    <exclude domain="sharedpref" path="SecureStore"/>
    <exclude domain="file" path="SQLite/"/>
  </cloud-backup>
  <device-transfer>
    <include domain="sharedpref" path="."/>
    <exclude domain="sharedpref" path="SecureStore"/>
    <exclude domain="file" path="SQLite/"/>
  </device-transfer>
</data-extraction-rules>
`

function withAndroidBackupRulesFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/xml')
      fs.mkdirSync(xmlDir, { recursive: true })
      fs.writeFileSync(path.join(xmlDir, 'backup_rules.xml'), BACKUP_RULES_XML)
      fs.writeFileSync(path.join(xmlDir, 'data_extraction_rules.xml'), DATA_EXTRACTION_RULES_XML)
      return config
    },
  ])
}

// Must run after the expo-secure-store plugin (see app.json's plugins order) so this
// application-tag assignment wins instead of theirs.
function withAndroidBackupRulesManifest(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0]
    if (application) {
      application.$['android:fullBackupContent'] = '@xml/backup_rules'
      application.$['android:dataExtractionRules'] = '@xml/data_extraction_rules'
    }
    return config
  })
}

function withAndroidBackupRules(config) {
  config = withAndroidBackupRulesFiles(config)
  config = withAndroidBackupRulesManifest(config)
  return config
}

module.exports = withAndroidBackupRules
