import { api } from '../api-client';
import { AuthService } from './auth.service';
import { CreateUserPayload, ManagedUser, UpdateUserPayload } from '../types';
import { asItemResponse, asListResponse, buildQuery } from './api-normalizers';

export interface UserListQuery {
  search?: string;
  roleId?: string;
  tenantId?: string;
  isActive?: boolean;
}

const admin = (path: string) => `/admin${path}`;

function ownerToManagedUser(owner: any): ManagedUser {
  return {
    ...owner,
    isActive: owner.status !== 'INACTIVE',
    role: owner.role || 'OWNER',
  };
}

function normalizeList(response: Awaited<ReturnType<typeof api.get<any>>>) {
  const normalized = asListResponse<any>(response, 'owners');
  if (!normalized.success) return normalized as any;
  return {
    ...normalized,
    data: normalized.data.items.map(ownerToManagedUser),
  };
}

export const UserService = {
  async list(query?: UserListQuery) {
    return normalizeList(await api.get(admin(`/owners${buildQuery(query as any)}`)));
  },

  async get(id: string) {
    const response = asItemResponse<any>(await api.get(admin(`/owners/${id}`)), 'owner');
    return response.success ? { ...response, data: ownerToManagedUser(response.data) } : response;
  },

  async create(data: CreateUserPayload) {
    const payload = {
      ...data,
      status: typeof data.isActive === 'boolean' ? (data.isActive ? 'ACTIVE' : 'INACTIVE') : undefined,
    };
    const response = asItemResponse<any>(await api.post(admin('/owners'), payload), 'owner');
    return response.success ? { ...response, data: ownerToManagedUser(response.data) } : response;
  },

  async update(id: string, data: UpdateUserPayload) {
    const payload = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      status: typeof data.isActive === 'boolean' ? (data.isActive ? 'ACTIVE' : 'INACTIVE') : undefined,
    };
    const response = asItemResponse<any>(await api.put(admin(`/owners/${id}`), payload), 'owner');
    return response.success ? { ...response, data: ownerToManagedUser(response.data) } : response;
  },

  async delete(id: string, hardDelete = false) {
    const url = admin(`/owners/${id}${hardDelete ? '?hard=true' : ''}`);
    const response = asItemResponse<any>(await api.delete(url), 'owner');
    return response.success ? { ...response, data: ownerToManagedUser(response.data) } : response;
  },

  async resetPassword(ownerId: string, newPassword: string) {
    return AuthService.resetOwnerPassword({ ownerId, newPassword });
  },
};
