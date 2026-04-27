'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import {
  Building2, Users, CreditCard, TrendingUp,
  CheckCircle2, AlertCircle, XCircle, Crown, Star, Zap
} from 'lucide-react';
import { mockTenants, mockUsers, mockAuditLogs } from '@/lib/data';
import { formatCurrency, formatDate } from '@/lib/constants';

const PLAN_META = {
  basic:    { label: 'Basic',    icon: Star,  color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' },
  standard: { label: 'Standard', icon: Zap,   color: 'text-blue-600', bg: 'bg-blue-50',  border: 'border-blue-200' },
  premium:  { label: 'Premium',  icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
};

const STATUS_META = {
  active:    { label: 'Active',    icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  suspended: { label: 'Suspended', icon: XCircle,      color: 'text-red-600',   bg: 'bg-red-50' },
  expired:   { label: 'Expired',   icon: AlertCircle,  color: 'text-orange-600', bg: 'bg-orange-50' },
  trial:     { label: 'Trial',     icon: AlertCircle,  color: 'text-purple-600', bg: 'bg-purple-50' },
};

export default function AdminDashboard() {
  const activeTenants  = mockTenants.filter(t => t.subscriptionStatus === 'active').length;
  const premiumTenants = mockTenants.filter(t => t.plan === 'premium').length;
  const recentLogs     = mockAuditLogs.slice(0, 5);

  const stats = [
    {
      label: 'Total Tenants',
      value: mockTenants.length,
      sub: `${activeTenants} active`,
      icon: Building2,
      gradient: 'theme-sidebar-bg',
    },
    {
      label: 'Premium Plans',
      value: premiumTenants,
      sub: 'Highest tier',
      icon: Crown,
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Platform Users',
      value: mockUsers.length,
      sub: 'Across all tenants',
      icon: Users,
      gradient: 'from-[#0D7377] to-teal-600',
    },
    {
      label: 'MRR (Est.)',
      value: '₹42K',
      sub: 'Monthly revenue',
      icon: TrendingUp,
      gradient: 'from-green-600 to-emerald-600',
    },
  ];

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
              {mockTenants.map(tenant => {
                const planMeta   = PLAN_META[tenant.plan];
                const statusMeta = STATUS_META[tenant.subscriptionStatus];
                const PlanIcon   = planMeta.icon;
                const StatusIcon = statusMeta.icon;

                return (
                  <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{tenant.businessName}</p>
                        <p className="text-xs text-gray-400">{tenant.ownerName} · {tenant.city}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${planMeta.bg} ${planMeta.color} border ${planMeta.border}`}>
                        <PlanIcon className="w-3 h-3" />
                        {planMeta.label}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusMeta.bg} ${statusMeta.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusMeta.label}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-700">
                        {tenant.activeStaff} / {tenant.maxStaff === 999 ? '∞' : tenant.maxStaff}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-700">{formatDate(tenant.expiryDate)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-semibold hover:bg-[var(--color-accent)]/20 transition-colors">
                          Manage
                        </button>
                        {tenant.subscriptionStatus === 'active' ? (
                          <button className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors">
                            Suspend
                          </button>
                        ) : (
                          <button className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-semibold hover:bg-green-100 transition-colors">
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <Card className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-base font-bold text-gray-900 mb-5">Plan Distribution</h3>
          <div className="space-y-4">
            {(['basic', 'standard', 'premium'] as const).map(plan => {
              const count = mockTenants.filter(t => t.plan === plan).length;
              const pct   = Math.round((count / mockTenants.length) * 100);
              const meta  = PLAN_META[plan];
              const PlanIcon = meta.icon;
              return (
                <div key={plan} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                    <PlanIcon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{count} tenants</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          plan === 'premium' ? 'from-amber-400 to-orange-500' :
                          plan === 'standard' ? 'from-blue-400 to-blue-600' :
                          'from-gray-300 to-gray-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Audit Logs */}
        <Card className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-base font-bold text-gray-900 mb-5">Recent Admin Activity</h3>
          <div className="space-y-3">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{log.userName}</span>{' '}
                    {log.action} <span className="text-gray-500">{log.resource}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(log.timestamp).toLocaleDateString('en-IN')}{' '}
                    {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
