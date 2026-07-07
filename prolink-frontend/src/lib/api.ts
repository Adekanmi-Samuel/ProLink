import axios from 'axios';
import { API_BASE_URL } from './backendConfig';

console.log('[api] baseURL=', API_BASE_URL);

// Create axios instance with cookie-based authentication
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Uses httpOnly cookie for authentication
});

// Request interceptor - inject token from localStorage as fallback
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const safeError = {
      message: error?.message,
      name: error?.name,
      response: error?.response ? { status: error.response.status, data: error.response.data } : undefined,
    };
    console.error('[api] response error', safeError);

    // If 401 — token is invalid/expired, redirect to login
    if (error.response && error.response.status === 401) {
      const endpoint = error.config?.url || '';
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register') && !endpoint.includes('/auth/verify')) {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup') && window.location.pathname !== '/') {
          // Clear local token on 401
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const hasAuthCookie = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('token='));
  const hasLocalToken = !!localStorage.getItem('token');
  return hasCookie || hasLocalToken;
};