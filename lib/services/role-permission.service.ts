import { api } from '../api-client';
import { Role, Permission } from '../types';

export const RoleService = {
  async list() {
    return api.get<Role[]>('/roles');
  },

  async get(id: string) {
    return api.get<Role>(`/roles/${id}`);
  },

  async create(data: Partial<Role> & { permissionIds?: string[] }) {
    return api.post<Role>('/roles', data);
  },

  async update(id: string, data: Partial<Role> & { permissionIds?: string[] }) {
    return api.put<Role>(`/roles/${id}`, data);
  },

  async delete(id: string) {
    return api.delete<{ message: string }>(`/roles/${id}`);
  }
};

export const PermissionService = {
  async list() {
    return api.get<Permission[]>('/permissions');
  },

  async get(id: string) {
    return api.get<Permission>(`/permissions/${id}`);
  },

  async create(data: Partial<Permission>) {
    return api.post<Permission>('/permissions', data);
  },

  async update(id: string, data: Partial<Permission>) {
    return api.put<Permission>(`/permissions/${id}`, data);
  },

  async delete(id: string) {
    return api.delete<{ message: string }>(`/permissions/${id}`);
  }
};
