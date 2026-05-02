import { api } from '../api-client';
import { MonitoringMetrics } from '../types';

export const MonitoringService = {
  async getMetrics() {
    return api.get<MonitoringMetrics>('/monitoring/metrics');
  },

  async refreshSession() {
    return api.post<{ message?: string }>('/auth/refresh');
  },
};
