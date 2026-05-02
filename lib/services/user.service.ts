import { api } from '../api-client';
import { CreateUserPayload, ManagedUser, UpdateUserPayload } from '../types';

export interface UserListQuery {
  search?: string;
  roleId?: string;
  isActive?: boolean;
}

function buildUserQuery(query?: UserListQuery) {
  if (!query) return '';

  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.roleId) params.set('roleId', query.roleId);
  if (typeof query.isActive === 'boolean') params.set('isActive', String(query.isActive));

  const value = params.toString();
  return value ? `?${value}` : '';
}

export const UserService = {
  async list(query?: UserListQuery) {
    return api.get<ManagedUser[]>(`/users${buildUserQuery(query)}`);
  },

  async get(id: string) {
    return api.get<ManagedUser>(`/users/${id}`);
  },

  async create(data: CreateUserPayload) {
    return api.post<ManagedUser>('/users', data);
  },

  async update(id: string, data: UpdateUserPayload) {
    return api.put<ManagedUser>(`/users/${id}`, data);
  },

  async delete(id: string) {
    return api.delete<ManagedUser | { message: string }>(`/users/${id}`);
  },

  async getDashboardStats() {
    return api.get<{
      totalTenants: number;
      activeUsers: number;
      totalOrders: number;
      revenue: number;
    }>('/admin/stats');
  }
};
