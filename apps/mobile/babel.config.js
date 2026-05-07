module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root:    ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@ai-fashion/shared': '../../packages/shared/src',
          },
        },
      ],
      'react-native-reanimated/plugin',
      'nativewind/babel',
    ],
  }
}
