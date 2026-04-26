'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { mockRoles, mockPermissions } from '@/lib/data';

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState(mockRoles[0]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles Management</h1>
          <p className="text-gray-600 mt-1 text-sm">Create and manage system roles with custom permissions</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-medium hover:shadow-lg transition-all whitespace-nowrap self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Add New Role
        </button>
      </div>

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
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 bg-white hover:border-teal-300'
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
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Assigned Permissions</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Permission</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Resource</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPermissions
                    .filter(p => selectedRole.permissions.includes(p.id))
                    .map(permission => (
                      <tr key={permission.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{permission.name}</p>
                          <p className="text-xs text-gray-600">{permission.description}</p>
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
