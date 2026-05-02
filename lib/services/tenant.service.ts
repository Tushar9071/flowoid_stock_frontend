import { api } from '../api-client';
import { BackendTenant, CreateTenantPayload } from '../types';

export const TenantService = {
  async create(data: CreateTenantPayload) {
    return api.post<BackendTenant>('/tenants', data);
  },

  async mine() {
    return api.get<BackendTenant[]>('/tenants/mine');
  },
};
