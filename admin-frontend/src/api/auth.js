import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
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
    
   const response = await api.post('/auth/login-admin', formData, { // <-- Correction
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});
    const data = response.data;
    
    // Store token and user info
    authAPI.setToken(data.access_token);
    authAPI.setUser(data.user);
    
    return data;
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('adminToken');
  },

  isAdmin: () => {
    const user = authAPI.getUser();
    return user && user.is_admin;
  },

  getToken: () => {
    return localStorage.getItem('adminToken');
  },

  setToken: (token) => {
    localStorage.setItem('adminToken', token);
  },

  setUser: (user) => {
    localStorage.setItem('adminUser', JSON.stringify(user));
  },

  getUser: () => {
    const user = localStorage.getItem('adminUser');
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
  }
};

export default api; 