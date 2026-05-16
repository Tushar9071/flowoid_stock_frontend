'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card } from '@/components/ui/card';
import { MonitoringService } from '@/lib/services/monitoring.service';
import { MonitoringMetrics } from '@/lib/types';
import {
  Activity,
  Clock,
  Cpu,
  Database,
  HardDrive,
  Loader2,
  Route,
  Server,
  Wifi,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MONITORING_SOCKET_URL = process.env.NEXT_PUBLIC_MONITORING_SOCKET_URL as string;

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'fallback' | 'disconnected'>('connecting');

  const fetchMetrics = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await MonitoringService.getMetrics();
      if (response.success) {
        setMetrics(response.data);
      } else {
        toast.error(response.error?.message || 'Failed to load monitoring metrics');
      }
    } catch {
      toast.error('Failed to load monitoring metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    let socket: Socket | null = null;
    let fallbackInterval: number | undefined;
    let fallbackStarted = false;

    const connectSocket = () => {
      const token = localStorage.getItem('auth_token');
      socket = io(MONITORING_SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        auth: token ? { token } : undefined,
        extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      socket.on('connect', () => {
        setSocketStatus('connected');
        socket?.emit('metrics:refresh');
      });

      socket.on('metrics:update', (nextMetrics: MonitoringMetrics) => {
        setMetrics(nextMetrics);
        setIsLoading(false);
      });

      socket.on('connect_error', () => {
        setSocketStatus('fallback');
        if (!fallbackStarted) {
          fallbackStarted = true;
          fallbackInterval = window.setInterval(() => fetchMetrics(true), 15000);
        }
      });

      socket.on('disconnect', () => {
        setSocketStatus('disconnected');
      });
    };

    connectSocket();

    return () => {
      if (fallbackInterval) window.clearInterval(fallbackInterval);
      socket?.disconnect();
    };
  }, []);

  const topRoutes = useMemo(() => {
    if (!metrics?.api.routes) return [];
    return Object.entries(metrics.api.routes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="h-9 w-9 animate-spin text-[#0D7377]" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8">
        <Card className="rounded-xl border border-red-100 bg-red-50 p-8 text-center text-red-700">
          Monitoring metrics are not available for this account.
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm font-semibold text-gray-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-green-700">
            <span className={`h-2 w-2 rounded-full ${socketStatus === 'connected' ? 'bg-green-500' : 'bg-amber-500'}`} />
            {socketStatus === 'connected' ? 'Socket Live' : 'REST Fallback'}
          </span>
          <span>Updated {new Date(metrics.timestamp).toLocaleString()}</span>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Server} label="Service Uptime" value={formatUptime(metrics.service.uptimeSeconds)} detail={`PID ${metrics.service.pid}`} />
        <MetricCard icon={Cpu} label="CPU Usage" value={`${Number(metrics.system.cpuUsagePercent || 0).toFixed(1)}%`} detail={`${metrics.system.cpuCount} cores`} />
        <MetricCard icon={HardDrive} label="Memory Usage" value={`${Number(metrics.system.memoryUsagePercent || 0).toFixed(1)}%`} detail={`${metrics.system.usedMemoryMb} / ${metrics.system.totalMemoryMb} MB`} />
        <MetricCard icon={Database} label="Database" value={metrics.database.status} detail={`${metrics.database.latencyMs ?? '-'} ms latency`} good={metrics.database.status === 'UP'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-[#0F2A4A]">API Traffic</h2>
              <p className="text-sm text-gray-500">Requests and response behavior from the backend</p>
            </div>
            <Activity className="h-5 w-5 text-[#0D7377]" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <SmallStat label="Total Requests" value={metrics.api.totalRequests} />
            <SmallStat label="Active Requests" value={metrics.api.activeRequests} />
            <SmallStat label="Avg Response" value={`${metrics.api.averageResponseTimeMs} ms`} />
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">Top Routes</h3>
            <div className="space-y-2">
              {topRoutes.length > 0 ? topRoutes.map(([routeName, count]) => (
                <div key={routeName} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Route className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="truncate text-sm font-semibold text-gray-700">{routeName}</span>
                  </div>
                  <span className="text-sm font-black text-[#0D7377]">{count}</span>
                </div>
              )) : (
                <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
                  No route data yet.
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-[#0F2A4A]">Runtime</h2>
              <p className="text-sm text-gray-500">Node and host details</p>
            </div>
            <Wifi className="h-5 w-5 text-[#0D7377]" />
          </div>

          <div className="space-y-3">
            <RuntimeRow label="Host" value={metrics.system.hostname} />
            <RuntimeRow label="Platform" value={metrics.service.platform} />
            <RuntimeRow label="Node" value={metrics.service.nodeVersion} />
            <RuntimeRow label="Started" value={new Date(metrics.service.startedAt).toLocaleString()} />
            <RuntimeRow label="RSS" value={`${metrics.process.rssMb} MB`} />
            <RuntimeRow label="Heap Used" value={`${metrics.process.heapUsedMb} MB`} />
          </div>
        </Card>
      </div>

      <Card className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#0D7377]" />
          <h2 className="text-base font-black text-[#0F2A4A]">Status Codes</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(metrics.api.statusCodes || {}).length > 0 ? Object.entries(metrics.api.statusCodes || {}).map(([code, count]) => (
            <div key={code} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">HTTP {code}</p>
              <p className="mt-1 text-2xl font-black text-[#0F2A4A]">{count}</p>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-gray-200 p-6 text-sm font-medium text-gray-500 lg:col-span-5">
              No status code data yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  good,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
  good?: boolean;
}) {
  return (
    <Card className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-500">{label}</p>
          <p className={`mt-1 text-3xl font-black ${good ? 'text-green-700' : 'text-[#0F2A4A]'}`}>{value}</p>
          <p className="mt-1 text-xs font-medium text-gray-400">{detail}</p>
        </div>
        <div className="rounded-xl bg-[#0D7377]/10 p-3 text-[#0D7377]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function SmallStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#0F2A4A]">{value}</p>
    </div>
  );
}

function RuntimeRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 last:border-0">
      <span className="text-sm font-semibold text-gray-500">{label}</span>
      <span className="text-right text-sm font-bold text-gray-900">{value}</span>
    </div>
  );
}
