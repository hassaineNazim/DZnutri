module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Ceci DOIT être 'react-native-reanimated/plugin'
      // Et il DOIT être en dernier.
      'react-native-reanimated/plugin',
    ],
  };
};