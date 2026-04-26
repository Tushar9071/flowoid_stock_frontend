'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  ChevronLeft, Settings, Shield, Building2,
  BarChart3, LogOut, Gem, CreditCard, FileText, Menu, ChevronRight
} from 'lucide-react';

const adminNavItems = [
  { id: 'dashboard',  label: 'Dashboard',      href: '/admin',              icon: BarChart3 },
  { id: 'tenants',    label: 'Tenants',         href: '/admin/users',        icon: Building2 },
  { id: 'subscriptions', label: 'Subscriptions', href: '/admin/roles',      icon: CreditCard },
  { id: 'audit-logs', label: 'Audit Logs',      href: '/admin/audit-logs',   icon: FileText },
  { id: 'settings',   label: 'Platform Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

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
        className={`fixed md:sticky left-0 top-0 h-screen w-[240px] flex flex-col z-40 transition-transform duration-300 ${
          !isOpen ? '-translate-x-full md:translate-x-0' : ''
        }`}
        style={{ background: 'linear-gradient(175deg, #0F2A4A 0%, #0A1E38 100%)' }}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
                <Gem className="w-4 h-4 text-[#F5A623]" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">Flowoid Admin</p>
                <p className="text-white/40 text-[10px] mt-0.5">Platform Management</p>
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

        {/* Admin badge */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-400/20">
            <Shield className="w-3.5 h-3.5 text-purple-300" />
            <span className="text-purple-300 text-xs font-semibold">Platform Super Admin</span>
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
            {adminNavItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));

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
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive ? 'text-[#F5A623]' : 'text-white/40 group-hover:text-white/70'
                      }`}
                    />
                    <span>{item.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#F5A623]" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name || 'Admin'}</p>
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
