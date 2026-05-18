'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { CurrentTenantService } from '@/lib/services/current-tenant.service';
import { RoleService } from '@/lib/services/role-permission.service';
import { UserService } from '@/lib/services/user.service';
import { BackendTenant, CreateUserPayload, ManagedUser, Role, UpdateUserPayload } from '@/lib/types';
import { isOwnerRole, isSuperAdminRole } from '@/lib/roles';
import { normalizePhoneForApi } from '@/lib/utils';
import {
  CheckCircle,
  Edit2,
  Eye,
  Loader2,
  Plus,
  Power,
  PowerOff,
  RotateCcw,
  Save,
  Search,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

type UserForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  roleId: string;
  isActive: boolean;
};

const emptyForm: UserForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  roleId: '',
  isActive: true,
};

function getRoleName(user: ManagedUser) {
  if (typeof user.role === 'string') return user.role;
  return user.role?.name || 'Default Role';
}

function userBelongsToTenant(user: ManagedUser, tenantIds: Set<string>) {
  if (user.tenantId && tenantIds.has(user.tenantId)) return true;

  return Boolean(user.tenantUsers?.some(item => {
    const tenantId = item.tenant?.id || item.tenantId;
    return tenantId ? tenantIds.has(tenantId) : false;
  }));
}

function tenantNamesForUser(user: ManagedUser, tenants: BackendTenant[]) {
  const fallbackTenants = new Map(tenants.map(tenant => [tenant.id, tenant.name]));
  const names = user.tenantUsers
    ?.map(item => item.tenant?.name || (item.tenantId ? fallbackTenants.get(item.tenantId) : undefined))
    .filter(Boolean);

  if (names?.length) return names.join(', ');
  if (user.tenantId && fallbackTenants.has(user.tenantId)) return fallbackTenants.get(user.tenantId);
  return '-';
}

export function UserManagementPanel({ showLocalAction = false }: { showLocalAction?: boolean }) {
  const { hasPermission, isFullAccess, role } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tenants, setTenants] = useState<BackendTenant[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<ManagedUser | null>(null);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [formData, setFormData] = useState<UserForm>(emptyForm);
  const canView = isFullAccess || hasPermission('users.read');
  const canCreate = isFullAccess || hasPermission('users.create');
  const canUpdate = isFullAccess || hasPermission('users.update');
  const canDelete = isFullAccess || hasPermission('users.delete');
  const isOwner = isOwnerRole(role);
  const isSuperAdmin = isSuperAdminRole(role);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const tenantsRes = isOwner ? await CurrentTenantService.listCurrentTenants() : null;
      const ownerTenants = tenantsRes?.success ? tenantsRes.data || [] : [];
      const ownerTenantId = ownerTenants[0]?.id;
      const [usersRes, rolesRes] = await Promise.all([
        UserService.list(isOwner && ownerTenantId ? { tenantId: ownerTenantId } : undefined),
        RoleService.list(),
      ]);

      if (usersRes.success) {
        setUsers(usersRes.data || []);
      } else {
        toast.error(usersRes.error?.message || 'Failed to load users');
      }

      if (rolesRes.success) {
        const activeRoles = (rolesRes.data || []).filter(item => {
          if (!item.isActive) return false;
          if (isSuperAdmin) return true;

          const roleName = item.name.toUpperCase();
          const protectedRole =
            roleName.includes('SUPER_ADMIN') ||
            roleName.includes('FLOWOID_ADMIN') ||
            roleName === 'FREE_USERS' ||
            roleName === 'OWNER' ||
            roleName === 'TENANT_OWNER';

          return !protectedRole;
        });
        setRoles(activeRoles);
      } else {
        toast.error(rolesRes.error?.message || 'Failed to load roles');
      }

      if (tenantsRes && tenantsRes.success) {
        setTenants(ownerTenants);
      }
    } catch {
      toast.error('Failed to load user management data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleAdminAction = () => openCreateModal();
    window.addEventListener('admin-action-click', handleAdminAction);
    return () => window.removeEventListener('admin-action-click', handleAdminAction);
  }, [roles]);

  const tenantIds = useMemo(() => new Set(tenants.map(tenant => tenant.id)), [tenants]);

  const tenantScopedUsers = useMemo(() => {
    if (!isOwner || tenantIds.size === 0) return users;

    return users.filter(user => userBelongsToTenant(user, tenantIds));
  }, [isOwner, tenantIds, users]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return tenantScopedUsers.filter(user => {
      const matchesStatus =
        activeFilter === 'all' ||
        (activeFilter === 'active' ? user.isActive : !user.isActive);
      const matchesSearch =
        !normalizedSearch ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        (user.email || '').toLowerCase().includes(normalizedSearch) ||
        user.phone.toLowerCase().includes(normalizedSearch) ||
        getRoleName(user).toLowerCase().includes(normalizedSearch);
      
      const userRoleId = user.roleId || (typeof user.role === 'object' ? user.role?.id : '');
      const matchesRole = !roleFilter || userRoleId === roleFilter;

      return matchesStatus && matchesSearch && matchesRole;
    });
  }, [activeFilter, search, tenantScopedUsers, roleFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilter, roleFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));

  const openCreateModal = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create users');
      return;
    }
    setEditingUser(null);
    setFormData({ ...emptyForm, roleId: roles[0]?.id || '' });
    setIsModalOpen(true);
  };

  const openEditModal = (user: ManagedUser) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update users');
      return;
    }
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      roleId: user.roleId || (typeof user.role === 'object' ? user.role?.id || '' : ''),
      isActive: user.isActive,
    });
    setIsModalOpen(true);
  };

  const openViewModal = async (user: ManagedUser) => {
    setViewingUser(user);
    try {
      const response = await UserService.get(user.id);
      if (response.success) {
        setViewingUser(response.data);
      }
    } catch {
      // Keep the table row details visible if the detail request is blocked.
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData(emptyForm);
  };

  const handleSaveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedPhone = normalizePhoneForApi(formData.phone);

    if (!formData.name.trim()) return toast.error('User name is required');
    if (normalizedPhone.length < 6) return toast.error('Enter a valid phone number');
    if (!editingUser && formData.password.length < 8) return toast.error('Password must be at least 8 characters');

    setIsSaving(true);
    try {
      const commonPayload = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: normalizedPhone,
        roleId: formData.roleId || undefined,
        isActive: formData.isActive,
      };

      const response = editingUser
        ? await UserService.update(editingUser.id, {
            ...commonPayload,
            email: formData.email.trim() || null,
            password: formData.password ? formData.password : undefined,
          } satisfies UpdateUserPayload)
        : await UserService.create({
            ...commonPayload,
            password: formData.password,
          } satisfies CreateUserPayload);

      if (response.success) {
        toast.success(editingUser ? 'User updated successfully' : 'User created successfully');
        closeModal();
        await loadData();
      } else {
        toast.error(response.error?.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivateUser = async (user: ManagedUser) => {
    if (!window.confirm(`Deactivate "${user.name}" and revoke active sessions?`)) return;

    try {
      const response = await UserService.delete(user.id);
      if (response.success) {
        toast.success('User deactivated successfully');
        await loadData();
      } else {
        toast.error(response.error?.message || 'Failed to deactivate user');
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  const handleToggleActive = async (user: ManagedUser, isActive: boolean) => {
    const action = isActive ? 'activate' : 'deactivate';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${user.name}"?`)) return;

    try {
      const response = isActive
        ? await UserService.update(user.id, { isActive: true })
        : await UserService.delete(user.id);

      if (response.success) {
        toast.success(isActive ? 'User activated successfully' : 'User deactivated successfully');
        await loadData();
        if (viewingUser?.id === user.id) {
          setViewingUser(null);
        }
      } else {
        toast.error(response.error?.message || `Failed to ${action} user`);
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search users, phone, role..."
              className="theme-focus-ring h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition"
            />
          </div>

          <div className="flex rounded-lg border border-gray-200 bg-white p-1">
            {(['all', 'active', 'inactive'] as const).map(status => (
              <button
                key={status}
                onClick={() => setActiveFilter(status)}
                className={`h-8 rounded-md px-3 text-xs font-bold capitalize transition ${
                  activeFilter === status ? 'theme-accent-btn' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <select
            value={roleFilter}
            onChange={event => setRoleFilter(event.target.value)}
            className="theme-focus-ring h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition"
          >
            <option value="">All Roles</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>

        {showLocalAction && canCreate && (
          <button
            onClick={openCreateModal}
            className="theme-accent-btn inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        )}
      </div>

      <Card className="theme-surface-card overflow-hidden">
        {!canView ? (
          <div className="p-12 text-center text-sm font-medium text-gray-500">
            You do not have permission to view users.
          </div>
        ) : isLoading ? (
          <div className="overflow-x-auto p-4 space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow className="theme-table-header">
                  <TableHead className="text-[11px] font-bold uppercase tracking-wide text-gray-500">User</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Phone</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Role</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Tenants</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Status</TableHead>
                  <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map(user => (
                  <TableRow key={user.id} className="theme-table-row">
                    <TableCell>
                      <p className="theme-text-primary font-bold">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email || 'No email'}</p>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-700">{user.phone}</TableCell>
                    <TableCell>
                      <span className="theme-badge-soft inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold">
                        <Shield className="h-3.5 w-3.5" />
                        {getRoleName(user)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {tenantNamesForUser(user, tenants)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                        user.isActive ? 'theme-badge-soft' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <CheckCircle className="h-3.5 w-3.5" />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openViewModal(user)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100"
                          title="View user"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canUpdate && (
                          <button
                            onClick={() => openEditModal(user)}
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100"
                            title="Edit user"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {canUpdate && (
                          <button
                            onClick={() => handleToggleActive(user, !user.isActive)}
                            className={`rounded-lg border p-2 transition ${
                              user.isActive
                                ? 'border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent-dark)] hover:bg-[var(--color-accent-light)]'
                            }`}
                            title={user.isActive ? 'Deactivate user' : 'Activate user'}
                          >
                            {user.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeactivateUser(user)}
                            className="rounded-lg border border-red-100 bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                            title="Delete / deactivate user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredUsers.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 px-6 py-4 gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Rows:</span>
                    <select
                      value={itemsPerPage}
                      onChange={e => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-sm font-semibold text-gray-700 outline-none transition"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="15">15</option>
                      <option value="20">20</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {filteredUsers.length === 0 && (
              <div className="p-12 text-center text-sm font-medium text-gray-500">
                No users found.
              </div>
            )}
          </div>
        )}
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/70 p-3 backdrop-blur-sm sm:p-4">
          <Card className="theme-modal-panel flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 p-5 sm:p-6">
              <div>
                <h2 className="theme-text-primary text-xl font-black sm:text-2xl">{editingUser ? 'Edit User' : 'Create User'}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {isOwner ? 'Assign roles only inside your business tenant.' : 'Assign only roles available to your account.'}
                </p>
              </div>
              <button onClick={closeModal} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Full Name" value={formData.name} onChange={value => setFormData({ ...formData, name: value })} required />
                <Field label="Phone" value={formData.phone} onChange={value => setFormData({ ...formData, phone: value })} required />
                <Field label="Email" type="email" value={formData.email} onChange={value => setFormData({ ...formData, email: value })} />
                <Field
                  label={editingUser ? 'New Password' : 'Password'}
                  type="password"
                  value={formData.password}
                  onChange={value => setFormData({ ...formData, password: value })}
                  required={!editingUser}
                  placeholder={editingUser ? 'Leave blank to keep current' : 'Minimum 8 characters'}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Role</label>
                  <select
                    value={formData.roleId}
                    onChange={event => setFormData({ ...formData, roleId: event.target.value })}
                    className="theme-focus-ring h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-900 outline-none"
                  >
                    <option value="">Backend default role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Active Account</p>
                    <p className="text-xs text-gray-500">Inactive users cannot access the system.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`relative h-6 w-11 rounded-full transition ${formData.isActive ? 'theme-accent-btn' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${formData.isActive ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 p-5 sm:flex-row sm:justify-end sm:p-6">
                <button type="button" onClick={closeModal} className="rounded-lg px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/70 p-4 backdrop-blur-sm">
          <Card className="theme-modal-panel w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <div>
                <h2 className="theme-text-primary text-xl font-black">User Details</h2>
                <p className="mt-1 text-sm text-gray-500">Account, role, status, and tenant access.</p>
              </div>
              <button onClick={() => setViewingUser(null)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="theme-icon-chip flex h-14 w-14 items-center justify-center rounded-full text-xl font-black">
                    {viewingUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="theme-text-primary text-2xl font-black">{viewingUser.name}</h3>
                    <p className="text-sm text-gray-500">{viewingUser.email || 'No email address'}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                  viewingUser.isActive ? 'theme-badge-soft' : 'bg-gray-100 text-gray-600'
                }`}>
                  <CheckCircle className="h-3.5 w-3.5" />
                  {viewingUser.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Detail label="Phone" value={viewingUser.phone} />
                <Detail label="Role" value={getRoleName(viewingUser)} />
                <Detail label="Created" value={new Date(viewingUser.createdAt).toLocaleString()} />
                <Detail label="Updated" value={viewingUser.updatedAt ? new Date(viewingUser.updatedAt).toLocaleString() : '-'} />
              </div>

              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">Tenant Access</p>
                {viewingUser.tenantUsers?.length ? (
                  <div className="space-y-2">
                    {viewingUser.tenantUsers.map(item => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
                        <div>
                          <p className="font-bold text-gray-900">{item.tenant?.name || (item.tenantId ? tenants.find(tenant => tenant.id === item.tenantId)?.name : null) || 'Tenant'}</p>
                          <p className="text-xs text-gray-500">{item.tenant?.slug || item.tenantId || '-'}</p>
                        </div>
                        <span className="theme-badge-soft rounded-full px-3 py-1 text-xs font-bold">
                          {item.role?.name || getRoleName(viewingUser)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No tenant records linked.</p>
                )}
              </div>

              <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                {canUpdate && (
                  <button
                    type="button"
                    onClick={() => {
                      const user = viewingUser;
                      setViewingUser(null);
                      openEditModal(user);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                )}
                {canUpdate && (
                  <button
                    type="button"
                    onClick={() => handleToggleActive(viewingUser, !viewingUser.isActive)}
                    className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold ${
                      viewingUser.isActive
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'bg-[var(--color-accent-light)] text-[var(--color-accent-dark)] hover:bg-[var(--color-accent-light)]'
                    }`}
                  >
                    {viewingUser.isActive ? <PowerOff className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                    {viewingUser.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="theme-focus-ring h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-900 outline-none transition"
      />
    </div>
  );
}
