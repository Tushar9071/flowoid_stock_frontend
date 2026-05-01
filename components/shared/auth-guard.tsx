'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';
import { isSuperAdminRole, normalizeRole } from '@/lib/roles';

interface AuthGuardProps {
  children: React.ReactNode;
  /** Roles allowed to access this route. If empty, any authenticated user is allowed. */
  allowedRoles?: UserRole[];
  /** Where to redirect unauthenticated users */
  redirectTo?: string;
}

/**
 * AuthGuard — wraps a route and enforces authentication + role-based access.
 * - If not authenticated → redirects to /login
 * - If authenticated but wrong role → redirects to their appropriate home
 */
export function AuthGuard({
  children,
  allowedRoles = [],
  redirectTo = '/login',
}: AuthGuardProps) {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace(redirectTo);
      return;
    }

    const normalizedRole = normalizeRole(role);
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

    if (allowedRoles.length > 0 && role && !normalizedAllowedRoles.includes(normalizedRole)) {
      // Redirect to their correct home
      if (isSuperAdminRole(role)) {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, role, user, router, redirectTo, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading Flowoid Stock…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (allowedRoles.length > 0 && role && !allowedRoles.map(normalizeRole).includes(normalizeRole(role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Opening your workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
