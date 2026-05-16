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
  module: '',
  action: '',
  name: '',
  description: '',
};

const MODULE_SUGGESTIONS = [
  'dashboard',
  'designs',
  'workers',
  'assignments',
  'raw-materials',
  'stock_items',
  'parties',
  'sales_orders',
  'payments',
  'worker_payments',
  'reports',
  'users',
  'roles',
  'settings',
];

const ACTION_SUGGESTIONS = [
  'read',
  'create',
  'update',
  'delete',
  'view',
  'export',
  'import',
  'approve',
  'cancel',
  'close',
  'dispatch',
  'payments',
];

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  designs: 'Design Catalogue',
  workers: 'Worker Management',
  assignments: 'Worker Assignments',
  'raw-materials': 'Raw Materials',
  stock_items: 'Stock Items / Inventory',
  parties: 'Party Management',
  sales_orders: 'Orders & Dispatch',
  payments: 'Payments & Ledger',
  worker_payments: 'Worker Payments',
  reports: 'Reports',
  users: 'User Management',
  roles: 'Roles & Permissions',
  settings: 'Settings',
};

const seedActions = ['read', 'create', 'update', 'delete'] as const;

const defaultPermissionTemplates = MODULE_SUGGESTIONS.flatMap(mod =>
  seedActions.map(action => ({
    code: `${mod}.${action}`,
    name: `${action === 'read' ? 'View' : action === 'create' ? 'Create' : action === 'update' ? 'Update' : 'Delete'} ${MODULE_LABELS[mod] || mod}`,
    description: `Allows ${action} access for ${MODULE_LABELS[mod] || mod}.`,
  })),
);

const workerAssignmentTemplates = [
  { code: 'assignments.read', name: 'View Worker Assignments', description: 'Allows viewing worker assignments.' },
  { code: 'assignments.create', name: 'Create Worker Assignments', description: 'Allows creating new worker assignments.' },
  { code: 'assignments.update', name: 'Update Worker Assignments', description: 'Allows updating existing worker assignments.' },
  { code: 'assignments.delete', name: 'Delete Worker Assignments', description: 'Allows deleting worker assignments.' },
];

const OWNER_ROLE_NAMES = new Set(['FREE_USERS', 'OWNER', 'TENANT_OWNER']);

function buildPermissionCode(mod: string, action: string) {
  const clean = (s: string) =>
    s.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '_').replace(/^_+|_+$/g, '');
  return `${clean(mod)}.${clean(action)}`;
}

// ── Inline combobox ───────────────────────────────────────────────────────────
function Combobox({
  id,
  value,
  onChange,
  suggestions,
  placeholder,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const filtered = value
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s !== value)
    : suggestions;

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        value={value}
        disabled={disabled}
        autoComplete="off"
        onChange={e => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="theme-focus-ring w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none transition-all font-bold text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
      />
      {open && filtered.length > 0 && !disabled && (
        <ul className="absolute z-30 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl max-h-52 overflow-y-auto">
          {filtered.map(s => (
            <li
              key={s}
              onMouseDown={() => { onChange(s); setOpen(false); }}
              className="cursor-pointer px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-[var(--color-accent-light)] transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
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
      if (res.success) setPermissions(res.data || []);
      else toast.error(res.error?.message || 'Failed to load permissions');
    } catch {
      toast.error('Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPermissions(); }, []);

  const openCreateModal = () => {
    setEditingPermission(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (perm: Permission) => {
    setEditingPermission(perm);
    setFormData({
      code: perm.code,
      module: perm.code?.split('.')?.[0] || '',
      action: perm.code?.split('.')?.[1] || '',
      name: perm.name,
      description: perm.description || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPermission(null);
    setFormData(emptyForm);
  };

  const handleSavePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Permission name is required');
    if (!editingPermission && !formData.module.trim()) return toast.error('Module is required');
    if (!editingPermission && !formData.action.trim()) return toast.error('Action is required');

    const code = editingPermission ? formData.code : buildPermissionCode(formData.module, formData.action);

    setIsSaving(true);
    try {
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
        toast.success(editingPermission ? 'Permission updated' : 'Permission created');
        closeModal();
        await fetchPermissions();
      } else {
        toast.error(res.error?.message || 'Failed to save permission');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Seed buttons ────────────────────────────────────────────────────────────
  const seedTemplates = async (templates: typeof defaultPermissionTemplates) => {
    const existingCodes = new Set(permissions.map(p => p.code));
    const missing = templates.filter(t => !existingCodes.has(t.code));
    let created = 0;
    for (const t of missing) {
      const r = await PermissionService.create(t);
      if (r.success) created++;
    }
    return created;
  };

  const assignToOwnerRole = async (allPermissions: Permission[], permCodes: string[]) => {
    const rolesRes = await RoleService.list();
    if (!rolesRes.success) return false;
    const role = (rolesRes.data || []).find(r => OWNER_ROLE_NAMES.has(r.name.toUpperCase()));
    if (!role) { toast.error('Owner role not found — run "Seed Owner Roles" in Roles page first'); return false; }

    const existing = new Set(role.permissions?.map((rp: any) => rp.permission?.id || rp.id) || []);
    const newIds = permCodes
      .map(code => allPermissions.find(p => p.code === code)?.id)
      .filter((id): id is string => Boolean(id));
    const merged = Array.from(new Set([...existing, ...newIds]));

    const res = await RoleService.update(role.id, {
      name: role.name,
      description: role.description || undefined,
      isActive: role.isActive,
      permissionIds: merged,
    });
    if (res.success) toast.success(`Assigned to ${role.name}`);
    else toast.error(res.error?.message || 'Failed to assign permissions');
    return res.success;
  };

  const handleSeedDefaults = async () => {
    setIsSaving(true);
    try {
      const created = await seedTemplates(defaultPermissionTemplates);
      if (created === 0) toast.success('Default permissions already exist');
      else toast.success(`${created} default permissions created`);
      await fetchPermissions();
    } catch { toast.error('Failed to seed default permissions'); }
    finally { setIsSaving(false); }
  };

  const handleSeedFreeOwner = async () => {
    setIsSaving(true);
    try {
      await seedTemplates(defaultPermissionTemplates);
      const permsRes = await PermissionService.list();
      if (!permsRes.success) { toast.error('Failed to reload permissions'); return; }
      await assignToOwnerRole(permsRes.data || [], defaultPermissionTemplates.map(t => t.code));
      setPermissions(permsRes.data || []);
    } catch { toast.error('Failed to seed & assign free owner permissions'); }
    finally { setIsSaving(false); }
  };

  const handleSeedWorkerAssignments = async () => {
    setIsSaving(true);
    try {
      const created = await seedTemplates(workerAssignmentTemplates);
      const permsRes = await PermissionService.list();
      if (!permsRes.success) { toast.error('Seeded but failed to reload'); return; }
      await assignToOwnerRole(permsRes.data || [], workerAssignmentTemplates.map(t => t.code));
      setPermissions(permsRes.data || []);
      if (created > 0) toast.success(`${created} worker assignment permissions seeded`);
    } catch { toast.error('Failed to seed worker assignment permissions'); }
    finally { setIsSaving(false); }
  };

  const handleDeletePermission = async (perm: Permission) => {
    if (!window.confirm(`Delete permission "${perm.name}"? Roles using it may lose access.`)) return;
    try {
      const res = await PermissionService.delete(perm.id);
      if (res.success) {
        toast.success('Permission deleted');
        setPermissions(prev => prev.filter(p => p.id !== perm.id));
      } else {
        toast.error(res.error?.message || 'Failed to delete permission');
      }
    } catch { toast.error('An unexpected error occurred'); }
  };

  const liveCode =
    editingPermission
      ? formData.code
      : formData.module && formData.action
        ? buildPermissionCode(formData.module, formData.action)
        : '';

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="theme-text-accent w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={openCreateModal}
          className="theme-accent-btn flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Permission
        </button>
      </div>

      {/* ── Permission cards grouped by module ──────────────────────────────── */}
      <div className="space-y-10">
        {modules.map(moduleName => {
          const modulePermissions = permissions.filter(
            p => (p.module || p.code?.split('.')?.[0] || 'system') === moduleName,
          );
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
                  <Card
                    key={perm.id}
                    className="theme-surface-card group relative overflow-hidden p-5 transition-all hover:border-[var(--color-accent)]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="theme-text-primary font-bold transition-colors group-hover:text-[var(--color-accent-dark)]">
                          {perm.name}
                        </h4>
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

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
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
                  <h2 className="theme-text-primary text-xl font-black sm:text-2xl">
                    {editingPermission ? 'Edit Permission' : 'Add Permission'}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {editingPermission
                      ? 'Update name and description'
                      : 'Type any module & action — code is auto-generated'}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSavePermission} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
                  {/* Module combobox */}
                  <div className="space-y-1.5">
                    <label htmlFor="perm-module" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                      Page / Module
                      {!editingPermission && (
                        <span className="normal-case font-medium text-[10px] text-[var(--color-accent)] tracking-normal">
                          type freely or pick suggestion
                        </span>
                      )}
                    </label>
                    <Combobox
                      id="perm-module"
                      value={formData.module}
                      onChange={module => setFormData({ ...formData, module })}
                      suggestions={MODULE_SUGGESTIONS}
                      placeholder="e.g. assignments, workers, reports…"
                      disabled={!!editingPermission}
                    />
                  </div>

                  {/* Action combobox */}
                  <div className="space-y-1.5">
                    <label htmlFor="perm-action" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                      Action
                      {!editingPermission && (
                        <span className="normal-case font-medium text-[10px] text-[var(--color-accent)] tracking-normal">
                          type freely or pick suggestion
                        </span>
                      )}
                    </label>
                    <Combobox
                      id="perm-action"
                      value={formData.action}
                      onChange={action => setFormData({ ...formData, action })}
                      suggestions={ACTION_SUGGESTIONS}
                      placeholder="e.g. read, create, approve, export…"
                      disabled={!!editingPermission}
                    />
                  </div>

                  {/* Live code preview */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                      Auto Generated Code
                    </label>
                    <div className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center font-mono text-sm font-bold text-gray-700 select-all">
                      {liveCode || <span className="text-gray-400 font-sans font-normal">module.action</span>}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                      Permission Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Create Orders"
                      className="theme-focus-ring w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none transition-all font-bold text-gray-900"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Allows creating new orders"
                      className="theme-focus-ring w-full h-28 p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none transition-all font-medium text-gray-900 resize-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 p-5 sm:flex-row sm:justify-end sm:p-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                  >
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
