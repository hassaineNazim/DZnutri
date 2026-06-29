import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const TOKEN_KEY = 'adminToken';
const REFRESH_KEY = 'adminRefreshToken';
const USER_KEY = 'adminUser';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Rafraîchissement silencieux du token (single-flight) ---
let refreshPromise = null;

async function performRefresh() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;
  try {
    // Appel direct (hors instance `api`) pour ne pas re-déclencher l'intercepteur.
    const resp = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
    const { access_token, refresh_token } = resp.data || {};
    if (access_token && refresh_token) {
      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem(REFRESH_KEY, refresh_token);
      return access_token;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Add response interceptor to refresh on 401, then fall back to logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const url = original?.url || '';
    // On n'intercepte pas les endpoints d'auth eux-mêmes (évite qu'un login
    // échoué ne relance un refresh avec un ancien token).
    const isAuthEndpoint =
      url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccess = await refreshPromise;
      if (newAccess) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      }
      // Rafraîchissement impossible : on nettoie et on renvoie vers le login.
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/auth/login-admin', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const data = response.data;

    authAPI.setToken(data.access_token);
    if (data.refresh_token) {
      localStorage.setItem(REFRESH_KEY, data.refresh_token);
    }

    // Le endpoint /auth/login-admin ne renvoie que le token : on récupère le
    // profil admin (is_admin) pour alimenter isAdmin().
    try {
      const profile = await authAPI.getProfile();
      authAPI.setUser(profile);
    } catch (e) {
      authAPI.setUser(null);
    }

    return data;
  },

  // Synchrone (appelé sans await) : nettoyage local immédiat, révocation serveur
  // en arrière-plan (best-effort).
  logout: () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    if (refreshToken) {
      axios.post(`${API_BASE_URL}/auth/logout`, { refresh_token: refreshToken }).catch(() => {});
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  isAdmin: () => {
    const user = authAPI.getUser();
    return user && user.is_admin;
  },

  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  getProfile: async () => {
    const response = await api.get('/api/admin/profile');
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Backend is not accessible');
    }
  },
};

export default api;
