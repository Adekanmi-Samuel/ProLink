import axios from 'axios';
import { API_BASE_URL } from './backendConfig';

console.log('[api] baseURL=', API_BASE_URL);

// Token storage — in-memory + localStorage fallback for page reloads
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('prolink_token', token);
  } else {
    localStorage.removeItem('prolink_token');
  }
};

// Restore token from localStorage on load
if (typeof window !== 'undefined') {
  const storedToken = localStorage.getItem('prolink_token');
  if (storedToken) authToken = storedToken;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // keep as fallback for cookie-based flows
});

// Attach the token to every outgoing request as an Authorization header
api.interceptors.request.use(
  (config) => {
    // Read from localStorage on every request (Next.js app router bundles pages separately,
    // so module-level state is NOT shared between login -> dashboard navigation)
    const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('prolink_token') : null);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// This interceptor checks every response from the server for security errors.
api.interceptors.response.use(
  (response) => {
    // If the response contains a token from login/register, save it
    if (response.data?.token) {
      setAuthToken(response.data.token);
    }
    return response;
  },
  (error) => {
    const safeError = {
      message: error?.message,
      name: error?.name,
      response: error?.response ? { status: error.response.status, data: error.response.data } : undefined,
    };
    console.error('[api] response error', safeError);

    // If 401 — token is invalid/expired, clear it and redirect
    if (error.response && error.response.status === 401) {
      setAuthToken(null);
      document.cookie = 'token=; Max-Age=0; path=/';
      const endpoint = error.config?.url || '';
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
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
 * Check if the user has a stored auth token (localStorage or cookie).
 * Use before making authenticated API calls to avoid unnecessary 401s.
 */
export const hasAuthToken = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem('prolink_token')) return true;
  // Check if the httpOnly cookie 'token' is set (value is inaccessible but existence works)
  return document.cookie.split(';').some(c => c.trim().startsWith('token='));
};
