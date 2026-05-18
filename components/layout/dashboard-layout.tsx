'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useAuth } from '@/lib/auth-context';
import { navigationItems } from '@/lib/constants';
import { Shield } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  /** Page title shown in the header banner */
  title?: string;
  /** Subtitle shown below the title */
  subtitle?: string;
  /** Primary action button (e.g. "+ Add New") rendered top-right of the banner */
  action?: ReactNode;
  breadcrumb?: React.ReactNode;
}

export function DashboardLayout({ children, title, subtitle, action, breadcrumb }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { hasPermission, isFullAccess } = useAuth();
  const navItem = navigationItems.find(item => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`)));
  const pagePermission = navItem && 'permission' in navItem ? navItem.permission : undefined;
  const canViewPage = !pagePermission || isFullAccess || hasPermission(pagePermission);

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header breadcrumb={breadcrumb} />

        {/* Page header banner */}
        {(title || action) && (
          <div className="shrink-0 bg-white border-b border-[#e5e7eb] px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                {title && (
                  <h1 className="text-[26px] font-bold theme-text-primary leading-tight">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-sm text-[#6b7280] mt-0.5">{subtitle}</p>
                )}
              </div>
              {action && <div className="shrink-0">{action}</div>}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {canViewPage ? (
            children
          ) : (
            <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-[#e5e7eb] bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff0f0]">
                <Shield className="h-7 w-7 text-[#cc2200]" />
              </div>
              <p className="theme-text-primary mb-1 text-[18px] font-bold">Access Denied</p>
              <p className="text-sm text-[#6b7280]">You do not have permission to view this page.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
