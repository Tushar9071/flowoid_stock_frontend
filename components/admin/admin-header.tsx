'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Bell, Shield, Search, LogOut, Settings } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';

const notifications = [
  { id: 1, title: 'New Tenant Signup',    message: 'Sharma Jewellers signed up for a trial', time: '1 hour ago',  read: false },
  { id: 2, title: 'Subscription Expiring', message: 'Ayanshi Imitation plan expires in 3 days', time: '5 hours ago', read: false },
  { id: 3, title: 'Payment Received',     message: 'Premium plan payment confirmed',            time: '1 day ago',  read: true  },
];

export function AdminHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#e5e7eb] shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 pl-16 md:pl-6 gap-6">
        
        {/* Title Area removed to prevent duplication with AdminLayout banner */}

        {/* Global Search Bar */}
        <div className="flex-1 max-w-2xl hidden md:block">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search tenants, subscriptions..."
              className="w-full h-10 pl-10 pr-4 rounded-full border border-[#e5e7eb] bg-[#f9fafb] focus:bg-white focus:ring-2 focus:ring-[#0F2A4A]/10 focus:border-[var(--color-accent)] outline-none transition-all text-sm theme-text-primary placeholder:text-[#9ca3af]"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {/* Platform Online pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e6f9f0] border border-[#1a7a4a]/20">
            <span className="w-2 h-2 rounded-full bg-[#1a7a4a] animate-pulse" />
            <span className="text-[11px] font-bold text-[#1a7a4a] uppercase tracking-wide">Platform Online</span>
          </div>

          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* Notifications */}
          <button className="relative p-2.5 hover:bg-[#f9fafb] rounded-full transition-colors border border-transparent hover:border-[#e5e7eb]">
            <Bell className="w-5 h-5 text-[#374151]" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-theme-status-critical rounded-full border-2 border-white" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-[#e5e7eb] mx-1" />

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-1.5 pr-3 hover:bg-[#f9fafb] rounded-full transition-colors border border-transparent hover:border-[#e5e7eb]"
            >
              <div className="w-8 h-8 rounded-full theme-sidebar-bg text-white flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden sm:block text-left">
                 <p className="text-[13px] font-bold theme-text-primary leading-tight">{user?.name || 'Admin'}</p>
                 <div className="flex items-center gap-1">
                   <Shield className="w-3 h-3 text-[#6b7280]" />
                   <p className="text-[11px] font-semibold text-[#6b7280]">Flowoid Admin</p>
                 </div>
              </div>
            </button>

            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowDropdown(false)}
                />
                <div className="AdminHeader_dropdown absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#e5e7eb] z-50 overflow-hidden">
                  <div className="p-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
                    <p className="text-[14px] font-bold theme-text-primary">{user?.name || 'Admin'}</p>
                    <p className="text-[12px] text-[#6b7280] truncate mt-0.5">{user?.email || 'admin@flowoid.com'}</p>
                  </div>
                  <div className="p-1.5">
                    <button 
                      onClick={() => { setShowDropdown(false); router.push('/admin/settings'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#374151] rounded-lg hover:bg-[#f3f4f6] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#6b7280]" />
                      Platform Settings
                    </button>
                    <div className="h-px bg-[#e5e7eb] my-1.5" />
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-bold text-[#cc2200] rounded-lg hover:bg-[#fff0f0] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
