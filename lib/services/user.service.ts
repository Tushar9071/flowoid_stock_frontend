import { api } from '../api-client';
import { User } from '../types';

export const UserService = {
  async list() {
    return api.get<User[]>('/users');
  },

  async get(id: string) {
    return api.get<User>(`/users/${id}`);
  },

  async create(data: Partial<User>) {
    return api.post<User>('/users', data);
  },

  async update(id: string, data: Partial<User>) {
    return api.put<User>(`/users/${id}`, data);
  },

  async delete(id: string) {
    return api.delete<{ message: string }>(`/users/${id}`);
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
