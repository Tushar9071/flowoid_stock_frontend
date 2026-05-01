import type { UserRole } from './types';

export function normalizeRole(role?: UserRole | null): string {
  if (!role) return 'viewer';

  const normalized = String(role).trim().toUpperCase();

  if (normalized === 'SUPER_ADMIN' || normalized === 'FLOWOID_ADMIN') return 'flowoid_admin';
  if (normalized === 'OWNER' || normalized === 'TENANT_OWNER' || normalized.includes('OWNER')) return 'owner';
  if (normalized === 'MANAGER' || normalized === 'TENANT_MANAGER' || normalized.includes('MANAGER')) return 'manager';
  if (normalized === 'VIEWER' || normalized === 'AUDITOR' || normalized.includes('VIEWER')) return 'viewer';
  if (normalized === 'STAFF' || normalized === 'TENANT_STAFF') return 'manager';

  return normalized.toLowerCase();
}

export function isSuperAdminRole(role?: UserRole | null): boolean {
  return normalizeRole(role) === 'flowoid_admin';
}

export function isOwnerRole(role?: UserRole | null): boolean {
  return normalizeRole(role) === 'owner';
}

export function canManageTenant(role?: UserRole | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'owner' || normalized === 'flowoid_admin';
}

