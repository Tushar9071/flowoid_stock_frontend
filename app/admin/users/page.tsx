'use client';

import { UserManagementPanel } from '@/components/admin/user-management-panel';

export default function UsersPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <UserManagementPanel />
    </div>
  );
}
