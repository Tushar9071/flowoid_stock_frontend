const API_PATH_PREFIX = '/api';

export function getApiBaseUrl() {
  const configuredUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  if (process.env.NODE_ENV === 'development') {
    throw new Error('BACKEND_API_URL or NEXT_PUBLIC_API_URL environment variable is not defined');
  }

  return '';
}

export function getApiUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${API_PATH_PREFIX}${normalizedPath}`;
}
