'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { SkeletonTable, SkeletonCard } from '@/components/skeleton/Skeletons';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  Activity,
  ArrowRight,
  BadgeIndianRupee,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  Edit3,
  FileText,
  Loader2,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  WalletCards,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import { CurrentTenantService } from '@/lib/services/current-tenant.service';
import { PartyService } from '@/lib/services/party.service';
import {
  BackendParty,
  BackendTenant,
  CreatePartyPayload,
  OpeningBalanceType,
  PartyStatementResponse,
  PartyType,
} from '@/lib/types';

type Tab = 'DEALER' | 'SUPPLIER';
type ModalMode = 'create' | 'edit' | 'view';
type LedgerMode = 'statement' | 'ledger';

interface PartyFormState {
  type: PartyType;
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  alternatePhone: string;
  email: string;
  gstin: string;
  pan: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  creditPeriodDays: string;
  creditLimit: string;
  openingBalance: string;
  openingBalanceType: OpeningBalanceType;
  openingBalanceDate: string;
  notes: string;
}

const PAGE_LIMIT = 12;

const SAMPLE_PARTIES: CreatePartyPayload[] = [
  {
    type: 'DEALER',
    name: 'Sharma Jewellers',
    code: 'DEL001',
    contactPerson: 'Amit Sharma',
    phone: '9811111111',
    email: 'accounts@sharmajewellers.example',
    gstin: '07ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    creditPeriodDays: 30,
    creditLimit: 200000,
    openingBalance: 45000,
    openingBalanceType: 'RECEIVABLE',
    openingBalanceDate: new Date().toISOString(),
    notes: 'Sample dealer for testing orders and receivables',
  },
  {
    type: 'DEALER',
    name: 'Royal Collection',
    code: 'DEL002',
    contactPerson: 'Neha Mehta',
    phone: '9822222222',
    email: 'royal.collection@example.com',
    gstin: '27BCDEF2345G1Z6',
    pan: 'BCDEF2345G',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    creditPeriodDays: 45,
    creditLimit: 300000,
    openingBalance: 0,
    notes: 'Sample dealer with clean opening ledger',
  },
  {
    type: 'SUPPLIER',
    name: 'Shree Balaji Traders',
    code: 'SUP001',
    contactPerson: 'Rohit Sharma',
    phone: '9833333333',
    email: 'balaji.traders@example.com',
    gstin: '24CDEFG3456H1Z7',
    pan: 'CDEFG3456H',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    creditPeriodDays: 15,
    creditLimit: 150000,
    openingBalance: 25000,
    openingBalanceType: 'PAYABLE',
    openingBalanceDate: new Date().toISOString(),
    notes: 'Sample supplier for purchase and payable testing',
  },
  {
    type: 'SUPPLIER',
    name: 'Prem Metals',
    code: 'SUP002',
    contactPerson: 'Kiran Patel',
    phone: '9844444444',
    email: 'prem.metals@example.com',
    gstin: '24DEFGH4567I1Z8',
    pan: 'DEFGH4567I',
    city: 'Surat',
    state: 'Gujarat',
    country: 'India',
    creditPeriodDays: 20,
    creditLimit: 225000,
    openingBalance: 12000,
    openingBalanceType: 'PAYABLE',
    openingBalanceDate: new Date().toISOString(),
    notes: 'Sample raw material supplier',
  },
];

const emptyForm = (type: PartyType): PartyFormState => ({
  type,
  name: '',
  code: '',
  contactPerson: '',
  phone: '',
  alternatePhone: '',
  email: '',
  gstin: '',
  pan: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
  creditPeriodDays: '',
  creditLimit: '',
  openingBalance: '',
  openingBalanceType: 'RECEIVABLE',
  openingBalanceDate: new Date().toISOString().slice(0, 10),
  notes: '',
});

function numberOrUndefined(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function money(value: string | number | null | undefined) {
  const amount = Number(value || 0);
  return formatCurrency(Number.isFinite(amount) ? amount : 0);
}

function dateInputToIso(date: string) {
  if (!date) return undefined;
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

function isoToDateInput(date?: string | null) {
  return date ? date.slice(0, 10) : '';
}

function prettyDate(date?: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

function formFromParty(party: BackendParty): PartyFormState {
  return {
    type: party.type,
    name: party.name || '',
    code: party.code || '',
    contactPerson: party.contactPerson || '',
    phone: party.phone || '',
    alternatePhone: party.alternatePhone || '',
    email: party.email || '',
    gstin: party.gstin || '',
    pan: party.pan || '',
    addressLine1: party.addressLine1 || '',
    addressLine2: party.addressLine2 || '',
    city: party.city || '',
    state: party.state || '',
    country: party.country || 'India',
    postalCode: party.postalCode || '',
    creditPeriodDays: party.creditPeriodDays ? String(party.creditPeriodDays) : '',
    creditLimit: party.creditLimit ? String(party.creditLimit) : '',
    openingBalance: party.openingBalance ? String(party.openingBalance) : '',
    openingBalanceType: party.openingBalanceType || 'RECEIVABLE',
    openingBalanceDate: isoToDateInput(party.openingBalanceDate) || new Date().toISOString().slice(0, 10),
    notes: party.notes || '',
  };
}

function payloadFromForm(form: PartyFormState): CreatePartyPayload {
  const openingBalance = numberOrUndefined(form.openingBalance);
  return {
    type: form.type,
    name: form.name.trim(),
    code: form.code.trim().toUpperCase() || undefined,
    contactPerson: form.contactPerson.trim() || undefined,
    phone: form.phone.trim() || undefined,
    alternatePhone: form.alternatePhone.trim() || undefined,
    email: form.email.trim() || undefined,
    gstin: form.gstin.trim().toUpperCase() || undefined,
    pan: form.pan.trim().toUpperCase() || undefined,
    addressLine1: form.addressLine1.trim() || undefined,
    addressLine2: form.addressLine2.trim() || undefined,
    city: form.city.trim() || undefined,
    state: form.state.trim() || undefined,
    country: form.country.trim() || undefined,
    postalCode: form.postalCode.trim() || undefined,
    creditPeriodDays: numberOrUndefined(form.creditPeriodDays),
    creditLimit: numberOrUndefined(form.creditLimit),
    openingBalance,
    openingBalanceType: openingBalance && openingBalance > 0 ? form.openingBalanceType : undefined,
    openingBalanceDate: openingBalance && openingBalance > 0 ? dateInputToIso(form.openingBalanceDate) : undefined,
    notes: form.notes.trim() || undefined,
  };
}

function statusPill(active: boolean) {
  return active
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-slate-200 bg-slate-100 text-slate-600';
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}

export default function PartyManagementPage() {
  const { hasPermission } = useAuth();
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [tab, setTab] = useState<Tab>('DEALER');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [page, setPage] = useState(1);
  const [parties, setParties] = useState<BackendParty[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [dropdownCounts, setDropdownCounts] = useState({ dealers: 0, suppliers: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedParty, setSelectedParty] = useState<BackendParty | null>(null);
  const [form, setForm] = useState<PartyFormState>(emptyForm('DEALER'));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceHasExisting, setBalanceHasExisting] = useState(false);
  const [ledgerMode, setLedgerMode] = useState<LedgerMode>('statement');
  const [ledgerData, setLedgerData] = useState<PartyStatementResponse | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerFilters, setLedgerFilters] = useState({
    fromDate: '',
    toDate: '',
    includeOpeningEntry: true,
  });

  const canCreate = hasPermission('parties.create');
  const canUpdate = hasPermission('parties.update');
  const canDelete = hasPermission('parties.delete');

  const loadTenant = useCallback(async () => {
    const response = await CurrentTenantService.getCurrentTenant();
    if (response.success && response.data) {
      setTenant(response.data);
      return response.data;
    }

    toast.error(response.error?.message || 'No business tenant found for this account');
    return null;
  }, []);

  const loadDropdownCounts = useCallback(async (tenantId: string) => {
    const [dealersRes, suppliersRes] = await Promise.all([
      PartyService.dropdown(tenantId, { type: 'DEALER', isActive: true, limit: 100 }),
      PartyService.dropdown(tenantId, { type: 'SUPPLIER', isActive: true, limit: 100 }),
    ]);

    setDropdownCounts({
      dealers: dealersRes.success ? dealersRes.data.items.length : 0,
      suppliers: suppliersRes.success ? suppliersRes.data.items.length : 0,
    });
  }, []);

  const loadParties = useCallback(async () => {
    const currentTenant = tenant || await loadTenant();
    if (!currentTenant) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await PartyService.list(currentTenant.id, {
        page,
        limit: PAGE_LIMIT,
        search: search.trim() || undefined,
        type: tab,
        isActive: status === 'all' ? undefined : status === 'active',
      });

      if (response.success) {
        setParties(response.data.items);
        setPagination({
          page: response.data.pagination.page,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.totalItems,
        });
      } else {
        toast.error(response.error?.message || 'Failed to load parties');
      }

      await loadDropdownCounts(currentTenant.id);
    } catch {
      toast.error('Failed to load parties');
    } finally {
      setLoading(false);
    }
  }, [loadDropdownCounts, loadTenant, page, search, status, tab, tenant]);

  useEffect(() => {
    loadParties();
  }, [page, search, status, tab, tenant?.id]); // Re-fetch when dependencies change, but ensure loadParties uses useCallback properly

  useEffect(() => {
    setPage(1);
  }, [search, status, tab]);

  const stats = useMemo(() => {
    const active = parties.filter(party => party.isActive).length;
    const totalOpening = parties.reduce((sum, party) => sum + Number(party.openingBalance || 0), 0);
    return { active, totalOpening };
  }, [parties]);

  const openCreate = () => {
    if (!canCreate) return toast.error('You do not have permission to create parties');
    setSelectedParty(null);
    setForm(emptyForm(tab));
    setFormErrors({});
    setModalMode('create');
  };

  const openParty = async (party: BackendParty, mode: ModalMode) => {
    if (!tenant) return;
    if (mode === 'edit' && !canUpdate) return toast.error('You do not have permission to update parties');

    const response = await PartyService.getById(tenant.id, party.id);
    if (!response.success) {
      toast.error(response.error?.message || 'Failed to load party details');
      return;
    }

    setSelectedParty(response.data);
    setForm(formFromParty(response.data));
    setFormErrors({});
    setModalMode(mode);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!tenant) return toast.error('Tenant is required');
    if (!form.name.trim() || form.name.trim().length < 2) return toast.error('Party name must be at least 2 characters');

    setSaving(true);
    try {
      const duplicate = await PartyService.checkDuplicate(tenant.id, {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        code: form.code.trim().toUpperCase() || undefined,
        gstin: form.gstin.trim().toUpperCase() || undefined,
        excludePartyId: selectedParty?.id,
      });

      if (duplicate.success && duplicate.data.exists) {
        toast.error(`Duplicate party found by ${duplicate.data.duplicateBy.join(', ')}`);
        setSaving(false);
        return;
      }

      const payload = payloadFromForm(form);
      const response = selectedParty
        ? await PartyService.update(tenant.id, selectedParty.id, payload)
        : await PartyService.create(tenant.id, payload);

      if (response.success) {
        toast.success(selectedParty ? 'Party updated successfully' : 'Party created successfully');
        setModalMode(null);
        setSelectedParty(null);
        await loadParties();
      } else {
        if (response.error?.details?.fieldErrors) {
          const errors: Record<string, string> = {};
          for (const [key, messages] of Object.entries(response.error.details.fieldErrors as Record<string, string[]>)) {
            errors[key] = messages[0];
          }
          setFormErrors(errors);
          toast.error('Please correct the errors in the form');
        } else {
          toast.error(response.error?.message || 'Failed to save party');
        }
      }
    } catch {
      toast.error('Failed to save party');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (party: BackendParty) => {
    if (!tenant) return;
    if (!canUpdate) return toast.error('You do not have permission to update parties');

    const response = await PartyService.updateStatus(tenant.id, party.id, !party.isActive);
    if (response.success) {
      toast.success(response.data.isActive ? 'Party activated' : 'Party deactivated');
      await loadParties();
    } else {
      toast.error(response.error?.message || 'Failed to update party status');
    }
  };

  const deleteParty = async (party: BackendParty) => {
    if (!tenant) return;
    if (!canDelete) return toast.error('You do not have permission to delete parties');
    if (!window.confirm(`Delete ${party.name}? This will soft delete the party.`)) return;

    const response = await PartyService.delete(tenant.id, party.id);
    if (response.success) {
      toast.success('Party deleted successfully');
      await loadParties();
    } else {
      toast.error(response.error?.message || 'Failed to delete party');
    }
  };

  const seedSampleParties = async () => {
    const currentTenant = tenant || await loadTenant();
    if (!currentTenant) return;
    if (!canCreate) return toast.error('You do not have permission to create parties');

    setSeedLoading(true);
    let created = 0;
    let skipped = 0;

    try {
      for (const sample of SAMPLE_PARTIES) {
        const duplicate = await PartyService.checkDuplicate(currentTenant.id, {
          name: sample.name,
          phone: sample.phone,
          code: sample.code,
          gstin: sample.gstin,
        });

        if (duplicate.success && duplicate.data.exists) {
          skipped += 1;
          continue;
        }

        const response = await PartyService.create(currentTenant.id, sample);
        if (response.success) {
          created += 1;
        } else {
          toast.error(response.error?.message || `Failed to create ${sample.name}`);
        }
      }

      if (created || skipped) {
        toast.success(`Sample parties ready: ${created} created, ${skipped} skipped`);
      }

      await loadParties();
    } catch {
      toast.error('Failed to seed sample parties');
    } finally {
      setSeedLoading(false);
    }
  };

  const openBalance = async (party: BackendParty) => {
    if (!tenant) return;
    if (!canCreate && !canUpdate) return toast.error('You do not have permission to manage opening balances');

    const response = await PartyService.getOpeningBalance(tenant.id, party.id);
    if (!response.success) {
      toast.error(response.error?.message || 'Failed to load opening balance');
      return;
    }

    setSelectedParty(response.data.party);
    setBalanceHasExisting(response.data.hasOpeningBalance);
    setForm(formFromParty(response.data.party));
    setFormErrors({});
    setBalanceModalOpen(true);
  };

  const saveOpeningBalance = async (event: FormEvent) => {
    event.preventDefault();
    if (!tenant || !selectedParty) return;
    const openingBalance = numberOrUndefined(form.openingBalance) || 0;

    setSaving(true);
    const payload = {
      openingBalance,
      openingBalanceType: openingBalance > 0 ? form.openingBalanceType : undefined,
      openingBalanceDate: openingBalance > 0 ? dateInputToIso(form.openingBalanceDate) : undefined,
      notes: form.notes.trim() || undefined,
    };

    const response = balanceHasExisting
      ? await PartyService.updateOpeningBalance(tenant.id, selectedParty.id, payload)
      : await PartyService.createOpeningBalance(tenant.id, selectedParty.id, payload);

    setSaving(false);
    if (response.success) {
      toast.success(balanceHasExisting ? 'Opening balance updated' : 'Opening balance created');
      setBalanceModalOpen(false);
      await loadParties();
    } else {
      if (response.error?.details?.fieldErrors) {
        const errors: Record<string, string> = {};
        for (const [key, messages] of Object.entries(response.error.details.fieldErrors as Record<string, string[]>)) {
          errors[key] = messages[0];
        }
        setFormErrors(errors);
      } else {
        toast.error(response.error?.message || 'Failed to save opening balance');
      }
    }
  };

  const openLedger = async (party: BackendParty, mode: LedgerMode) => {
    if (!tenant) return;
    setSelectedParty(party);
    setLedgerMode(mode);
    setLedgerData(null);
    setLedgerLoading(true);

    const query = {
      page: 1,
      limit: 50,
      fromDate: dateInputToIso(ledgerFilters.fromDate),
      toDate: dateInputToIso(ledgerFilters.toDate),
      includeOpeningEntry: ledgerFilters.includeOpeningEntry,
    };

    const response = mode === 'statement'
      ? await PartyService.statement(tenant.id, party.id, query)
      : await PartyService.ledger(tenant.id, party.id, query);

    setLedgerLoading(false);
    if (response.success) {
      setLedgerData(response.data);
    } else {
      toast.error(response.error?.message || `Failed to load ${mode}`);
    }
  };

  const tabs = [
    { id: 'DEALER' as Tab, label: 'Dealers', icon: Building2, count: dropdownCounts.dealers },
    { id: 'SUPPLIER' as Tab, label: 'Suppliers', icon: Truck, count: dropdownCounts.suppliers },
  ];

  return (
    <DashboardLayout
      title="Party Management"
      subtitle="Tenant-scoped dealers, suppliers, balances and ledger history"
      action={
        canCreate ? (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold theme-accent-btn"
            >
              <Plus className="h-4 w-4" />
              Add {tab === 'DEALER' ? 'Dealer' : 'Supplier'}
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {loading && parties.length === 0 ? (
            <div className="col-span-1 lg:col-span-3">
              <SkeletonCard count={3} />
            </div>
          ) : (
            <>
              <div className="theme-surface-card p-4">
                <div className="flex items-center gap-3">
                  <span className="theme-icon-chip flex h-10 w-10 items-center justify-center rounded-lg">
                    <ClipboardList className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Visible Records</p>
                    <p className="text-2xl font-bold theme-text-primary">{pagination.totalItems}</p>
                  </div>
                </div>
              </div>
              <div className="theme-surface-card p-4">
                <div className="flex items-center gap-3">
                  <span className="theme-icon-chip flex h-10 w-10 items-center justify-center rounded-lg">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Active On Page</p>
                    <p className="text-2xl font-bold theme-text-primary">{stats.active}</p>
                  </div>
                </div>
              </div>
              <div className="theme-surface-card p-4">
                <div className="flex items-center gap-3">
                  <span className="theme-icon-chip flex h-10 w-10 items-center justify-center rounded-lg">
                    <BadgeIndianRupee className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Opening Balance</p>
                    <p className="text-2xl font-bold theme-text-primary">{formatCurrency(stats.totalOpening)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="theme-surface-card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1">
              {tabs.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                      tab === item.id ? 'theme-tab-active' : 'theme-tab-inactive'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs">{item.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-[240px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search name, code, phone..."
                  className="h-10 w-full pl-9 text-sm"
                />
              </div>
              <select
                value={status}
                onChange={event => setStatus(event.target.value as typeof status)}
                className="h-10 min-w-[140px] text-sm font-semibold"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="all">All Status</option>
              </select>
              <button
                onClick={loadParties}
                className="theme-secondary-btn inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {loading && parties.length === 0 ? (
            <div className="p-4">
              <SkeletonTable rows={6} cols={6} />
            </div>
          ) : parties.length === 0 ? (
            <div className="p-12 text-center">
              <div className="theme-icon-chip mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                {tab === 'DEALER' ? <Building2 className="h-7 w-7" /> : <Truck className="h-7 w-7" />}
              </div>
              <p className="text-lg font-bold theme-text-primary">No {tab === 'DEALER' ? 'dealers' : 'suppliers'} found</p>
              <p className="mt-1 text-sm text-slate-500">Create one or adjust your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="theme-table-header">
                  <tr>
                    <th className="px-4 py-3 font-bold">Party</th>
                    <th className="px-4 py-3 font-bold">Contact</th>
                    <th className="px-4 py-3 font-bold">Credit</th>
                    <th className="px-4 py-3 font-bold">Opening Balance</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parties.map(party => (
                    <tr key={party.id} className="theme-table-row">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <span className="theme-icon-chip mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg">
                            {party.type === 'DEALER' ? <Building2 className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                          </span>
                          <div>
                            <button
                              onClick={() => openParty(party, 'view')}
                              className="text-left font-bold theme-text-primary hover:underline"
                            >
                              {party.name}
                            </button>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {party.code || 'No code'} {party.gstin ? ` / GST ${party.gstin}` : ''}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3.5 w-3.5" />
                              {[party.city, party.state].filter(Boolean).join(', ') || 'Address not added'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-800">{party.contactPerson || '-'}</p>
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="h-3.5 w-3.5" />
                          {party.phone || '-'}
                        </p>
                        <p className="text-xs text-slate-500">{party.email || ''}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold theme-text-primary">{money(party.creditLimit)}</p>
                        <p className="text-xs text-slate-500">{party.creditPeriodDays || 0} days</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold theme-text-primary">{money(party.openingBalance)}</p>
                        <p className="text-xs text-slate-500">{party.openingBalanceType || '-'} / {prettyDate(party.openingBalanceDate)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusPill(party.isActive)}`}>
                          {party.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button title="View" onClick={() => openParty(party, 'view')} className="theme-secondary-btn rounded-lg p-2">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          <button title="Statement" onClick={() => openLedger(party, 'statement')} className="theme-secondary-btn rounded-lg p-2">
                            <FileText className="h-4 w-4" />
                          </button>
                          <button title="Ledger" onClick={() => openLedger(party, 'ledger')} className="theme-secondary-btn rounded-lg p-2">
                            <BookOpen className="h-4 w-4" />
                          </button>
                          {(canCreate || canUpdate) && (
                            <button title="Opening balance" onClick={() => openBalance(party)} className="theme-secondary-btn rounded-lg p-2">
                              <WalletCards className="h-4 w-4" />
                            </button>
                          )}
                          {canUpdate && (
                            <>
                              <button title="Edit" onClick={() => openParty(party, 'edit')} className="theme-secondary-btn rounded-lg p-2">
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button title="Activate or deactivate" onClick={() => toggleStatus(party)} className="theme-secondary-btn rounded-lg p-2">
                                <Power className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {canDelete && (
                            <button title="Delete" onClick={() => deleteParty(party)} className="theme-danger-btn rounded-lg p-2">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {Math.max(pagination.totalPages, 1)} / {pagination.totalItems} total
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(value => Math.max(1, value - 1))}
                className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(value => value + 1)}
                className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalMode && (
        <PartyModal
          mode={modalMode}
          form={form}
          errors={formErrors}
          setForm={setForm}
          saving={saving}
          onClose={() => setModalMode(null)}
          onSubmit={handleSubmit}
        />
      )}

      {balanceModalOpen && selectedParty && (
        <BalanceModal
          party={selectedParty}
          form={form}
          errors={formErrors}
          setForm={setForm}
          saving={saving}
          hasExisting={balanceHasExisting}
          onClose={() => setBalanceModalOpen(false)}
          onSubmit={saveOpeningBalance}
        />
      )}

      {selectedParty && (ledgerLoading || ledgerData) ? (
        <LedgerPanel
          party={selectedParty}
          mode={ledgerMode}
          data={ledgerData}
          loading={ledgerLoading}
          filters={ledgerFilters}
          setFilters={setLedgerFilters}
          onClose={() => {
            setLedgerData(null);
            setLedgerLoading(false);
          }}
          onReload={() => selectedParty && openLedger(selectedParty, ledgerMode)}
          setMode={mode => selectedParty && openLedger(selectedParty, mode)}
        />
      ) : null}
    </DashboardLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = 'text',
  required = false,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={`h-10 w-full text-sm disabled:bg-slate-100 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </label>
  );
}

function PartyModal({
  mode,
  form,
  errors,
  setForm,
  saving,
  onClose,
  onSubmit,
}: {
  mode: ModalMode;
  form: PartyFormState;
  errors: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<PartyFormState>>;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const disabled = mode === 'view';
  const title = mode === 'create' ? `Add ${form.type === 'DEALER' ? 'Dealer' : 'Supplier'}` : mode === 'edit' ? 'Edit Party' : 'Party Details';

  return (
    <Portal>
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
      <form onSubmit={onSubmit} className="theme-modal-panel flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="text-xl font-bold theme-text-primary">{title}</h2>
            <p className="text-sm text-slate-500">Core details, tax IDs, address and credit setup</p>
          </div>
          <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 overflow-y-auto p-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Party Type <span className="text-red-500">*</span></span>
            <select
              disabled={disabled}
              value={form.type}
              onChange={event => setForm(value => ({ ...value, type: event.target.value as PartyType }))}
              className={`h-10 w-full text-sm font-semibold ${errors.type ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            >
              <option value="DEALER">Dealer</option>
              <option value="SUPPLIER">Supplier</option>
            </select>
            {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type}</p>}
          </label>
          <Field label="Name" value={form.name} onChange={value => setForm(data => ({ ...data, name: value }))} disabled={disabled} required error={errors.name} />
          <Field label="Code" value={form.code} onChange={value => setForm(data => ({ ...data, code: value }))} disabled={disabled} placeholder="Auto uppercase" error={errors.code} />
          <Field label="Contact Person" value={form.contactPerson} onChange={value => setForm(data => ({ ...data, contactPerson: value }))} disabled={disabled} error={errors.contactPerson} />
          <Field label="Phone" value={form.phone} onChange={value => setForm(data => ({ ...data, phone: value }))} disabled={disabled} error={errors.phone} />
          <Field label="Alternate Phone" value={form.alternatePhone} onChange={value => setForm(data => ({ ...data, alternatePhone: value }))} disabled={disabled} error={errors.alternatePhone} />
          <Field label="Email" type="email" value={form.email} onChange={value => setForm(data => ({ ...data, email: value }))} disabled={disabled} error={errors.email} />
          <Field label="GSTIN" value={form.gstin} onChange={value => setForm(data => ({ ...data, gstin: value }))} disabled={disabled} error={errors.gstin} />
          <Field label="PAN" value={form.pan} onChange={value => setForm(data => ({ ...data, pan: value }))} disabled={disabled} error={errors.pan} />
          <Field label="Credit Period Days" type="number" value={form.creditPeriodDays} onChange={value => setForm(data => ({ ...data, creditPeriodDays: value }))} disabled={disabled} error={errors.creditPeriodDays} />
          <Field label="Credit Limit" type="number" value={form.creditLimit} onChange={value => setForm(data => ({ ...data, creditLimit: value }))} disabled={disabled} error={errors.creditLimit} />
          <Field label="Opening Balance" type="number" value={form.openingBalance} onChange={value => setForm(data => ({ ...data, openingBalance: value }))} disabled={disabled} error={errors.openingBalance} />
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Balance Type <span className="text-red-500">*</span></span>
            <select
              disabled={disabled}
              value={form.openingBalanceType}
              onChange={event => setForm(value => ({ ...value, openingBalanceType: event.target.value as OpeningBalanceType }))}
              className={`h-10 w-full text-sm font-semibold ${errors.openingBalanceType ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            >
              <option value="RECEIVABLE">Receivable</option>
              <option value="PAYABLE">Payable</option>
            </select>
            {errors.openingBalanceType && <p className="mt-1 text-xs text-red-500">{errors.openingBalanceType}</p>}
          </label>
          <Field label="Opening Balance Date" type="date" value={form.openingBalanceDate} onChange={value => setForm(data => ({ ...data, openingBalanceDate: value }))} disabled={disabled} error={errors.openingBalanceDate} />
          <Field label="Address Line 1" value={form.addressLine1} onChange={value => setForm(data => ({ ...data, addressLine1: value }))} disabled={disabled} error={errors.addressLine1} />
          <Field label="Address Line 2" value={form.addressLine2} onChange={value => setForm(data => ({ ...data, addressLine2: value }))} disabled={disabled} error={errors.addressLine2} />
          <Field label="City" value={form.city} onChange={value => setForm(data => ({ ...data, city: value }))} disabled={disabled} error={errors.city} />
          <Field label="State" value={form.state} onChange={value => setForm(data => ({ ...data, state: value }))} disabled={disabled} error={errors.state} />
          <Field label="Country" value={form.country} onChange={value => setForm(data => ({ ...data, country: value }))} disabled={disabled} error={errors.country} />
          <Field label="Postal Code" value={form.postalCode} onChange={value => setForm(data => ({ ...data, postalCode: value }))} disabled={disabled} error={errors.postalCode} />
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes</span>
            <textarea
              value={form.notes}
              onChange={event => setForm(data => ({ ...data, notes: event.target.value }))}
              disabled={disabled}
              rows={3}
              className={`w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[var(--color-accent)] disabled:bg-slate-100 ${errors.notes ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            />
            {errors.notes && <p className="mt-1 text-xs text-red-500">{errors.notes}</p>}
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg px-4 py-2 text-sm font-semibold">
            {mode === 'view' ? 'Close' : 'Cancel'}
          </button>
          {mode !== 'view' && (
            <button disabled={saving} className="theme-accent-btn inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Party
            </button>
          )}
        </div>
      </form>
    </div>
    </Portal>
  );
}

function BalanceModal({
  party,
  form,
  errors,
  setForm,
  saving,
  hasExisting,
  onClose,
  onSubmit,
}: {
  party: BackendParty;
  form: PartyFormState;
  errors: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<PartyFormState>>;
  saving: boolean;
  hasExisting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Portal>
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
      <form onSubmit={onSubmit} className="theme-modal-panel w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="text-xl font-bold theme-text-primary">Opening Balance</h2>
            <p className="text-sm text-slate-500">{party.name} / {hasExisting ? 'Update existing entry' : 'Create first entry'}</p>
          </div>
          <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg p-2">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-4 p-4">
          <Field label="Amount" type="number" value={form.openingBalance} onChange={value => setForm(data => ({ ...data, openingBalance: value }))} error={errors.openingBalance} />
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Type <span className="text-red-500">*</span></span>
            <select
              value={form.openingBalanceType}
              onChange={event => setForm(value => ({ ...value, openingBalanceType: event.target.value as OpeningBalanceType }))}
              className={`h-10 w-full text-sm font-semibold ${errors.openingBalanceType ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            >
              <option value="RECEIVABLE">Receivable</option>
              <option value="PAYABLE">Payable</option>
            </select>
            {errors.openingBalanceType && <p className="mt-1 text-xs text-red-500">{errors.openingBalanceType}</p>}
          </label>
          <Field label="Date" type="date" value={form.openingBalanceDate} onChange={value => setForm(data => ({ ...data, openingBalanceDate: value }))} error={errors.openingBalanceDate} />
          <Field label="Notes" value={form.notes} onChange={value => setForm(data => ({ ...data, notes: value }))} error={errors.notes} />
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
          <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg px-4 py-2 text-sm font-semibold">Cancel</button>
          <button disabled={saving} className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {hasExisting ? 'Update Balance' : 'Create Balance'}
          </button>
        </div>
      </form>
    </div>
    </Portal>
  );
}

function LedgerPanel({
  party,
  mode,
  data,
  loading,
  filters,
  setFilters,
  onClose,
  onReload,
  setMode,
}: {
  party: BackendParty | null;
  mode: LedgerMode;
  data: PartyStatementResponse | null;
  loading: boolean;
  filters: { fromDate: string; toDate: string; includeOpeningEntry: boolean };
  setFilters: React.Dispatch<React.SetStateAction<{ fromDate: string; toDate: string; includeOpeningEntry: boolean }>>;
  onClose: () => void;
  onReload: () => void;
  setMode: (mode: LedgerMode) => void;
}) {
  if (!party) return null;

  return (
    <Portal>
    <div className="fixed inset-y-0 right-0 z-[100] flex w-full max-w-3xl flex-col border-l border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <div>
          <h2 className="text-xl font-bold theme-text-primary">{party.name}</h2>
          <p className="text-sm text-slate-500">{mode === 'statement' ? 'Party statement' : 'Ledger history'}</p>
        </div>
        <button onClick={onClose} className="theme-secondary-btn rounded-lg p-2">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_1fr_auto_auto]">
        <Field label="From" type="date" value={filters.fromDate} onChange={value => setFilters(data => ({ ...data, fromDate: value }))} />
        <Field label="To" type="date" value={filters.toDate} onChange={value => setFilters(data => ({ ...data, toDate: value }))} />
        <label className="flex items-end gap-2 pb-2 text-sm font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={filters.includeOpeningEntry}
            onChange={event => setFilters(data => ({ ...data, includeOpeningEntry: event.target.checked }))}
          />
          Opening
        </label>
        <button onClick={onReload} className="theme-accent-btn mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold">
          <RefreshCw className="h-4 w-4" />
          Apply
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200 p-4">
        <button onClick={() => setMode('statement')} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'statement' ? 'theme-tab-active' : 'theme-secondary-btn'}`}>
          Statement
        </button>
        <button onClick={() => setMode('ledger')} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'ledger' ? 'theme-tab-active' : 'theme-secondary-btn'}`}>
          Ledger
        </button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading {mode}
        </div>
      ) : data ? (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ['Before', data.summary.balanceBeforePeriod],
              ['Debit', data.summary.totalDebit],
              ['Credit', data.summary.totalCredit],
              ['Closing', data.summary.closingBalance],
            ].map(([label, value]) => (
              <div key={label} className="theme-surface-muted rounded-xl border p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="text-lg font-bold theme-text-primary">{money(value)}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="theme-table-header">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Debit</th>
                  <th className="px-3 py-2">Credit</th>
                  <th className="px-3 py-2">Balance</th>
                  <th className="px-3 py-2">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500">No ledger entries found</td>
                  </tr>
                ) : data.entries.map(entry => (
                  <tr key={entry.id} className="theme-table-row">
                    <td className="px-3 py-3">{prettyDate(entry.entryDate)}</td>
                    <td className="px-3 py-3 font-semibold">{entry.entryType.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-3">{money(entry.debitAmount)}</td>
                    <td className="px-3 py-3">{money(entry.creditAmount)}</td>
                    <td className="px-3 py-3 font-bold theme-text-primary">{money(entry.runningBalance)}</td>
                    <td className="px-3 py-3 text-slate-500">{entry.referenceNo || entry.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-500">
          <div>
            <Activity className="mx-auto mb-3 h-8 w-8" />
            <p className="font-semibold">No ledger data loaded</p>
            <button onClick={onReload} className="theme-accent-btn mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold">
              Load Now
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
    </Portal>
  );
}
