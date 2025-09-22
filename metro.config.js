const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add any custom Metro configuration here
config.resolver.alias = {
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
};

module.exports = config;