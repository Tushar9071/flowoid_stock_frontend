import React from 'react';
import { SkeletonDashboardPage } from '@/components/skeleton/Skeletons';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#f0f2f5] p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <SkeletonDashboardPage />
      </div>
    </div>
  );
}
