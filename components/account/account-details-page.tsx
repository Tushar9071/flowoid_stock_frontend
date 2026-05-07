'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AuthService } from '@/lib/services/auth.service';
import { CurrentTenantService } from '@/lib/services/current-tenant.service';
import { useAuth } from '@/lib/auth-context';
import { BackendTenant } from '@/lib/types';
import { normalizeRole } from '@/lib/roles';
import { Building2, CheckCircle2, KeyRound, Loader2, Mail, Phone, Shield, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';

type Mode = 'profile' | 'settings';
type Shell = 'dashboard' | 'admin';

const roleLabels: Record<string, string> = {
  flowoid_admin: 'Flowoid Admin',
  owner: 'Business Owner',
  manager: 'Staff / Manager',
  viewer: 'Viewer',
};

export function AccountDetailsPage({ mode, shell }: { mode: Mode; shell: Shell }) {
  const { user, role, permissions, refreshAuth } = useAuth();
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [loadingTenant, setLoadingTenant] = useState(shell !== 'admin');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (shell === 'admin') return;

    const loadTenant = async () => {
      setLoadingTenant(true);
      const response = await CurrentTenantService.getCurrentTenant();
      if (response.success && response.data) {
        setTenant(response.data);
      }
      setLoadingTenant(false);
    };

    loadTenant();
  }, [shell]);

  const roleKey = normalizeRole(role);
  const roleLabel = roleLabels[roleKey] || String(role || 'User');
  const permissionGroups = useMemo(() => {
    const grouped = new Map<string, string[]>();
    for (const permission of permissions) {
      const [moduleName = 'system', action = 'access'] = permission.split('.');
      const label = moduleName.replace(/[-_]/g, ' ');
      grouped.set(label, [...(grouped.get(label) || []), action]);
    }
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passwordForm.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Passwords do not match');

    setSavingPassword(true);
    try {
      const response = await AuthService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.success) {
        toast.success('Password updated successfully');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        await refreshAuth();
      } else {
        toast.error(response.error?.message || 'Failed to update password');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const content = (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="theme-surface-card overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center gap-4">
              <div className="theme-avatar flex h-14 w-14 items-center justify-center rounded-full text-xl font-black text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <h2 className="theme-text-primary truncate text-2xl font-black">{user?.name || 'User'}</h2>
                <p className="text-sm font-semibold text-slate-500">{roleLabel}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <InfoCard icon={UserRound} label="Name" value={user?.name || '-'} />
            <InfoCard icon={Shield} label="Role" value={String(role || '-')} />
            <InfoCard icon={Mail} label="Email" value={user?.email || '-'} />
            <InfoCard icon={Phone} label="Phone" value={user?.phone || '-'} />
          </div>
        </section>

        <section className="theme-surface-card overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h3 className="theme-text-primary flex items-center gap-2 text-base font-black">
              <Building2 className="h-5 w-5" />
              {shell === 'admin' ? 'Platform Access' : 'Business Tenant'}
            </h3>
          </div>

          <div className="p-5">
            {shell === 'admin' ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-black text-emerald-800">Flowoid platform administrator</p>
                <p className="mt-1 text-sm text-emerald-700">Can manage tenants, roles, permissions, monitoring and platform settings.</p>
              </div>
            ) : loadingTenant ? (
              <div className="flex items-center gap-2 p-4 text-sm font-semibold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading tenant details
              </div>
            ) : tenant ? (
              <div className="space-y-3">
                <InfoLine label="Business" value={tenant.name} />
                <InfoLine label="Slug" value={tenant.slug} />
                <InfoLine label="Status" value={tenant.status} />
                <InfoLine label="Category" value={tenant.businessCategory || '-'} />
                <InfoLine label="Email" value={tenant.email || '-'} />
                <InfoLine label="Phone" value={tenant.phone || '-'} />
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Tenant details are not included in the current backend session response.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="theme-surface-card overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <h3 className="theme-text-primary flex items-center gap-2 text-base font-black">
            <CheckCircle2 className="h-5 w-5" />
            Permissions
          </h3>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
          {permissionGroups.length ? permissionGroups.map(([moduleName, actions]) => (
            <div key={moduleName} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="theme-text-primary text-sm font-black capitalize">{moduleName}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{actions.join(', ')}</p>
            </div>
          )) : (
            <p className="text-sm font-semibold text-slate-500">No permissions returned for this account.</p>
          )}
        </div>
      </section>

      {mode === 'settings' && (
        <section className="theme-surface-card overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h3 className="theme-text-primary flex items-center gap-2 text-base font-black">
              <KeyRound className="h-5 w-5" />
              Security Settings
            </h3>
          </div>
          <form onSubmit={savePassword} className="grid gap-4 p-5 md:grid-cols-3">
            <Field label="Current Password" type="password" value={passwordForm.currentPassword} onChange={value => setPasswordForm(data => ({ ...data, currentPassword: value }))} />
            <Field label="New Password" type="password" value={passwordForm.newPassword} onChange={value => setPasswordForm(data => ({ ...data, newPassword: value }))} />
            <Field label="Confirm Password" type="password" value={passwordForm.confirmPassword} onChange={value => setPasswordForm(data => ({ ...data, confirmPassword: value }))} />
            <div className="md:col-span-3 flex justify-end">
              <button disabled={savingPassword} className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold disabled:opacity-60">
                {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Password
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );

  if (shell === 'admin') return content;

  return (
    <DashboardLayout
      title={mode === 'profile' ? 'My Profile' : 'Settings'}
      subtitle={mode === 'profile' ? 'Your account, role, tenant and permissions' : 'Account security and tenant details'}
    >
      {content}
    </DashboardLayout>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="break-words text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-right text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}

function Field({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="theme-focus-ring h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none"
      />
    </label>
  );
}
