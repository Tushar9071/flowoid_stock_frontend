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

export const AuthService = {
  async login(credentials: any) {
    return api.post<AuthResponse>('/auth/login', credentials);
  },

  async register(data: any) {
    return api.post<AuthResponse>('/auth/register', data);
  },

  async logout() {
    return api.post<{ message: string }>('/auth/logout');
  },

  async getCurrentUser() {
    return api.get<User>('/auth/me');
  },

  async getMyPermissions() {
    return api.get<MyPermissionsResponse>('/auth/my-permissions');
  },

  async refresh() {
    return api.post<AuthResponse>('/auth/refresh');
  },

  async changePassword(data: any) {
    return api.post<{ message: string }>('/auth/change-password', data);
  }
};
