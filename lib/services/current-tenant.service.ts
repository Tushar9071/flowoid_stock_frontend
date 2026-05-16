import { AuthService } from './auth.service';
import { TenantService } from './tenant.service';
import { api } from '../api-client';
import { BackendTenant, ManagedUser, User } from '../types';

const AUTH_USER_STORAGE_KEY = 'flowoid_auth_user';
const CURRENT_TENANT_STORAGE_KEY = 'flowoid_current_tenant';
const ACCESS_TOKEN_STORAGE_KEY = 'auth_token';
let tenantPromise: Promise<{
  success: boolean;
  data: BackendTenant | null;
  error?: { code: string; message: string; details?: any };
}> | null = null;

function tenantFromId(id?: string | null): BackendTenant | null {
  if (!id) return null;
  return {
    id,
    name: 'Current Business',
    slug: id,
    status: 'ACTIVE',
  };
}

type TenantCarrier = Partial<User> | Partial<ManagedUser>;

function tenantFromUser(user?: TenantCarrier | null): BackendTenant | null {
  if (!user) return null;
  const data = user as any;
  const nestedUser = data.user || data.data?.user || data.profile || data.data?.profile;
  if (nestedUser && nestedUser !== data) {
    const tenant = tenantFromUser(nestedUser);
    if (tenant) return tenant;
  }

  if (data.tenant?.id) return data.tenant;
  if (data.tenants?.[0]?.id) return data.tenants[0];
  if (data.currentTenant?.id) return data.currentTenant;
  if (data.activeTenant?.id) return data.activeTenant;
  if (data.business?.id) return {
    id: data.business.id,
    name: data.business.name || data.business.businessName || 'Current Business',
    slug: data.business.slug || data.business.id,
    status: data.business.status || 'ACTIVE',
  };

  const tenantUser = data.tenantUsers?.find((item: any) => item.tenant?.id || item.tenantId);
  if (tenantUser?.tenant?.id) return tenantUser.tenant;
  if (tenantUser?.tenantId) return tenantFromId(tenantUser.tenantId);

  return tenantFromId(
    data.tenantId ||
    data.activeTenantId ||
    data.currentTenantId ||
    data.businessId
  );
}

function saveTenant(tenant: BackendTenant | null) {
  if (!tenant || typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_TENANT_STORAGE_KEY, JSON.stringify(tenant));
}

function firstTenantFromPayload(payload: any): BackendTenant | null {
  if (!payload) return null;
  if (Array.isArray(payload)) {
    for (const item of payload) {
      if (item?.id) return item;
      if (item?.tenant?.id) return item.tenant;
      const nested = firstTenantFromPayload(item);
      if (nested?.id) return nested;
    }
    return null;
  }
  if (payload.id) return payload as BackendTenant;
  if (payload.tenant?.id) return payload.tenant;
  if (payload.currentTenant?.id) return payload.currentTenant;
  if (payload.activeTenant?.id) return payload.activeTenant;

  const candidates = [
    payload.items,
    payload.tenants,
    payload.businesses,
    payload.userTenants,
    payload.tenantUsers,
    payload.data,
    payload.data?.items,
    payload.data?.tenants,
    payload.data?.businesses,
    payload.data?.tenantUsers,
    payload.result,
    payload.result?.items,
  ];

  for (const candidate of candidates) {
    const tenant = firstTenantFromPayload(candidate);
    if (tenant?.id) return tenant;
  }

  return null;
}

function storedCurrentTenant() {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CURRENT_TENANT_STORAGE_KEY);
    return stored ? JSON.parse(stored) as BackendTenant : null;
  } catch {
    return null;
  }
}

function storedUserTenant() {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return stored ? tenantFromUser(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

function tokenTenant() {
  if (typeof window === 'undefined') return null;

  try {
    const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    const payload = token?.split('.')[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(normalized));
    const rawTenant =
      decoded.tenantId ||
      decoded.tenant_id ||
      decoded.activeTenantId ||
      decoded.currentTenantId ||
      decoded.businessId ||
      decoded.tenantIds?.[0] ||
      decoded.tenants?.[0]?.id ||
      decoded.tenants?.[0] ||
      decoded.tenantUsers?.[0]?.tenantId ||
      decoded.tenantUsers?.[0]?.tenant?.id;

    if (rawTenant && typeof rawTenant === 'object' && rawTenant.id) return rawTenant;
    return tenantFromId(rawTenant);
  } catch {
    return null;
  }
}

export const CurrentTenantService = {
  async getCurrentTenant() {
    if (tenantPromise) return tenantPromise;

    tenantPromise = this.resolveCurrentTenant().finally(() => {
      tenantPromise = null;
    });

    return tenantPromise;
  },

  async resolveCurrentTenant() {
    const mine = await TenantService.mine();
    const mineTenant = firstTenantFromPayload(mine.data);
    if (mine.success && mineTenant?.id) {
      saveTenant(mineTenant);
      return {
        success: true,
        data: mineTenant,
      };
    }

    const currentUser = await AuthService.getCurrentUser();
    if (currentUser.success) {
      const tenant = tenantFromUser(currentUser.data);
      if (tenant) {
        saveTenant(tenant);
        return {
          success: true,
          data: tenant,
        };
      }

      const userDetail = await api.get<ManagedUser>(`/users/${currentUser.data.id}`);
      if (userDetail.success) {
        const tenantFromDetail = tenantFromUser(userDetail.data);
        if (tenantFromDetail) {
          saveTenant(tenantFromDetail);
          return {
            success: true,
            data: tenantFromDetail,
          };
        }
      }
    }

    const storedTenant = storedUserTenant();
    if (storedTenant) {
      saveTenant(storedTenant);
      return {
        success: true,
        data: storedTenant,
      };
    }

    const jwtTenant = tokenTenant();
    if (jwtTenant) {
      saveTenant(jwtTenant);
      return {
        success: true,
        data: jwtTenant,
      };
    }

    const previousTenant = storedCurrentTenant();
    if (previousTenant?.id && !mine.error && !currentUser.error) {
      return {
        success: true,
        data: previousTenant,
      };
    }

    return {
      success: false,
      data: null,
      error: mine.error || currentUser.error || {
        code: 'TENANT_NOT_FOUND',
        message: 'No business tenant found for this account',
      },
    };
  },

  async listCurrentTenants() {
    const mine = await TenantService.mine();
    const mineTenant = firstTenantFromPayload(mine.data);
    if (mine.success && mineTenant?.id) {
      saveTenant(mineTenant);
      return {
        success: true,
        data: Array.isArray(mine.data) ? mine.data : [mineTenant],
      };
    }

    const current = await this.getCurrentTenant();
    if (current.success && current.data) {
      saveTenant(current.data);
      return {
        success: true,
        data: [current.data],
      };
    }

    const previousTenant = storedCurrentTenant();
    if (previousTenant?.id && !current.error) {
      return {
        success: true,
        data: [previousTenant],
      };
    }

    return {
      success: false,
      data: [],
      error: current.error,
    };
  },
};
