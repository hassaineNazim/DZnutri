// react-native-fbsdk-next casse la compilation Swift sur iOS (bug du
// package — voir plugins/withExcludeFacebookIOS.js pour le détail). On
// exclut aussi son autolinking React Native "classique" côté iOS ici ;
// Android n'est pas concerné.
module.exports = {
  dependencies: {
    'react-native-fbsdk-next': {
      platforms: {
        ios: null,
      },
    },
  },
};
