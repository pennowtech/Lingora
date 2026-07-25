const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

function findAndroidSdk() {
  const configuredSdk = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
  ].find((candidate) => candidate && fs.existsSync(candidate))

  if (configuredSdk) {
    return configuredSdk
  }

  const home = os.homedir()
  const defaultLocations = {
    darwin: [path.join(home, 'Library', 'Android', 'sdk')],
    linux: [path.join(home, 'Android', 'Sdk')],
    win32: [
      process.env.LOCALAPPDATA &&
        path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
    ],
  }

  return (defaultLocations[process.platform] ?? []).find(
    (candidate) => candidate && fs.existsSync(candidate)
  )
}

const androidSdk = findAndroidSdk()

if (!androidSdk) {
  console.error(
    'Android SDK not found. Install it with Android Studio or set ANDROID_HOME.'
  )
  process.exit(1)
}

const result = spawnSync(
  process.execPath,
  [require.resolve('expo/bin/cli'), 'run:android', ...process.argv.slice(2)],
  {
    env: {
      ...process.env,
      ANDROID_HOME: androidSdk,
      ANDROID_SDK_ROOT: androidSdk,
    },
    stdio: 'inherit',
  }
)

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
