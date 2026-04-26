'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const ROLE_LABELS: Record<string, string> = {
  flowoid_admin: 'Flowoid Admin',
  owner: 'Business Owner',
  manager: 'Manager',
  viewer: 'Viewer / Auditor',
};

export function Header({ breadcrumb }: { breadcrumb?: React.ReactNode }) {
  const { user, role, logout } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };


  const notifications = [
    {
      id: 1,
      title: 'Low Stock Alert',
      message: 'Gold Plating Solution is below threshold',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 2,
      title: 'Payment Overdue',
      message: 'Sharma Jewellers has overdue payment',
      time: '5 hours ago',
      read: false,
    },
    {
      id: 3,
      title: 'Order Dispatched',
      message: 'Order ORD001 dispatched successfully',
      time: '1 day ago',
      read: true,
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex-1">
          {breadcrumb && <div className="text-sm text-muted-foreground">{breadcrumb}</div>}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
            <SheetTrigger asChild>
              <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-primary" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-3">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg border ${
                      notif.read
                        ? 'bg-white border-border'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <p className="font-medium text-sm text-text">{notif.title}</p>
                    <p className="text-xs text-muted mt-1">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{notif.time}</p>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {user?.name.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                   <p className="text-sm font-medium text-text">{user?.name || 'User'}</p>
                   <p className="text-xs text-muted-foreground">{role ? ROLE_LABELS[role] || role : ''}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-sm font-semibold">{user?.name || 'User'}</span>
                <span className="text-xs text-muted-foreground font-normal">{user?.email || 'user@ayanshi.com'}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-danger focus:bg-danger/10 focus:text-danger"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
