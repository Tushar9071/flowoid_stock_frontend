'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PermissionService } from '@/lib/services/role-permission.service';
import { UserService } from '@/lib/services/user.service';
import { ManagedUser, Permission } from '@/lib/types';
import { Check, ChevronRight, Loader2, Lock, RotateCcw, Search, Shield, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';

const CRUD_ACTIONS = [
  { key: 'VIEW', label: 'Read' },
  { key: 'CREATE', label: 'Create' },
  { key: 'UPDATE', label: 'Update' },
  { key: 'DELETE', label: 'Delete' },
] as const;

function permissionCode(permission: Permission) {
  return permission.code || `${permission.module}.${permission.action}`.toLowerCase();
}

function permissionModule(permission: Permission) {
  return permission.module || permission.code?.split('.')?.[0]?.toUpperCase() || 'SYSTEM';
}

function permissionAction(permission: Permission) {
  return permission.action || permission.code?.split('.')?.[1]?.toUpperCase() || 'ACCESS';
}

export default function RolesPage() {
  const [owners, setOwners] = useState<ManagedUser[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [ownerPermissions, setOwnerPermissions] = useState<Permission[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<ManagedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissionId, setSavingPermissionId] = useState<string | null>(null);
  const [isApplyingDefaults, setIsApplyingDefaults] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');
  const autoAppliedOwnersRef = React.useRef<Set<string>>(new Set());

  const selectedPermissionIds = useMemo(
    () => new Set(ownerPermissions.map((permission) => permission.id)),
    [ownerPermissions]
  );

  const permissionRows = useMemo(() => {
    const groups = new Map<string, Permission[]>();
    permissions.forEach((permission) => {
      const key = permissionModule(permission);
      groups.set(key, [...(groups.get(key) || []), permission]);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, modulePermissions]) => {
        const actionMap = new Map<string, Permission>();
        const otherPermissions: Permission[] = [];

        modulePermissions.forEach((permission) => {
          const action = permissionAction(permission);
          if (CRUD_ACTIONS.some(item => item.key === action)) {
            actionMap.set(action, permission);
          } else {
            otherPermissions.push(permission);
          }
        });

        return { module, actionMap, otherPermissions };
      });
  }, [permissions]);

  const filteredOwners = useMemo(() => {
    const query = ownerSearch.trim().toLowerCase();
    if (!query) return owners;

    return owners.filter((owner) =>
      [owner.name, owner.email, owner.phone, owner.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [ownerSearch, owners]);

  const filteredPermissionRows = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    if (!query) return permissionRows;

    return permissionRows
      .map((row) => {
        const moduleMatches = row.module.replace(/_/g, ' ').toLowerCase().includes(query);
        const actionMap = new Map<string, Permission>();
        const otherPermissions = row.otherPermissions.filter((permission) => {
          const searchable = [
            permissionCode(permission),
            permissionModule(permission),
            permissionAction(permission),
            permission.name,
            permission.description,
          ].filter(Boolean).join(' ').toLowerCase();
          return moduleMatches || searchable.includes(query);
        });

        row.actionMap.forEach((permission, action) => {
          const searchable = [
            permissionCode(permission),
            permissionModule(permission),
            permissionAction(permission),
            permission.name,
            permission.description,
            action,
          ].filter(Boolean).join(' ').toLowerCase();

          if (moduleMatches || searchable.includes(query)) {
            actionMap.set(action, permission);
          }
        });

        return { ...row, actionMap, otherPermissions };
      })
      .filter((row) => row.actionMap.size > 0 || row.otherPermissions.length > 0);
  }, [permissionRows, permissionSearch]);

  const loadOwnerPermissions = async (ownerId: string, showLoader: boolean = true) => {
    if (showLoader) setLoadingPermissions(true);
    try {
      const response = await PermissionService.getOwnerPermissions(ownerId);
      if (response.success) {
        const nextPermissions = response.data || [];
        setOwnerPermissions(nextPermissions);

        if (nextPermissions.length === 0 && !autoAppliedOwnersRef.current.has(ownerId)) {
          autoAppliedOwnersRef.current.add(ownerId);
          const defaultsResponse = await PermissionService.assignDefaultOwnerPermissions(ownerId);
          if (defaultsResponse.success) {
            await loadOwnerPermissions(ownerId, showLoader);
            toast.success('Default owner permissions applied');
          } else {
            toast.error(defaultsResponse.error?.message || 'Failed to apply default permissions');
          }
        }
      } else {
        setOwnerPermissions([]);
        // Check if it's a 403 Forbidden error (permission denied)
        if (response.error?.status === 403) {
          toast.error('You do not have permission to manage owner permissions. Contact an administrator.');
        } else {
          toast.error(response.error?.message || 'Failed to load owner permissions');
        }
      }
    } catch (error) {
      setOwnerPermissions([]);
      toast.error('Failed to load owner permissions');
    } finally {
      if (showLoader) setLoadingPermissions(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ownersRes, permissionsRes] = await Promise.all([
        UserService.list(),
        PermissionService.list(),
      ]);

      if (ownersRes.success) {
        const nextOwners = ownersRes.data || [];
        setOwners(nextOwners);
        const nextSelected = selectedOwner
          ? nextOwners.find((owner: ManagedUser) => owner.id === selectedOwner.id) || nextOwners.find((o: ManagedUser) => o.isActive) || null
          : nextOwners.find((o: ManagedUser) => o.isActive) || null;
        setSelectedOwner(nextSelected);
        if (nextSelected) await loadOwnerPermissions(nextSelected.id);
      } else {
        toast.error(ownersRes.error?.message || 'Failed to load owners');
      }

      if (permissionsRes.success) {
        setPermissions(permissionsRes.data || []);
      } else {
        toast.error(permissionsRes.error?.message || 'Failed to load permissions');
      }
    } catch {
      toast.error('Failed to load permission management data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectOwner = async (owner: ManagedUser) => {
    setSelectedOwner(owner);
    await loadOwnerPermissions(owner.id);
  };

  const togglePermission = async (permission: Permission) => {
    if (!selectedOwner) return;

    const currentlyAssigned = selectedPermissionIds.has(permission.id);
    setSavingPermissionId(permission.id);

    try {
      const response = currentlyAssigned
        ? await PermissionService.removeOwnerPermission(selectedOwner.id, permission.id)
        : await PermissionService.assignOwnerPermissions(selectedOwner.id, [...Array.from(selectedPermissionIds), permission.id]);

      if (response.success) {
        await loadOwnerPermissions(selectedOwner.id, false);
        toast.success(currentlyAssigned ? 'Permission removed' : 'Permission assigned');
      } else {
        toast.error(response.error?.message || 'Failed to update permission');
      }
    } catch {
      toast.error('Failed to update permission');
    } finally {
      setSavingPermissionId(null);
    }
  };

  const applyDefaultPermissions = async () => {
    if (!selectedOwner) return;
    setIsApplyingDefaults(true);
    try {
      const response = await PermissionService.assignDefaultOwnerPermissions(selectedOwner.id);
      if (response.success) {
        await loadOwnerPermissions(selectedOwner.id, false);
        toast.success('Default owner permissions applied');
      } else {
        toast.error(response.error?.message || 'Failed to apply default permissions');
      }
    } catch {
      toast.error('Failed to apply default permissions');
    } finally {
      setIsApplyingDefaults(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Skeleton className="h-[520px] rounded-xl" />
        <Skeleton className="h-[620px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid items-start gap-5 p-4 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="theme-surface-card overflow-hidden lg:sticky lg:top-6">
        <div className="border-b border-gray-100 p-4">
          <h2 className="flex items-center gap-2 text-sm font-black text-gray-900">
            <UserRound className="h-4 w-4" />
            Owner Accounts
          </h2>
          <p className="mt-1 text-xs text-gray-500">Select an owner to manage backend permissions.</p>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={ownerSearch}
              onChange={(event) => setOwnerSearch(event.target.value)}
              placeholder="Search owner, phone, email"
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)]"
            />
          </div>
        </div>

        <div className="max-h-[calc(100vh-180px)] space-y-2 overflow-y-auto p-3">
          {filteredOwners.map((owner) => (
            <button
              key={owner.id}
              onClick={() => selectOwner(owner)}
              disabled={!owner.isActive}
              className={`w-full rounded-lg p-3 text-left transition ${
                !owner.isActive
                  ? 'bg-gray-50 opacity-60 cursor-not-allowed grayscale'
                  : selectedOwner?.id === owner.id
                  ? 'theme-accent-btn shadow-sm'
                  : 'bg-white theme-text-primary hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black">{owner.name}</p>
                    {!owner.isActive && (
                      <span className="shrink-0 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">Inactive</span>
                    )}
                  </div>
                  <p className="truncate text-xs opacity-70">{owner.email || owner.phone}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
              </div>
            </button>
          ))}

          {filteredOwners.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
              {owners.length === 0 ? 'No owner accounts found.' : 'No owners match this search.'}
            </div>
          )}
        </div>
      </Card>

      <Card className="theme-surface-card overflow-hidden p-5 sm:p-6">
        {selectedOwner ? (
          <>
            <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="theme-text-primary text-2xl font-black">{selectedOwner.name}</h1>
                <p className="mt-1 text-sm text-gray-500">{selectedOwner.email || selectedOwner.phone}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="theme-badge-soft inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-black">
                  <Shield className="h-3.5 w-3.5" />
                  {ownerPermissions.length} permissions assigned
                </div>
                <button
                  type="button"
                  onClick={applyDefaultPermissions}
                  disabled={isApplyingDefaults || savingPermissionId !== null}
                  className="theme-secondary-btn inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-black"
                >
                  {isApplyingDefaults ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  Apply Defaults
                </button>
              </div>
            </div>

            {loadingPermissions ? (
              <div className="mt-5 space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="mt-5 space-y-6">
                <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                  <Lock className="h-4 w-4" />
                  Backend Permission Assignment
                </div>

                <div className="relative max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={permissionSearch}
                    onChange={(event) => setPermissionSearch(event.target.value)}
                    placeholder="Search module, action, permission"
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)]"
                  />
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-400">Module</th>
                        {CRUD_ACTIONS.map(action => (
                          <th key={action.key} className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-gray-400">
                            {action.label}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-400">Other</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPermissionRows.map((row) => (
                        <tr key={row.module} className="bg-white">
                          <td className="px-4 py-4">
                            <p className="theme-text-primary text-sm font-black uppercase">{row.module.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-gray-400">Backend module</p>
                          </td>
                          {CRUD_ACTIONS.map(action => {
                            const permission = row.actionMap.get(action.key);
                            return (
                              <td key={action.key} className="px-4 py-4 text-center">
                                {permission ? (
                                  <PermissionTick
                                    checked={selectedPermissionIds.has(permission.id)}
                                    loading={savingPermissionId === permission.id}
                                    disabled={savingPermissionId !== null || isApplyingDefaults}
                                    onClick={() => togglePermission(permission)}
                                  />
                                ) : (
                                  <span className="inline-block h-7 w-7 rounded-md border border-transparent" />
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              {row.otherPermissions.length > 0 ? row.otherPermissions.map(permission => (
                                <button
                                  key={permission.id}
                                  type="button"
                                  onClick={() => togglePermission(permission)}
                                  disabled={savingPermissionId !== null || isApplyingDefaults}
                                  className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase transition ${
                                    selectedPermissionIds.has(permission.id)
                                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent-dark)]'
                                      : 'border-gray-200 bg-white text-gray-500 hover:border-[var(--color-accent)]'
                                  }`}
                                >
                                  {savingPermissionId === permission.id ? 'Saving...' : permissionAction(permission).replace(/_/g, ' ')}
                                </button>
                              )) : (
                                <span className="text-xs text-gray-300">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredPermissionRows.length === 0 && (
                    <div className="border-t border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
                      No backend permissions match this search.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center text-sm text-gray-500">
            Create an owner account first, then assign backend permissions here.
          </div>
        )}
      </Card>
    </div>
  );
}

function PermissionTick({
  checked,
  loading,
  disabled,
  onClick,
}: {
  checked: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${
        checked
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
          : 'border-gray-300 bg-white text-transparent hover:border-[var(--color-accent)]'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      aria-pressed={checked}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin text-[var(--color-accent)]" /> : <Check className="h-4 w-4" />}
    </button>
  );
}
