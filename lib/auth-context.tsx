'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { User, UserRole, Permission } from './types';
import { AuthService } from './services/auth.service';
import { isSuperAdminRole } from './roles';
import { normalizePhoneForApi } from './utils';

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
    return permissions.includes(permissionCode);
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
