import axios from 'axios';

// Resolve API base URL with protocol normalization (defaults to /api for local dev proxy)
const rawBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
const baseURL =
  rawBaseUrl.startsWith('http://') || rawBaseUrl.startsWith('https://') || rawBaseUrl.startsWith('/')
    ? rawBaseUrl
    : `https://${rawBaseUrl}`;

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

