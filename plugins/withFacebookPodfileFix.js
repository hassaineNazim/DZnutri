// react-native-fbsdk-next@13.4.3 embarque DEUX podspecs iOS : l'ancien
// (react-native-fbsdk-next.podspec, subspecs Core/Login/Share) qui pin
// FBSDKCoreKit/LoginKit/ShareKit à "~> 18.0", et le nouveau module Expo
// (ExpoAdapterFBSDKNext.podspec, utilisé par l'autolinking Expo Modules)
// qui dépend de 'FBSDKCoreKit' SANS aucune contrainte de version.
//
// Résultat : CocoaPods résout la version la plus récente de FBSDKCoreKit
// (au-delà de 18.x), dont l'API a changé — le code Swift généré par
// react-native-fbsdk-next (FacebookAppDelegate.swift, écrit pour l'API
// ~18.x) ne compile plus ("incorrect argument label", "extra arguments").
//
// On force donc la même contrainte "~> 18.0" pour tous les pods FBSDK dans
// le Podfile généré, avant `pod install`.
const { withPodfile } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const FBSDK_VERSION = '~> 18.0';
const PODS = [
  'FBSDKCoreKit',
  'FBSDKCoreKit_Basics',
  'FBSDKLoginKit',
  'FBSDKShareKit',
  'FBSDKGamingServicesKit',
];

module.exports = function withFacebookPodfileFix(config) {
  return withPodfile(config, (config) => {
    const newSrc = PODS.map((name) => `  pod '${name}', '${FBSDK_VERSION}'`).join('\n');

    const { contents } = mergeContents({
      tag: 'fbsdk-version-pin',
      src: config.modResults.contents,
      newSrc,
      anchor: /target\s+['"][^'"]+['"]\s+do/,
      offset: 1,
      comment: '#',
    });

    config.modResults.contents = contents;
    return config;
  });
};
