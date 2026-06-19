'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, User, Settings, Loader2, Menu } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { normalizeRole } from '@/lib/roles';
import Image from 'next/image';
import { GlobalSearch } from '@/components/shared/global-search';
import { useRecentActivity } from '@/lib/hooks/use-activity-context';
import { Clock, CheckCircle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { activities, unreadCount, markAllAsRead, lastReadTimestamp } = useRecentActivity();
  const roleKey = normalizeRole(role);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#e5e7eb] shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 gap-3 md:gap-6">
        
        {/* Breadcrumb / Title Area */}
        <div className="flex sm:hidden items-center gap-2 w-40 shrink-0">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
            className="p-1 -ml-1 text-[#0F2A4A] hover:bg-slate-100 rounded-md transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Image
            src="/brand/StockFlow_horizontal_light.svg"
            alt="StockFlow"
            width={2400}
            height={600}
            className="h-auto w-full max-w-[120px] object-contain object-left"
            style={{ height: 'auto' }}
            priority
            loading="eager"
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
        <GlobalSearch
          containerClassName="flex-1 max-w-2xl hidden md:block"
          placeholder="Search designs, dealers, or workers globally..."
        />

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-auto">

          {/* Theme Switcher — palette icon only, no label */}
          <ThemeSwitcher />

          {/* Divider */}
          <div className="w-px h-6 bg-[#e5e7eb] mx-1" />

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 hover:bg-[#f9fafb] rounded-full transition-colors border border-transparent hover:border-[#e5e7eb]"
            >
              <Bell className="w-5 h-5 text-[#374151]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-[#cc2200] text-white text-[10px] font-bold rounded-full border-2 border-white notification-glow">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-[320px] sm:max-w-none bg-white rounded-xl shadow-xl border border-[#e5e7eb] z-50 overflow-hidden flex flex-col max-h-[85vh] origin-top-right">
                  <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between shrink-0 bg-[#f9fafb]">
                    <h3 className="text-[15px] font-bold text-[#0F2A4A]">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1 p-2 max-h-[380px]">
                    {activities.length === 0 ? (
                      <div className="py-10 flex flex-col items-center justify-center text-center">
                        <CheckCircle className="w-10 h-10 text-[#e5e7eb] mb-2" />
                        <p className="text-sm font-medium text-[#6b7280]">No recent activity available</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {activities.slice(0, 20).map((activity, i) => (
                          <div key={activity.id} className="p-3 hover:bg-[#f9fafb] rounded-lg transition-colors flex gap-3 items-start group">
                            <span className="shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 border border-slate-200 group-hover:bg-white transition-colors">
                              <activity.icon className="w-4 h-4 text-slate-500" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold text-slate-900 leading-tight">
                                {activity.title}
                              </p>
                              <p className="text-[12px] text-slate-600 mt-0.5 leading-relaxed">
                                {activity.subtitle}
                              </p>
                              <div className="flex items-center text-[11px] font-semibold text-slate-400 mt-1.5 uppercase tracking-wide">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                              </div>
                            </div>
                            {activity.timestamp.getTime() > lastReadTimestamp && (
                              <span className="w-2 h-2 rounded-full bg-[#cc2200] shrink-0 mt-2"></span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {activities.length > 0 && (
                    <div className="p-3 border-t border-[#e5e7eb] shrink-0 text-center bg-[#f9fafb] sticky bottom-0">
                      <button onClick={() => { setShowNotifications(false); router.push('/dashboard/recent-activity'); }} className="text-[13px] font-bold text-indigo-600 hover:text-indigo-800">
                        View all activity
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

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
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-56 max-w-[280px] sm:max-w-none bg-white rounded-xl shadow-lg border border-[#e5e7eb] z-50 overflow-hidden origin-top-right">
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
