import { api } from '../api-client';
import { asListResponse, buildQuery } from '../services/api-normalizers';

export interface LogStats {
  last24h: {
    total: number;
    errors: number;
    warns: number;
  };
  last7d: {
    errors: number;
  };
  topErrors: Array<{ message: string; count: number }>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  createdAt?: string;
  level: string;
  category: string;
  message: string;
  endpoint?: string;
  duration?: number;
  userId?: string;
  requestId?: string;
  ip?: string;
  ipAddress?: string;
  statusCode?: number;
  meta?: Record<string, any>;
}

export interface LogFilters {
  level?: string;
  category?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

function normalizeFilters(filters: LogFilters) {
  return {
    level: filters.level && filters.level !== 'All' ? filters.level : undefined,
    category: filters.category && filters.category !== 'All' ? filters.category : undefined,
    search: filters.search,
    from: filters.startDate,
    to: filters.endDate,
    page: filters.page,
    limit: filters.limit,
  };
}

export const logsApi = {
  async getStats() {
    const response = asListResponse<LogEntry>(await api.get('/admin/logs?per_page=100'), 'logs');
    const logs = response.success ? response.data.items : [];
    const errors = logs.filter((log) => String(log.level).toUpperCase() === 'ERROR');
    const warns = logs.filter((log) => ['WARN', 'WARNING'].includes(String(log.level).toUpperCase()));

    return {
      success: response.success,
      data: {
        last24h: {
          total: logs.length,
          errors: errors.length,
          warns: warns.length,
        },
        last7d: {
          errors: errors.length,
        },
        topErrors: errors.slice(0, 5).map((log) => ({ message: log.message, count: 1 })),
      } satisfies LogStats,
      error: response.error,
    };
  },

  async getLogs(filters: LogFilters) {
    const response = asListResponse<LogEntry>(
      await api.get(`/admin/logs${buildQuery(normalizeFilters(filters))}`),
      'logs'
    );

    return response.success
      ? {
          ...response,
          data: {
            data: response.data.items,
            total: response.data.pagination?.totalItems || response.data.items.length,
          },
        }
      : response as any;
  },
};
