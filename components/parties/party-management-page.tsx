'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
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
  Trash2,
  Truck,
  WalletCards,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';

import { PartyService } from '@/lib/services/party.service';
import { CurrentOwnerService } from '@/lib/services/current-owner.service';
import { SearchInput } from '@/components/shared/search-input';
import { confirmAction } from '@/components/shared/confirm-action';

import { AdvancedDataTable } from '@/components/shared/DataTable';
import { PremiumSelect } from '@/components/ui/PremiumSelect';
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

export type PartyManagementPageProps = {
  initialTab?: Tab;
  fixedTab?: Tab;
  title?: string;
  subtitle?: string;
};

const PAGE_LIMIT = 100;
const LEDGER_SUMMARY_DEFAULT = {
  balanceBeforePeriod: 0,
  totalDebit: 0,
  totalCredit: 0,
  closingBalance: 0,
  balanceNature: 'RECEIVABLE' as OpeningBalanceType,
};

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

function generatePartyCode(type: PartyType, parties: BackendParty[], fallbackCount: number) {
  const prefix = type === 'DEALER' ? 'DEL' : 'SUP';
  const maxExisting = parties
    .filter(party => (party.type || party.partyType) === type)
    .map(party => {
      const match = String(party.code || '').match(new RegExp(`^${prefix}(\\d+)$`, 'i'));
      return match ? Number(match[1]) : 0;
    })
    .reduce((max, value) => Math.max(max, value), 0);
  return `${prefix}${String(Math.max(maxExisting, fallbackCount) + 1).padStart(3, '0')}`;
}

function formFromParty(party: BackendParty): PartyFormState {
  return {
    type: party.type || party.partyType || 'DEALER',
    name: party.name || '',
    code: party.code || '',
    contactPerson: party.contactPerson || '',
    phone: party.phone || '',
    alternatePhone: party.alternatePhone || '',
    email: party.email || '',
    gstin: party.gstin || '',
    pan: party.pan || '',
    addressLine1: party.addressLine1 || party.address || '',
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
    partyType: form.type,
    name: form.name.trim(),
    code: form.code.trim().toUpperCase(),
    contactPerson: form.contactPerson.trim() || undefined,
    phone: form.phone.trim() || undefined,
    alternatePhone: form.alternatePhone.trim() || undefined,
    email: form.email.trim() || undefined,
    gstin: form.gstin.trim().toUpperCase() || undefined,
    pan: form.pan.trim().toUpperCase() || undefined,
    address: [form.addressLine1.trim(), form.addressLine2.trim()].filter(Boolean).join(', ') || undefined,
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

export function PartyManagementPage({
  initialTab = 'DEALER',
  fixedTab,
  title,
  subtitle,
}: PartyManagementPageProps) {
  const { hasPermission } = useAuth();
  const resolvedInitialTab = fixedTab ?? initialTab;
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [tab, setTab] = useState<Tab>(resolvedInitialTab);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [parties, setParties] = useState<BackendParty[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [dropdownCounts, setDropdownCounts] = useState({ dealers: 0, suppliers: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedParty, setSelectedParty] = useState<BackendParty | null>(null);
  const [form, setForm] = useState<PartyFormState>(emptyForm(resolvedInitialTab));
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

  const permissionModule = tab === 'DEALER' ? 'dealer_management' : 'supplier_management';
  const canCreate = hasPermission(`${permissionModule}.create`);
  const canUpdate = hasPermission(`${permissionModule}.update`);
  const canDelete = hasPermission(`${permissionModule}.delete`);

  const loadTenant = useCallback(async () => {
    const response = await CurrentOwnerService.getCurrentOwner();
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
  }, [loadDropdownCounts, loadTenant, page, search, tab, tenant]);

  const pathname = usePathname();

  useEffect(() => {
    loadParties();
  }, [page, search, tab, tenant?.id, pathname]);

  useEffect(() => {
    setPage(1);
  }, [search, tab]);

  useEffect(() => {
    if (fixedTab && tab !== fixedTab) {
      setTab(fixedTab);
      setForm(emptyForm(fixedTab));
    }
  }, [fixedTab, tab]);

  const openCreate = () => {
    if (!canCreate) return toast.error('You do not have permission to create parties');
    const type = fixedTab ?? tab;
    setSelectedParty(null);
    setForm({ ...emptyForm(type), code: generatePartyCode(type, parties, dropdownCounts[type === 'DEALER' ? 'dealers' : 'suppliers']) });
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
    if (!selectedParty && !form.code.trim()) return toast.error('Party code is required');
    if (Number(form.openingBalance || 0) > 0 && !form.openingBalanceType) return toast.error('Opening balance type is required');

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

      const payload = payloadFromForm({ ...form, type: fixedTab ?? form.type });
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

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!tenant) return;
    if (!canUpdate) throw new Error('You do not have permission to update parties');

    const isActive = newStatus.toUpperCase() === 'ACTIVE';
    const response = await PartyService.updateStatus(tenant.id, id, isActive);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update party status');
    }
    await loadParties();
  };

  const deleteParty = async (party: BackendParty) => {
    if (!tenant) return;
    if (!canDelete) return toast.error('You do not have permission to delete parties');
    if (!(await confirmAction(`Are you sure you want to delete "${party.name}"?`))) return;

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

  const tabs = useMemo(() => {
    const allTabs = [
      { id: 'DEALER' as Tab, label: 'Dealers', icon: Building2, count: dropdownCounts.dealers },
      { id: 'SUPPLIER' as Tab, label: 'Suppliers', icon: Truck, count: dropdownCounts.suppliers },
    ];
    return fixedTab ? allTabs.filter(item => item.id === fixedTab) : allTabs;
  }, [dropdownCounts.dealers, dropdownCounts.suppliers, fixedTab]);

  return (
    <DashboardLayout
      title={title || 'Party Management'}
      subtitle={subtitle || 'Tenant-scoped dealers, suppliers, balances and ledger history'}
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
        <div className="theme-surface-card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1">
              {tabs.map(item => {
                const Icon = item.icon;
                const isLocked = Boolean(fixedTab);
                return (
                  <button
                    key={item.id}
                    onClick={() => (!isLocked ? setTab(item.id) : undefined)}
                    disabled={isLocked}
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

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <SearchInput
                containerClassName="h-14 min-w-[280px]"
                inputClassName="text-base"
                placeholder="Search name, code, phone..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
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
            <AdvancedDataTable
              data={parties}
              searchable={false}
              emptyIcon={tab === 'DEALER' ? <Building2 className="h-7 w-7" /> : <Truck className="h-7 w-7" />}
              emptyTitle={`No ${tab === 'DEALER' ? 'dealers' : 'suppliers'} found`}
              onStatusChange={handleStatusChange}
              columns={[
                {
                  field: 'party',
                  header: 'Party',
                  sortable: true,
                  filterable: true,
                  filterType: 'text',
                  getValue: party => `${party.name || ''} ${party.code || ''} ${party.gstin || ''}`,
                  render: party => (
                    <div className="flex items-start gap-3">
                      <span className="theme-icon-chip mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg">
                        {party.type === 'DEALER' ? <Building2 className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                      </span>
                      <div>
                        <button onClick={() => openParty(party, 'view')} className="text-left font-bold theme-text-primary hover:underline">
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
                  ),
                },
                {
                  field: 'contact',
                  header: 'Contact',
                  sortable: true,
                  filterable: true,
                  filterType: 'text',
                  getValue: party => `${party.contactPerson || ''} ${party.phone || ''} ${party.email || ''}`,
                  render: party => (
                    <div>
                      <p className="font-semibold text-slate-800">{party.contactPerson || '-'}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-500"><Phone className="h-3.5 w-3.5" />{party.phone || '-'}</p>
                      <p className="text-xs text-slate-500">{party.email || ''}</p>
                    </div>
                  ),
                },
                {
                  field: 'creditLimit',
                  header: 'Credit',
                  sortable: true,
                  filterable: true,
                  filterType: 'number',
                  getValue: party => Number(party.creditLimit || 0),
                  render: party => <div><p className="font-bold theme-text-primary">{money(party.creditLimit)}</p><p className="text-xs text-slate-500">{party.creditPeriodDays || 0} days</p></div>,
                },
                {
                  field: 'openingBalance',
                  header: 'Opening Balance',
                  sortable: true,
                  filterable: true,
                  filterType: 'number',
                  getValue: party => Number(party.openingBalance || 0),
                  render: party => <div><p className="font-bold theme-text-primary">{money(party.openingBalance)}</p><p className="text-xs text-slate-500">{party.openingBalanceType || '-'}</p></div>,
                },
                {
                  field: 'isActive',
                  header: 'Status',
                  sortable: true,
                  filterable: true,
                  filterType: 'boolean',
                  getValue: party => Boolean(party.isActive),
                },
                {
                  field: 'actions',
                  header: 'Actions',
                  render: party => (
                    <div className="flex flex-wrap justify-end gap-2">
                      <button title="View" onClick={() => openParty(party, 'view')} className="theme-secondary-btn rounded-lg p-2"><MoreHorizontal className="h-4 w-4" /></button>
                      <button title="Statement" onClick={() => openLedger(party, 'statement')} className="theme-secondary-btn rounded-lg p-2"><FileText className="h-4 w-4" /></button>
                      <button title="Ledger" onClick={() => openLedger(party, 'ledger')} className="theme-secondary-btn rounded-lg p-2"><BookOpen className="h-4 w-4" /></button>
                      {(canCreate || canUpdate) && <button title="Opening balance" onClick={() => openBalance(party)} className="theme-secondary-btn rounded-lg p-2"><WalletCards className="h-4 w-4" /></button>}
                      {canUpdate && <button title="Edit" onClick={() => openParty(party, 'edit')} className="theme-secondary-btn rounded-lg p-2"><Edit3 className="h-4 w-4" /></button>}
                      {canDelete && party.isActive && <button title="Deactivate" onClick={() => deleteParty(party)} className="theme-danger-btn rounded-lg p-2"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>
      </div>

      {modalMode && (
        <PartyModal
          mode={modalMode}
          lockedType={fixedTab}
          form={form}
          errors={formErrors}
          setForm={setForm}
          codeForType={(type) => generatePartyCode(type, parties, dropdownCounts[type === 'DEALER' ? 'dealers' : 'suppliers'])}
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
  lockedType,
  form,
  errors,
  setForm,
  codeForType,
  saving,
  onClose,
  onSubmit,
}: {
  mode: ModalMode;
  lockedType?: PartyType;
  form: PartyFormState;
  errors: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<PartyFormState>>;
  codeForType: (type: PartyType) => string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const disabled = mode === 'view';
  const lockedValue = lockedType || form.type;
  const title = mode === 'create' ? `Add ${form.type === 'DEALER' ? 'Dealer' : 'Supplier'}` : mode === 'edit' ? 'Edit Party' : 'Party Details';

  return (
    <Portal>
    <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
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
            <PremiumSelect
              disabled={disabled || Boolean(lockedType)}
              value={lockedValue}
              onChange={(event: any) => {
                if (lockedType) return;
                const nextType = event.target.value as PartyType;
                setForm(value => ({
                  ...value,
                  type: nextType,
                  code: codeForType(nextType),
                }));
              }}
              className={`h-10 w-full text-sm font-semibold disabled:bg-slate-100 ${errors.type ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            >
              <option value="DEALER">Dealer (Customer)</option>
              <option value="SUPPLIER">Supplier (Vendor)</option>
            </PremiumSelect>
            {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type}</p>}
          </label>

          <Field label="Party Name" value={form.name} onChange={(value) => setForm(current => ({ ...current, name: value }))} required error={errors.name} />
          <Field label="Party Code" value={form.code} disabled={disabled || mode !== 'create'} onChange={(value) => setForm(current => ({ ...current, code: value.toUpperCase() }))} required={mode === 'create'} error={errors.code} />
          <Field label="Contact Person" value={form.contactPerson} onChange={(value) => setForm(current => ({ ...current, contactPerson: value }))} error={errors.contactPerson} />
          <Field label="Phone" value={form.phone} onChange={(value) => setForm(current => ({ ...current, phone: value }))} error={errors.phone} />
          <Field label="Alternate Phone" value={form.alternatePhone} onChange={(value) => setForm(current => ({ ...current, alternatePhone: value }))} error={errors.alternatePhone} />
          <Field label="Email" type="email" value={form.email} onChange={(value) => setForm(current => ({ ...current, email: value }))} error={errors.email} />
          <Field label="GSTIN" value={form.gstin} onChange={(value) => setForm(current => ({ ...current, gstin: value }))} error={errors.gstin} />
          <Field label="PAN" value={form.pan} onChange={(value) => setForm(current => ({ ...current, pan: value }))} error={errors.pan} />
          <Field label="Address Line 1" value={form.addressLine1} onChange={(value) => setForm(current => ({ ...current, addressLine1: value }))} error={errors.addressLine1} />
          <Field label="Address Line 2" value={form.addressLine2} onChange={(value) => setForm(current => ({ ...current, addressLine2: value }))} error={errors.addressLine2} />
          <Field label="City" value={form.city} onChange={(value) => setForm(current => ({ ...current, city: value }))} error={errors.city} />
          <Field label="State" value={form.state} onChange={(value) => setForm(current => ({ ...current, state: value }))} error={errors.state} />
          <Field label="Country" value={form.country} onChange={(value) => setForm(current => ({ ...current, country: value }))} error={errors.country} />
          <Field label="Postal Code" value={form.postalCode} onChange={(value) => setForm(current => ({ ...current, postalCode: value }))} error={errors.postalCode} />
          <Field label="Credit Period (days)" type="number" value={form.creditPeriodDays} onChange={(value) => setForm(current => ({ ...current, creditPeriodDays: value }))} error={errors.creditPeriodDays} />
          <Field label="Credit Limit" type="number" value={form.creditLimit} onChange={(value) => setForm(current => ({ ...current, creditLimit: value }))} error={errors.creditLimit} />
          <Field label="Opening Balance" type="number" value={form.openingBalance} onChange={(value) => setForm(current => ({ ...current, openingBalance: value }))} error={errors.openingBalance} />
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Opening Balance Type</span>
            <PremiumSelect
              disabled={disabled}
              value={form.openingBalanceType}
              onChange={(event: any) => setForm(current => ({ ...current, openingBalanceType: event.target.value as OpeningBalanceType }))}
              className="h-10 w-full text-sm font-semibold"
            >
              <option value="RECEIVABLE">Receivable</option>
              <option value="PAYABLE">Payable</option>
            </PremiumSelect>
          </label>
          <Field label="Opening Balance Date" type="date" value={form.openingBalanceDate} onChange={(value) => setForm(current => ({ ...current, openingBalanceDate: value }))} />
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes</span>
            <textarea
              disabled={disabled}
              value={form.notes}
              onChange={(event) => setForm(current => ({ ...current, notes: event.target.value }))}
              rows={3}
              className="w-full text-sm"
            />
          </label>
        </div>

        {mode !== 'view' && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 p-4">
            <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg px-4 py-2 text-sm font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Party
            </button>
          </div>
        )}
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
    <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
      <form onSubmit={onSubmit} className="theme-modal-panel flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="text-xl font-bold theme-text-primary">Opening Balance for {party.name}</h2>
            <p className="text-sm text-slate-500">Set the starting balance and type for this account.</p>
          </div>
          <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2">
          <Field label="Opening Balance" type="number" value={form.openingBalance} onChange={(value) => setForm(current => ({ ...current, openingBalance: value }))} error={errors.openingBalance} />
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Opening Balance Type</span>
            <PremiumSelect
              value={form.openingBalanceType}
              onChange={(event: any) => setForm(current => ({ ...current, openingBalanceType: event.target.value as OpeningBalanceType }))}
              className="h-10 w-full text-sm font-semibold"
            >
              <option value="RECEIVABLE">Receivable</option>
              <option value="PAYABLE">Payable</option>
            </PremiumSelect>
          </label>
          <Field label="Opening Balance Date" type="date" value={form.openingBalanceDate} onChange={(value) => setForm(current => ({ ...current, openingBalanceDate: value }))} />
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm(current => ({ ...current, notes: event.target.value }))}
              rows={3}
              className="w-full text-sm"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 p-4">
          <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg px-4 py-2 text-sm font-semibold">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {hasExisting ? 'Update Balance' : 'Save Balance'}
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
  party: BackendParty;
  mode: LedgerMode;
  data: PartyStatementResponse | null;
  loading: boolean;
  filters: {
    fromDate: string;
    toDate: string;
    includeOpeningEntry: boolean;
  };
  setFilters: React.Dispatch<React.SetStateAction<{ fromDate: string; toDate: string; includeOpeningEntry: boolean }>>;
  onClose: () => void;
  onReload: () => void;
  setMode: (mode: LedgerMode) => void;
}) {
  const summary = data?.summary || LEDGER_SUMMARY_DEFAULT;
  const entries = data?.entries || [];

  return (
    <Portal>
    <div className="fixed inset-0 z-[120] flex justify-end bg-slate-950/45">
      <div className="theme-modal-panel flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-none sm:rounded-l-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h2 className="text-xl font-bold theme-text-primary">{party.name}</h2>
            <p className="text-sm text-slate-500">{mode === 'statement' ? 'Party statement' : 'Ledger'} overview</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMode(mode === 'statement' ? 'ledger' : 'statement')}
              className="theme-secondary-btn rounded-lg px-3 py-2 text-sm font-semibold"
            >
              Switch to {mode === 'statement' ? 'Ledger' : 'Statement'}
            </button>
            <button type="button" onClick={onReload} className="theme-secondary-btn rounded-lg px-3 py-2 text-sm font-semibold">
              Refresh
            </button>
            <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg p-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-200 p-4 md:grid-cols-3">
          <Field label="From" type="date" value={filters.fromDate} onChange={(value) => setFilters(current => ({ ...current, fromDate: value }))} />
          <Field label="To" type="date" value={filters.toDate} onChange={(value) => setFilters(current => ({ ...current, toDate: value }))} />
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={filters.includeOpeningEntry}
              onChange={(event) => setFilters(current => ({ ...current, includeOpeningEntry: event.target.checked }))}
            />
            Include opening balance
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <SkeletonTable rows={6} cols={6} />
          ) : !data ? (
            <div className="p-10 text-center text-sm text-slate-500">No ledger data found.</div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="theme-surface-card p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Opening Balance</p>
                  <p className="text-xl font-bold theme-text-primary">{money(summary.balanceBeforePeriod)}</p>
                </div>
                <div className="theme-surface-card p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total Debit</p>
                  <p className="text-xl font-bold theme-text-primary">{money(summary.totalDebit)}</p>
                </div>
                <div className="theme-surface-card p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total Credit</p>
                  <p className="text-xl font-bold theme-text-primary">{money(summary.totalCredit)}</p>
                </div>
              </div>

              <AdvancedDataTable
                data={entries as any[]}
                searchable={false}
                emptyIcon={<BookOpen className="h-6 w-6 text-slate-400" />}
                emptyTitle="No ledger entries found"
                columns={[
                  {
                    field: 'entryDate',
                    header: 'Date',
                    sortable: true,
                    filterable: true,
                    filterType: 'date',
                    getValue: entry => entry.entryDate,
                    render: entry => <span className="text-slate-600">{prettyDate(entry.entryDate)}</span>,
                  },
                  {
                    field: 'description',
                    header: 'Description',
                    sortable: true,
                    filterable: true,
                    filterType: 'text',
                    getValue: entry => `${entry.description || ''} ${entry.entryType || ''} ${entry.referenceNo || ''}`,
                    render: entry => (
                      <div>
                        <p className="font-semibold text-slate-700">{entry.description || '-'}</p>
                        <p className="text-xs text-slate-500">{entry.entryType || entry.voucherType || '-'}</p>
                      </div>
                    ),
                  },
                  {
                    field: 'debitAmount',
                    header: 'Debit',
                    sortable: true,
                    filterable: true,
                    filterType: 'number',
                    getValue: entry => Number(entry.debitAmount || 0),
                    render: entry => <span>{money(entry.debitAmount)}</span>,
                  },
                  {
                    field: 'creditAmount',
                    header: 'Credit',
                    sortable: true,
                    filterable: true,
                    filterType: 'number',
                    getValue: entry => Number(entry.creditAmount || 0),
                    render: entry => <span>{money(entry.creditAmount)}</span>,
                  },
                  {
                    field: 'runningBalance',
                    header: 'Balance',
                    sortable: true,
                    filterable: true,
                    filterType: 'number',
                    getValue: entry => Number(entry.runningBalance || 0),
                    render: entry => <span className="font-bold text-slate-700">{money(entry.runningBalance)}</span>,
                  },
                ]}
              />
            </div>
          )}
        </div>
      </div>
    </div>
    </Portal>
  );
}
