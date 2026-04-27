'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { mockRoles, mockPermissions } from '@/lib/data';

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState(mockRoles[0]);

  React.useEffect(() => {
    const handleAdminAction = () => alert('Feature coming soon: Add New Role');
    window.addEventListener('admin-action-click', handleAdminAction);
    return () => window.removeEventListener('admin-action-click', handleAdminAction);
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Action button moved to AdminLayout banner */}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Roles List */}
        <Card className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Roles</h2>
          <div className="space-y-2">
            {mockRoles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedRole.id === role.id
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                    : 'border-gray-200 bg-white hover:border-[var(--color-accent)]/30'
                }`}
              >
                <h3 className="font-semibold text-gray-900">{role.displayName}</h3>
                <p className="text-xs text-gray-600 mt-1">{role.userCount} users assigned</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Role Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <Card className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedRole.displayName}</h2>
                <p className="text-gray-600 mt-2">{selectedRole.description}</p>
                {selectedRole.isSystem && (
                  <span className="inline-block mt-3 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    System Role
                  </span>
                )}
              </div>
              {!selectedRole.isSystem && (
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit2 className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Users Assigned</p>
                <p className="text-3xl font-bold text-teal-600 mt-2">{selectedRole.userCount}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Permissions</p>
                <p className="text-3xl font-bold text-teal-600 mt-2">{selectedRole.permissions.length}</p>
              </div>
            </div>
          </Card>

          {/* Permissions Table */}
          <Card className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-[#0F2A4A] mb-6">Assigned Permissions</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f5f6fa] border-b border-[#e5e7eb]">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-left whitespace-nowrap">Permission</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-left whitespace-nowrap">Resource</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-left whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {mockPermissions
                    .filter(p => selectedRole.permissions.includes(p.id))
                    .map(permission => (
                      <tr key={permission.id} className="transition-colors hover:bg-[#f0f4ff]">
                        <td className="py-3 px-4">
                          <p className="font-medium text-[#0F2A4A]">{permission.name}</p>
                          <p className="text-xs text-[#6b7280]">{permission.description}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                            {permission.resource}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {permission.actions.map(a => (
                            <span key={a} className="inline-block mr-2 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {a}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
