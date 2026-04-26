'use client';

import React, { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumb?: React.ReactNode;
}

export function DashboardLayout({
  children,
  title,
  breadcrumb,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header breadcrumb={breadcrumb} />

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {title && (
              <div className="mb-8">
                <h1 className="text-3xl font-serif font-bold text-text">{title}</h1>
              </div>
            )}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
