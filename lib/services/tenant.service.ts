import { BackendTenant, CreateTenantPayload } from '../types';
import type { ApiResponse } from '../api-client';

const SINGLE_BUSINESS: BackendTenant = {
  id: 'owner',
  name: 'Current Business',
  slug: 'owner',
  status: 'ACTIVE',
};

export const TenantService = {
  async create(data: CreateTenantPayload) {
    return {
      success: true,
      data: {
        ...SINGLE_BUSINESS,
        name: data.name || SINGLE_BUSINESS.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
      },
    } as ApiResponse<BackendTenant>;
  },

  async mine() {
    return {
      success: true,
      data: [SINGLE_BUSINESS],
    } as ApiResponse<BackendTenant[]>;
  },
};
