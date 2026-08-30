// Facebook est volontairement absent du binaire iOS (voir
// plugins/withExcludeFacebookIOS.js). Ce module spécifique à iOS empêche Metro
// de charger react-native-fbsdk-next lorsque l'écran d'authentification s'ouvre.
export const initializeFacebookSDK = () => {};

export const getFacebookAccessToken = async (): Promise<string> => {
  throw new Error('Connexion Facebook indisponible sur iOS.');
};
