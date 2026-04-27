'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  ChevronLeft, Settings, Shield, Building2,
  BarChart3, LogOut, Gem, CreditCard, FileText, Menu, ChevronRight,
} from 'lucide-react';

const adminNavItems = [
  { id: 'dashboard',     label: 'Dashboard',         href: '/admin',            icon: BarChart3  },
  { id: 'tenants',       label: 'Tenants',            href: '/admin/users',      icon: Building2  },
  { id: 'subscriptions', label: 'Subscriptions',      href: '/admin/roles',      icon: CreditCard },
  { id: 'audit-logs',    label: 'Audit Logs',         href: '/admin/audit-logs', icon: FileText   },
  { id: 'settings',      label: 'Platform Settings',  href: '/admin/settings',   icon: Settings   },
];

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router  = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed md:hidden top-4 left-4 z-50 p-2 bg-white shadow-md rounded-lg border border-[#e5e7eb] transition-opacity duration-200 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <Menu className="w-5 h-5 text-[#0F2A4A]" />
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 h-full md:h-screen w-[260px] flex flex-col z-40 transition-transform duration-300 shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ background: 'linear-gradient(175deg, #0F2A4A 0%, #0A1E38 100%)' }}
      >
        <div className="p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-[15px] leading-tight tracking-wide">Flowoid Admin</p>
                <p className="text-white/50 text-[11px] font-medium tracking-wider uppercase mt-0.5">Platform Setup</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 scrollbar-none">
          <div className="px-5 mb-3">
            <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">
              Navigation
            </p>
          </div>
          <ul className="space-y-1 px-3">
            {adminNavItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] transition-all group overflow-hidden ${
                      isActive
                        ? 'bg-purple-600 text-white font-bold shadow-md'
                        : 'text-white/60 hover:bg-white/10 hover:text-white font-medium'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />
                    )}
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'
                      }`}
                    />
                    <span>{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-white/50" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold shrink-0 border border-white/20">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-bold truncate">{user?.name || 'Admin'}</p>
              <p className="text-white/50 text-[11px] font-medium truncate uppercase tracking-wider">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-[13px] font-bold border border-transparent hover:border-white/10"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
