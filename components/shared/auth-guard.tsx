'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';
import { isSuperAdminRole, normalizeRole } from '@/lib/roles';
import { SkeletonAppLayout } from '@/components/skeleton/Skeletons';

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
      router.replace('/login');
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
    return <SkeletonAppLayout />;
  }

  if (!isAuthenticated || !user) {
    return <SkeletonAppLayout />;
  }

  if (allowedRoles.length > 0 && role && !allowedRoles.map(normalizeRole).includes(normalizeRole(role))) {
    return <SkeletonAppLayout />;
  }

  return <>{children}</>;
}
