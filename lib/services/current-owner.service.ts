import { BackendTenant } from '../types';
import type { ApiResponse } from '../api-client';
import { SettingsService } from './settings.service';

const CURRENT_OWNER_STORAGE_KEY = 'flowoid_current_owner';

function saveTenant(tenant: BackendTenant) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_OWNER_STORAGE_KEY, JSON.stringify(tenant));
}

function mapSettingsToTenant(settings: any): BackendTenant {
  return {
    id: settings.id || 'owner',
    name: settings.businessName || 'Current Business',
    slug: 'owner',
    status: 'ACTIVE',
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
    logoUrl: settings.logoUrl,
    businessCategory: settings.category,
  };
}

export const CurrentOwnerService = {
  async getCurrentOwner() {
    const response = await SettingsService.get();
    if (!response.success || !response.data) {
      return { success: false, error: response.error } as any;
    }
    const tenant = mapSettingsToTenant(response.data);
    saveTenant(tenant);
    return {
      success: true,
      data: tenant,
    } as ApiResponse<BackendTenant>;
  },

  async listCurrentOwners() {
    const response = await SettingsService.get();
    if (!response.success || !response.data) {
      return { success: false, error: response.error } as any;
    }
    const tenant = mapSettingsToTenant(response.data);
    saveTenant(tenant);
    return {
      success: true,
      data: [tenant],
    } as ApiResponse<BackendTenant[]>;
  },
};
