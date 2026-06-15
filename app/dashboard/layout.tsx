'use client';

import { AuthGuard } from '@/components/shared/auth-guard';
import { Sidebar } from '@/components/layout/sidebar';
import { ActivityProvider } from '@/lib/hooks/use-activity-context';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <ActivityProvider>
        <div className="flex h-screen bg-[#f0f2f5] overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {children}
          </div>
        </div>
      </ActivityProvider>
    </AuthGuard>
  );
}
