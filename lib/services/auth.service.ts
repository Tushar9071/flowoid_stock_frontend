import { api } from '../api-client';
import { User, Permission } from '../types';

export interface AuthResponse {
  user: User;
}

export interface PermissionResponse {
  permissions: Permission[];
  isFullAccess: boolean;
}

export type MyPermissionsResponse = PermissionResponse | string[];

function unwrapUser(payload: any): User {
  return (
    payload?.user ||
    payload?.data?.user ||
    payload?.profile ||
    payload?.data?.profile ||
    payload
  ) as User;
}

function normalizeAuthResponse(payload: any): AuthResponse {
  return {
    ...payload,
    user: unwrapUser(payload),
  };
}

export const AuthService = {
  async login(credentials: any) {
    const response = await api.post<any>('/auth/login', credentials);
    if (response.success) {
      return {
        ...response,
        data: normalizeAuthResponse(response.data),
      };
    }
    return response;
  },

  async register(data: any) {
    const response = await api.post<any>('/auth/register', data);
    if (response.success) {
      return {
        ...response,
        data: normalizeAuthResponse(response.data),
      };
    }
    return response;
  },

  async logout() {
    return api.post<{ message: string }>('/auth/logout');
  },

  async getCurrentUser() {
    const response = await api.get<any>('/auth/me');
    if (response.success) {
      return {
        ...response,
        data: unwrapUser(response.data),
      };
    }
    return response;
  },

  async getMyPermissions() {
    return api.get<MyPermissionsResponse>('/auth/my-permissions');
  },

  async refresh() {
    const response = await api.post<any>('/auth/refresh');
    if (response.success) {
      return {
        ...response,
        data: normalizeAuthResponse(response.data),
      };
    }
    return response;
  },

  async changePassword(data: any) {
    return api.post<{ message: string }>('/auth/change-password', data);
  }
};
