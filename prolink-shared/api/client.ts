import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// ─── Types ─────────────────────────────────────────────────────────

export interface ApiClientConfig {
  /** Base URL of the ProLink API (e.g. "https://api.prolink.ng" or "http://localhost:5000") */
  baseURL?: string;
  /** Function that returns the current auth token. Called on every request. */
  getToken?: () => string | null | undefined;
  /** Called when a 401 response is received. */
  onUnauthorized?: () => void;
  /** Additional default Axios config */
  axiosConfig?: AxiosRequestConfig;
}

export interface ProLinkApiClient {
  instance: AxiosInstance;
  configureAuth: (getToken: () => string | null | undefined) => void;
  configureOnUnauthorized: (handler: () => void) => void;
  setBaseURL: (url: string) => void;
}

// ─── Default Base URL ──────────────────────────────────────────────

const DEFAULT_BASE_URL =
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'http://localhost:5000';

// ─── Client Factory ────────────────────────────────────────────────

let _getToken: (() => string | null | undefined) | null = null;
let _onUnauthorized: (() => void) | null = null;

/**
 * Create a configured Axios instance for the ProLink API.
 *
 * Usage (web):
 * ```ts
 * import { createApiClient } from 'prolink-shared/api/client';
 * const api = createApiClient({ baseURL: API_BASE_URL });
 * ```
 *
 * Usage (React Native):
 * ```ts
 * import { createApiClient } from 'prolink-shared/api/client';
 * const api = createApiClient({
 *   baseURL: EXPO_PUBLIC_API_URL,
 *   getToken: () => SecureStore.getItemAsync('token'),
 * });
 * ```
 */
export function createApiClient(config?: ApiClientConfig): ProLinkApiClient {
  const baseURL = config?.baseURL || DEFAULT_BASE_URL;

  if (config?.getToken) {
    _getToken = config.getToken;
  }
  if (config?.onUnauthorized) {
    _onUnauthorized = config.onUnauthorized;
  }

  const instance = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
    ...config?.axiosConfig,
  });

  // ── Request interceptor: inject Bearer token ────────────────────
  instance.interceptors.request.use(
    (reqConfig: InternalAxiosRequestConfig) => {
      if (_getToken) {
        const token = _getToken();
        if (token) {
          reqConfig.headers.Authorization = `Bearer ${token}`;
        }
      }
      return reqConfig;
    },
    (error) => Promise.reject(error)
  );

  // ── Response interceptor: handle 401 ────────────────────────────
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        if (_onUnauthorized) {
          _onUnauthorized();
        }
      }
      return Promise.reject(error);
    }
  );

  return {
    instance,
    configureAuth: (getToken: () => string | null | undefined) => {
      _getToken = getToken;
    },
    configureOnUnauthorized: (handler: () => void) => {
      _onUnauthorized = handler;
    },
    setBaseURL: (url: string) => {
      instance.defaults.baseURL = url;
    },
  };
}

// ─── Default Export ────────────────────────────────────────────────
// Pre-configured client that consumers can customise after import.

export const apiClient = createApiClient();
export default apiClient;
