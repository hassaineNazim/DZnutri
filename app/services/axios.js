import axios from 'axios';
import { API_URL } from '../config/api';
import { invalidateSession } from './authSession';
import { getAccessToken, getRefreshToken, saveTokens } from './tokenStore';

// Create axios instance with a sensible timeout and base URL coming from config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

if (__DEV__) {
  console.log('[axios] baseURL =', API_URL);
}

// Attach stored access token (if any) to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('[axios] error reading token', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Rafraîchissement silencieux du token ---
// Single-flight : un seul appel /auth/refresh à la fois ; les requêtes 401
// concurrentes attendent le même résultat puis sont rejouées.
let refreshPromise = null;

async function performRefresh() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return { accessToken: null, staleSession: false };
  try {
    // Appel direct (hors instance `api`) pour ne pas re-déclencher l'intercepteur.
    const resp = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken });
    const { access_token, refresh_token } = resp.data || {};
    if (access_token && refresh_token) {
      // Une déconnexion ou un changement de compte a pu avoir lieu pendant
      // l'appel réseau : ne jamais ressusciter l'ancienne session.
      if ((await getRefreshToken()) !== refreshToken) {
        return { accessToken: null, staleSession: true };
      }
      await saveTokens({ access_token, refresh_token });
      return { accessToken: access_token, staleSession: false };
    }
    return {
      accessToken: null,
      staleSession: (await getRefreshToken()) !== refreshToken,
    };
  } catch {
    return {
      accessToken: null,
      staleSession: (await getRefreshToken()) !== refreshToken,
    };
  }
}

api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const original = error.config;

    // Sur 401, on tente UNE fois de rafraîchir puis on rejoue la requête.
    if (error?.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
          refreshPromise = null;
        });
      }
      const refreshResult = await refreshPromise;
      if (refreshResult.accessToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${refreshResult.accessToken}`;
        return api(original);
      }
      // Une ancienne requête peut finir après une déconnexion ou après la
      // connexion d'un autre compte. Dans ce cas, ne pas effacer la nouvelle
      // session : l'erreur d'origine est simplement rejetée.
      if (refreshResult.staleSession) return Promise.reject(error);
      // Rafraîchissement impossible (refresh token absent/expiré/révoqué) :
      // on nettoie la session locale. Le garde global redirige vers /auth.
      await invalidateSession('expired');
    }

    // Logs réseau utiles au diagnostic sur appareil (dev uniquement).
    if (__DEV__) {
      if (error?.code === 'ECONNABORTED') {
        console.warn('[axios] request timeout', error.message);
      } else if (error?.request && !error.response) {
        console.warn('[axios] network error, no response received', error.message);
      } else if (error?.response) {
        console.warn('[axios] response error', error.response.status, error.response.data);
      }
    }
    return Promise.reject(error);
  }
);

export { api };
