export const DEFAULT_BACKEND_URL = 'https://ayanshistockapi.flowoid.tech';
const API_PATH_PREFIX = '/api';

export function getApiBaseUrl(overrideUrl?: string | null) {
  const configuredUrl =
    overrideUrl ||
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_BACKEND_URL;

  return configuredUrl.replace(/\/$/, '');
}

export function getApiUrl(path = '', overrideUrl?: string | null) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getApiBaseUrl(overrideUrl);
  const apiBaseUrl = baseUrl.endsWith(API_PATH_PREFIX) ? baseUrl : `${baseUrl}${API_PATH_PREFIX}`;
  return `${apiBaseUrl}${normalizedPath}`;
}
