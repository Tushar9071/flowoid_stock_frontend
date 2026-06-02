const API_BASE_URL = process.env.NEXT_PUBLIC_API_PROXY_URL || '/api';
export const ACCESS_TOKEN_STORAGE_KEY = 'auth_token';
export const AUTH_USER_STORAGE_KEY = 'flowoid_auth_user';

const REFRESH_BEFORE_EXPIRY_MS = 60_000;
const MIN_REFRESH_INTERVAL_MS = 30_000;

export type ApiError = {
  code: string;
  message: string;
  details?: any;
  status?: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  error?: ApiError;
};

type RequestOptions = RequestInit & {
  skipAuthRefresh?: boolean;
  raw?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;
let lastRefreshAttemptAt = 0;

function isBrowser() {
  return typeof window !== 'undefined';
}

function joinUrl(endpoint: string) {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
}

function storedAccessToken() {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

function saveAuthPayload(payload: any) {
  if (!isBrowser() || !payload) return;

  const token = payload.accessToken || payload.token || payload.access_token || payload.data?.accessToken;
  if (typeof token === 'string' && token.length > 0) {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  }

  const user = payload.user || payload.data?.user;
  if (user) {
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  }
}

export function clearAuthStorage() {
  if (!isBrowser()) return;
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

export function getAccessTokenExpiryMs(token = storedAccessToken()) {
  if (!token || !isBrowser()) return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(normalized));
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function getMsUntilAccessTokenRefresh() {
  const expiryMs = getAccessTokenExpiryMs();
  if (!expiryMs || expiryMs <= Date.now()) return null;
  return Math.max(expiryMs - Date.now() - REFRESH_BEFORE_EXPIRY_MS, MIN_REFRESH_INTERVAL_MS);
}

function shouldRefreshAccessToken() {
  const expiryMs = getAccessTokenExpiryMs();
  return Boolean(expiryMs && expiryMs - Date.now() <= REFRESH_BEFORE_EXPIRY_MS);
}

async function parseBody(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!text) return null;
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        error: {
          code: 'INVALID_JSON_RESPONSE',
          message: 'Server returned invalid JSON.',
        },
      };
    }
  }

  return text;
}

function normalizeError(status: number, payload: any): ApiError {
  return {
    status,
    code: payload?.error?.code || payload?.code || String(status),
    message:
      payload?.error?.message ||
      payload?.message ||
      (status === 403
        ? 'Permission denied.'
        : status === 401
          ? 'Authentication is required.'
          : `Request failed with status ${status}`),
    details: payload?.error?.details || payload?.details,
  };
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
  retryOnUnauthorized = true
): Promise<ApiResponse<T>> {
  if (
    isBrowser() &&
    retryOnUnauthorized &&
    !options.skipAuthRefresh &&
    !endpoint.startsWith('/auth/') &&
    shouldRefreshAccessToken()
  ) {
    await refreshAccessToken();
  }

  const headers = new Headers(options.headers);
  headers.set('Accept', headers.get('Accept') || 'application/json');
  headers.set('X-Requested-With', 'XMLHttpRequest');

  const token = storedAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const hasFormBody = options.body instanceof FormData;
  if (!hasFormBody && options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(joinUrl(endpoint), {
      ...options,
      headers,
      credentials: 'include',
      cache: options.cache || 'no-store',
    });

    if (options.raw) {
      return {
        success: response.ok,
        data: response as T,
        error: response.ok ? undefined : normalizeError(response.status, null),
      };
    }

    const payload = await parseBody(response);
    if (payload && typeof payload === 'object') saveAuthPayload(payload);

    if (!response.ok) {
      if (response.status === 401 && retryOnUnauthorized && endpoint !== '/auth/refresh') {
        const refreshed = await refreshAccessToken();
        if (refreshed) return request<T>(endpoint, options, false);
      }

      if (response.status === 401) clearAuthStorage();

      return {
        success: false,
        data: null as T,
        error: normalizeError(response.status, payload),
      };
    }

    if (payload && typeof payload === 'object' && 'success' in payload) {
      return payload as ApiResponse<T>;
    }

    return {
      success: true,
      data: payload as T,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null as T,
      error: {
        code: 'NETWORK_ERROR',
        message: error?.message || 'Network request failed.',
      },
    };
  }
}

export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  if (Date.now() - lastRefreshAttemptAt < MIN_REFRESH_INTERVAL_MS) return false;

  lastRefreshAttemptAt = Date.now();
  refreshPromise = request<any>(
    '/auth/refresh',
    { method: 'POST', skipAuthRefresh: true },
    false
  )
    .then((response) => response.success)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function ensureFreshAccessToken() {
  if (!shouldRefreshAccessToken()) return true;
  return refreshAccessToken();
}

function bodyInit(body?: any) {
  if (body === undefined || body instanceof FormData) return body;
  return JSON.stringify(body);
}

export const api = {
  get: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'POST', body: bodyInit(body) }),
  put: <T>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'PUT', body: bodyInit(body) }),
  patch: <T>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'PATCH', body: bodyInit(body) }),
  delete: <T>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'DELETE', body: bodyInit(body) }),
};
