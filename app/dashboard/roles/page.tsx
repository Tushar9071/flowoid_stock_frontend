'use client';

import AdminRolesPage from '@/app/admin/roles/page';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import { isOwnerRole, isSuperAdminRole } from '@/lib/roles';
import { Shield } from 'lucide-react';

export default function DashboardRolesPage() {
  const { role, hasPermission, isFullAccess } = useAuth();
  const canManageRoles = (isOwnerRole(role) || isSuperAdminRole(role)) && (isFullAccess || hasPermission('roles.read'));

  if (!canManageRoles) {
    return (
      <DashboardLayout title="Roles & Permissions">
        <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-[#e5e7eb] bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff0f0]">
            <Shield className="h-7 w-7 text-[#cc2200]" />
          </div>
          <p className="theme-text-primary mb-1 text-[18px] font-bold">Access Denied</p>
          <p className="text-sm text-[#6b7280]">Only owners can create roles and assign permissions.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Roles & Permissions"
      subtitle="Create roles and assign only the permissions available to your account"
    >
      <div className="-m-4 sm:-m-6">
        <AdminRolesPage />
      </div>
    </DashboardLayout>
  );
}
