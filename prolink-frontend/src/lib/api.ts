import axios from 'axios';
import { API_BASE_URL } from './backendConfig';

console.log('[api] baseURL=', API_BASE_URL);

// Create axios instance with cookie-based authentication
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Uses httpOnly cookie for authentication
});

// Request interceptor - no need to add Authorization header since we use cookies
api.interceptors.request.use(
  (config) => {
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
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * Check if the user has an auth cookie set.
 * Note: We can't read httpOnly cookie value, but we can check if it exists.
 */
export const hasAuthCookie = (): boolean => {
  if (typeof window === 'undefined') return false;
  return document.cookie.split(';').some(c => c.trim().startsWith('token='));
};