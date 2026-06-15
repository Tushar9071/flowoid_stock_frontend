'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
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
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [pathname]);

  const { hasPermission, isFullAccess } = useAuth();
  const navItem = navigationItems.find(item => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`)));
  const pagePermission = navItem && 'permission' in navItem ? navItem.permission : undefined;
  const canViewPage = !pagePermission || isFullAccess || hasPermission(pagePermission);

  return (
    <>
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
        <div className="flex-1 overflow-auto bg-[#f8fafc] p-4 md:p-6 theme-bg-main relative" ref={scrollRef}>
          {canViewPage ? children : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-500 max-w-md">
                You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
              </p>
            </div>
          )}
        </div>
    </>
  );
}
