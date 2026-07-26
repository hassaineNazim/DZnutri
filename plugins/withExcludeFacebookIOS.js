// react-native-fbsdk-next embarque un adaptateur "Expo Modules"
// (ExpoAdapterFBSDKNext, FacebookAppDelegate.swift) qui appelle FBSDKCoreKit
// avec des signatures qui ne correspondent plus à l'API réellement compilée
// (bug du package, confirmé sur plusieurs versions de FBSDKCoreKit) — le
// build iOS échoue à la compilation Swift ("incorrect argument label",
// "extra arguments"...).
//
// En attendant un correctif upstream, on exclut ce module de l'autolinking
// Expo Modules côté iOS uniquement (Android n'est pas concerné : le Podfile
// n'affecte que la target iOS). Le rendu JS (LoginManager, AccessToken...)
// est par ailleurs désactivé sur iOS côté app (voir app/auth/index.tsx).
const { withPodfile } = require('@expo/config-plugins');

const EXCLUDED_PACKAGE = 'react-native-fbsdk-next';

module.exports = function withExcludeFacebookIOS(config) {
  return withPodfile(config, (config) => {
    const before = config.modResults.contents;
    const after = before.replace(
      /use_expo_modules!(\([^)]*\))?/,
      `use_expo_modules!(exclude: ['${EXCLUDED_PACKAGE}'])`,
    );

    if (after === before) {
      throw new Error(
        "withExcludeFacebookIOS: 'use_expo_modules!' introuvable dans le Podfile généré — impossible d'exclure react-native-fbsdk-next de l'autolinking iOS.",
      );
    }

    config.modResults.contents = after;
    return config;
  });
};
