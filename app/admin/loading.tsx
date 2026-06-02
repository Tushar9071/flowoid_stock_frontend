import React from 'react';
import { SkeletonAdminPage } from '@/components/skeleton/Skeletons';

export default function AdminLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <SkeletonAdminPage />
    </div>
  );
}
