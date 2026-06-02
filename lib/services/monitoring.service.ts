import { api } from '../api-client';
import type { ApiResponse } from '../api-client';
import { MonitoringMetrics } from '../types';

function mb(bytes?: number) {
  return Math.round(((bytes || 0) / 1024 / 1024) * 100) / 100;
}

function normalizeStatus(status: any, apiStats?: any): MonitoringMetrics {
  const memoryUsage = status?.memoryUsage || {};
  const heapTotalMb = mb(memoryUsage.heapTotal);
  const heapUsedMb = mb(memoryUsage.heapUsed);
  const rssMb = mb(memoryUsage.rss);
  const memoryUsagePercent = heapTotalMb > 0 ? (heapUsedMb / heapTotalMb) * 100 : 0;

  return {
    timestamp: new Date().toISOString(),
    service: {
      uptimeSeconds: Number(status?.uptime || 0),
      pid: Number(status?.process?.pid || 0),
      nodeVersion: status?.process?.nodeVersion || '',
      platform: status?.process?.platform || '',
      startedAt: new Date(Date.now() - Number(status?.uptime || 0) * 1000).toISOString(),
    },
    system: {
      hostname: '',
      cpuUsagePercent: 0,
      cpuCount: 0,
      loadAverage: [],
      totalMemoryMb: heapTotalMb,
      usedMemoryMb: heapUsedMb,
      freeMemoryMb: Math.max(heapTotalMb - heapUsedMb, 0),
      memoryUsagePercent,
    },
    process: {
      rssMb,
      heapTotalMb,
      heapUsedMb,
      externalMb: mb(memoryUsage.external),
    },
    api: {
      totalRequests: Number(apiStats?.total || 0),
      activeRequests: 0,
      averageResponseTimeMs: Number(apiStats?.avgResponseTimeMs || 0),
      statusCodes: {
        success: Number(apiStats?.success || 0),
        warning: Number(apiStats?.warning || 0),
        error: Number(apiStats?.error || 0),
      },
      routes: {},
    },
    database: {
      status: 'UP',
      latencyMs: null,
    },
  };
}

export const MonitoringService = {
  async getMetrics(): Promise<ApiResponse<MonitoringMetrics>> {
    const [statusRes, apiStatsRes] = await Promise.all([
      api.get<any>('/admin/monitoring/status'),
      api.get<any>('/admin/monitoring/api-stats').catch(() => ({ success: false, data: null })),
    ]);

    if (!statusRes.success) return statusRes as ApiResponse<MonitoringMetrics>;

    return {
      ...statusRes,
      data: normalizeStatus(statusRes.data, apiStatsRes.success ? apiStatsRes.data : null),
    };
  },

  async refreshSession() {
    return api.post<{ message?: string }>('/auth/refresh');
  },
};
