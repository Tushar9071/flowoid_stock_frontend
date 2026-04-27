import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { SkeletonDashboardPage } from '@/components/skeleton/Skeletons';

export default function DashboardLoading() {
  return (
    <DashboardLayout
      title="Loading Dashboard"
      subtitle="Fetching latest records from database..."
    >
      <SkeletonDashboardPage />
    </DashboardLayout>
  );
}
