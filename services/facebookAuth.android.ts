import { AccessToken, LoginManager, Settings } from 'react-native-fbsdk-next';

export const initializeFacebookSDK = () => {
  Settings.initializeSDK();
};

export const getFacebookAccessToken = async (): Promise<string> => {
  const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
  if (result.isCancelled) {
    throw new Error('Connexion Facebook annulée.');
  }

  const data = await AccessToken.getCurrentAccessToken();
  if (!data?.accessToken) {
    throw new Error("Facebook : jeton d'accès introuvable (vérifiez la configuration de l'app Facebook).");
  }
  return data.accessToken;
};
