'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Plus, Edit2, Loader2, ShieldCheck, Trash2, X, Save } from 'lucide-react';
import { PermissionService, RoleService } from '@/lib/services/role-permission.service';
import { Permission } from '@/lib/types';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

type PermissionForm = {
  code: string;
  module: string;
  action: string;
  name: string;
  description: string;
};

const emptyForm: PermissionForm = {
  code: '',
  module: 'stock_items',
  action: 'read',
  name: '',
  description: '',
};

const actions = ['read', 'create', 'update', 'delete'] as const;

const moduleOptions = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'designs', label: 'Design Catalogue' },
  { value: 'workers', label: 'Worker Management' },
  { value: 'raw-materials', label: 'Raw Materials' },
  { value: 'stock_items', label: 'Stock Items / Inventory' },
  { value: 'parties', label: 'Party Management' },
  { value: 'sales_orders', label: 'Orders & Dispatch' },
  { value: 'payments', label: 'Payments & Ledger' },
  { value: 'reports', label: 'Reports' },
  { value: 'users', label: 'User Management' },
  { value: 'roles', label: 'Roles & Permissions' },
  { value: 'settings', label: 'Settings' },
];

const defaultPermissionTemplates = moduleOptions.flatMap(module =>
  actions.map(action => ({
    code: `${module.value}.${action}`,
    name: `${action === 'read' ? 'View' : action === 'create' ? 'Create' : action === 'update' ? 'Update' : 'Delete'} ${module.label}`,
    description: `Allows ${action} access for ${module.label}.`,
  })),
);

const freeUserOwnerRoleNames = new Set(['FREE_USERS', 'OWNER', 'TENANT_OWNER']);

function buildPermissionCode(moduleName: string, action: string) {
  return `${moduleName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}.${action}`;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState<PermissionForm>(emptyForm);

  const modules = useMemo(
    () => Array.from(new Set(permissions.map(p => p.module || p.code?.split('.')?.[0] || 'system'))),
    [permissions],
  );

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const res = await PermissionService.list();
      if (res.success) {
        setPermissions(res.data || []);
      } else {
        toast.error(res.error?.message || 'Failed to load permissions');
      }
    } catch (error) {
      toast.error('Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const openCreateModal = () => {
    setEditingPermission(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      code: permission.code,
      module: permission.code?.split('.')?.[0] || 'stock_items',
      action: permission.code?.split('.')?.[1] || 'read',
      name: permission.name,
      description: permission.description || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPermission(null);
    setFormData(emptyForm);
  };

  const handleSavePermission = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) return toast.error('Permission name is required');
    const generatedCode = buildPermissionCode(formData.module, formData.action);
    if (!editingPermission && !generatedCode.trim()) return toast.error('Permission code is required');

    setIsSaving(true);
    try {
      const code = editingPermission ? formData.code : generatedCode;
      const res = editingPermission
        ? await PermissionService.update(editingPermission.id, {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
          })
        : await PermissionService.create({
            code,
            name: formData.name.trim(),
            description: formData.description.trim() || null,
          });

      if (res.success) {
        toast.success(editingPermission ? 'Permission updated successfully' : 'Permission created successfully');
        closeModal();
        await fetchPermissions();
      } else {
        toast.error(res.error?.message || `Failed to ${editingPermission ? 'update' : 'create'} permission`);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateDefaultPermissions = async () => {
    const existingCodes = new Set(permissions.map(permission => permission.code));
    const missing = defaultPermissionTemplates.filter(template => !existingCodes.has(template.code));

    if (missing.length === 0) {
      toast.success('Default stock management permissions already exist');
      return;
    }

    setIsSaving(true);
    try {
      let created = 0;
      for (const template of missing) {
        const response = await PermissionService.create(template);
        if (response.success) created += 1;
      }
      toast.success(`${created} default permissions created`);
      await fetchPermissions();
    } catch {
      toast.error('Failed to create default permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedAndAssignFreeUser = async () => {
    setIsSaving(true);
    try {
      const existingCodes = new Set(permissions.map(permission => permission.code));
      const missing = defaultPermissionTemplates.filter(template => !existingCodes.has(template.code));

      for (const template of missing) {
        await PermissionService.create(template);
      }

      const [permissionsRes, rolesRes] = await Promise.all([
        PermissionService.list(),
        RoleService.list(),
      ]);

      if (!permissionsRes.success || !rolesRes.success) {
        toast.error('Seed completed, but roles/permissions could not be refreshed');
        return;
      }

      const allPermissions = permissionsRes.data || [];
      const role = (rolesRes.data || []).find(item => freeUserOwnerRoleNames.has(item.name.toUpperCase()));

      if (!role) {
        toast.error('FREE_USERS owner role was not found');
        setPermissions(allPermissions);
        return;
      }

      const permissionIds = defaultPermissionTemplates
        .map(template => allPermissions.find(permission => permission.code === template.code)?.id)
        .filter((id): id is string => Boolean(id));

      const updateRes = await RoleService.update(role.id, {
        name: role.name,
        description: role.description || undefined,
        isActive: role.isActive,
        permissionIds,
      });

      if (updateRes.success) {
        toast.success(`Seeded permissions and assigned ${role.name}`);
      } else {
        toast.error(updateRes.error?.message || `Failed to assign permissions to ${role.name}`);
      }

      setPermissions(allPermissions);
    } catch {
      toast.error('Failed to seed and assign FREE_USERS permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePermission = async (permission: Permission) => {
    const confirmed = window.confirm(`Delete permission "${permission.name}"? Roles using this permission may lose access.`);
    if (!confirmed) return;

    try {
      const res = await PermissionService.delete(permission.id);
      if (res.success) {
        toast.success('Permission deleted successfully');
        setPermissions(prev => prev.filter(p => p.id !== permission.id));
      } else {
        toast.error(res.error?.message || 'Failed to delete permission');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="theme-text-accent w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={handleCreateDefaultPermissions}
          disabled={isSaving}
          className="theme-secondary-btn flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold transition-all disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          Seed Defaults
        </button>
        <button
          onClick={handleSeedAndAssignFreeUser}
          disabled={isSaving}
          className="theme-secondary-btn flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold transition-all disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          Seed Free Owner
        </button>
        <button
          onClick={openCreateModal}
          className="theme-accent-btn flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Permission
        </button>
      </div>

      <div className="space-y-10">
        {modules.map(moduleName => {
          const modulePermissions = permissions.filter(p => (p.module || p.code?.split('.')?.[0] || 'system') === moduleName);
          return (
            <div key={moduleName} className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="theme-icon-chip p-1.5 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 capitalize">{moduleName} Module</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modulePermissions.map(perm => (
                  <Card key={perm.id} className="theme-surface-card group relative overflow-hidden p-5 transition-all hover:border-[var(--color-accent)]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="theme-text-primary font-bold transition-colors group-hover:text-[var(--color-accent-dark)]">{perm.name}</h4>
                        <code className="text-[10px] font-mono text-gray-400 mt-1 block tracking-tight">
                          {perm.code}
                        </code>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(perm)}
                          className="p-2 bg-gray-50 hover:bg-[var(--color-accent-light)] rounded-lg transition-all"
                          title="Edit permission"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeletePermission(perm)}
                          className="p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                          title="Delete permission"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
                      {perm.description || 'No description available for this permission.'}
                    </p>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-medium">
                        Added {new Date(perm.createdAt).toLocaleDateString()}
                      </span>
                      <div className="theme-badge-soft px-2 py-0.5 text-[10px] font-bold rounded uppercase">
                        {perm.action || perm.code?.split('.')?.[1] || 'access'}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
        
        {permissions.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500">No permissions found in the system.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0F2A4A]/80 backdrop-blur-sm"
              onClick={closeModal}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="theme-modal-panel relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-gray-100 p-5 sm:p-6">
                <div>
                  <h2 className="theme-text-primary text-xl font-black sm:text-2xl">{editingPermission ? 'Edit Permission' : 'Add Permission'}</h2>
                  <p className="text-gray-500 text-sm mt-1">Define permission code, name and description</p>
                </div>
                <button onClick={closeModal} className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSavePermission} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Page / Module</label>
                    <select
                      value={formData.module}
                      disabled={!!editingPermission}
                      onChange={e => {
                        const moduleName = e.target.value;
                        setFormData({ ...formData, module: moduleName, code: buildPermissionCode(moduleName, formData.action) });
                      }}
                      className="theme-focus-ring w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none transition-all font-bold text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {moduleOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Action</label>
                    <select
                      value={formData.action}
                      disabled={!!editingPermission}
                      onChange={e => {
                        const action = e.target.value;
                        setFormData({ ...formData, action, code: buildPermissionCode(formData.module, action) });
                      }}
                      className="theme-focus-ring w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none transition-all font-bold text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed capitalize"
                    >
                      {actions.map(action => (
                        <option key={action} value={action}>{action}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Auto Generated Code</label>
                    <input
                      type="text"
                      value={editingPermission ? formData.code : buildPermissionCode(formData.module, formData.action)}
                      disabled={!!editingPermission}
                      readOnly
                      placeholder="orders.create"
                      className="theme-focus-ring w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none transition-all font-bold text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Permission Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Create Orders"
                      className="theme-focus-ring w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none transition-all font-bold text-gray-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Allows creating new orders"
                      className="theme-focus-ring w-full h-28 p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none transition-all font-medium text-gray-900 resize-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 p-5 sm:flex-row sm:justify-end sm:p-6">
                  <button type="button" onClick={closeModal} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="theme-accent-btn px-8 py-3 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-all disabled:opacity-70"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {editingPermission ? 'Save Changes' : 'Create Permission'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
