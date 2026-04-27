'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Plus, Edit2, Trash2, Shield, Mail, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { mockUsers } from '@/lib/data';
import { SkeletonTable } from '@/components/skeleton/Skeletons';

export default function UsersPage() {
  const [filter, setFilter] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<typeof mockUsers>([]);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 700));
      if (!isMounted) return;
      setUsers(mockUsers);
      setIsLoading(false);
    };

    loadUsers();

    // Listen for global admin header action
    const handleAdminAction = () => setShowInviteModal(true);
    window.addEventListener('admin-action-click', handleAdminAction);

    return () => {
      isMounted = false;
      window.removeEventListener('admin-action-click', handleAdminAction);
    };
  }, []);

  const filtered = filter === 'all' ? users : users.filter(u => u.status === filter);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Action button moved logic if needed, but keeping it for now as a local button */}

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
                <select
                  required
                  title="Assign role"
                  aria-label="Assign role"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                >
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

        {isLoading && (
          <div className="p-6">
            <SkeletonTable rows={8} cols={6} />
          </div>
        )}

        {!isLoading && <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f5f6fa] border-b border-[#e5e7eb]">
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-left whitespace-nowrap">User</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-left whitespace-nowrap">Role</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-left whitespace-nowrap">Department</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-left whitespace-nowrap">Status</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-left whitespace-nowrap">Joined</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {filtered.map(user => {
                const statusConfig = {
                  active: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Active' },
                  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Awaiting Acceptance' },
                  inactive: { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Inactive' },
                };
                const config = statusConfig[user.status as keyof typeof statusConfig];
                const StatusIcon = config.icon;

                return (
                  <tr key={user.id} className="transition-colors hover:bg-[#f0f4ff]">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-semibold text-[#0F2A4A]">{user.name}</p>
                        <p className="text-sm text-[#6b7280]">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#0D7377]" />
                        <span className="font-medium text-[#0F2A4A] capitalize">{user.role}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#374151]">{user.department || '-'}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 ${config.color}`} />
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#6b7280]">
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
        </div>}

        {!isLoading && filtered.length === 0 && (
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
