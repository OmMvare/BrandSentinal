import axios from 'axios';

// Resolve API base URL with protocol and /api normalization
const rawBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
let normalized = String(rawBaseUrl).trim();

// Ensure protocol is attached if a bare domain is passed
if (!normalized.startsWith('http://') && !normalized.startsWith('https://') && !normalized.startsWith('/')) {
  normalized = `https://${normalized}`;
}

// Strip any trailing slash
normalized = normalized.replace(/\/+$/, '');

// Ensure /api is the suffix for backend endpoints
if (!normalized.endsWith('/api') && !normalized.includes('/api/')) {
  normalized = `${normalized}/api`;
}

const baseURL = normalized;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('brand_sentinel_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if invalid
      localStorage.removeItem('brand_sentinel_token');
      localStorage.removeItem('brand_sentinel_user');
      // Do not force redirect if user is already on login or registration pages
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

