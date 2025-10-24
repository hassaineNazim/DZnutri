// eslint.config.js

const expoConfig = require('eslint-config-expo/flat');

// Just export the array directly
module.exports = [
  expoConfig,
  {
    ignores: ['dist/*'],
  },
];