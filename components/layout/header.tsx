'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, User, Settings, Loader2 } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { normalizeRole } from '@/lib/roles';
import Image from 'next/image';
import { SearchInput } from '@/components/shared/search-input';

const ROLE_LABELS: Record<string, string> = {
  flowoid_admin: 'Flowoid Admin',
  owner: 'Business Owner',
  manager: 'Manager',
  viewer: 'Viewer',
};

export function Header({ breadcrumb }: { breadcrumb?: React.ReactNode }) {
  const { user, role, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const roleKey = normalizeRole(role);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#e5e7eb] shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 gap-3 md:gap-6">
        
        {/* Breadcrumb / Title Area */}
        <div className="flex sm:hidden items-center w-36 shrink-0">
          <Image
            src="/brand/StockFlow_horizontal_blue.svg"
            alt="StockFlow"
            width={2400}
            height={600}
            className="h-auto w-full object-contain object-left"
            priority
          />
        </div>
        <div className="hidden sm:block shrink-0">
          {breadcrumb ? (
            <div className="text-sm font-semibold text-[#6b7280]">{breadcrumb}</div>
          ) : (
            <div className="text-sm font-semibold text-[#6b7280]">Dashboard Overview</div>
          )}
        </div>

        {/* Global Search Bar */}
        <SearchInput
          containerClassName="flex-1 max-w-2xl hidden md:flex"
          placeholder="Search designs, dealers, or workers globally..."
        />

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-auto">
          <PWAInstallButton compact />

          {/* Theme Switcher — palette icon only, no label */}
          <ThemeSwitcher />

          {/* Divider */}
          <div className="w-px h-6 bg-[#e5e7eb] mx-1" />

          {/* Notifications */}
          <button className="relative p-2.5 hover:bg-[#f9fafb] rounded-full transition-colors border border-transparent hover:border-[#e5e7eb]">
            <Bell className="w-5 h-5 text-[#374151]" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#cc2200] rounded-full border-2 border-white" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-[#e5e7eb] mx-1" />

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-1.5 pr-3 hover:bg-[#f9fafb] rounded-full transition-colors border border-transparent hover:border-[#e5e7eb]"
            >
              {/* Avatar — uses theme accent color */}
              <div className="theme-avatar w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold">
                {user?.name.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                 <p className="text-[13px] font-bold text-[#0F2A4A] leading-tight">{user?.name || 'User'}</p>
                 <p className="text-[11px] font-semibold text-[#6b7280]">{role ? ROLE_LABELS[roleKey] || role : ''}</p>
              </div>
            </button>

            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#e5e7eb] z-50 overflow-hidden">
                  <div className="p-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
                    <p className="text-[14px] font-bold text-[#0F2A4A]">{user?.name || 'User'}</p>
                    <p className="text-[12px] text-[#6b7280] truncate mt-0.5">{user?.email || 'user@example.com'}</p>
                  </div>
                  <div className="p-1.5">
                    <button 
                      onClick={() => { setShowDropdown(false); router.push('/dashboard/profile'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#374151] rounded-lg hover:bg-[#f3f4f6] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#6b7280]" />
                      My Profile
                    </button>
                    <button 
                      onClick={() => { setShowDropdown(false); router.push('/dashboard/settings'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#374151] rounded-lg hover:bg-[#f3f4f6] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#6b7280]" />
                      Account Settings
                    </button>
                    <div className="h-px bg-[#e5e7eb] my-1.5" />
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-bold text-[#cc2200] rounded-lg hover:bg-[#fff0f0] transition-colors"
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
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
