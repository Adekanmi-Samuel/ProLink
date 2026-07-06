const DEFAULT_API_BASE_URL = 'https://prolink-backend.vercel.app/api';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const ensureApiSuffix = (value: string) => {
  const normalized = trimTrailingSlash(value);
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

const resolveConfiguredApiBaseUrl = () => {
  let configured =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_API_BASE_URL;

  if (configured && !configured.startsWith('http://') && !configured.startsWith('https://')) {
    configured = `https://${configured}`;
  }

  return ensureApiSuffix(configured);
};

export const API_BASE_URL = resolveConfiguredApiBaseUrl();
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE_URL.replace(/\/api$/, '');

