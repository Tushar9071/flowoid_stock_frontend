'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { mockUsers } from '@/lib/data';
import { formatDate } from '@/lib/constants';
import { Plus, Edit, Trash2, Shield, Search, ChevronDown, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { SkeletonCard } from '@/components/skeleton/Skeletons';

export default function UserManagementPage() {
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<typeof mockUsers>([]);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setIsLoading(true);
      // Placeholder async flow until API integration.
      await new Promise(resolve => setTimeout(resolve, 700));
      if (!isMounted) return;
      setUsers(mockUsers);
      setIsLoading(false);
    };

    if (role === 'owner') {
      loadUsers();
    }

    return () => {
      isMounted = false;
    };
  }, [role]);

  if (role !== 'owner') {
    return (
      <DashboardLayout title="User Management">
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-12 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-[#fff0f0] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-[#cc2200]" />
          </div>
          <p className="theme-text-primary font-bold text-[18px] mb-1">Access Denied</p>
          <p className="text-sm text-[#6b7280]">Only owners can manage user accounts and system permissions.</p>
        </div>
      </DashboardLayout>
    );
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout 
      title="User Management" 
      subtitle="Invite team members and configure role-based access"
      action={
        <button className="theme-accent-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />
          Add User
        </button>
      }
    >
      <div className="space-y-6">
        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="theme-focus-ring w-full h-9 pl-9 pr-3 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] focus:bg-white outline-none transition-all"
            />
          </div>
          <button className="h-9 px-3 rounded-lg border border-[#e5e7eb] bg-white text-sm text-[#374151] flex items-center gap-1.5 hover:bg-[#f9fafb] transition-colors w-fit">
            Role <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading && <SkeletonCard count={6} />}

        {!isLoading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map(user => (
            <div key={user.id} className="bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="theme-text-primary w-10 h-10 rounded-full bg-[#f0f2f5] border border-[#e5e7eb] flex items-center justify-center font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="theme-text-primary text-[16px] font-bold leading-tight">{user.name}</h3>
                      <p className="text-[13px] text-[#6b7280]">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-lg text-[#9ca3af] hover:theme-text-primary hover:bg-[#f9fafb] transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    {user.role !== 'owner' && (
                       <button className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#cc2200] hover:bg-[#fff0f0] transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-[#f3f4f6] pt-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-1">System Role</p>
                       <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#f3f4f6] text-xs font-bold text-[#374151] capitalize">
                          {user.role === 'owner' && <Shield className="w-3 h-3" />}
                          {user.role === 'manager' && <UserIcon className="w-3 h-3" />}
                          {user.role}
                       </span>
                     </div>
                     <div>
                       <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-1">Account Status</p>
                       <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                         user.status === 'active' ? 'bg-[#e6f9f0] text-[#1a7a4a]' : 'bg-[#fff0f0] text-[#cc2200]'
                       }`}>
                         {user.status}
                       </span>
                     </div>
                  </div>
                </div>

                <div className="bg-[#f9fafb] rounded-lg p-3 text-center border border-[#e5e7eb]">
                   <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">Last Login</p>
                   <p className="theme-text-primary text-[13px] font-medium">
                     {user.lastLogin ? formatDate(user.lastLogin) : 'Never logged in'}
                   </p>
                </div>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </DashboardLayout>
  );
}
