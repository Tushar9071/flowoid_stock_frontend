'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { User, UserRole, Permission } from './types';
import { AuthService } from './services/auth.service';
import { isOwnerRole, isSuperAdminRole } from './roles';
import { normalizePhoneForApi } from './utils';
import { getMsUntilAccessTokenRefresh, refreshAccessToken } from './api-client';

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
const AUTH_USER_STORAGE_KEY = 'flowoid_auth_user';

const OWNER_DEFAULT_PERMISSIONS = new Set([
  'dashboard.read',
  'designs.read',
  'workers.read',
  'raw_materials.read',
  'stock_items.read',
  'inventory.read',
  'parties.read',
  'sales_orders.read',
  'payments.read',
  'reports.read',
  'users.read',
  'users.create',
  'users.update',
  'users.delete',
  'roles.read',
  'roles.create',
  'roles.update',
  'roles.delete',
  'settings.read',
]);

const PERMISSION_ALIASES: Record<string, string[]> = {
  'dashboard.read': ['dashboard.read', 'home.read'],
  'designs.read': ['designs.read', 'design_catalogue.read', 'design-catalogue.read'],
  'workers.read': ['workers.read', 'worker_management.read', 'worker-management.read'],
  'raw_materials.read': ['raw_materials.read', 'raw-materials.read', 'materials.read'],
  'raw_materials.create': ['raw_materials.create', 'raw-materials.create', 'materials.create'],
  'raw_materials.update': ['raw_materials.update', 'raw_materials.edit', 'raw-materials.update', 'raw-materials.edit', 'materials.update'],
  'raw_materials.delete': ['raw_materials.delete', 'raw-materials.delete', 'materials.delete'],
  'raw-materials.read': ['raw-materials.read', 'raw_materials.read', 'materials.read'],
  'raw-materials.create': ['raw-materials.create', 'raw_materials.create', 'materials.create'],
  'raw-materials.update': ['raw-materials.update', 'raw-materials.edit', 'raw_materials.update', 'raw_materials.edit', 'materials.update'],
  'raw-materials.delete': ['raw-materials.delete', 'raw_materials.delete', 'materials.delete'],
  'stock_items.read': ['stock_items.read', 'stock-items.read', 'inventory.read', 'stock.read'],
  'parties.read': ['parties.read', 'party_management.read', 'party-management.read', 'customers.read', 'suppliers.read'],
  'parties.create': ['parties.create', 'party_management.create', 'customers.create', 'suppliers.create'],
  'parties.update': ['parties.update', 'parties.edit', 'party_management.update', 'customers.update', 'suppliers.update'],
  'parties.delete': ['parties.delete', 'party_management.delete', 'customers.delete', 'suppliers.delete'],
  'sales_orders.read': ['sales_orders.read', 'sales-orders.read', 'orders.read', 'orders_dispatch.read'],
  'payments.read': ['payments.read', 'payments_ledger.read', 'payments-ledger.read', 'ledger.read'],
  'reports.read': ['reports.read'],
  'users.read': ['users.read', 'user_management.read', 'user-management.read'],
  'users.create': ['users.create', 'user_management.create'],
  'users.update': ['users.update', 'users.edit', 'user_management.update'],
  'users.delete': ['users.delete', 'user_management.delete'],
  'roles.read': ['roles.read', 'role_management.read', 'role-management.read'],
  'roles.create': ['roles.create', 'role_management.create'],
  'roles.update': ['roles.update', 'roles.edit', 'role_management.update'],
  'roles.delete': ['roles.delete', 'role_management.delete'],
  'settings.read': ['settings.read'],
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isFullAccess, setIsFullAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sync user and permissions on mount
  useEffect(() => {
    const initAuth = async () => {
      const publicRoutes = ['/', '/login', '/register', '/demo'];
      const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/demo'));

      if (isPublicRoute) {
        setIsLoading(false);
        return;
      }

      try {
        const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        const response = await AuthService.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
          localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(response.data));
          
          // Fetch permissions if user is authenticated
          const permResponse = await AuthService.getMyPermissions();
          if (permResponse.success) {
            const normalized = normalizePermissions(permResponse.data);
            setPermissions(normalized.codes);
            setIsFullAccess(normalized.isFullAccess);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [pathname]);

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
      // Auto-detect email vs phone
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      
      const loginPayload: any = { password };
      if (isEmail) {
        loginPayload.email = identifier;
      } else {
        const phone = normalizePhoneForApi(identifier);
        if (phone.length < 6) {
          return { success: false, error: 'Enter a valid email address or phone number.' };
        }
        loginPayload.phone = phone;
      }

      const response = await AuthService.login(loginPayload);
      
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
    try {
      await AuthService.logout();
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      setUser(null);
      setPermissions([]);
      setIsFullAccess(false);
      window.location.href = '/login';
    }
  };

  const completeAuth = async (userData: User): Promise<string> => {
    setUser(userData);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(userData));

    try {
      const permResponse = await AuthService.getMyPermissions();
      if (permResponse.success && permResponse.data) {
        const normalized = normalizePermissions(permResponse.data);
        setPermissions(normalized.codes);
        setIsFullAccess(normalized.isFullAccess);
      } else if (isSuperAdminRole(userData.role)) {
        setIsFullAccess(true);
      }
    } catch (permError) {
      if (isSuperAdminRole(userData.role)) {
        setIsFullAccess(true);
      }
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
          setPermissions(normalized.codes);
          setIsFullAccess(normalized.isFullAccess);
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
    if (permissionCode === 'dashboard.read') return true;
    if (isOwnerRole(user?.role) && permissions.length === 0 && OWNER_DEFAULT_PERMISSIONS.has(permissionCode)) {
      return OWNER_DEFAULT_PERMISSIONS.has(permissionCode);
    }

    const normalizedPermissions = new Set(permissions.map(code => code.toLowerCase()));
    const candidates = PERMISSION_ALIASES[permissionCode] || [permissionCode];
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
