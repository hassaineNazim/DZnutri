import Constants from 'expo-constants';
import { Platform } from 'react-native';

// URL explicite fournie AU BUILD via la variable d'env EAS `EXPO_PUBLIC_API_URL`
// (profils preview/production). C'est la seule qui doit court-circuiter
// l'auto-détection en développement.
const EXPLICIT_API_URL = process.env.EXPO_PUBLIC_API_URL || null;

// URL de l'API de PRODUCTION : l'explicite, sinon le placeholder `extra.apiUrl`
// d'app.config.js (utilisé uniquement pour les builds autonomes non-dev).
const PROD_API_URL = EXPLICIT_API_URL || Constants.expoConfig?.extra?.apiUrl || null;

// Détection automatique de l'hôte en développement uniquement.
const getDevApiUrl = () => {
  // Web : serveur de dev local
  if (Platform.OS === 'web') {
    return 'http://127.0.0.1:8000';
  }

  // Appareil physique via Expo : on déduit l'IP de la machine depuis le manifest.
  const manifest = Constants.manifest || Constants.expoConfig || {};
  const debuggerHost = manifest.debuggerHost || manifest.hostUri || null;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    return `http://${host}:8000`;
  }

  // Repli : IP locale (à adapter à votre machine de dev).
  return 'http://172.20.10.2:8000';
};

const getApiUrl = () => {
  // Build de production : on EXIGE une URL HTTPS configurée.
  if (!__DEV__) {
    if (!PROD_API_URL) {
      console.error(
        '[api] EXPO_PUBLIC_API_URL / expo.extra.apiUrl non défini : ' +
          "l'application ne pourra pas joindre le backend en production.",
      );
      return '';
    }
    return PROD_API_URL;
  }

  // Développement : URL explicite (EXPO_PUBLIC_API_URL) si fournie, sinon
  // AUTO-DÉTECTION de l'IP du PC via le manifest Metro. On ignore volontairement
  // le placeholder `extra.apiUrl` ici, pour que le dev client suive l'IP tout
  // seul (aucun rebuild quand l'IP/box change).
  return EXPLICIT_API_URL || getDevApiUrl();
};

export const API_URL = getApiUrl();
