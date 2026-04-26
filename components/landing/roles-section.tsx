'use client';

import React, { useState } from 'react';
import { Shield, Lock, Eye, Settings } from 'lucide-react';

const roles = [
  {
    id: 'admin',
    name: 'Admin (Single User)',
    icon: Settings,
    color: 'from-purple-500 to-indigo-500',
    description: 'Exclusive control over all user management and permissions — only one admin per organization',
    capabilities: [
      'Create, edit, and deactivate user accounts',
      'Assign and manage user roles with granular permissions',
      'Send invitations to new team members with secure onboarding',
      'Define and modify role-based permissions and access controls',
      'Configure approval workflows for all operations',
      'View comprehensive audit logs of all system activities',
      'Manage authentication, security settings, and integrations',
      'Override permissions only in documented exceptions',
    ],
    badge: 'Sole Authority',
  },
  {
    id: 'owner',
    name: 'Business Owner',
    icon: Shield,
    color: 'from-teal-500 to-cyan-500',
    description: 'Strategic business operations, critical approvals, and oversight',
    capabilities: [
      'Full access to business dashboard and analytics',
      'Approve critical stock requisitions and high-value orders',
      'Process major financial transactions and dealer payments',
      'Manage supplier relationships and raw material purchases',
      'Review worker earnings and settle outstanding payments',
      'Authorize orders exceeding credit limits',
      'Monitor inventory, stock alerts, and design performance',
      'Access financial reports and profit analysis',
    ],
    badge: 'Approver',
  },
  {
    id: 'manager',
    name: 'Operations Manager',
    icon: Lock,
    color: 'from-amber-500 to-orange-500',
    description: 'Day-to-day operations — can create records but cannot delete or override owner decisions',
    capabilities: [
      'Record raw material purchases and issuances to workers',
      'Submit stock requisitions for owner approval',
      'Create and process sales orders with dealers',
      'Record finished goods received from workers',
      'Issue material lots to workers with tracking',
      'Dispatch orders and generate invoices',
      'Record payments and update ledgers',
      'View inventory levels and generate reports',
    ],
    badge: 'Operator',
  },
  {
    id: 'viewer',
    name: 'Auditor/Viewer',
    icon: Eye,
    color: 'from-blue-500 to-slate-500',
    description: 'Read-only access for compliance, auditing, and reporting',
    capabilities: [
      'View all reports and export to PDF/Excel',
      'Review complete audit logs with user activity tracking',
      'Inspect all transaction records and ledgers',
      'Monitor outstanding payments and aging analysis',
      'Track worker productivity and payment history',
      'Generate compliance and financial reports',
      'View design performance and stock levels',
      'Monitor system usage and access patterns',
    ],
    badge: 'Monitor',
  },
];

export function RolesSection() {
  const [selectedRole, setSelectedRole] = useState('admin');
  const selectedRoleData = roles.find(r => r.id === selectedRole)!;
  const Icon = selectedRoleData.icon;

  return (
    <section id="roles" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-gray-900">Four Core Roles</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Flexible role structure designed for enterprise needs with granular permission control
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Role Selector */}
          <div className="space-y-4">
            {roles.map(role => {
              const RoleIcon = role.icon;
              const isSelected = role.id === selectedRole;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 bg-gray-50 hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${role.color} text-white`}>
                      <RoleIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-600">{role.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Role Details */}
          <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${selectedRoleData.color} text-white flex-shrink-0`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-gray-900">{selectedRoleData.name}</h3>
                  <p className="text-gray-600 mt-1">{selectedRoleData.description}</p>
                </div>
              </div>
              {selectedRoleData.badge && (
                <div className="px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold flex-shrink-0">
                  {selectedRoleData.badge}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Key Capabilities</h4>
              <ul className="space-y-3">
                {selectedRoleData.capabilities.map((capability, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700">
                    <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-1">
                      ✓
                    </div>
                    <span>{capability}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 border border-teal-100">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-teal-700">Note:</span> Permissions can be customized per organization needs
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
