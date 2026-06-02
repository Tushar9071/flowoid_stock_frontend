'use client';

import React from 'react';
import { AuthGuard } from '@/components/shared/auth-guard';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
