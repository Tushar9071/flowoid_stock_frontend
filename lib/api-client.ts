/**
 * API Client for Flowoid Stock
 * Handles base URL, credentials, and common response formatting.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_PROXY_URL || '/api';
const ACCESS_TOKEN_STORAGE_KEY = 'auth_token';
const REFRESH_BEFORE_EXPIRY_MS = 60_000;
const MIN_REFRESH_INTERVAL_MS = 30_000;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

let refreshPromise: Promise<boolean> | null = null;
let lastRefreshAttemptAt = 0;

function getStoredAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function getAccessTokenExpiryMs(token = getStoredAccessToken()) {
  if (!token) return null;

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
  if (!expiryMs) return null;
  if (expiryMs <= Date.now()) return null;
  return Math.max(expiryMs - Date.now() - REFRESH_BEFORE_EXPIRY_MS, MIN_REFRESH_INTERVAL_MS);
}

function shouldRefreshAccessToken() {
  const expiryMs = getAccessTokenExpiryMs();
  if (!expiryMs) return false;
  return expiryMs - Date.now() <= REFRESH_BEFORE_EXPIRY_MS;
}

function findToken(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null;
  if (typeof obj.accessToken === 'string') return obj.accessToken;
  if (typeof obj.token === 'string') return obj.token;
  if (typeof obj.access_token === 'string') return obj.access_token;

  if (obj.data) {
    const token = findToken(obj.data);
    if (token) return token;
  }

  if (obj.user) {
    const token = findToken(obj.user);
    if (token) return token;
  }

  return null;
}

export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  if (Date.now() - lastRefreshAttemptAt < MIN_REFRESH_INTERVAL_MS) {
    return false;
  }

  lastRefreshAttemptAt = Date.now();
  refreshPromise = refreshAccessTokenRequest().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function refreshAccessTokenRequest() {
  const headers = new Headers();
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  headers.set('X-Requested-With', 'XMLHttpRequest');

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers,
    credentials: 'include',
  });

  const text = await response.text();
  let result: any = null;
  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    result = null;
  }
  const headerToken = response.headers.get('Authorization')?.replace('Bearer ', '') ||
    response.headers.get('x-access-token') ||
    response.headers.get('accessToken');
  const token = headerToken || findToken(result);

  if (token && typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  }

  return response.ok;
}

export async function ensureFreshAccessToken() {
  if (!shouldRefreshAccessToken()) return true;
  return refreshAccessToken();
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retryOnUnauthorized = true
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;

  if (
    typeof window !== 'undefined' &&
    retryOnUnauthorized &&
    !endpoint.startsWith('/auth/') &&
    shouldRefreshAccessToken()
  ) {
    await refreshAccessToken();
  }
  
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  headers.set('X-Requested-With', 'XMLHttpRequest'); // Helps with some CSRF/CORS setups
  
  // Add Bearer token if a backend deployment exposes one. Cookie auth is handled
  // by the same-origin /api proxy so browser requests do not depend on CORS cookies.
  if (typeof window !== 'undefined') {
    const token = getStoredAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Ensure cookies are sent (equivalent to withCredentials: true)
  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);
    
    // Check headers for token first (some backends send it here)
    const headerToken = response.headers.get('Authorization')?.replace('Bearer ', '') || 
                       response.headers.get('x-access-token') ||
                       response.headers.get('accessToken');

    const responseText = await response.text();
    const contentType = response.headers.get('content-type') || '';
    let result: any = null;

    if (responseText) {
      if (contentType.includes('application/json')) {
        try {
          result = JSON.parse(responseText);
        } catch {
          result = {
            success: false,
            error: {
              code: 'INVALID_JSON_RESPONSE',
              message: responseText.trim().startsWith('<!DOCTYPE')
                ? 'Server returned an HTML page instead of JSON. Please check the API route or session.'
                : 'Server returned invalid JSON.',
            },
          };
        }
      } else {
        result = {
          success: false,
          error: {
            code: 'NON_JSON_RESPONSE',
            message: responseText.trim().startsWith('<!DOCTYPE')
              ? 'Server returned an HTML page instead of JSON. Please check the API route or session.'
              : responseText.slice(0, 200),
          },
        };
      }
    }

    if (
      process.env.NODE_ENV === 'development' &&
      process.env.NEXT_PUBLIC_API_DEBUG === 'true'
    ) {
      console.debug(`[API Response] ${endpoint}`, {
        status: response.status,
        ok: response.ok,
        bytes: responseText.length,
      });
    }

    const possibleToken = headerToken || findToken(result);

    if (possibleToken) {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, possibleToken);
    }

    if (!response.ok) {
      if (response.status === 401 && retryOnUnauthorized && endpoint !== '/auth/refresh') {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return apiFetch<T>(endpoint, options, false);
        }
      }

      return {
        success: false,
        data: null as any,
        error: result?.error || {
          code: result?.statusCode ? String(result.statusCode) : 'FETCH_ERROR',
          message:
            result?.message ||
            result?.error?.message ||
            (response.status === 500
              ? 'Backend server error. Please check the API logs or try again.'
              : `Request failed with status ${response.status}`),
          // Capture field-level validation errors from the backend
          details: result?.errors || result?.details || result?.validationErrors || result?.error?.details,
        },
      };
    }

    if (result && typeof result === 'object' && 'success' in result) {
      return result as ApiResponse<T>;
    }

    // Backend returned data directly, wrap it for consistency
    return {
      success: true,
      data: result as T
    };
  } catch (error: any) {
    console.error('API Fetch Error:', error);
    return {
      success: false,
      data: null as any,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network request failed',
      },
    };
  }
}

export const api = {
  get: <T>(url: string, options?: RequestInit) => apiFetch<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body?: any, options?: RequestInit) => 
    apiFetch<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body?: any, options?: RequestInit) => 
    apiFetch<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(url: string, body?: any, options?: RequestInit) =>
    apiFetch<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string, options?: RequestInit) => apiFetch<T>(url, { ...options, method: 'DELETE' }),
};
