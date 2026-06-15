'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { User, UserRole, Permission } from './types';
import { AuthService } from './services/auth.service';
import { isOwnerRole, isSuperAdminRole } from './roles';
import { normalizePhoneForApi } from './utils';
import { AUTH_USER_STORAGE_KEY, clearAuthStorage, getMsUntilAccessTokenRefresh, refreshAccessToken } from './api-client';
import { DEFAULT_OWNER_PERMISSION_CODES } from './services/role-permission.service';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  permissions: string[]; // Store only codes for easy checking
  isFullAccess: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  completeAuth: (user: User) => Promise<string>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const OWNER_DEFAULT_PERMISSIONS = DEFAULT_OWNER_PERMISSION_CODES;
const OWNER_DEFAULT_PERMISSION_LIST = Array.from(OWNER_DEFAULT_PERMISSIONS);

const PERMISSION_ALIASES: Record<string, string[]> = {
  'dashboard.read': ['dashboard.read', 'dashboard.view', 'home.read'],
  'designs.read': ['designs.read', 'designs.view', 'design_catalogue.read', 'design-catalogue.read'],
  'designs.create': ['designs.create', 'design_catalogue.create', 'design-catalogue.create'],
  'designs.update': ['designs.update', 'designs.edit', 'design_catalogue.update', 'design-catalogue.update'],
  'designs.delete': ['designs.delete', 'design_catalogue.delete', 'design-catalogue.delete'],
  'workers.read': ['workers.read', 'workers.view', 'worker_management.read', 'worker-management.read'],
  'workers.create': ['workers.create', 'worker_management.create', 'worker-management.create'],
  'workers.update': ['workers.update', 'workers.edit', 'worker_management.update', 'worker-management.update'],
  'workers.delete': ['workers.delete', 'worker_management.delete', 'worker-management.delete'],
  'assignments.create': ['assignments.create', 'worker_assignments.create'],
  'assignments.update': ['assignments.update', 'assignments.edit', 'worker_assignments.update'],
  'raw_materials.read': ['raw_materials.read', 'raw_materials.view', 'raw-materials.read', 'materials.read'],
  'raw_materials.create': ['raw_materials.create', 'raw-materials.create', 'materials.create'],
  'raw_materials.update': ['raw_materials.update', 'raw_materials.edit', 'raw-materials.update', 'raw-materials.edit', 'materials.update'],
  'raw_materials.delete': ['raw_materials.delete', 'raw-materials.delete', 'materials.delete'],
  'raw_materials.approve': ['raw_materials.approve', 'raw-materials.approve', 'materials.approve'],
  'raw-materials.read': ['raw-materials.read', 'raw_materials.read', 'raw_materials.view', 'materials.read'],
  'raw-materials.create': ['raw-materials.create', 'raw_materials.create', 'materials.create'],
  'raw-materials.update': ['raw-materials.update', 'raw-materials.edit', 'raw_materials.update', 'raw_materials.edit', 'materials.update'],
  'raw-materials.delete': ['raw-materials.delete', 'raw_materials.delete', 'materials.delete'],
  'raw-materials.approve': ['raw-materials.approve', 'raw_materials.approve', 'materials.approve'],
  'stock_items.read': ['stock_items.read', 'stock-items.read', 'inventory.read', 'inventory.view', 'stock.read'],
  'stock_items.create': ['stock_items.create', 'stock-items.create', 'inventory.create', 'stock.create'],
  'inventory.create': ['inventory.create', 'stock_items.create', 'stock.create'],
  'inventory.update': ['inventory.update', 'inventory.edit', 'stock_items.update', 'stock-items.update', 'stock.update'],
  'parties.read': ['parties.read', 'parties.view', 'party_management.read', 'party-management.read', 'customers.read', 'dealers.read', 'suppliers.read'],
  'parties.create': ['parties.create', 'party_management.create', 'customers.create', 'dealers.create', 'suppliers.create'],
  'parties.update': ['parties.update', 'parties.edit', 'party_management.update', 'customers.update', 'dealers.update', 'suppliers.update'],
  'parties.delete': ['parties.delete', 'party_management.delete', 'customers.delete', 'dealers.delete', 'suppliers.delete'],
  'dealer_management.read': ['dealer_management.read', 'dealer-management.read', 'dealers.read', 'parties.read', 'parties.view'],
  'dealer_management.create': ['dealer_management.create', 'dealer-management.create', 'dealers.create', 'parties.create'],
  'dealer_management.update': ['dealer_management.update', 'dealer-management.update', 'dealers.update', 'dealers.edit', 'parties.update', 'parties.edit'],
  'dealer_management.delete': ['dealer_management.delete', 'dealer-management.delete', 'dealers.delete', 'parties.delete'],
  'supplier_management.read': ['supplier_management.read', 'supplier-management.read', 'suppliers.read', 'parties.read', 'parties.view'],
  'supplier_management.create': ['supplier_management.create', 'supplier-management.create', 'suppliers.create', 'parties.create'],
  'supplier_management.update': ['supplier_management.update', 'supplier-management.update', 'suppliers.update', 'suppliers.edit', 'parties.update', 'parties.edit'],
  'supplier_management.delete': ['supplier_management.delete', 'supplier-management.delete', 'suppliers.delete', 'parties.delete'],
  'sales_orders.read': ['sales_orders.read', 'sales-orders.read', 'orders.read', 'orders.view', 'orders_dispatch.read'],
  'sales_orders.create': ['sales_orders.create', 'sales-orders.create', 'orders.create', 'orders_dispatch.create'],
  'orders.create': ['orders.create', 'sales_orders.create', 'sales-orders.create'],
  'orders.update': ['orders.update', 'orders.edit', 'sales_orders.update', 'sales-orders.update', 'orders_dispatch.update'],
  'orders.dispatch': ['orders.dispatch', 'orders_dispatch.dispatch', 'sales_orders.dispatch'],
  'orders.cancel': ['orders.cancel', 'orders.delete', 'sales_orders.cancel', 'sales-orders.cancel'],
  'payments.read': ['payments.read', 'payments.view', 'payments_ledger.read', 'payments-ledger.read', 'ledger.read'],
  'payments.create': ['payments.create', 'payments_ledger.create', 'payments-ledger.create'],
  'payments.update': ['payments.update', 'payments.edit', 'payments_ledger.update', 'payments-ledger.update'],
  'worker_payments.create': ['worker_payments.create', 'worker-payments.create', 'workers.payments.create', 'payments.create'],
  'reports.read': ['reports.read', 'reports.view'],
  'users.read': ['users.read', 'user_management.read', 'user-management.read'],
  'users.create': ['users.create', 'user_management.create'],
  'users.update': ['users.update', 'users.edit', 'user_management.update'],
  'users.delete': ['users.delete', 'user_management.delete'],
  'roles.read': ['roles.read', 'role_management.read', 'role-management.read'],
  'roles.create': ['roles.create', 'role_management.create'],
  'roles.update': ['roles.update', 'roles.edit', 'role_management.update'],
  'roles.delete': ['roles.delete', 'role_management.delete'],
  'settings.read': ['settings.read', 'settings.view'],
  'settings.manage_settings': ['settings.manage_settings', 'settings.manage-settings', 'settings.update', 'settings.edit'],
};


function normalizePermissions(data: unknown): { codes: string[]; isFullAccess: boolean } {
  if (!data) {
    return { codes: [], isFullAccess: false };
  }

  const payload = Array.isArray(data) ? data : (data as any).permissions;
  const codes = (Array.isArray(payload) ? payload : [])
    .map((permission: Permission | string) =>
      typeof permission === 'string' ? permission : permission.code
    )
    .filter(Boolean);

  return {
    codes,
    isFullAccess: !Array.isArray(data) && Boolean((data as any).isFullAccess),
  };
}

function applyPermissionsForUser(
  userData: User,
  normalized: { codes: string[]; isFullAccess: boolean },
  setPermissions: (permissions: string[]) => void,
  setIsFullAccess: (isFullAccess: boolean) => void
) {
  // Super admin / full-access users: grant full access flag
  if (normalized.isFullAccess || isSuperAdminRole(userData.role)) {
    setPermissions(normalized.codes);
    setIsFullAccess(true);
    return;
  }

  // All other users (including Owner): use ONLY what the backend returned.
  // No fallback — backend is the single source of truth.
  // If backend returns [] it means no permissions were assigned.
  setPermissions(normalized.codes);
  setIsFullAccess(false);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isFullAccess, setIsFullAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const publicRoutes = ['/', '/login', '/register', '/demo'];
      const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/demo'));

      const storedUserStr = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      const startTime = Date.now();

      try {
        if (storedUserStr) {
          setUser(JSON.parse(storedUserStr));
        }

        if (isPublicRoute && !storedUserStr) {
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
          if (pathname === '/' && isStandalone) {
             router.replace('/login');
          }
          setIsLoading(false);
          return;
        }

        const response = await AuthService.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
          localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(response.data));
          
          const permResponse = await AuthService.getMyPermissions();
          if (permResponse.success) {
            const normalized = normalizePermissions(permResponse.data);
            applyPermissionsForUser(response.data, normalized, setPermissions, setIsFullAccess);
          }

          if (isPublicRoute && pathname !== '/demo') {
            router.replace(isSuperAdminRole(response.data.role) ? '/admin' : '/dashboard');
            return;
          }
        } else {
          if (storedUserStr) {
             localStorage.removeItem(AUTH_USER_STORAGE_KEY);
             setUser(null);
          }
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
          if (pathname === '/' && isStandalone) {
             router.replace('/login');
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        const elapsed = Date.now() - startTime;
        if (elapsed < 400) {
          await new Promise(resolve => setTimeout(resolve, 400 - elapsed));
        }
        setIsLoading(false);
      }
    };

    initAuth();
  }, [pathname, router]);

  useEffect(() => {
    if (!user) return;

    let timer: number | undefined;

    const scheduleRefresh = () => {
      const delay = getMsUntilAccessTokenRefresh();
      if (delay === null) return;

      timer = window.setTimeout(async () => {
        const refreshed = await refreshAccessToken();
        const nextDelay = getMsUntilAccessTokenRefresh();
        if (refreshed && nextDelay !== null) {
          scheduleRefresh();
        }
      }, delay);
    };

    scheduleRefresh();

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [user]);

  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string; redirectTo?: string }> => {
    try {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const normalizedIdentifier = isEmail ? identifier.trim() : normalizePhoneForApi(identifier);

      if (!isEmail && normalizedIdentifier.length < 6) {
        return { success: false, error: 'Enter a valid email address or phone number.' };
      }

      const response = await AuthService.login({
        identifier: normalizedIdentifier,
        password,
      });
      
      if (response.success && response.data) {
        const user = response.data.user;
        const redirectTo = await completeAuth(user);
        return { success: true, redirectTo };
      } else {
        return { 
          success: false, 
          error: response.error?.message || 'Authentication failed' 
        };
      }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    // Fire the API call in the background without waiting
    AuthService.logout().catch(console.error);
    
    // Instantly clear storage and force a hard redirect to cleanly wipe all app state
    clearAuthStorage();
    window.location.href = '/login';
  };

  const completeAuth = async (userData: User): Promise<string> => {
    setUser(userData);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(userData));

    try {
      const permResponse = await AuthService.getMyPermissions();
      if (permResponse.success && permResponse.data) {
        const normalized = normalizePermissions(permResponse.data);
        applyPermissionsForUser(userData, normalized, setPermissions, setIsFullAccess);
      } else {
        // Permissions API returned no usable data:
        // Super admin gets full access by role; everyone else gets no permissions (safe default)
        setPermissions([]);
        setIsFullAccess(isSuperAdminRole(userData.role));
        console.warn('Permission fetch returned no data after login — granting no permissions');
      }
    } catch (permError) {
      // Network/server error during permission fetch:
      // Safe default — no permissions. Super admin keeps access via role check.
      setPermissions([]);
      setIsFullAccess(isSuperAdminRole(userData.role));
      console.warn('Permission fetch failed after auth:', permError);
    }

    return isSuperAdminRole(userData.role) ? '/admin' : '/dashboard';
  };

  const refreshAuth = async () => {
    setIsLoading(true);
    try {
      const response = await AuthService.getCurrentUser();
      if (response.success && response.data) {
        const userData = response.data;
        setUser(userData);
        
        const permResponse = await AuthService.getMyPermissions();
        if (permResponse.success) {
          const normalized = normalizePermissions(permResponse.data);
          applyPermissionsForUser(userData, normalized, setPermissions, setIsFullAccess);
        }
      }
    } catch (error) {
      console.error('Auth refresh failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (isFullAccess || isSuperAdminRole(user?.role)) return true;
    if (isOwnerRole(user?.role) && (permissionCode.startsWith('users.') || permissionCode.startsWith('roles.'))) {
      return false;
    }
    const normalizedPermissions = new Set(permissions.map(code => code.toLowerCase()));
    const candidates = PERMISSION_ALIASES[permissionCode] || [permissionCode];
    if (permissionCode === 'dashboard.read' && permissions.length === 0) return true;
    return candidates.some(code => normalizedPermissions.has(code.toLowerCase()));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        permissions,
        isFullAccess,
        login,
        completeAuth,
        logout,
        refreshAuth,
        hasPermission,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
