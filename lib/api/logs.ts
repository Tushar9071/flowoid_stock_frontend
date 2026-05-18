import { api } from '../api-client';

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
  level: string;
  category: string;
  message: string;
  endpoint?: string;
  duration?: number;
  userId?: string;
  requestId?: string;
  ip?: string;
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

export const logsApi = {
  getStats: () => api.get<LogStats>('/admin/logs/stats'),
  
  getLogs: (filters: LogFilters) => {
    const params = new URLSearchParams();
    if (filters.level && filters.level !== 'All') params.append('level', filters.level);
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    params.append('page', filters.page.toString());
    params.append('limit', filters.limit.toString());
    
    return api.get<{ data: LogEntry[]; total: number }>(`/admin/logs?${params.toString()}`);
  }
};
