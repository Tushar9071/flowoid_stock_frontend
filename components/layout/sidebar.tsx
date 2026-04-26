'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { navigationItems, navigationVisibility } from '@/lib/constants';
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
  Gem,
  ChevronRight,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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
  owner:         { label: 'Business Owner', color: '#0D7377' },
  manager:       { label: 'Manager',        color: '#0F2A4A' },
  viewer:        { label: 'Viewer',          color: '#D97706' },
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Filter navigation items based on role
  const roleKey = role || 'viewer';
  const visibleNav = navigationVisibility[roleKey] || [];

  const visibleItems = navigationItems.filter(item => {
    // Owner-only items
    if (item.adminOnly && roleKey !== 'owner' && roleKey !== 'flowoid_admin') return false;
    return visibleNav.includes(item.id);
  });

  const roleMeta = ROLE_BADGE[roleKey] || { label: roleKey, color: '#0F2A4A' };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed md:hidden top-4 left-4 z-50 p-2 bg-white shadow-md rounded-lg border border-gray-200"
      >
        <Menu className="w-5 h-5 text-[#0F2A4A]" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed md:hidden inset-0 bg-black/50 z-30"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static left-0 top-0 h-screen w-[240px] flex flex-col z-40 transition-transform duration-300 ${
          !isOpen ? '-translate-x-full md:translate-x-0' : ''
        }`}
        style={{ background: 'linear-gradient(175deg, #0F2A4A 0%, #0A1E38 100%)' }}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
                <Gem className="w-4 h-4 text-[#F5A623]" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">Flowoid Stock</p>
                <p className="text-white/40 text-[10px] mt-0.5">Ayanshi Imitation</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1 hover:bg-white/10 rounded"
            >
              <ChevronLeft className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* Role Badge */}
        <div className="px-4 py-3 border-b border-white/10">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: roleMeta.color + '25', color: roleMeta.color === '#0F2A4A' ? '#93C5FD' : '#F5A623' }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: roleMeta.color === '#0F2A4A' ? '#93C5FD' : roleMeta.color }}
            />
            {roleMeta.label}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-none">
          <div className="px-3 mb-2">
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider px-2 mb-2">
              Navigation
            </p>
          </div>
          <ul className="space-y-0.5 px-2">
            {visibleItems.map(item => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
              const Icon = iconMap[item.icon as keyof typeof iconMap];

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                      isActive
                        ? 'bg-white/15 text-white font-semibold'
                        : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                    }`}
                  >
                    {Icon && (
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isActive ? 'text-[#F5A623]' : 'text-white/40 group-hover:text-white/70'
                        }`}
                      />
                    )}
                    <span>{item.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#F5A623]" />}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Viewer notice */}
          {roleKey === 'viewer' && (
            <div className="mx-3 mt-4 p-3 rounded-lg bg-[#F5A623]/10 border border-[#F5A623]/20">
              <p className="text-[#F5A623] text-xs font-semibold mb-1">Read-Only Mode</p>
              <p className="text-white/50 text-[11px]">You have view-only access. Contact the Owner to change permissions.</p>
            </div>
          )}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#0D7377] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name || 'User'}</p>
              <p className="text-white/40 text-[10px] truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all text-xs font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
