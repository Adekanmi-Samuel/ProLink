import axios from 'axios';
import { API_BASE_URL } from './backendConfig';

// Create axios instance with cookie-based authentication
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Uses httpOnly cookie for authentication
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  }
});

// Request interceptor - inject token from localStorage as fallback
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
      
      // DO NOT redirect for soft-auth endpoints used by Navbar/UserContext on public pages
      const isSoftAuthEndpoint = endpoint.includes('/profiles/me') || endpoint.includes('/notifications/unread-count');
      
      if (!isSoftAuthEndpoint && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register') && !endpoint.includes('/auth/verify')) {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup') && window.location.pathname !== '/') {
          
          // Prevent race condition: if the token in localStorage is different from the one sent in the request,
          // it means the user has logged in again while this request was pending.
          const currentToken = localStorage.getItem('token') || sessionStorage.getItem('token');
          const sentAuthHeader = error.config?.headers?.Authorization as string | undefined;
          const sentToken = sentAuthHeader ? sentAuthHeader.split(' ')[1] : null;

          if (sentToken && currentToken && sentToken !== currentToken) {
            // Token changed, ignore this 401
            return Promise.reject(error);
          }

          // Clear local token on 401
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
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
  // Only check httpOnly cookies for actual authentication
  // The token is stored in httpOnly cookies via withCredentials: true
  // This function returns the actual authentication status (cookie-based only)
  const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('token='));
  return hasCookie;
};