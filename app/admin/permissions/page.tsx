'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PermissionService } from '@/lib/services/role-permission.service';
import { Permission } from '@/lib/types';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

function moduleName(permission: Permission) {
  return permission.module || permission.code?.split('.')?.[0] || 'SYSTEM';
}

function actionName(permission: Permission) {
  return permission.action || permission.code?.split('.')?.[1] || 'ACCESS';
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await PermissionService.list();
        if (response.success) {
          setPermissions(response.data || []);
        } else {
          toast.error(response.error?.message || 'Failed to load permissions');
        }
      } catch {
        toast.error('Failed to load permissions');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const grouped = useMemo(() => {
    const groups = new Map<string, Permission[]>();
    permissions.forEach((permission) => {
      const key = moduleName(permission);
      groups.set(key, [...(groups.get(key) || []), permission]);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card className="theme-surface-card p-5">
        <div className="flex items-start gap-3">
          <div className="theme-icon-chip rounded-lg p-2">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="theme-text-primary text-lg font-black">Backend Permissions</h2>
            <p className="mt-1 text-sm text-gray-500">
              These permissions are defined by the backend. Admins can assign them to owner accounts from Roles & Permissions.
            </p>
          </div>
        </div>
      </Card>

      {grouped.map(([group, groupPermissions]) => (
        <section key={group} className="space-y-3">
          <h3 className="theme-text-primary text-sm font-black uppercase tracking-widest">
            {group.replace(/_/g, ' ')}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groupPermissions.map((permission) => (
              <Card key={permission.id} className="theme-surface-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="theme-text-primary text-sm font-black">{permission.name}</p>
                    <code className="mt-1 block text-xs text-gray-400">{permission.code}</code>
                  </div>
                  <span className="theme-badge-soft rounded-full px-2.5 py-1 text-[10px] font-black uppercase">
                    {actionName(permission)}
                  </span>
                </div>
                {permission.description && (
                  <p className="mt-3 text-sm text-gray-500">{permission.description}</p>
                )}
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
