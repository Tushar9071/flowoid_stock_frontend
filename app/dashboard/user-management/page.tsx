'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { mockUsers } from '@/lib/data';
import { formatDate } from '@/lib/constants';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function UserManagementPage() {
  const { role } = useAuth();

  if (role !== 'owner') {
    return (
      <DashboardLayout title="User Management">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Access denied. Owner only.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockUsers.map(user => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-text">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-muted mt-1">{user.phone}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="p-1">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="p-1 text-danger hover:text-danger">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Role and Status */}
                  <div className="flex gap-3 flex-wrap">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Role</p>
                      <p className="px-3 py-1 rounded-full text-sm font-semibold capitalize bg-primary/10 text-primary">
                        {user.role}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <StatusBadge status={user.status} />
                    </div>
                  </div>

                  {/* Last Login */}
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">Last Login</p>
                    <p className="text-sm text-text">{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
