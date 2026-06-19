'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { MonitoringService } from '@/lib/services/monitoring.service';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Users, Activity, Clock, Server, AlertCircle, HardDrive, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

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
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { 
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
}

function ProgressBar({ value, colorClass }: { value: number, colorClass: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#f3f4f6] mt-3">
      <div 
        className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsDashboardLoading(true);
      try {
        const [dashboardRes, metricsRes] = await Promise.all([
          api.get<AdminDashboardData>('/admin/dashboard'),
          MonitoringService.getMetrics().catch(() => ({ success: false, data: null })),
        ]);

        if (dashboardRes.success) setDashboard(dashboardRes.data);
        if (metricsRes.success) setMetrics(metricsRes.data);
      } finally {
        setIsDashboardLoading(false);
      }
    };

    fetchDashboard();
    const interval = setInterval(async () => {
      const res = await MonitoringService.getMetrics().catch(() => null);
      if (res?.success) setMetrics(res.data);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  if (isDashboardLoading) {
    return (
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[140px] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] rounded-2xl lg:col-span-2" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-2xl w-full" />
      </div>
    );
  }

  // Derived calculations
  const totalRequests = dashboard?.apiRequestStats.total || 1;
  const successRequests = dashboard?.apiRequestStats.success || 0;
  const errorRequests = dashboard?.apiRequestStats.error || 0;
  const successRate = Math.round((successRequests / totalRequests) * 100);

  const memoryPercent = Number(metrics?.system?.memoryUsagePercent ?? 0);
  const cpuPercent = Number(metrics?.system?.cpuUsagePercent ?? 0);
  const avgResponseTime = Math.round(Number(metrics?.api?.averageResponseTimeMs ?? 0));
  const databaseStatus = metrics?.database?.status || 'UP';
  const databaseLatency = Number(metrics?.database?.latencyMs ?? 0);
  const uptimeSeconds = Number(metrics?.service?.uptimeSeconds ?? dashboard?.systemHealth.uptime ?? 0);

  const kpis = [
    {
      title: 'Total Accounts',
      value: (dashboard?.owners.total || 0).toString(),
      icon: Users,
      color: 'bg-[#e0f2fe] text-[#0284c7]',
      trend: `${dashboard?.owners.active || 0} active`,
      accentBorder: true,
    },
    {
      title: 'API Success Rate',
      value: `${successRate}%`,
      icon: Activity,
      color: 'bg-[#fffbeb] text-[#d97706]',
      trend: `${successRequests.toLocaleString()} queries`,
      accentBorder: true,
    },
    {
      title: 'System Uptime',
      value: formatUptime(uptimeSeconds),
      icon: Clock,
      color: 'bg-[#f3f4f6] text-[#6b7280]',
      trend: 'Since restart',
      accentBorder: false,
    },
    {
      title: 'Avg Response Time',
      value: `${avgResponseTime}ms`,
      icon: Server,
      color: 'bg-[#e6f9f0] text-[#1a7a4a]',
      trend: 'Across all nodes',
      accentBorder: false,
    },
  ];

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* KPI Cards (Exact match to Owner Dashboard kpi-cards.tsx) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6"
                style={
                  kpi.accentBorder
                    ? { borderTop: '3px solid var(--color-accent)' }
                    : undefined
                }
              >
                <div className="flex items-start justify-between mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                    {kpi.title}
                  </p>
                  <div className={`p-2 rounded-lg ${kpi.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-black theme-text-primary leading-none mb-2">{kpi.value}</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                    {kpi.trend}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Charts and Alerts Grid (Matches Sales Chart & Activity grid) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* System Resources (Takes 2 columns like SalesChart) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden h-full">
            <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-bold theme-text-primary">System Resources</h3>
                <p className="text-sm text-[#6b7280] mt-1">Live overview of CPU and Memory allocation</p>
              </div>
            </div>
            <div className="p-8 space-y-10">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-[#374151] flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#9ca3af]" /> CPU Usage
                  </span>
                  <span className="text-xl font-black theme-text-primary">{cpuPercent.toFixed(1)}%</span>
                </div>
                <ProgressBar value={cpuPercent} colorClass={cpuPercent > 85 ? 'bg-[#ef4444]' : cpuPercent > 60 ? 'bg-[#f59e0b]' : 'bg-[#0D7377]'} />
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-[#374151] flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-[#9ca3af]" /> Memory Usage
                  </span>
                  <span className="text-xl font-black theme-text-primary">{memoryPercent.toFixed(1)}%</span>
                </div>
                <ProgressBar value={memoryPercent} colorClass={memoryPercent > 85 ? 'bg-[#ef4444]' : memoryPercent > 60 ? 'bg-[#f59e0b]' : 'bg-[#0D7377]'} />
              </div>

              <div className="pt-6 border-t border-[#e5e7eb] flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af] mb-1">Database Status</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${databaseStatus === 'UP' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>
                    {databaseStatus}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af] mb-1">Query Latency</span>
                  <span className="text-lg font-black theme-text-primary">{databaseLatency > 0 ? databaseLatency : '< 1'}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent System Exceptions (Takes 1 col like RecentActivityWidget) */}
        <div>
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
              <h3 className="text-[16px] font-bold theme-text-primary">System Exceptions</h3>
              <Link href="/admin/logs" className="text-sm font-semibold text-[#0D7377] hover:text-[#0D7377]/80">
                View All
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto p-2 max-h-[380px]">
              {(dashboard?.recentIssues || []).length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-10 h-10 text-[#e5e7eb] mb-2" />
                  <p className="text-sm font-medium text-[#6b7280]">All Systems Operational</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {(dashboard?.recentIssues || []).slice(0, 5).map((issue) => (
                    <div key={issue.id} className="p-3 hover:bg-[#f9fafb] rounded-lg transition-colors flex gap-3 items-start group">
                      <span className="shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 border border-slate-200 group-hover:bg-white transition-colors">
                         {issue.level === 'ERROR' || issue.level === 'CRITICAL' ? (
                          <AlertCircle className="w-4 h-4 text-[#cc2200]" />
                         ) : (
                          <AlertCircle className="w-4 h-4 text-[#d97706]" />
                         )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-900 leading-tight line-clamp-2">
                          {issue.message}
                        </p>
                        <div className="flex items-center text-[11px] font-semibold text-slate-400 mt-1.5 uppercase tracking-wide justify-between">
                          <span>{issue.level}</span>
                          <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {formatDate(issue.createdAt).split(',')[0]}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats (Matches 4 col Quick Stats) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl p-4 theme-card-accent border border-border">
          <p className="text-sm text-muted-foreground mb-2">Active Admins</p>
          <p className="text-2xl font-bold theme-text-primary">{dashboard?.owners.active || 0}</p>
          <p className="text-xs text-success mt-2">Can access dashboard</p>
        </div>
        <div className="bg-white rounded-xl p-4 theme-card-accent border border-border">
          <p className="text-sm text-muted-foreground mb-2">Inactive Accounts</p>
          <p className="text-2xl font-bold theme-text-primary">{dashboard?.owners.inactive || 0}</p>
          <p className="text-xs text-warning mt-2">Access revoked/suspended</p>
        </div>
        <div className="bg-white rounded-xl p-4 theme-card-accent border border-border">
          <p className="text-sm text-muted-foreground mb-2">Failed API Events</p>
          <p className="text-2xl font-bold theme-text-primary">{errorRequests}</p>
          <p className="text-xs text-danger mt-2">Total backend errors</p>
        </div>
        <div className="bg-white rounded-xl p-4 theme-card-accent border border-border">
          <p className="text-sm text-muted-foreground mb-2">Last Backup</p>
          <p className="text-lg font-bold theme-text-primary truncate">
            {dashboard?.backupStatus.lastBackupDate ? formatDate(dashboard.backupStatus.lastBackupDate).split(',')[0] : 'Never'}
          </p>
          <p className={`text-xs mt-2 font-bold ${dashboard?.backupStatus.lastBackupStatus === 'SUCCESS' ? 'text-success' : 'text-danger'}`}>
            {dashboard?.backupStatus.lastBackupStatus || 'No Record'}
          </p>
        </div>
      </motion.div>

      {/* Recent Logins Table (Matches Recent Orders Table) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden"
      >
        <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-between">
          <div>
            <h3 className="text-[18px] font-bold theme-text-primary">Recent Access Logs</h3>
            <p className="text-sm text-[#6b7280] mt-1">Latest 5 platform logins across all administrative users</p>
          </div>
          <button 
            onClick={() => {
              setIsRedirecting(true);
              router.push('/admin/users');
            }} 
            className="text-sm font-semibold text-[#0D7377] hover:text-[#0D7377]/80 inline-flex items-center gap-2"
            disabled={isRedirecting}
          >
            {isRedirecting && <Loader2 className="h-4 w-4 animate-spin" />}
            Manage Users
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#374151]">
            <thead className="bg-[#f9fafb] text-[#6b7280]">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold text-right">Last Login Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {(dashboard?.recentLoginActivity || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#6b7280]">
                    No recent logins found in the system.
                  </td>
                </tr>
              ) : (
                (dashboard?.recentLoginActivity || []).slice(0, 5).map((login) => (
                  <tr 
                    key={login.id} 
                    className="hover:bg-[#f9fafb]/50 transition-colors cursor-pointer"
                    onClick={() => router.push('/admin/users')}
                  >
                    <td className="px-6 py-4 font-medium theme-text-primary flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0D7377]/10 text-[#0D7377] flex items-center justify-center font-bold text-xs border border-[#0D7377]/20">
                        {login.name.charAt(0)}
                      </div>
                      {login.name}
                    </td>
                    <td className="px-6 py-4">
                      {login.email || login.phone || 'Not Provided'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        login.role === 'SUPER_ADMIN' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#e0f2fe] text-[#0284c7]'
                      }`}>
                        {login.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-[#6b7280]">
                       {formatDate(login.lastLoginAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
