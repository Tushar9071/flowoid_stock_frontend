import { api } from '../api-client';
import { Permission, User } from '../types';

export interface AuthResponse {
  user: User;
  accessTokenExpiresAt?: number;
  refreshTokenExpiresAt?: number;
  message?: string;
}

export interface PermissionResponse {
  permissions: Permission[];
  isFullAccess: boolean;
}

function unwrapUser(payload: any): User {
  return (payload?.user || payload) as User;
}

function permissionCode(permission: any) {
  if (!permission) return '';
  if (permission.code) return permission.code;
  if (permission.module && permission.action) {
    return `${String(permission.module).toLowerCase()}.${String(permission.action).toLowerCase()}`;
  }
  return '';
}

function normalizePermissions(user: any): PermissionResponse {
  const role = String(user?.role || '').toUpperCase();
  const rawPermissions = Array.isArray(user?.permissions) ? user.permissions : [];

  return {
    isFullAccess: role === 'ADMIN',
    permissions: rawPermissions
      .map((permission: any) => ({
        ...permission,
        code: permissionCode(permission),
        name: permission.description || permissionCode(permission),
        createdAt: permission.createdAt || '',
      }))
      .filter((permission: Permission) => Boolean(permission.code)),
  };
}

export const AuthService = {
  async login(credentials: { identifier: string; password: string } | any) {
    const identifier = credentials.identifier || credentials.email || credentials.phone;
    const response = await api.post<any>('/auth/login', {
      identifier,
      password: credentials.password,
    });

    if (!response.success) return response;

    return {
      ...response,
      data: {
        ...response.data,
        user: unwrapUser(response.data),
      } as AuthResponse,
    };
  },

  async register(data: { name: string; phone: string; email?: string; password: string }) {
    const response = await api.post<any>('/auth/register', data);
    if (!response.success) return response;

    return {
      ...response,
      data: {
        ...response.data,
        user: unwrapUser(response.data),
      } as AuthResponse,
    };
  },

  async logout() {
    return api.post<{ message: string }>('/auth/logout');
  },

  async getCurrentUser() {
    const response = await api.get<any>('/auth/me');
    if (!response.success) return response;

    return {
      ...response,
      data: unwrapUser(response.data),
    };
  },

  async getMyPermissions() {
    const response = await this.getCurrentUser();
    if (!response.success) return response as any;

    return {
      ...response,
      data: normalizePermissions(response.data),
    };
  },

  async refresh() {
    const response = await api.post<any>('/auth/refresh');
    if (!response.success) return response;

    return {
      ...response,
      data: {
        ...response.data,
        user: unwrapUser(response.data),
      } as AuthResponse,
    };
  },

  async updateProfile(data: Partial<Pick<User, 'name' | 'phone' | 'email'>>) {
    const response = await api.put<any>('/auth/me', data);
    if (!response.success) return response;

    return {
      ...response,
      data: unwrapUser(response.data),
    };
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return api.put<{ message: string }>('/auth/change-password', data);
  },

  async resetOwnerPassword(data: { ownerId: string; newPassword: string }) {
    return api.post<{ message: string }>('/auth/admin/reset-password', data);
  },
};
