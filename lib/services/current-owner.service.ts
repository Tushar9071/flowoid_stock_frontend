import { BackendTenant } from '../types';
import type { ApiResponse } from '../api-client';
import { TenantService } from './tenant.service';

const CURRENT_OWNER_STORAGE_KEY = 'flowoid_current_owner';

function saveTenant(tenant: BackendTenant) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_OWNER_STORAGE_KEY, JSON.stringify(tenant));
}

export const CurrentOwnerService = {
  async getCurrentOwner() {
    const response = await TenantService.mine();
    const tenant = response.data[0];
    saveTenant(tenant);
    return {
      success: true,
      data: tenant,
    } as ApiResponse<BackendTenant>;
  },

  async listCurrentOwners() {
    const response = await TenantService.mine();
    response.data.forEach(saveTenant);
    return response;
  },
};
