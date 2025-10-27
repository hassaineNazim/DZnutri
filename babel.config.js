module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Worklets plugin required by expo-router / reanimated worklets
      'react-native-worklets/plugin',
    ],
  };
};
