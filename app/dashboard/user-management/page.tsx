'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { UserManagementPanel } from '@/components/admin/user-management-panel';
import { useAuth } from '@/lib/auth-context';
import { isSuperAdminRole } from '@/lib/roles';
import { Shield } from 'lucide-react';

export default function UserManagementPage() {
  const { role, hasPermission, isFullAccess } = useAuth();
  const canManageUsers = isSuperAdminRole(role) && (isFullAccess || hasPermission('users.read'));

  if (!canManageUsers) {
    return (
      <DashboardLayout title="User Management">
        <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-[#e5e7eb] bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff0f0]">
            <Shield className="h-7 w-7 text-[#cc2200]" />
          </div>
          <p className="theme-text-primary mb-1 text-[18px] font-bold">Access Denied</p>
          <p className="text-sm text-[#6b7280]">User management is available only in the admin panel.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="User Management" subtitle="Create users and assign roles based on your available permissions">
      <UserManagementPanel showLocalAction />
    </DashboardLayout>
  );
}
