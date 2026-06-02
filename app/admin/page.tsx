'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { MonitoringService } from '@/lib/services/monitoring.service';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Server,
  Shield,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';

type AdminDashboardData = {
  owners: {
    total: number;
    active: number;
    inactive: number;
  };
  recentLoginActivity: Array<{
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    role: string;
    lastLoginAt?: string | null;
  }>;
  systemHealth: {
    uptime: number;
    memoryUsage: Record<string, number>;
    nodeVersion: string;
  };
  apiRequestStats: {
    total: number;
    success: number;
    error: number;
  };
  backupStatus: {
    lastBackupDate: string | null;
    lastBackupStatus: 'SUCCESS' | 'FAILED' | null;
  };
  recentIssues: Array<{
    id: string;
    level: string;
    message: string;
    createdAt: string;
  }>;
};

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = React.useState<AdminDashboardData | null>(null);
  const [metrics, setMetrics] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const [dashboardRes, metricsRes] = await Promise.all([
          api.get<AdminDashboardData>('/admin/dashboard'),
          MonitoringService.getMetrics().catch(() => ({ success: false, data: null })),
        ]);

        if (dashboardRes.success) {
          setDashboard(dashboardRes.data);
        }

        if (metricsRes.success) {
          setMetrics(metricsRes.data);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Owners',
      value: dashboard?.owners.total || 0,
      sub: 'Registered owner accounts',
      icon: Users,
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      label: 'Active Owners',
      value: dashboard?.owners.active || 0,
      sub: 'Can access workspace',
      icon: CheckCircle2,
      gradient: 'from-[#0D7377] to-teal-600',
    },
    {
      label: 'Inactive Owners',
      value: dashboard?.owners.inactive || 0,
      sub: 'Access disabled',
      icon: Shield,
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      label: 'API Events',
      value: dashboard?.apiRequestStats.total || 0,
      sub: `${dashboard?.apiRequestStats.error || 0} warnings/errors`,
      icon: Activity,
      gradient: 'from-slate-700 to-slate-900',
    },
  ];

  const memoryPercent = metrics?.system?.memoryUsagePercent ?? 0;
  const databaseStatus = metrics?.database?.status || 'UP';
  const uptimeSeconds = metrics?.service?.uptimeSeconds ?? dashboard?.systemHealth.uptime ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid gap-5 md:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="theme-card-accent rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="mt-1.5 text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="mt-1 text-xs text-gray-400">{stat.sub}</p>
                </div>
                <div className={`rounded-xl bg-gradient-to-br ${stat.gradient} p-3 text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Admin Activity</h3>
              <p className="text-xs text-gray-500">Recent backend login and issue data</p>
            </div>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">Recent Logins</h4>
              <div className="space-y-3">
                {(dashboard?.recentLoginActivity || []).length > 0 ? (
                  dashboard?.recentLoginActivity.map((login) => (
                    <div key={login.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="font-bold text-gray-900">{login.name}</p>
                      <p className="text-xs text-gray-500">{login.email || login.phone || '-'}</p>
                      <p className="mt-1 text-[11px] font-medium text-gray-400">{formatDate(login.lastLoginAt)}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">No recent login activity.</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">Recent Issues</h4>
              <div className="space-y-3">
                {(dashboard?.recentIssues || []).length > 0 ? (
                  dashboard?.recentIssues.slice(0, 5).map((issue) => (
                    <div key={issue.id} className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                      <p className="text-xs font-black uppercase text-amber-700">{issue.level}</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">{issue.message}</p>
                      <p className="mt-1 text-[11px] text-gray-500">{formatDate(issue.createdAt)}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">No recent backend issues.</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">System Health</h3>
              <Server className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Clock className="h-4 w-4" /> Uptime
                </div>
                <span className="text-sm font-bold text-gray-900">{formatUptime(uptimeSeconds)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Database className="h-4 w-4" /> Database
                </div>
                <span className={`text-sm font-bold ${databaseStatus === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
                  {databaseStatus}
                </span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Activity className="h-4 w-4" /> Memory
                </div>
                <span className="text-sm font-bold text-gray-900">{Number(memoryPercent).toFixed(1)}%</span>
              </div>
            </div>
          </Card>

          <Card className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-5 text-base font-bold text-gray-900">Backup Status</h3>
            {dashboard?.backupStatus.lastBackupDate ? (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className={`text-sm font-black ${dashboard.backupStatus.lastBackupStatus === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                  {dashboard.backupStatus.lastBackupStatus || 'UNKNOWN'}
                </p>
                <p className="mt-1 text-xs text-gray-500">{formatDate(dashboard.backupStatus.lastBackupDate)}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                <AlertCircle className="mb-3 h-10 w-10 text-amber-500" />
                <p className="text-xs font-medium text-gray-600">No backup has been recorded yet</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
