'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Plus, Edit2 } from 'lucide-react';
import { mockPermissions } from '@/lib/data';
import { PermissionMatrix } from '@/components/admin/permission-matrix';

export default function PermissionsPage() {
  const [viewMode, setViewMode] = useState<'permissions' | 'matrix'>('matrix');
  const resourceTypes = ['user', 'role', 'order', 'inventory', 'payment', 'design', 'worker', 'audit_log'];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permissions Management</h1>
          <p className="text-gray-600 mt-1">Define and manage granular permissions. Only the admin can configure access control.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'matrix'
                ? 'bg-teal-100 text-teal-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Matrix View
          </button>
          <button
            onClick={() => setViewMode('permissions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'permissions'
                ? 'bg-teal-100 text-teal-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Detailed Permissions
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
            <Plus className="w-5 h-5" />
            Add Permission
          </button>
        </div>
      </div>

      {viewMode === 'matrix' && <PermissionMatrix />}

      {viewMode === 'permissions' && (
        <div className="space-y-6">
        {resourceTypes.map(resource => {
          const resourcePermissions = mockPermissions.filter(p => p.resource === resource);
          return (
            <Card key={resource} className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">{resource} Permissions</h3>

              <div className="grid md:grid-cols-2 gap-4">
                {resourcePermissions.map(perm => (
                  <div key={perm.id} className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{perm.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{perm.description}</p>
                      </div>
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {perm.actions.map(action => (
                        <span key={action} className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded font-semibold">
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
        </div>
      )}
    </div>
  );
}
