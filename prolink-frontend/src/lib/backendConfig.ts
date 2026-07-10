const PRODUCTION_API_BASE_URL = 'https://prolink-backend.vercel.app/api';
const PRODUCTION_SOCKET_URL = 'https://prolink-backend.vercel.app';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const ensureApiSuffix = (value: string) => {
  const normalized = trimTrailingSlash(value);
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

/**
 * Resolve the API base URL from environment variables.
 * Falls back to the production backend URL if env vars are missing or empty.
 *
 * Handles edge cases:
 * - Empty string env vars (Vercel sometimes returns "")
 * - Missing /api suffix
 * - Missing protocol
 */
const resolveConfiguredApiBaseUrl = () => {
  // NEXT_PUBLIC_API_BASE_URL should be e.g. "https://prolink-backend.vercel.app/api"
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  // NEXT_PUBLIC_API_URL should be e.g. "https://prolink-backend.vercel.app" (without /api)
  const envUrl2 = process.env.NEXT_PUBLIC_API_URL;

  // Pick first non-empty value
  let configured = envUrl || envUrl2 || '';

  // If all empty, fall back to production URL
  if (!configured || configured.trim() === '') {
    console.warn(
      '[ProLink] NEXT_PUBLIC_API_BASE_URL is not set. ' +
      'Using fallback URL. Please set this env var in your Vercel dashboard.'
    );
    return ensureApiSuffix(PRODUCTION_API_BASE_URL);
  }

  if (configured && !configured.startsWith('http://') && !configured.startsWith('https://')) {
    configured = `https://${configured}`;
  }

  return ensureApiSuffix(configured);
};

export const API_BASE_URL = resolveConfiguredApiBaseUrl();
export const SOCKET_URL = (() => {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (socketUrl && socketUrl.trim() !== '') {
    return socketUrl.trim();
  }
  // Derive socket URL from API URL if not set
  if (API_BASE_URL !== PRODUCTION_API_BASE_URL) {
    return API_BASE_URL.replace(/\/api$/, '');
  }
  return PRODUCTION_SOCKET_URL;
})();
