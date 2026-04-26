'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Bell, Shield } from 'lucide-react';

export function AdminHeader() {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
      <div>
        <h1 className="text-base font-bold text-gray-900">Platform Administration</h1>
        <p className="text-xs text-gray-400">Flowoid Stock · Tenant & Subscription Management</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Platform Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-green-700">Platform Online</span>
        </div>

        {/* Notifications */}
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</p>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-purple-500" />
              <p className="text-xs text-purple-600 font-medium">Flowoid Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
