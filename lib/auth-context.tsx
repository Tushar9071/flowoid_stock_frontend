'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from './types';
import { mockUsers, DEMO_CREDENTIALS } from './data';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  login: (email: string, password: string) => { success: boolean; error?: string; redirectTo?: string };
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('flowoid_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        const foundUser = mockUsers.find(u => u.id === parsed.userId);
        if (foundUser && foundUser.status === 'active') {
          setUser(foundUser);
        }
      }
    } catch {
      localStorage.removeItem('flowoid_auth');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (email: string, password: string): { success: boolean; error?: string; redirectTo?: string } => {
    const cred = DEMO_CREDENTIALS.find(
      c => c.email.toLowerCase() === email.toLowerCase() && c.password === password
    );

    if (!cred) {
      return { success: false, error: 'Invalid email or password. Check the demo credentials below.' };
    }

    const foundUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!foundUser) {
      return { success: false, error: 'User account not found.' };
    }

    if (foundUser.status !== 'active') {
      return { success: false, error: 'This account is inactive. Contact Flowoid Admin.' };
    }

    setUser(foundUser);
    localStorage.setItem('flowoid_auth', JSON.stringify({ userId: foundUser.id }));

    // Role-based redirect
    const redirectTo = foundUser.role === 'flowoid_admin' ? '/admin' : '/dashboard';
    return { success: true, redirectTo };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('flowoid_auth');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        login,
        logout,
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
