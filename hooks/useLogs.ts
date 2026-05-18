import { useState, useEffect, useCallback } from 'react';
import { logsApi, LogFilters, LogEntry, LogStats } from '@/lib/api/logs';

export function useLogStats() {
  const [stats, setStats] = useState<LogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    const res = await logsApi.getStats();
    if (res.success) {
      setStats(res.data);
      setError(null);
    } else {
      setError(res.error?.message || 'Failed to fetch log stats');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}

export function useLogs(filters: LogFilters, autoRefresh: boolean, isRowExpanded: boolean) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    const res = await logsApi.getLogs(filters);
    if (res.success) {
      const responseData: any = res.data;
      const logsArray = Array.isArray(responseData)
        ? responseData
        : (responseData?.data || responseData?.logs || responseData?.items || []);
      const logsTotal = responseData?.total ?? logsArray.length;
      
      setLogs(logsArray);
      setTotal(logsTotal);
      setError(null);
    } else {
      setError(res.error?.message || 'Failed to fetch logs');
    }
    if (showLoading) setIsLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh || isRowExpanded) return;
    const interval = setInterval(() => {
      fetchLogs(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, isRowExpanded, fetchLogs]);

  return { logs, total, isLoading, error, refetch: () => fetchLogs(true) };
}
