'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { BusinessSettings, SettingsService } from '@/lib/services/settings.service';
import { useAuth } from '@/lib/auth-context';
import { normalizePhoneForApi } from '@/lib/utils';
import {
  BadgeIndianRupee,
  Building2,
  FileText,
  ImagePlus,
  Loader2,
  Lock,
  PackageCheck,
  Save,
  Settings2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const emptySettings: BusinessSettings = {
  businessName: '',
  category: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  gstin: '',
  pan: '',
  invoicePrefix: 'INV',
  challanPrefix: 'CHL',
  paymentPrefix: 'PAY',
  orderPrefix: 'ORD',
  purchasePrefix: 'PUR',
  allowNegativeStock: false,
  lowStockThreshold: 10,
  defaultPaymentTerms: 'Payment due within 30 days',
};

type SectionKey = 'profile' | 'documents' | 'stock' | 'payments';

export default function DashboardSettingsPage() {
  const { hasPermission, isFullAccess, user } = useAuth();
  const canManage = isFullAccess || hasPermission('settings.manage_settings');
  const [settings, setSettings] = useState<BusinessSettings>(emptySettings);
  const [activeSection, setActiveSection] = useState<SectionKey>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<SectionKey | 'logo' | null>(null);
  const [logoLoadError, setLogoLoadError] = useState(false);

  const sections = useMemo(() => [
    { id: 'profile' as const, label: 'Business Profile', icon: Building2 },
    { id: 'documents' as const, label: 'Documents', icon: FileText },
    { id: 'stock' as const, label: 'Stock Rules', icon: PackageCheck },
    { id: 'payments' as const, label: 'Payment Terms', icon: BadgeIndianRupee },
  ], []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      const response = await SettingsService.get();
      if (!mounted) return;
      if (response.success) {
        setSettings({ ...emptySettings, ...response.data });
      } else {
        toast.error(response.error?.message || 'Failed to load settings');
      }
      setIsLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (field: keyof BusinessSettings, value: string | boolean | number) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const saveSection = async (section: SectionKey) => {
    if (!canManage) return toast.error('You do not have permission to update settings');

    setSavingSection(section);
    try {
      const response =
        section === 'profile'
          ? await SettingsService.updateBusinessProfile({
              businessName: settings.businessName || undefined,
              category: settings.category || undefined,
              phone: settings.phone ? normalizePhoneForApi(settings.phone) : undefined,
              email: settings.email || undefined,
              address: settings.address || undefined,
              city: settings.city || undefined,
              state: settings.state || undefined,
              country: settings.country || undefined,
              gstin: settings.gstin || undefined,
              pan: settings.pan || undefined,
            })
          : section === 'documents'
            ? await SettingsService.updateDocumentConfig({
                invoicePrefix: settings.invoicePrefix || undefined,
                challanPrefix: settings.challanPrefix || undefined,
                paymentPrefix: settings.paymentPrefix || undefined,
                orderPrefix: settings.orderPrefix || undefined,
                purchasePrefix: settings.purchasePrefix || undefined,
              })
            : section === 'stock'
              ? await SettingsService.updateStockRules({
                  allowNegativeStock: Boolean(settings.allowNegativeStock),
                  lowStockThreshold: Number(settings.lowStockThreshold || 0),
                })
              : await SettingsService.updatePaymentTerms({
                  defaultPaymentTerms: settings.defaultPaymentTerms || undefined,
                });

      if (response.success) {
        setSettings({ ...emptySettings, ...response.data });
        toast.success('Settings saved');
      } else {
        toast.error(response.error?.message || 'Failed to save settings');
      }
    } catch {
      toast.error('Unexpected error while saving settings');
    } finally {
      setSavingSection(null);
    }
  };

  const uploadLogo = async (file?: File) => {
    if (!file) return;
    if (!canManage) return toast.error('You do not have permission to update settings');

    setSavingSection('logo');
    const response = await SettingsService.uploadLogo(file);
    if (response.success) {
      setSettings({ ...emptySettings, ...response.data });
      setLogoLoadError(false);
      toast.success('Logo updated');
    } else {
      toast.error(response.error?.message || 'Failed to upload logo');
    }
    setSavingSection(null);
  };

  const logoSrc = useMemo(() => {
    const rawUrl = settings.logoUrl;
    if (!rawUrl) return '';
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

    const uploadPath = rawUrl.replace(/\\/g, '/').replace(/^\/?api\/uploads\//, '/uploads/');
    const normalizedPath = uploadPath.startsWith('/') ? uploadPath : `/${uploadPath}`;
    return encodeURI(normalizedPath);
  }, [settings.logoUrl]);

  useEffect(() => {
    setLogoLoadError(false);
  }, [logoSrc]);

  return (
    <DashboardLayout
      title="Settings"
      subtitle="Business profile, document prefixes, stock controls and payment defaults"
    >
      {isLoading ? (
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Skeleton className="h-[460px] rounded-xl" />
          <Skeleton className="h-[620px] rounded-xl" />
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="theme-surface-card overflow-hidden rounded-xl border border-gray-200 bg-white lg:sticky lg:top-6">
            <div className="border-b border-gray-100 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                <Settings2 className="h-4 w-4" />
                Settings Sections
              </div>
              {!canManage && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  View-only access. Admin must assign Settings Manage permission to edit.
                </div>
              )}
            </div>
            <div className="space-y-1 p-3">
              {sections.map((section) => {
                const Icon = section.icon;
                const active = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-bold transition ${
                      active ? 'theme-accent-btn' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="space-y-5">
            <div className="theme-surface-card rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    {logoSrc && !logoLoadError ? (
                      <img src={logoSrc} alt="Business logo" className="h-full w-full object-cover" onError={() => setLogoLoadError(true)} />
                    ) : (
                      <Building2 className="h-7 w-7 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="theme-text-primary text-xl font-black">
                      {settings.businessName || user?.name || 'Business Settings'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">{settings.category || 'Configure your business profile'}</p>
                  </div>
                </div>
                <label className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-black ${
                  canManage ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : 'pointer-events-none border-gray-100 bg-gray-50 text-gray-400'
                }`}>
                  {savingSection === 'logo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => uploadLogo(event.target.files?.[0])} />
                </label>
              </div>
            </div>

            {activeSection === 'profile' && (
              <SettingsCard title="Business Profile" saving={savingSection === 'profile'} canManage={canManage} onSave={() => saveSection('profile')}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Business Name" value={settings.businessName || ''} onChange={(value) => updateField('businessName', value)} />
                  <Field label="Category" value={settings.category || ''} onChange={(value) => updateField('category', value)} />
                  <Field label="Phone" value={settings.phone || ''} onChange={(value) => updateField('phone', value)} />
                  <Field label="Email" type="email" value={settings.email || ''} onChange={(value) => updateField('email', value)} />
                  <Field label="GSTIN" value={settings.gstin || ''} onChange={(value) => updateField('gstin', value)} />
                  <Field label="PAN" value={settings.pan || ''} onChange={(value) => updateField('pan', value)} />
                  <Field className="md:col-span-2" label="Address" value={settings.address || ''} onChange={(value) => updateField('address', value)} />
                  <Field label="City" value={settings.city || ''} onChange={(value) => updateField('city', value)} />
                  <Field label="State" value={settings.state || ''} onChange={(value) => updateField('state', value)} />
                  <Field label="Country" value={settings.country || ''} onChange={(value) => updateField('country', value)} />
                </div>
              </SettingsCard>
            )}

            {activeSection === 'documents' && (
              <SettingsCard title="Document Prefixes" saving={savingSection === 'documents'} canManage={canManage} onSave={() => saveSection('documents')}>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Invoice Prefix" value={settings.invoicePrefix || ''} onChange={(value) => updateField('invoicePrefix', value.toUpperCase())} />
                  <Field label="Challan Prefix" value={settings.challanPrefix || ''} onChange={(value) => updateField('challanPrefix', value.toUpperCase())} />
                  <Field label="Payment Prefix" value={settings.paymentPrefix || ''} onChange={(value) => updateField('paymentPrefix', value.toUpperCase())} />
                  <Field label="Order Prefix" value={settings.orderPrefix || ''} onChange={(value) => updateField('orderPrefix', value.toUpperCase())} />
                  <Field label="Purchase Prefix" value={settings.purchasePrefix || ''} onChange={(value) => updateField('purchasePrefix', value.toUpperCase())} />
                </div>
              </SettingsCard>
            )}

            {activeSection === 'stock' && (
              <SettingsCard title="Stock Rules" saving={savingSection === 'stock'} canManage={canManage} onSave={() => saveSection('stock')}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Low Stock Threshold" type="number" value={String(settings.lowStockThreshold ?? 0)} onChange={(value) => updateField('lowStockThreshold', Number(value))} />
                  <label className="flex h-[76px] items-center justify-between rounded-xl border border-gray-200 bg-white px-4">
                    <div>
                      <p className="text-sm font-black text-gray-900">Allow Negative Stock</p>
                      <p className="mt-1 text-xs text-gray-500">Backend will permit stock balance below zero.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(settings.allowNegativeStock)}
                      onChange={(event) => updateField('allowNegativeStock', event.target.checked)}
                      className="h-5 w-5 accent-[var(--color-accent)]"
                    />
                  </label>
                </div>
              </SettingsCard>
            )}

            {activeSection === 'payments' && (
              <SettingsCard title="Payment Terms" saving={savingSection === 'payments'} canManage={canManage} onSave={() => saveSection('payments')}>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-black text-gray-900">Default Payment Terms</span>
                  <textarea
                    value={settings.defaultPaymentTerms || ''}
                    onChange={(event) => updateField('defaultPaymentTerms', event.target.value)}
                    rows={5}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)]"
                  />
                </label>
              </SettingsCard>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function SettingsCard({
  title,
  children,
  saving,
  canManage,
  onSave,
}: {
  title: string;
  children: React.ReactNode;
  saving: boolean;
  canManage: boolean;
  onSave: () => void;
}) {
  return (
    <section className="theme-surface-card rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-5 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="theme-text-primary text-lg font-black">{title}</h2>
        <button
          type="button"
          onClick={onSave}
          disabled={!canManage || saving}
          className="theme-accent-btn inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-black text-gray-900">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)]"
      />
    </label>
  );
}
