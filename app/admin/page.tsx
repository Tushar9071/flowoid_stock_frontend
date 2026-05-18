'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import {
  Building2, Users, CreditCard, TrendingUp,
  CheckCircle2, AlertCircle, XCircle, Crown, Star, Zap, Shield, Database, Activity, Server, Clock
} from 'lucide-react';
import { RoleService, PermissionService } from '@/lib/services/role-permission.service';
import { UserService } from '@/lib/services/user.service';
import { MonitoringService } from '@/lib/services/monitoring.service';
import { formatCurrency } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const mockChartData = [
  { name: 'Jan', users: 400, revenue: 2400 },
  { name: 'Feb', users: 600, revenue: 3500 },
  { name: 'Mar', users: 800, revenue: 4800 },
  { name: 'Apr', users: 1100, revenue: 6000 },
  { name: 'May', users: 1500, revenue: 8500 },
  { name: 'Jun', users: 1800, revenue: 10000 },
  { name: 'Jul', users: 2100, revenue: 12500 },
];

export default function AdminDashboard() {
  const [stats, setStats] = React.useState<any[]>([]);
  const [metrics, setMetrics] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [rolesRes, permsRes, usersRes, monitoringRes] = await Promise.all([
          RoleService.list(),
          PermissionService.list(),
          UserService.list().catch(() => ({ success: false, data: [] })),
          MonitoringService.getMetrics().catch(() => ({ success: false, data: null }))
        ]);

        const rolesCount = rolesRes.success && rolesRes.data ? rolesRes.data.length : 0;
        const permsCount = permsRes.success && permsRes.data ? permsRes.data.length : 0;
        
        const users = (usersRes as any).success && (usersRes as any).data ? (usersRes as any).data : [];
        const totalUsersCount = users.length;
        const activeUsersCount = users.filter((u: any) => u.isActive).length;

        if ((monitoringRes as any).success && (monitoringRes as any).data) {
          setMetrics((monitoringRes as any).data);
        }

        setStats([
          {
            label: 'Total Roles',
            value: rolesCount,
            sub: 'System-wide roles',
            icon: Shield,
            gradient: 'theme-sidebar-bg',
          },
          {
            label: 'Total Permissions',
            value: permsCount,
            sub: 'Granular controls',
            icon: Crown,
            gradient: 'from-amber-500 to-orange-500',
          },
          {
            label: 'Active Users',
            value: activeUsersCount,
            sub: 'Active accounts',
            icon: Users,
            gradient: 'from-[#0D7377] to-teal-600',
          },
          {
            label: 'Total Users',
            value: totalUsersCount,
            sub: 'All registered users',
            icon: Users,
            gradient: 'from-blue-600 to-indigo-600',
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Title removed as it is now handled by AdminLayout */}
 
      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
            >
              <Card className="p-5 rounded-xl border border-gray-200 bg-white theme-card-accent transition-all hover:shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1.5">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Dashboard main area can be expanded later. For now, just the top level stats are displayed. */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid lg:grid-cols-3 gap-6 mt-6"
      >
        {/* Chart Section */}
        <Card className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">Platform Growth</h3>
              <p className="text-xs text-gray-500">Users and revenue over time</p>
            </div>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="var(--chart-1)" fillOpacity={1} fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-2)" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Health & Alerts Column */}
        <div className="space-y-6">
          <Card className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">System Health</h3>
              <Server className="w-5 h-5 text-gray-400" />
            </div>
            {metrics ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Clock className="w-4 h-4" /> Uptime
                  </div>
                  <span className="text-sm font-bold text-gray-900">{formatUptime(metrics.service.uptimeSeconds)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Database className="w-4 h-4" /> Database
                  </div>
                  <span className={`text-sm font-bold ${metrics.database.status === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.database.status}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Activity className="w-4 h-4" /> Memory
                  </div>
                  <span className="text-sm font-bold text-gray-900">{Number(metrics.system.memoryUsagePercent).toFixed(1)}%</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
                <p className="text-xs font-medium text-gray-600">All systems operational</p>
              </div>
            )}
          </Card>

          <Card className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-base font-bold text-gray-900 mb-5">System Alerts</h3>
            {metrics && Number(metrics.system.cpuUsagePercent) > 80 ? (
              <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-4">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-900">High CPU Usage</p>
                  <p className="text-xs font-medium text-red-700 mt-1">CPU is currently operating at {Number(metrics.system.cpuUsagePercent).toFixed(1)}%</p>
                </div>
              </div>
            ) : metrics && metrics.database.status !== 'UP' ? (
              <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-4">
                <Database className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-900">Database Disconnected</p>
                  <p className="text-xs font-medium text-red-700 mt-1">Cannot reach primary database cluster.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
                <p className="text-xs font-medium text-gray-600">No active alerts</p>
              </div>
            )}
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
