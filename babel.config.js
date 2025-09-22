module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@services': './src/services',
            '@utils': './src/utils',
            '@hooks': './src/hooks',
            '@store': './src/store',
            '@types': './src/types',
            '@constants': './src/constants',
          },
        },
      ],
    ],
  };
};