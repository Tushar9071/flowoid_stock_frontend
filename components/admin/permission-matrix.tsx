'use client';

import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface PermissionRow {
  action: string;
  category: string;
  admin: boolean;
  owner: boolean;
  manager: boolean;
  viewer: boolean;
}

const permissions: PermissionRow[] = [
  // User & Access Management
  { action: 'Create Users', category: 'User Management', admin: true, owner: false, manager: false, viewer: false },
  { action: 'Edit User Details', category: 'User Management', admin: true, owner: false, manager: false, viewer: false },
  { action: 'Assign Roles', category: 'User Management', admin: true, owner: false, manager: false, viewer: false },
  { action: 'Deactivate Users', category: 'User Management', admin: true, owner: false, manager: false, viewer: false },
  { action: 'Send Invitations', category: 'User Management', admin: true, owner: false, manager: false, viewer: false },

  // Role & Permission Config
  { action: 'Create Roles', category: 'Role Management', admin: true, owner: false, manager: false, viewer: false },
  { action: 'Define Permissions', category: 'Role Management', admin: true, owner: false, manager: false, viewer: false },
  { action: 'Modify Workflows', category: 'Role Management', admin: true, owner: false, manager: false, viewer: false },

  // Stock & Inventory Operations
  { action: 'Submit Stock Requisition', category: 'Inventory', admin: false, owner: false, manager: true, viewer: false },
  { action: 'Approve Stock Requisition', category: 'Inventory', admin: false, owner: true, manager: false, viewer: false },
  { action: 'Record Stock Receipt', category: 'Inventory', admin: false, owner: false, manager: true, viewer: false },
  { action: 'View Inventory Reports', category: 'Inventory', admin: false, owner: true, manager: true, viewer: true },

  // Order Management
  { action: 'Create Orders', category: 'Orders', admin: false, owner: false, manager: true, viewer: false },
  { action: 'Approve Large Orders', category: 'Orders', admin: false, owner: true, manager: false, viewer: false },
  { action: 'Dispatch Orders', category: 'Orders', admin: false, owner: false, manager: true, viewer: false },
  { action: 'View Orders', category: 'Orders', admin: false, owner: true, manager: true, viewer: true },

  // Financial Operations
  { action: 'Record Payments', category: 'Finance', admin: false, owner: false, manager: true, viewer: false },
  { action: 'Approve Payments', category: 'Finance', admin: false, owner: true, manager: false, viewer: false },
  { action: 'View Financial Reports', category: 'Finance', admin: false, owner: true, manager: false, viewer: true },

  // Audit & Logs
  { action: 'View Audit Logs', category: 'Audit', admin: true, owner: true, manager: false, viewer: true },
  { action: 'Export Reports', category: 'Audit', admin: false, owner: true, manager: false, viewer: true },
];

export function PermissionMatrix() {
  const categories = Array.from(new Set(permissions.map(p => p.category)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Permission Matrix</h2>
        <p className="text-gray-600">Complete role-based permission structure showing what each role can do</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full bg-white">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 w-48">Action</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 w-32">Admin</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 w-32">Owner</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 w-32">Manager</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 w-32">Viewer</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => {
              const categoryPerms = permissions.filter(p => p.category === category);
              return (
                <React.Fragment key={category}>
                  {categoryPerms.map((perm, idx) => (
                    <tr key={perm.action} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx === 0 ? 'border-t-2 border-t-teal-200' : ''}`}>
                      <td className={`py-4 px-6 text-sm ${idx === 0 ? 'pt-4' : ''}`}>
                        {idx === 0 && <span className="text-xs font-semibold text-teal-600 block mb-2 uppercase">{category}</span>}
                        <span className="font-medium text-gray-900">{perm.action}</span>
                      </td>
                      <td className="py-4 px-4 text-center" title="Admin">
                        {perm.admin ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="py-4 px-4 text-center" title="Owner">
                        {perm.owner ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="py-4 px-4 text-center" title="Manager">
                        {perm.manager ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="py-4 px-4 text-center" title="Viewer">
                        {perm.viewer ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900">Allowed</span>
          </div>
          <p className="text-sm text-gray-700">Role has permission to perform this action</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-gray-400" />
            <span className="font-semibold text-gray-900">Not Allowed</span>
          </div>
          <p className="text-sm text-gray-700">Role cannot perform this action</p>
        </div>
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-900">Customizable</span>
          </div>
          <p className="text-sm text-gray-700">Admin can create custom permissions as needed</p>
        </div>
      </div>
    </div>
  );
}
