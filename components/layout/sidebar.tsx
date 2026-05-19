'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { navigationItems, navigationVisibility } from '@/lib/constants';
import { normalizeRole } from '@/lib/roles';
import {
  ChevronLeft,
  Menu,
  LayoutDashboard,
  Grid2X2,
  Users,
  Package,
  Boxes,
  Users2,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Shield,
  Settings,
  LogOut,
  Loader2,
  Gem,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  LayoutDashboard,
  Grid2X2,
  Users,
  Package,
  Boxes,
  Users2,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Shield,
  Settings,
};

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  flowoid_admin: { label: 'Flowoid Admin', color: '#7C3AED' },
  owner:         { label: 'Business Owner', color: '#f5a623' },
  manager:       { label: 'Manager',        color: '#1a7a4a' },
  viewer:        { label: 'Viewer',         color: '#6b7280' },
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, user, logout, hasPermission, isFullAccess } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  const roleKey = normalizeRole(role);
  const visibleNav = navigationVisibility[roleKey] || navigationVisibility.viewer;

  const visibleItems = navigationItems.filter(item => {
    if (item.adminOnly && roleKey !== 'owner' && roleKey !== 'flowoid_admin') return false;
    if ('permission' in item && item.permission && !isFullAccess && roleKey !== 'flowoid_admin' && !hasPermission(item.permission)) {
      return false;
    }
    return visibleNav.includes(item.id);
  });

  const roleMeta = ROLE_BADGE[roleKey] || { label: roleKey, color: '#f5a623' };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`hidden top-4 left-4 z-50 p-2 bg-white shadow-md rounded-lg border border-[#e5e7eb] transition-opacity duration-200 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <Menu className="w-5 h-5 text-[#0F2A4A]" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}

      {/* Sidebar container — background driven by --color-sidebar-bg */}
      <aside
        className={`theme-sidebar-bg fixed md:static inset-y-0 left-0 h-full w-[260px] flex flex-col z-40 transition-transform duration-300 shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ background: 'var(--color-sidebar-bg)' }}
      >
       {/* Logo area */}
        <div className="px-3 py-0 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Image 
                src="/brand/StockFlow_horizontal_blue.svg" 
                alt="StockFlow" 
                width={2400} 
                height={600} 
                className="w-full h-auto object-contain object-left"
                priority
              />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto py-5 scrollbar-none">
          <div className="px-5 mb-3">
            <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">
              Navigation
            </p>
          </div>
          <ul className="space-y-1 px-3">
            {visibleItems.map(item => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
              const Icon = iconMap[item.icon as keyof typeof iconMap];

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] transition-all group overflow-hidden ${
                      isActive
                        ? 'font-bold shadow-md'
                        : 'text-white/60 hover:bg-white/10 hover:text-white font-medium'
                    }`}
                    style={isActive ? {
                      backgroundColor: 'var(--color-sidebar-active)',
                      color: 'var(--color-sidebar-active-text)',
                    } : undefined}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{ backgroundColor: 'var(--color-accent-dark)' }}
                      />
                    )}
                    {Icon && (
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                          isActive ? '' : 'text-white/40 group-hover:text-white/80'
                        }`}
                        style={isActive ? { color: 'var(--color-sidebar-active-text)' } : undefined}
                      />
                    )}
                    <span>{item.label}</span>
                    {isActive && (
                      <ChevronRight
                        className="w-4 h-4 ml-auto opacity-50"
                        style={{ color: 'var(--color-sidebar-active-text)' }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold shrink-0 border border-white/20">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-bold truncate">{user?.name || 'User'}</p>
              <p className="text-white/50 text-[11px] font-medium truncate uppercase tracking-wider">{roleMeta.label}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-[13px] font-bold border border-transparent hover:border-white/10"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
