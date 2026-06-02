import { api } from '../api-client';
import type { ApiResponse } from '../api-client';
import { Permission, Role } from '../types';

const admin = (path: string) => `/admin${path}`;

function permissionCode(permission: any) {
  if (permission.code) return permission.code;
  return `${String(permission.module).toLowerCase()}.${String(permission.action).toLowerCase()}`;
}

export const DEFAULT_OWNER_PERMISSION_CODES = new Set([
  'dashboard.view',
  'designs.view',
  'designs.create',
  'designs.update',
  'designs.delete',
  'workers.view',
  'workers.create',
  'workers.update',
  'workers.delete',
  'raw_materials.view',
  'raw_materials.create',
  'raw_materials.update',
  'raw_materials.delete',
  'inventory.view',
  'inventory.create',
  'inventory.update',
  'inventory.delete',
  'parties.view',
  'parties.create',
  'parties.update',
  'parties.delete',
  'orders.view',
  'orders.create',
  'orders.update',
  'orders.delete',
  'payments.view',
  'payments.create',
  'payments.update',
  'reports.view',
  'documents.generate_document',
  'settings.view',
  'settings.manage_settings',
]);

function flattenPermissions(payload: any): Permission[] {
  const source = payload?.permissions || payload;
  const permissions = Array.isArray(source)
    ? source
    : Object.values(source || {}).flat();

  return (permissions as any[]).map((item) => {
    const permission = item?.permission || item;
    return {
      ...permission,
      code: permissionCode(permission),
      name: permission.description || permissionCode(permission),
      createdAt: permission.createdAt || item?.assignedAt || '',
    };
  });
}

const SYSTEM_ROLES: Role[] = [
  {
    id: 'ADMIN',
    name: 'ADMIN',
    description: 'Full platform administration',
    isSystem: true,
    isActive: true,
    isDefault: false,
    createdAt: '',
    updatedAt: '',
    permissions: [],
  },
  {
    id: 'OWNER',
    name: 'OWNER',
    description: 'Business owner account',
    isSystem: true,
    isActive: true,
    isDefault: true,
    createdAt: '',
    updatedAt: '',
    permissions: [],
  },
];

export const RoleService = {
  async list() {
    return {
      success: true,
      data: SYSTEM_ROLES,
    } as ApiResponse<Role[]>;
  },

  async get(id: string) {
    return {
      success: true,
      data: SYSTEM_ROLES.find((role) => role.id === id) || SYSTEM_ROLES[1],
    } as ApiResponse<Role>;
  },

  async create(_data?: Partial<Role> & { permissionIds?: string[] }) {
    return {
      success: false,
      data: null as any,
      error: {
        code: 'UNSUPPORTED_BY_BACKEND',
        message: 'The backend exposes fixed ADMIN and OWNER roles. Assign permissions to owners instead.',
      },
    } as ApiResponse<Role>;
  },

  async update(id: string, _data?: Partial<Role> & { permissionIds?: string[] }) {
    return this.get(id);
  },

  async delete(_id?: string) {
    return {
      success: false,
      data: null as any,
      error: {
        code: 'UNSUPPORTED_BY_BACKEND',
        message: 'System roles cannot be deleted.',
      },
    } as ApiResponse<{ message: string }>;
  },
};

export const PermissionService = {
  async list() {
    const response = await api.get<any>(admin('/permissions'));
    if (!response.success) return response as any;
    return {
      ...response,
      data: flattenPermissions(response.data),
    };
  },

  async get(id: string) {
    const list = await this.list();
    if (!list.success) return list as any;
    return {
      ...list,
      data: list.data.find((permission: Permission) => permission.id === id) || null,
    };
  },

  async create(_data?: Partial<Permission>) {
    return {
      success: false,
      data: null as any,
      error: {
        code: 'UNSUPPORTED_BY_BACKEND',
        message: 'Permissions are defined by the backend and cannot be created from the frontend.',
      },
    } as ApiResponse<Permission>;
  },

  async update(id: string, _data?: Partial<Permission>) {
    return this.get(id);
  },

  async delete(_id?: string) {
    return {
      success: false,
      data: null as any,
      error: {
        code: 'UNSUPPORTED_BY_BACKEND',
        message: 'Permissions are defined by the backend and cannot be deleted from the frontend.',
      },
    } as ApiResponse<{ message: string }>;
  },

  async getOwnerPermissions(ownerId: string) {
    const response = await api.get<any>(admin(`/owners/${ownerId}/permissions`));
    if (!response.success) return response as any;
    return {
      ...response,
      data: flattenPermissions(response.data),
    };
  },

  async assignOwnerPermissions(ownerId: string, permissionIds: string[]) {
    return api.post(admin(`/owners/${ownerId}/permissions`), { permissionIds });
  },

  async removeOwnerPermission(ownerId: string, permissionId: string) {
    return api.delete(admin(`/owners/${ownerId}/permissions/${permissionId}`));
  },

  async assignDefaultOwnerPermissions(ownerId: string) {
    return api.post(admin(`/owners/${ownerId}/permissions/grant-all`), {});
  },
};
