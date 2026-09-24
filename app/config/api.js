import AsyncStorage from '@react-native-async-storage/async-storage';
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

// `let` et non `const` : l'adresse peut être remplacée au démarrage par la
// configuration distante (voir initApiUrl). Les modules qui l'importent lisent
// toujours la valeur courante, les imports ES étant des liaisons vivantes.
export let API_URL = getApiUrl();

// --- Configuration distante --------------------------------------------------
// L'adresse du backend n'est plus figée à la compilation : l'app la lit dans un
// fichier hébergé sur le site vitrine. Changer d'hébergeur = modifier ce fichier,
// sans rebuild ni passage par les stores. L'URL compilée ci-dessus ne sert plus
// que de repli, au tout premier lancement si le site est injoignable.
const REMOTE_CONFIG_URL = 'https://remoscan.vercel.app/config.json';
const CACHE_KEY = 'remote_api_url';
const FETCH_TIMEOUT_MS = 3000;

const listeners = new Set();

// Permet à axios de mettre à jour sa baseURL, qu'il fige à sa création.
export const onApiUrlChange = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// On n'accepte qu'une origine HTTPS nue : un fichier altéré ou mal saisi ne doit
// jamais pouvoir rediriger l'app vers du HTTP en clair ou une URL farfelue.
const normalizeApiUrl = (value) => {
  if (typeof value !== 'string') return null;
  const url = value.trim().replace(/\/+$/, '');
  return /^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(url) ? url : null;
};

const applyApiUrl = (url) => {
  if (!url || url === API_URL) return;
  API_URL = url;
  listeners.forEach((listener) => listener(url));
};

const fetchRemoteApiUrl = async () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(REMOTE_CONFIG_URL, { signal: controller.signal });
    if (!response.ok) return null;
    return normalizeApiUrl((await response.json())?.apiUrl);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

let initPromise = null;

// Résout l'adresse du backend. Ne bloque jamais plus de FETCH_TIMEOUT_MS, et pas
// du tout dès qu'une adresse est en cache : le rafraîchissement se fait alors en
// arrière-plan et vaut pour les appels suivants.
export const initApiUrl = () => {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    // En développement, on garde l'auto-détection de l'IP locale.
    if (__DEV__) return;

    const cached = normalizeApiUrl(await AsyncStorage.getItem(CACHE_KEY).catch(() => null));
    applyApiUrl(cached);

    const refresh = fetchRemoteApiUrl().then((remote) => {
      if (!remote) return;
      applyApiUrl(remote);
      AsyncStorage.setItem(CACHE_KEY, remote).catch(() => {});
    });

    if (!cached) await refresh;
  })();
  return initPromise;
};

// Lancé dès l'import : le temps que l'écran d'accueil s'affiche, la
// configuration est généralement déjà résolue.
initApiUrl();

export const PRIVACY_POLICY_URL = 'https://remoscan.vercel.app/privacy';
export const TERMS_OF_SERVICE_URL = 'https://remoscan.vercel.app/terms';
