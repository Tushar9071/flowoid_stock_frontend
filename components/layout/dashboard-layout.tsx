'use client';

import React, { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

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
  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header breadcrumb={breadcrumb} />

        {/* Page header banner */}
        {(title || action) && (
          <div className="shrink-0 bg-white border-b border-[#e5e7eb] px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
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
          {children}
        </div>
      </div>
    </div>
  );
}
