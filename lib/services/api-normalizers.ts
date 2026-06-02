import type { ApiResponse } from '../api-client';

export type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue>;
export type BackendRecord = Record<string, any>;

export type PaginatedResponse<T> = {
  items: T[];
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export function buildQuery(params: QueryParams = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    const normalizedKey = key === 'limit' ? 'per_page' : key;
    query.set(normalizedKey, String(value));
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export function unwrapKey<T = BackendRecord>(payload: any, key: string): T {
  return (payload?.[key] ?? payload) as T;
}

export function asListResponse<T = BackendRecord>(
  response: ApiResponse<any>,
  key: string
): ApiResponse<PaginatedResponse<T>> {
  if (!response.success) return response as ApiResponse<PaginatedResponse<T>>;

  const items = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.[key])
      ? response.data[key]
      : Array.isArray(response.data?.items)
        ? response.data.items
        : [];

  const meta = response.meta;
  return {
    ...response,
    data: {
      items,
      pagination: meta
        ? {
            page: meta.page,
            limit: meta.per_page,
            totalItems: meta.total,
            totalPages: meta.total_pages,
            hasNextPage: meta.page < meta.total_pages,
            hasPreviousPage: meta.page > 1,
          }
        : undefined,
    },
  };
}

export function asItemResponse<T = BackendRecord>(
  response: ApiResponse<any>,
  key: string
): ApiResponse<T> {
  if (!response.success) return response as ApiResponse<T>;
  return {
    ...response,
    data: unwrapKey<T>(response.data, key),
  };
}

export function responseItems<T = BackendRecord>(
  payload: T[] | PaginatedResponse<T> | BackendRecord | null | undefined
): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray((payload as PaginatedResponse<T>).items)) return (payload as PaginatedResponse<T>).items;

  const record = payload as BackendRecord;
  const arrayValue = Object.values(record).find(Array.isArray);
  return Array.isArray(arrayValue) ? arrayValue as T[] : [];
}
