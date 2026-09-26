export const PROD_BACKEND_URL = 'https://ayanshistockapi.flowoid.tech';
export const LOCAL_BACKEND_URL = 'http://localhost:8000';

export const DEFAULT_BACKEND_URL =
  process.env.NODE_ENV === 'production' ? PROD_BACKEND_URL : LOCAL_BACKEND_URL;

const API_PATH_PREFIX = '/api';

/**
 * Returns the base backend URL without trailing slash.
 * - In local dev (NODE_ENV !== 'production'): http://localhost:8000
 * - In production (NODE_ENV === 'production'): https://ayanshistockapi.flowoid.tech
 * No .env required! (Can still be overridden by BACKEND_URL if needed).
 */
export function getApiBaseUrl(overrideUrl?: string | null): string {
  const configuredUrl =
    overrideUrl ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (process.env.NODE_ENV === 'production' ? PROD_BACKEND_URL : LOCAL_BACKEND_URL);

  return configuredUrl.replace(/\/$/, '');
}

/**
 * Resolves full backend API route URL:
 * e.g. getApiUrl('auth/login')
 *  -> Local: http://localhost:8000/api/auth/login
 *  -> Prod:  https://ayanshistockapi.flowoid.tech/api/auth/login
 */
export function getApiUrl(path = '', overrideUrl?: string | null): string {
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getApiBaseUrl(overrideUrl);

  // Prevent duplicate `/api/api` if path or baseUrl already contains `/api`
  if (baseUrl.endsWith(API_PATH_PREFIX) && cleanPath.startsWith(`${API_PATH_PREFIX}/`)) {
    cleanPath = cleanPath.slice(API_PATH_PREFIX.length);
  } else if (!baseUrl.endsWith(API_PATH_PREFIX) && !cleanPath.startsWith(API_PATH_PREFIX)) {
    cleanPath = `${API_PATH_PREFIX}${cleanPath}`;
  }

  const baseWithoutTrailingSlash = baseUrl.replace(/\/$/, '');
  const pathWithoutLeadingSlash = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${baseWithoutTrailingSlash}${pathWithoutLeadingSlash}`;
}

/**
 * Returns the WebSocket / Socket.io server URL:
 * Automatically uses localhost:8000 in dev and production backend in prod.
 */
export function getSocketUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MONITORING_SOCKET_URL ||
    (process.env.NODE_ENV === 'production' ? PROD_BACKEND_URL : LOCAL_BACKEND_URL)
  );
}
