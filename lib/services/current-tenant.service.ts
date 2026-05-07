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
  if (data.tenant?.id) return data.tenant;
  if (data.tenants?.[0]?.id) return data.tenants[0];

  const tenantUser = data.tenantUsers?.find((item: any) => item.tenant?.id || item.tenantId);
  if (tenantUser?.tenant?.id) return tenantUser.tenant;
  if (tenantUser?.tenantId) return tenantFromId(tenantUser.tenantId);

  return tenantFromId(data.tenantId);
}

function saveTenant(tenant: BackendTenant | null) {
  if (!tenant || typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_TENANT_STORAGE_KEY, JSON.stringify(tenant));
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
    const tenantId =
      decoded.tenantId ||
      decoded.tenant_id ||
      decoded.activeTenantId ||
      decoded.currentTenantId ||
      decoded.tenants?.[0]?.id ||
      decoded.tenantUsers?.[0]?.tenantId ||
      decoded.tenantUsers?.[0]?.tenant?.id;

    return tenantFromId(tenantId);
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
    const previousTenant = storedCurrentTenant();
    if (previousTenant?.id) {
      return {
        success: true,
        data: previousTenant,
      };
    }

    const mine = await TenantService.mine();
    if (mine.success && mine.data?.[0]?.id) {
      saveTenant(mine.data[0]);
      return {
        success: true,
        data: mine.data[0],
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
    const previousTenant = storedCurrentTenant();
    if (previousTenant?.id) {
      return {
        success: true,
        data: [previousTenant],
      };
    }

    const mine = await TenantService.mine();
    if (mine.success && mine.data?.length) {
      saveTenant(mine.data[0]);
      return mine;
    }

    const current = await this.getCurrentTenant();
    if (current.success && current.data) {
      saveTenant(current.data);
      return {
        success: true,
        data: [current.data],
      };
    }

    return {
      success: false,
      data: [],
      error: current.error,
    };
  },
};
