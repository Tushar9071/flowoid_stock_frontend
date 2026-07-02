import { useState, useEffect, useCallback, useMemo } from 'react';
import { logsApi, LogFilters, LogEntry, LogStats } from '@/lib/api/logs';
import { UserService } from '@/lib/services/user.service';

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

// Regex to extract HTTP info from morgan-style logs: "GET /api/... 200 142ms"
const HTTP_LOG_REGEX = /^(GET|POST|PUT|DELETE|PATCH)\s+(\S+)\s+(\d{3})\s+(?:-\s+)?(\d+(?:\.\d+)?)(?:ms)?/i;

export function useLogs(filters: LogFilters, autoRefresh: boolean, isRowExpanded: boolean) {
  const [logs, setLogs] = useState<(LogEntry & { userName?: string })[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  // Fetch users once to build a mapping of userId -> userName
  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await UserService.list({ limit: 1000 } as any);
        if (res.success && res.data) {
          const map: Record<string, string> = {};
          res.data.forEach((u: any) => {
            if (u.id) map[u.id] = u.name || u.email || u.phone;
          });
          setUserMap(map);
        }
      } catch (err) {
        console.error('Failed to load users for logs mapping', err);
      }
    }
    loadUsers();
  }, []);

  const fetchLogs = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    const res = await logsApi.getLogs(filters);
    if (res.success) {
      const responseData: any = res.data;
      const rawLogs = Array.isArray(responseData)
        ? responseData
        : (responseData?.data || responseData?.logs || responseData?.items || []);
      const logsTotal = responseData?.total ?? rawLogs.length;
      
      // Parse logs to extract hidden fields and map usernames
      const parsedLogs = rawLogs.map((log: LogEntry) => {
        const parsed: LogEntry & { userName?: string } = { ...log };
        
        // 1. Extract endpoint, duration, and status code from message if it's an HTTP log
        if (!parsed.endpoint || !parsed.duration) {
          const match = parsed.message.match(HTTP_LOG_REGEX);
          if (match) {
            parsed.endpoint = match[2];
            parsed.statusCode = parseInt(match[3], 10);
            parsed.duration = parseFloat(match[4]);
            if (!parsed.category || parsed.category === 'General') {
              parsed.category = 'http';
            }
          }
        }

        // 2. Map User ID to User Name
        const uid = parsed.userId || parsed.meta?.userId;
        if (uid && userMap[uid]) {
          parsed.userName = userMap[uid];
        } else if (parsed.meta?.userName) {
          parsed.userName = parsed.meta.userName;
        }

        return parsed;
      });

      setLogs(parsedLogs);
      setTotal(logsTotal);
      setError(null);
    } else {
      setError(res.error?.message || 'Failed to fetch logs');
    }
    if (showLoading) setIsLoading(false);
  }, [filters, userMap]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh || isRowExpanded) {
      return;
    }
    
    const interval = setInterval(() => {
      fetchLogs(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, isRowExpanded, fetchLogs]);

  const analytics = useMemo(() => {
    if (!logs.length) return null;

    let errorCount = 0;
    let warnCount = 0;
    const routes: Record<string, number> = {};
    const users: Record<string, { count: number; name: string }> = {};

    logs.forEach(log => {
      const level = String(log.level).toUpperCase();
      if (level === 'ERROR') errorCount++;
      if (level === 'WARN' || level === 'WARNING') warnCount++;

      const route = log.endpoint || log.meta?.route || log.meta?.endpoint;
      if (route) {
        routes[route] = (routes[route] || 0) + 1;
      }

      const uid = log.userId || log.meta?.userId;
      if (uid) {
        const name = log.userName || uid;
        if (!users[uid]) {
          users[uid] = { count: 0, name };
        }
        users[uid].count++;
      }
    });

    const mostCommonRoute = Object.entries(routes).sort((a, b) => b[1] - a[1])[0];
    const mostActiveUserEntry = Object.entries(users).sort((a, b) => b[1].count - a[1].count)[0];

    return {
      errorPercentage: Math.round((errorCount / logs.length) * 100),
      warningPercentage: Math.round((warnCount / logs.length) * 100),
      mostCommonRoute: mostCommonRoute ? { name: mostCommonRoute[0], count: mostCommonRoute[1] } : null,
      mostActiveUser: mostActiveUserEntry 
        ? { id: mostActiveUserEntry[0], name: mostActiveUserEntry[1].name, count: mostActiveUserEntry[1].count } 
        : null,
      totalLoaded: logs.length
    };
  }, [logs]);

  return { 
    logs, 
    total, 
    isLoading, 
    error, 
    analytics,
    refetch: () => fetchLogs(true) 
  };
}
