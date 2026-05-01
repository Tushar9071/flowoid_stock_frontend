/**
 * API Client for Flowoid Stock
 * Handles base URL, credentials, and common response formatting.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_PROXY_URL || '/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  headers.set('X-Requested-With', 'XMLHttpRequest'); // Helps with some CSRF/CORS setups
  
  // Add Bearer token if a backend deployment exposes one. Cookie auth is handled
  // by the same-origin /api proxy so browser requests do not depend on CORS cookies.
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
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

    // Debug log to help identify the token location (Development only)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${endpoint}:`, { 
        status: response.status, 
        body: result,
        headers: Object.fromEntries(response.headers.entries())
      });
    }

    // Deep search for anything that looks like a token in body
    const findToken = (obj: any): string | null => {
      if (!obj || typeof obj !== 'object') return null;
      if (typeof obj.accessToken === 'string') return obj.accessToken;
      if (typeof obj.token === 'string') return obj.token;
      if (typeof obj.access_token === 'string') return obj.access_token;
      
      // Check data property specifically
      if (obj.data) {
        const t = findToken(obj.data);
        if (t) return t;
      }
      
      // Check user property specifically
      if (obj.user) {
        const t = findToken(obj.user);
        if (t) return t;
      }

      return null;
    };

    const possibleToken = headerToken || findToken(result);

    if (possibleToken) {
      localStorage.setItem('auth_token', possibleToken);
    }

    if (!response.ok) {
      return {
        success: false,
        data: null as any,
        error: result?.error || {
          code: 'FETCH_ERROR',
          message: response.status === 500
            ? 'Backend server error. Please check the API logs or try again.'
            : `Request failed with status ${response.status}`,
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
  delete: <T>(url: string, options?: RequestInit) => apiFetch<T>(url, { ...options, method: 'DELETE' }),
};
