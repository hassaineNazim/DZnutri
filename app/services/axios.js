import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';

// Create axios instance with a sensible timeout and base URL coming from config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

console.log('[axios] baseURL =', API_URL);

// Attach stored auth token (if any) to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${userToken}`;
      }
    } catch (e) {
      console.warn('[axios] error reading token', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Log network errors with helpful detail to aid debugging on device
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    // Axios wraps network errors; expose more details in console
    if (error?.code === 'ECONNABORTED') {
      console.warn('[axios] request timeout', error.message);
    } else if (error?.request && !error.response) {
      console.warn('[axios] network error, request made but no response received', error.message);
    } else if (error?.response) {
      console.warn('[axios] response error', error.response.status, error.response.data);
    } else {
      console.warn('[axios] unknown error', error?.message || error);
    }
    return Promise.reject(error);
  }
);

export { api };

