// Repli pour TypeScript et les plateformes sans implémentation dédiée.
// Metro choisit facebookAuth.ios.ts ou facebookAuth.android.ts dans les builds
// natifs avant d'utiliser ce fichier.
export const initializeFacebookSDK = () => {};

export const getFacebookAccessToken = async (): Promise<string> => {
  throw new Error('Connexion Facebook indisponible sur cette plateforme.');
};
