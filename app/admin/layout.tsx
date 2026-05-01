'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';
import { AuthGuard } from '@/components/shared/auth-guard';

const ADMIN_PAGE_META: Record<string, { 
  title: string; 
  subtitle: string; 
  action?: { label: string; icon: string } 
}> = {
  '/admin': {
    title: 'Platform Overview',
    subtitle: 'Manage all tenants, subscriptions, and platform health',
  },
  '/admin/tenants': {
    title: 'Tenant Management',
    subtitle: 'Overview of all business tenants and their system status',
  },
  '/admin/users': {
    title: 'User Management',
    subtitle: 'Manage users, invitations, and account access',
    action: { label: 'Send Invitation', icon: 'Mail' }
  },
  '/admin/roles': {
    title: 'Roles Management',
    subtitle: 'Create and manage system roles with custom permissions',
    action: { label: 'Add New Role', icon: 'Plus' }
  },
  '/admin/permissions': {
    title: 'Permissions Management',
    subtitle: 'Define and manage granular permission policies',
  },
  '/admin/workflows': {
    title: 'Approval Workflows',
    subtitle: 'Create and monitor multi-step approval chains',
  },
  '/admin/audit-logs': {
    title: 'Audit Logs',
    subtitle: 'Track platform activities and administrative changes',
  },
  '/admin/settings': {
    title: 'System Settings',
    subtitle: 'Configure platform-wide preferences and security controls',
  },
};

import { Mail, Plus } from 'lucide-react';
const ICON_MAP = { Mail, Plus };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageMeta = ADMIN_PAGE_META[pathname] ?? {
    title: 'Administration',
    subtitle: 'Manage platform modules and configuration',
  };

  return (
    <AuthGuard allowedRoles={['SUPER_ADMIN']}>
      {/* Same structure as DashboardLayout */}
      <div className="flex h-screen bg-[#f0f2f5] overflow-hidden">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader />
          <div className="shrink-0 bg-white border-b border-[#e5e7eb] px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[26px] font-bold theme-text-primary leading-tight">{pageMeta.title}</h1>
                <p className="text-sm text-[#6b7280] mt-0.5">{pageMeta.subtitle}</p>
              </div>
              {pageMeta.action && (
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('admin-action-click'))}
                  className="theme-accent-btn flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                >
                  {pageMeta.action.icon && React.createElement(ICON_MAP[pageMeta.action.icon as keyof typeof ICON_MAP] || Plus, { className: 'w-4 h-4' })}
                  {pageMeta.action.label}
                </button>
              )}
            </div>
          </div>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
