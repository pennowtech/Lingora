const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)
const defaultResolveRequest = config.resolver.resolveRequest
const expoRouterRoot = path.dirname(require.resolve('expo-router/package.json'))

function resolveExpoRouterSubpath(moduleName, platform) {
  if (moduleName === 'expo-router') {
    return require.resolve('expo-router', { paths: [projectRoot] })
  }

  if (!moduleName.startsWith('expo-router/')) {
    return null
  }

  const subpath = moduleName.slice('expo-router/'.length)
  const candidates = []

  if (subpath === '_ctx' && platform) {
    candidates.push(path.join(expoRouterRoot, `${subpath}.${platform}.js`))
  }

  candidates.push(
    path.join(expoRouterRoot, `${subpath}.js`),
    path.join(expoRouterRoot, subpath, 'index.js')
  )

  return candidates.find((candidate) => {
    try {
      return require('fs').existsSync(candidate)
    } catch {
      return false
    }
  })
}

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot]

// Tell Metro where to resolve packages — local node_modules first, then root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Required for pnpm: follow symlinks so Metro can traverse pnpm's nested structure
config.resolver.unstable_enableSymlinks = true

// Expo Router 56 ships empty runtime "types.js" modules that are required
// extensionlessly from vendored React Navigation files. In this pnpm + Windows
// workspace Metro can fail to resolve those files even though they exist.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const originModulePath = context.originModulePath.replace(/\\/g, '/')
  const expoRouterSubpath = resolveExpoRouterSubpath(moduleName, platform)

  if (expoRouterSubpath) {
    return {
      type: 'sourceFile',
      filePath: expoRouterSubpath,
    }
  }

  if (
    moduleName === './types' &&
    originModulePath.includes('/expo-router/build/react-navigation/')
  ) {
    return {
      type: 'sourceFile',
      filePath: path.join(path.dirname(context.originModulePath), 'types.js'),
    }
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform)
  }

  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
