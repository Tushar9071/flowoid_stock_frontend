'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { PermissionService, RoleService } from '@/lib/services/role-permission.service';
import { Permission, Role } from '@/lib/types';
import {
  Check,
  ChevronRight,
  Database,
  Edit2,
  Eye,
  Info,
  Loader2,
  Lock,
  Plus,
  Save,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

type RoleForm = {
  name: string;
  description: string;
  isActive: boolean;
  permissionIds: string[];
};

const actions = [
  { key: 'read', label: 'View', icon: Eye },
  { key: 'create', label: 'Add', icon: Plus },
  { key: 'update', label: 'Edit', icon: Edit2 },
  { key: 'delete', label: 'Delete', icon: Trash2 },
] as const;

const emptyForm: RoleForm = {
  name: '',
  description: '',
  isActive: true,
  permissionIds: [],
};

const seedModules = [
  'dashboard',
  'designs',
  'workers',
  'raw-materials',
  'stock_items',
  'parties',
  'sales_orders',
  'payments',
  'reports',
  'users',
  'roles',
  'settings',
];

const seedActions = ['read', 'create', 'update', 'delete'] as const;

const seededPermissionTemplates = seedModules.flatMap(moduleName =>
  seedActions.map(action => ({
    code: `${moduleName}.${action}`,
    name: `${action === 'read' ? 'View' : action === 'create' ? 'Create' : action === 'update' ? 'Update' : 'Delete'} ${moduleName.replace(/[-_]/g, ' ')}`,
    description: `Allows ${action} access for ${moduleName.replace(/[-_]/g, ' ')}.`,
  })),
);

const ownerRoleSeedTemplates = [
  {
    name: 'TENANT_OWNER',
    description: 'Business owner with full access inside their own tenant.',
    permissionCodes: seededPermissionTemplates.map(permission => permission.code),
  },
  {
    name: 'TENANT_STAFF',
    description: 'Staff role for daily stock, party, worker, order and payment operations.',
    permissionCodes: [
      'dashboard.read',
      'designs.read',
      'designs.create',
      'designs.update',
      'workers.read',
      'workers.create',
      'workers.update',
      'raw-materials.read',
      'raw-materials.create',
      'raw-materials.update',
      'stock_items.read',
      'stock_items.create',
      'stock_items.update',
      'parties.read',
      'parties.create',
      'parties.update',
      'sales_orders.read',
      'sales_orders.create',
      'sales_orders.update',
      'payments.read',
      'payments.create',
      'payments.update',
      'reports.read',
    ],
  },
  {
    name: 'TENANT_AUDITOR',
    description: 'Read-only tenant role for checking stock, ledgers and reports.',
    permissionCodes: seededPermissionTemplates
      .filter(permission => permission.code.endsWith('.read'))
      .map(permission => permission.code),
  },
];

function deriveModule(permission: Permission) {
  return permission.module || permission.code?.split('.')?.[0] || 'system';
}

function deriveAction(permission: Permission) {
  return permission.action || permission.code?.split('.')?.[1] || 'access';
}

function rolePermissionIds(role: Role | null) {
  return role?.permissions?.map(item => item.permission.id) || [];
}

export default function RolesPage() {
  const { hasPermission, isFullAccess } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingPermissionId, setSavingPermissionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleForm>(emptyForm);
  const [isSeeding, setIsSeeding] = useState(false);
  const canCreate = isFullAccess || hasPermission('roles.create');
  const canUpdate = isFullAccess || hasPermission('roles.update');
  const canDelete = isFullAccess || hasPermission('roles.delete');

  const permissionRows = useMemo(() => {
    const grouped = new Map<string, Record<string, Permission | undefined>>();
    for (const permission of permissions) {
      const moduleName = deriveModule(permission);
      const actionName = deriveAction(permission);
      if (!grouped.has(moduleName)) grouped.set(moduleName, {});
      grouped.get(moduleName)![actionName] = permission;
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([moduleName, actionMap]) => ({ moduleName, actionMap }));
  }, [permissions]);

  const selectedIds = useMemo(() => new Set(rolePermissionIds(selectedRole)), [selectedRole]);
  const totalAssigned = selectedIds.size;

  const fetchData = async (preferredRoleId?: string) => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        RoleService.list(),
        PermissionService.list(),
      ]);

      if (permsRes.success) {
        setPermissions(permsRes.data || []);
      } else {
        toast.error(permsRes.error?.message || 'Failed to load permissions');
      }

      if (rolesRes.success) {
        const nextRoles = rolesRes.data || [];
        setRoles(nextRoles);
        const nextSelected =
          nextRoles.find(role => role.id === preferredRoleId) ||
          nextRoles.find(role => role.id === selectedRole?.id) ||
          nextRoles[0] ||
          null;
        setSelectedRole(nextSelected);
      } else {
        toast.error(rolesRes.error?.message || 'Failed to load roles');
      }
    } catch {
      toast.error('Failed to load roles and permissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleAdminAction = () => handleCreateRole();
    window.addEventListener('admin-action-click', handleAdminAction);
    return () => window.removeEventListener('admin-action-click', handleAdminAction);
  }, []);

  const handleCreateRole = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create roles');
      return;
    }
    setEditingRole(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update roles');
      return;
    }
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      isActive: role.isActive,
      permissionIds: rolePermissionIds(role),
    });
    setIsModalOpen(true);
  };

  const handleSaveRole = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) return toast.error('Role name is required');

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        permissionIds: formData.permissionIds,
      };
      const response = editingRole
        ? await RoleService.update(editingRole.id, { ...payload, isActive: formData.isActive })
        : await RoleService.create(payload);

      if (response.success) {
        toast.success(editingRole ? 'Role updated successfully' : 'Role created successfully');
        setIsModalOpen(false);
        setEditingRole(null);
        await fetchData(response.data.id);
      } else {
        toast.error(response.error?.message || `Failed to ${editingRole ? 'update' : 'create'} role`);
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const updateRolePermissions = async (nextIds: string[], savingId: string | null = null) => {
    if (!selectedRole) return;
    if (!canUpdate) {
      toast.error('You do not have permission to update role permissions');
      return;
    }
    if (selectedRole.isSystem) {
      toast.error('System roles cannot be edited');
      return;
    }

    setSavingPermissionId(savingId || 'bulk');
    try {
      const response = await RoleService.update(selectedRole.id, {
        name: selectedRole.name,
        description: selectedRole.description || undefined,
        isActive: selectedRole.isActive,
        permissionIds: nextIds,
      });

      if (response.success) {
        setSelectedRole(response.data);
        setRoles(prev => prev.map(role => (role.id === response.data.id ? response.data : role)));
        toast.success('Permissions updated');
      } else {
        toast.error(response.error?.message || 'Failed to update permissions');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setSavingPermissionId(null);
    }
  };

  const toggleSelectedPermission = (permissionId: string) => {
    const currentIds = rolePermissionIds(selectedRole);
    const nextIds = currentIds.includes(permissionId)
      ? currentIds.filter(id => id !== permissionId)
      : [...currentIds, permissionId];
    updateRolePermissions(nextIds, permissionId);
  };

  const toggleFormPermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter(id => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  const handleDeleteRole = async (role: Role) => {
    if (!canDelete) return toast.error('You do not have permission to delete roles');
    if (role.isSystem) return toast.error('System roles cannot be deleted');
    if (!window.confirm(`Delete role "${role.name}"?`)) return;

    try {
      const response = await RoleService.delete(role.id);
      if (response.success) {
        toast.success('Role deleted successfully');
        await fetchData();
      } else {
        toast.error(response.error?.message || 'Failed to delete role');
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  const handleSeedOwnerRoles = async () => {
    if (!canCreate || !canUpdate) {
      toast.error('You need role create and update permission to seed owner roles');
      return;
    }

    setIsSeeding(true);
    try {
      const permissionsRes = await PermissionService.list();
      let allPermissions = permissionsRes.success ? permissionsRes.data || [] : permissions;
      const existingCodes = new Set(allPermissions.map(permission => permission.code));

      for (const template of seededPermissionTemplates) {
        if (existingCodes.has(template.code)) continue;
        const created = await PermissionService.create(template);
        if (created.success && created.data) {
          allPermissions = [...allPermissions, created.data];
          existingCodes.add(created.data.code);
        }
      }

      const rolesRes = await RoleService.list();
      let allRoles = rolesRes.success ? rolesRes.data || [] : roles;
      let seededCount = 0;

      for (const roleTemplate of ownerRoleSeedTemplates) {
        const permissionIds = roleTemplate.permissionCodes
          .map(code => allPermissions.find(permission => permission.code === code)?.id)
          .filter((id): id is string => Boolean(id));
        const existingRole = allRoles.find(role => role.name.toUpperCase() === roleTemplate.name);

        const response = existingRole
          ? await RoleService.update(existingRole.id, {
              name: existingRole.name,
              description: roleTemplate.description,
              isActive: true,
              permissionIds,
            })
          : await RoleService.create({
              name: roleTemplate.name,
              description: roleTemplate.description,
              isActive: true,
              permissionIds,
            });

        if (response.success) {
          seededCount += 1;
          allRoles = existingRole
            ? allRoles.map(role => (role.id === response.data.id ? response.data : role))
            : [response.data, ...allRoles];
        } else {
          toast.error(response.error?.message || `Failed to seed ${roleTemplate.name}`);
        }
      }

      setPermissions(allPermissions);
      setRoles(allRoles);
      setSelectedRole(allRoles.find(role => role.name.toUpperCase() === 'TENANT_OWNER') || allRoles[0] || null);
      toast.success(`Owner role seed complete: ${seededCount} roles ready`);
    } catch {
      toast.error('Failed to seed owner roles and permissions');
    } finally {
      setIsSeeding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="theme-text-accent h-10 w-10 animate-spin" />
          <p className="font-medium text-gray-500">Loading role management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="theme-surface-card overflow-hidden lg:sticky lg:top-6">
          <div className="flex items-center justify-between border-b border-gray-100 p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Shield className="h-4 w-4 text-gray-500" />
              Available Roles
            </h2>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-black text-gray-500">
              {roles.length} Total
            </span>
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto p-3 lg:max-h-[calc(100vh-170px)]">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`group w-full rounded-lg p-3 text-left transition ${
                  selectedRole?.id === role.id
                    ? 'theme-accent-btn shadow-sm'
                    : 'bg-white theme-text-primary hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black uppercase tracking-wide">{role.name}</h3>
                    <p className={`mt-1 text-xs font-black uppercase tracking-widest ${
                      selectedRole?.id === role.id ? 'opacity-80' : 'text-gray-400'
                    }`}>
                      {role.isSystem ? 'System Access' : 'Custom Role'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 opacity-60 transition group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}

            {canCreate && (
              <div className="mt-3 space-y-2">
                <button
                  onClick={handleSeedOwnerRoles}
                  disabled={isSeeding}
                  className="theme-secondary-btn flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-dashed text-sm font-bold transition disabled:opacity-60"
                >
                  {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                  Seed Owner Roles
                </button>
                <button
                  onClick={handleCreateRole}
                  className="theme-secondary-btn flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-dashed text-sm font-bold transition"
                >
                  <Plus className="h-4 w-4" />
                  Add New Role
                </button>
              </div>
            )}
          </div>
        </Card>

        {selectedRole && (
          <Card className="theme-surface-card overflow-hidden p-5 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="theme-text-primary text-2xl font-black uppercase tracking-wide">{selectedRole.name}</h2>
                <p className="mt-1.5 text-sm text-gray-500">{selectedRole.description || 'No description provided.'}</p>
              </div>

              {!selectedRole.isSystem && (canUpdate || canDelete) && (
                <div className="flex gap-3">
                  {canUpdate && (
                    <button
                      onClick={() => handleEditRole(selectedRole)}
                      className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteRole(selectedRole)}
                      className="theme-danger-btn inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <InfoTile label="Current Status" value={selectedRole.isActive ? 'Active Session' : 'Inactive'} active={selectedRole.isActive} />
              <InfoTile label="Scope" value="Organization Wide" />
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Assigned Permissions</p>
                <p className="theme-text-accent mt-1 text-2xl font-black">
                  {totalAssigned}
                  <span className="ml-1 text-base text-gray-400">/ {permissions.length}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="theme-text-primary flex items-center gap-2 text-base font-black">
                  <Lock className="h-5 w-5" />
                  Detailed Permissions Matrix
                  <Info className="h-4 w-4 text-gray-400" />
                </h3>
                {!selectedRole.isSystem && canUpdate && (
                  <button
                    onClick={() => updateRolePermissions([], 'bulk')}
                    className="text-sm font-bold text-red-500 hover:text-red-600"
                    disabled={savingPermissionId !== null}
                  >
                    Clear all permissions
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full min-w-[860px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-400">Page / Module</th>
                      {actions.map(action => {
                        const Icon = action.icon;
                        return (
                          <th key={action.key} className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-gray-400">
                            <div className="flex flex-col items-center gap-1">
                              <Icon className="theme-text-accent h-4 w-4" />
                              {action.label}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="theme-table-header">
                      <td className="px-4 py-3 text-sm font-black uppercase tracking-wide">Select / Deselect All</td>
                      {actions.map(action => {
                        const actionPermissions = permissions.filter(permission => deriveAction(permission) === action.key);
                        const allChecked = actionPermissions.length > 0 && actionPermissions.every(permission => selectedIds.has(permission.id));
                        return (
                          <td key={action.key} className="px-4 py-3 text-center">
                            <PermissionCheckbox
                              checked={allChecked}
                              disabled={selectedRole.isSystem || !canUpdate || actionPermissions.length === 0 || savingPermissionId !== null}
                              onChange={() => {
                                const current = new Set(rolePermissionIds(selectedRole));
                                if (allChecked) {
                                  actionPermissions.forEach(permission => current.delete(permission.id));
                                } else {
                                  actionPermissions.forEach(permission => current.add(permission.id));
                                }
                                updateRolePermissions(Array.from(current), 'bulk');
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>

                    {permissionRows.map(row => (
                      <tr key={row.moduleName} className="theme-table-row bg-white">
                        <td className="px-4 py-3">
                          <p className="theme-text-primary font-black capitalize">{row.moduleName.replace(/[-_]/g, ' ')}</p>
                          <p className="text-sm text-gray-400">Permission module</p>
                        </td>
                        {actions.map(action => {
                          const permission = row.actionMap[action.key];
                          const isChecked = Boolean(permission && selectedIds.has(permission.id));
                          return (
                            <td key={action.key} className="px-4 py-3 text-center">
                              {permission ? (
                                <PermissionCheckbox
                                  checked={isChecked}
                                  disabled={selectedRole.isSystem || !canUpdate || savingPermissionId !== null}
                                  loading={savingPermissionId === permission.id}
                                  onChange={() => toggleSelectedPermission(permission.id)}
                                />
                              ) : (
                                <span className="inline-block h-5 w-5 rounded-md border border-transparent" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/70 p-3 backdrop-blur-sm sm:p-4">
          <Card className="theme-modal-panel flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 p-5 sm:p-6">
              <div>
                <h2 className="theme-text-primary text-xl font-black sm:text-2xl">{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
                <p className="mt-1 text-sm text-gray-500">Configure role details and assign available permissions.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <div className="space-y-5">
                  <Field label="Role Name" value={formData.name} onChange={value => setFormData({ ...formData, name: value })} required />
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={event => setFormData({ ...formData, description: event.target.value })}
                      className="theme-focus-ring h-28 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-medium outline-none"
                    />
                  </div>
                  <div className="theme-surface-muted flex items-center justify-between rounded-lg border px-4 py-3">
                    <p className="theme-text-primary text-sm font-bold">Active Status</p>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`relative h-6 w-11 rounded-full transition ${formData.isActive ? 'theme-accent-btn' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${formData.isActive ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Assign Permissions</label>
                  <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 sm:max-h-[360px]">
                    {permissions.map(permission => {
                      const checked = formData.permissionIds.includes(permission.id);
                      return (
                        <button
                          key={permission.id}
                          type="button"
                          onClick={() => toggleFormPermission(permission.id)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition ${
                            checked ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'border-gray-100 bg-white hover:border-[var(--color-accent)]'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-900">{permission.name}</p>
                            <p className="text-xs text-gray-500">{permission.code}</p>
                          </div>
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                            checked ? 'theme-accent-btn' : 'bg-gray-100 text-transparent'
                          }`}>
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 p-5 sm:flex-row sm:justify-end sm:p-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingRole ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function InfoTile({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <div className="theme-surface-muted rounded-lg border p-4">
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {typeof active === 'boolean' && <span className={`h-3 w-3 rounded-full ${active ? 'bg-[var(--color-accent)]' : 'bg-gray-300'}`} />}
        <p className={`text-sm font-black ${active ? 'theme-text-accent' : 'theme-text-primary'}`}>{value}</p>
      </div>
    </div>
  );
}

function PermissionCheckbox({
  checked,
  disabled,
  loading,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  loading?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={`inline-flex h-6 w-6 items-center justify-center rounded-md border transition ${
        checked ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-sidebar-active-text)]' : 'border-gray-300 bg-white text-transparent'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-[var(--color-accent)]'}`}
      aria-pressed={checked}
    >
      {loading ? <Loader2 className="theme-text-accent h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</label>
      <input
        required={required}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="theme-focus-ring h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-900 outline-none transition"
      />
    </div>
  );
}
