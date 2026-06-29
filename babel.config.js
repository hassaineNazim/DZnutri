module.exports = function (api) {
  api.cache(true);

  const plugins = [];

  // En PRODUCTION, on retire les console.log / console.debug / console.info du
  // bundle (on conserve warn et error, utiles au diagnostic des crashes).
  if (
    process.env.NODE_ENV === "production" ||
    process.env.BABEL_ENV === "production"
  ) {
    plugins.push([
      "transform-remove-console",
      { exclude: ["error", "warn"] },
    ]);
  }

  // react-native-reanimated/plugin DOIT rester en dernier.
  plugins.push("react-native-reanimated/plugin");

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins,
  };
};
