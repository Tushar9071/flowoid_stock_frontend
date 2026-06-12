'use client';

import React from 'react';
import { AuthGuard } from '@/components/shared/auth-guard';

import { ActivityProvider } from '@/lib/hooks/use-activity-context';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <ActivityProvider>
        {children}
      </ActivityProvider>
    </AuthGuard>
  );
}
