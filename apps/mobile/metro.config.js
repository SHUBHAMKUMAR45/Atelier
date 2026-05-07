const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot]

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// 3. Robust resolution for problematic packages
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('swr') || moduleName.startsWith('clsx')) {
    try {
      const resolved = require.resolve(moduleName, {
        paths: [path.resolve(projectRoot, 'node_modules')],
      })
      return {
        filePath: resolved,
        type: 'sourceFile',
      }
    } catch (e) {}
  }
  return context.resolveRequest(context, moduleName, platform)
}

config.resolver.extraNodeModules = {
  'react-native-web': path.resolve(projectRoot, 'node_modules/react-native-web'),
}

// 4. Workspace package alias
config.resolver.alias = {
  '@ai-fashion/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
}

// 5. Symlinks for pnpm monorepo
config.resolver.unstable_enableSymlinks = true

// 6. Source extensions
config.resolver.sourceExts = [
  'js', 'jsx', 'ts', 'tsx', 'cjs', 'json',
]

module.exports = withNativeWind(config, { input: './global.css' })

