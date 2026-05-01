'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import {
  Building2, Users, CreditCard, TrendingUp,
  CheckCircle2, AlertCircle, XCircle, Crown, Star, Zap, Shield
} from 'lucide-react';
import { RoleService, PermissionService } from '@/lib/services/role-permission.service';
import { formatCurrency } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Fetch roles and permissions as these APIs are available
        const [rolesRes, permsRes] = await Promise.all([
          RoleService.list(),
          PermissionService.list()
        ]);

        const rolesCount = rolesRes.success ? rolesRes.data.length : 0;
        const permsCount = permsRes.success ? permsRes.data.length : 0;

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
            value: '---',
            sub: 'API Pending',
            icon: Users,
            gradient: 'from-[#0D7377] to-teal-600',
          },
          {
            label: 'Platform MRR',
            value: '₹---',
            sub: 'API Pending',
            icon: TrendingUp,
            gradient: 'from-green-600 to-emerald-600',
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
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Title removed as it is now handled by AdminLayout */}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-5 rounded-xl border border-gray-200 bg-white theme-card-accent transition-all">
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
          );
        })}
      </div>

      {/* Tenants Table */}
      <Card className="rounded-xl border border-gray-200 bg-white theme-card-accent overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Active Tenants</h2>
            <p className="text-xs text-gray-400 mt-0.5">All subscribed businesses on the platform</p>
          </div>
          <button className="theme-accent-btn px-4 py-2 rounded-lg text-xs font-semibold transition-colors">
            + Add Tenant
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">Business</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wider">Plan</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wider">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wider">Staff</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wider">Expires</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats[0]?.value === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">
                    No active tenants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <Card className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-base font-bold text-gray-900 mb-5">Plan Distribution</h3>
          <div className="text-center py-10 text-gray-400 text-sm">
            Insufficient data for distribution chart.
          </div>
        </Card>

        {/* Recent Audit Logs */}
        <Card className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-base font-bold text-gray-900 mb-5">Recent Admin Activity</h3>
          <div className="text-center py-10 text-gray-400 text-sm">
            No recent activity recorded.
          </div>
        </Card>
      </div>
    </div>
  );
}
