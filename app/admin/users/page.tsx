'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Plus, Edit2, Trash2, Shield, Mail, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { mockUsers } from '@/lib/data';

export default function UsersPage() {
  const [filter, setFilter] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const filtered = filter === 'all' ? mockUsers : mockUsers.filter(u => u.status === filter);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2 max-w-2xl">
            Invite team members, assign roles, and manage permissions. As the sole admin, only you can add new users and modify their access rights.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-medium hover:shadow-lg transition-all whitespace-nowrap flex-shrink-0"
        >
          <Mail className="w-5 h-5" />
          Send Invitation
        </button>
      </div>

      {/* Invitation Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Invite New User</h2>
              <p className="text-sm text-gray-600 mt-1">Send secure invitation to a new team member</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowInviteModal(false); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" required placeholder="user@company.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" required placeholder="John Doe" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Role</label>
                <select required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none">
                  <option>Owner</option>
                  <option>Manager</option>
                  <option>Viewer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input type="text" required placeholder="Operations" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p><strong>How it works:</strong> The user receives an invitation email with a secure link. They set up their credentials and you approve their access.</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Users List */}
      <Card className="rounded-lg border border-gray-200 bg-white">
        <div className="p-6 border-b border-gray-200 flex flex-wrap items-center gap-4">
          {['all', 'active', 'inactive', 'pending'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === status
                  ? 'bg-teal-100 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">User</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Role</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Department</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Joined</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const statusConfig = {
                  active: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Active' },
                  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Awaiting Acceptance' },
                  inactive: { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Inactive' },
                };
                const config = statusConfig[user.status as keyof typeof statusConfig];
                const StatusIcon = config.icon;

                return (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-teal-600" />
                        <span className="font-medium text-gray-900 capitalize">{user.role}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{user.department || '-'}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 ${config.color}`} />
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex gap-2 justify-end">
                        <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Edit user">
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Remove user">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-gray-600">
            <p>No users found in this category.</p>
          </div>
        )}
      </Card>

      {/* Admin Notes */}
      <Card className="rounded-lg border border-purple-200 bg-purple-50 p-6">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          Admin Authority Notice
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• <strong>Only you</strong> can invite new users and assign roles</li>
          <li>• Pending invitations expire after 7 days and can be resent</li>
          <li>• All user actions are logged in the audit system</li>
          <li>• Deactivating a user revokes all permissions immediately</li>
          <li>• Role changes require users to re-authenticate for security</li>
        </ul>
      </Card>
    </div>
  );
}
