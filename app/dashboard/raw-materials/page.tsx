'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { SkeletonTable, SkeletonCard } from '@/components/skeleton/Skeletons';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  AlertTriangle,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Database,
  Edit3,
  FileText,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import { PartyService } from '@/lib/services/party.service';
import { RawMaterialService } from '@/lib/services/raw-material.service';
import { CurrentTenantService } from '@/lib/services/current-tenant.service';
import {
  BackendTenant,
  CreateRawMaterialPurchasePayload,
  CreateRawMaterialTypePayload,
  PartyDropdownItem,
  RawMaterialIssuance,
  RawMaterialPurchase,
  RawMaterialPurchaseStatus,
  RawMaterialStockSummary,
  RawMaterialType,
  RawMaterialUnit,
  UpdateRawMaterialPurchasePayload,
} from '@/lib/types';

type Tab = 'stock' | 'types' | 'purchases' | 'issuances';
type TypeModalMode = 'create' | 'edit';
type PurchaseModalMode = 'create' | 'edit';

type TypeForm = {
  name: string;
  unit: RawMaterialUnit;
  description: string;
  isActive: boolean;
  openingStock: string;
  costPerUnit?: string;
  supplierId?: string;
};

type PurchaseForm = {
  materialTypeId: string;
  supplierId: string;
  quantity: string;
  costPerUnit: string;
  purchaseDate: string;
  status: RawMaterialPurchaseStatus;
  invoiceNumber: string;
  notes: string;
};

const PAGE_LIMIT = 12;
const UNITS: RawMaterialUnit[] = ['KG', 'GRAM', 'PIECE', 'METER', 'DOZEN'];
const PURCHASE_STATUSES: RawMaterialPurchaseStatus[] = ['PENDING', 'RECEIVED', 'CANCELLED'];

const SAMPLE_TYPES: CreateRawMaterialTypePayload[] = [
  { name: 'Gold Plated Base', unit: 'KG', description: 'Base layer material for jewellery plating' },
  { name: 'Rhodium Polish', unit: 'GRAM', description: 'Finishing polish used during final process' },
  { name: 'Stone Setting Wire', unit: 'METER', description: 'Wire used in stone setting assignments' },
];

const emptyTypeForm: TypeForm = {
  name: '',
  unit: 'KG',
  description: '',
  isActive: true,
  openingStock: '',
  costPerUnit: '',
  supplierId: '',
};

const emptyPurchaseForm = (): PurchaseForm => ({
  materialTypeId: '',
  supplierId: '',
  quantity: '',
  costPerUnit: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  status: 'RECEIVED',
  invoiceNumber: '',
  notes: '',
});

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}

function numberOrUndefined(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function money(value: string | number | null | undefined) {
  const amount = Number(value || 0);
  return formatCurrency(Number.isFinite(amount) ? amount : 0);
}

function prettyDate(date?: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

function dateInputToIso(date: string) {
  if (!date) return undefined;
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

function typeFormFromMaterial(material: RawMaterialType): TypeForm {
  return {
    name: material.name,
    unit: material.unit,
    description: material.description || '',
    isActive: material.isActive,
    openingStock: material.currentStock || '',
  };
}

function purchaseFormFromPurchase(purchase: RawMaterialPurchase): PurchaseForm {
  return {
    materialTypeId: purchase.materialTypeId,
    supplierId: purchase.supplierId,
    quantity: String(purchase.quantity || ''),
    costPerUnit: String(purchase.costPerUnit || ''),
    purchaseDate: purchase.purchaseDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    status: purchase.status,
    invoiceNumber: purchase.invoiceNumber || '',
    notes: purchase.notes || '',
  };
}

function statusPill(status: RawMaterialPurchaseStatus) {
  if (status === 'RECEIVED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'PENDING') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-100 text-slate-600';
}

export default function RawMaterialsPage() {
  const { hasPermission } = useAuth();
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [tab, setTab] = useState<Tab>('stock');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [purchaseStatus, setPurchaseStatus] = useState<'all' | RawMaterialPurchaseStatus>('all');
  const [page, setPage] = useState(1);
  const [types, setTypes] = useState<RawMaterialType[]>([]);
  const [stock, setStock] = useState<RawMaterialStockSummary[]>([]);
  const [purchases, setPurchases] = useState<RawMaterialPurchase[]>([]);
  const [issuances, setIssuances] = useState<RawMaterialIssuance[]>([]);
  const [suppliers, setSuppliers] = useState<PartyDropdownItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [checkingApis, setCheckingApis] = useState(false);
  const [typeModalMode, setTypeModalMode] = useState<TypeModalMode | null>(null);
  const [purchaseModalMode, setPurchaseModalMode] = useState<PurchaseModalMode | null>(null);
  const [selectedType, setSelectedType] = useState<RawMaterialType | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<RawMaterialPurchase | null>(null);
  const [typeForm, setTypeForm] = useState<TypeForm>(emptyTypeForm);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseForm>(emptyPurchaseForm());
  const [typeFormErrors, setTypeFormErrors] = useState<Record<string, string>>({});
  const [purchaseFormErrors, setPurchaseFormErrors] = useState<Record<string, string>>({});

  const canCreate = hasPermission('raw-materials.create');
  const canUpdate = hasPermission('raw-materials.update');
  const canDelete = hasPermission('raw-materials.delete');

  const loadTenant = useCallback(async () => {
    const response = await CurrentTenantService.getCurrentTenant();
    if (response.success && response.data) {
      setTenant(response.data);
      return response.data;
    }

    toast.error(response.error?.message || 'No business tenant found for this account');
    return null;
  }, []);

  const loadReferenceData = useCallback(async (tenantId: string) => {
    const [typesRes, suppliersRes, stockRes] = await Promise.all([
      RawMaterialService.listTypes(tenantId, { page: 1, limit: 100, isActive: true }),
      PartyService.dropdown(tenantId, { type: 'SUPPLIER', isActive: true, limit: 100 }),
      RawMaterialService.stock(tenantId),
    ]);

    if (typesRes.success) setTypes(typesRes.data.items);
    if (suppliersRes.success) setSuppliers(suppliersRes.data.items);
    if (stockRes.success) setStock(stockRes.data || []);
  }, []);

  const loadData = useCallback(async () => {
    const currentTenant = tenant || await loadTenant();
    if (!currentTenant) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await loadReferenceData(currentTenant.id);

      if (tab === 'types') {
        const response = await RawMaterialService.listTypes(currentTenant.id, {
          page,
          limit: PAGE_LIMIT,
          search: search.trim() || undefined,
          isActive: status === 'all' ? undefined : status === 'active',
        });
        if (response.success) {
          setTypes(response.data.items);
          setPagination({
            page: response.data.pagination.page,
            totalPages: response.data.pagination.totalPages,
            totalItems: response.data.pagination.totalItems,
          });
        } else {
          toast.error(response.error?.message || 'Failed to load raw material types');
        }
      }

      if (tab === 'purchases') {
        const response = await RawMaterialService.listPurchases(currentTenant.id, {
          page,
          limit: PAGE_LIMIT,
          status: purchaseStatus === 'all' ? undefined : purchaseStatus,
        });
        if (response.success) {
          setPurchases(response.data.items);
          setPagination({
            page: response.data.pagination.page,
            totalPages: response.data.pagination.totalPages,
            totalItems: response.data.pagination.totalItems,
          });
        } else {
          toast.error(response.error?.message || 'Failed to load purchases');
        }
      }

      if (tab === 'issuances') {
        const response = await RawMaterialService.listIssuances(currentTenant.id, {
          page,
          limit: PAGE_LIMIT,
        });
        if (response.success) {
          setIssuances(response.data.items);
          setPagination({
            page: response.data.pagination.page,
            totalPages: response.data.pagination.totalPages,
            totalItems: response.data.pagination.totalItems,
          });
        } else {
          toast.error(response.error?.message || 'Failed to load issuances');
        }
      }
    } catch {
      toast.error('Failed to load raw material data');
    } finally {
      setLoading(false);
    }
  }, [loadReferenceData, loadTenant, page, purchaseStatus, search, status, tab, tenant]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, status, purchaseStatus]);

  const stockStats = useMemo(() => {
    const current = stock.reduce((sum, item) => sum + Number(item.currentStock || 0), 0);
    const purchased = stock.reduce((sum, item) => sum + Number(item.totalPurchased || 0), 0);
    const issued = stock.reduce((sum, item) => sum + Number(item.totalIssued || 0), 0);
    const low = stock.filter(item => item.isLow).length;
    return { current, purchased, issued, low };
  }, [stock]);

  const openTypeModal = async (material?: RawMaterialType) => {
    if (material && !canUpdate) return toast.error('You do not have permission to update material types');
    if (!material && !canCreate) return toast.error('You do not have permission to create material types');
    const currentTenant = tenant || await loadTenant();
    if (!currentTenant) return;

    await loadReferenceData(currentTenant.id);

    setSelectedType(material || null);
    setTypeForm(material ? typeFormFromMaterial(material) : emptyTypeForm);
    setTypeFormErrors({});
    setTypeModalMode(material ? 'edit' : 'create');
  };

  const saveType = async (event: FormEvent) => {
    event.preventDefault();
    const currentTenant = tenant || await loadTenant();
    if (!typeForm.name.trim() || typeForm.name.trim().length < 2) return toast.error('Material name must be at least 2 characters');

    if (!selectedType && Number(typeForm.openingStock) > 0) {
      if (!typeForm.supplierId) return toast.error('Supplier is required by the database to log initial stock');
      if (!typeForm.costPerUnit || Number(typeForm.costPerUnit) <= 0) return toast.error('Cost per unit is required by the database to log initial stock');
    }

    setSaving(true);
    try {
      const payload = {
        name: typeForm.name.trim(),
        unit: typeForm.unit,
        description: typeForm.description.trim() || undefined,
        openingStock: typeForm.openingStock ? Number(typeForm.openingStock) : undefined,
      };

      const response = selectedType
        ? await RawMaterialService.updateType(currentTenant.id, selectedType.id, { ...payload, isActive: typeForm.isActive })
        : await RawMaterialService.createType(currentTenant.id, payload);

      if (response.success) {
        if (!selectedType && Number(typeForm.openingStock) > 0 && typeForm.costPerUnit && typeForm.supplierId) {
          const quantity = parseFloat(typeForm.openingStock);
          const cost = parseFloat(typeForm.costPerUnit);
          if (!isNaN(quantity) && quantity > 0 && !isNaN(cost) && cost > 0) {
            await RawMaterialService.createPurchase(currentTenant.id, {
              materialTypeId: response.data.id,
              supplierId: typeForm.supplierId,
              quantity,
              costPerUnit: cost,
              purchaseDate: new Date().toISOString(),
              status: 'RECEIVED',
              notes: 'Opening Stock',
            });
          }
        }
        toast.success(selectedType ? 'Material type updated' : 'Material type created');
        setTypeModalMode(null);
        setSelectedType(null);
        await loadData();
      } else {
        if (response.error?.details?.fieldErrors) {
          const errors: Record<string, string> = {};
          for (const [key, messages] of Object.entries(response.error.details.fieldErrors as Record<string, string[]>)) {
            errors[key] = messages[0];
          }
          setTypeFormErrors(errors);
          toast.error('Please correct the errors in the form');
        } else {
          toast.error(response.error?.message || 'Failed to save material type');
        }
      }
    } catch {
      toast.error('Failed to save material type');
    } finally {
      setSaving(false);
    }
  };

  const deleteType = async (material: RawMaterialType) => {
    const currentTenant = tenant || await loadTenant();
    if (!currentTenant) return;
    if (!canDelete) return toast.error('You do not have permission to delete material types');
    if (!window.confirm(`Delete ${material.name}? This will soft delete the material type.`)) return;

    const response = await RawMaterialService.deleteType(currentTenant.id, material.id);
    if (response.success) {
      toast.success('Material type deleted');
      await loadData();
    } else {
      toast.error(response.error?.message || 'Failed to delete material type');
    }
  };

  const openPurchaseModal = async (purchase?: RawMaterialPurchase) => {
    if (purchase && !canUpdate) return toast.error('You do not have permission to update purchases');
    if (!purchase && !canCreate) return toast.error('You do not have permission to create purchases');
    const currentTenant = tenant || await loadTenant();
    if (!currentTenant) return;

    await loadReferenceData(currentTenant.id);
    setSelectedPurchase(purchase || null);
    setPurchaseForm(purchase ? purchaseFormFromPurchase(purchase) : emptyPurchaseForm());
    setPurchaseFormErrors({});
    setPurchaseModalMode(purchase ? 'edit' : 'create');
  };

  const savePurchase = async (event: FormEvent) => {
    event.preventDefault();
    const currentTenant = tenant || await loadTenant();
    if (!currentTenant) return;

    const quantity = numberOrUndefined(purchaseForm.quantity);
    const costPerUnit = numberOrUndefined(purchaseForm.costPerUnit);
    if (!selectedPurchase && !purchaseForm.materialTypeId) return toast.error('Select a material type');
    if (!selectedPurchase && !purchaseForm.supplierId) return toast.error('Select a supplier');
    if (!quantity || quantity <= 0) return toast.error('Quantity must be greater than zero');
    if (!costPerUnit || costPerUnit <= 0) return toast.error('Cost per unit must be greater than zero');

    setSaving(true);
    try {
      const commonPayload = {
        quantity,
        costPerUnit,
        purchaseDate: dateInputToIso(purchaseForm.purchaseDate) || new Date().toISOString(),
        status: purchaseForm.status,
        invoiceNumber: purchaseForm.invoiceNumber.trim() || undefined,
        notes: purchaseForm.notes.trim() || undefined,
      };

      const response = selectedPurchase
        ? await RawMaterialService.updatePurchase(currentTenant.id, selectedPurchase.id, commonPayload satisfies UpdateRawMaterialPurchasePayload)
        : await RawMaterialService.createPurchase(currentTenant.id, {
            ...commonPayload,
            materialTypeId: purchaseForm.materialTypeId,
            supplierId: purchaseForm.supplierId,
          } satisfies CreateRawMaterialPurchasePayload);

      if (response.success) {
        toast.success(selectedPurchase ? 'Purchase updated' : 'Purchase created');
        setPurchaseModalMode(null);
        setSelectedPurchase(null);
        await loadData();
      } else {
        if (response.error?.details?.fieldErrors) {
          const errors: Record<string, string> = {};
          for (const [key, messages] of Object.entries(response.error.details.fieldErrors as Record<string, string[]>)) {
            errors[key] = messages[0];
          }
          setPurchaseFormErrors(errors);
          toast.error('Please correct the errors in the form');
        } else {
          toast.error(response.error?.message || 'Failed to save purchase');
        }
      }
    } catch {
      toast.error('Failed to save purchase');
    } finally {
      setSaving(false);
    }
  };

  const deletePurchase = async (purchase: RawMaterialPurchase) => {
    const currentTenant = tenant || await loadTenant();
    if (!currentTenant) return;
    if (!canDelete) return toast.error('You do not have permission to delete purchases');
    if (!window.confirm(`Delete purchase ${purchase.invoiceNumber || purchase.id}? This can affect stock.`)) return;

    const response = await RawMaterialService.deletePurchase(currentTenant.id, purchase.id);
    if (response.success) {
      toast.success('Purchase deleted');
      await loadData();
    } else {
      toast.error(response.error?.message || 'Failed to delete purchase');
    }
  };

  const seedSampleTypes = async () => {
    const currentTenant = tenant || await loadTenant();
    if (!currentTenant) return;
    if (!canCreate) return toast.error('You do not have permission to create material types');

    setSeedLoading(true);
    let created = 0;
    let skipped = 0;
    try {
      const existingRes = await RawMaterialService.listTypes(currentTenant.id, { page: 1, limit: 100 });
      const existingNames = new Set((existingRes.success ? existingRes.data.items : []).map(item => item.name.toLowerCase()));

      for (const sample of SAMPLE_TYPES) {
        if (existingNames.has(sample.name.toLowerCase())) {
          skipped += 1;
          continue;
        }
        const response = await RawMaterialService.createType(currentTenant.id, sample);
        if (response.success) created += 1;
      }

      toast.success(`Sample material types ready: ${created} created, ${skipped} skipped`);
      await loadData();
    } catch {
      toast.error('Failed to seed sample raw material types');
    } finally {
      setSeedLoading(false);
    }
  };

  const checkRawMaterialApis = async () => {
    const currentTenant = tenant || await loadTenant();
    if (!currentTenant) return;

    setCheckingApis(true);
    try {
      const [typesRes, purchasesRes, stockRes, issuancesRes, suppliersRes] = await Promise.all([
        RawMaterialService.listTypes(currentTenant.id, { page: 1, limit: 5 }),
        RawMaterialService.listPurchases(currentTenant.id, { page: 1, limit: 5 }),
        RawMaterialService.stock(currentTenant.id),
        RawMaterialService.listIssuances(currentTenant.id, { page: 1, limit: 5 }),
        PartyService.dropdown(currentTenant.id, { type: 'SUPPLIER', isActive: true, limit: 5 }),
      ]);

      const detailChecks: Array<Promise<unknown>> = [];
      if (typesRes.success && typesRes.data.items[0]) {
        detailChecks.push(RawMaterialService.getType(currentTenant.id, typesRes.data.items[0].id));
      }
      if (purchasesRes.success && purchasesRes.data.items[0]) {
        detailChecks.push(RawMaterialService.getPurchase(currentTenant.id, purchasesRes.data.items[0].id));
      }
      if (issuancesRes.success && issuancesRes.data.items[0]) {
        detailChecks.push(RawMaterialService.getIssuance(currentTenant.id, issuancesRes.data.items[0].id));
      }

      const detailResults = await Promise.all(detailChecks);
      const allOk = [typesRes, purchasesRes, stockRes, issuancesRes, suppliersRes, ...detailResults]
        .every((result: any) => result?.success !== false);

      if (allOk) {
        toast.success('Raw material APIs checked successfully');
      } else {
        toast.error('One or more raw material APIs returned an error');
      }

      await loadData();
    } catch {
      toast.error('Raw material API check failed');
    } finally {
      setCheckingApis(false);
    }
  };

  const tabs = [
    { id: 'stock' as Tab, label: 'Stock', icon: Boxes },
    { id: 'types' as Tab, label: 'Types', icon: Package },
    { id: 'purchases' as Tab, label: 'Purchases', icon: Truck },
    { id: 'issuances' as Tab, label: 'Issuances', icon: FileText },
  ];

  return (
    <DashboardLayout
      title="Raw Materials"
      subtitle="Tenant-scoped material catalogue, supplier purchases, stock and assignment issuances"
      action={
        canCreate ? (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={seedSampleTypes}
              disabled={seedLoading}
              className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {seedLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Seed Types
            </button>
            <button
              onClick={checkRawMaterialApis}
              disabled={checkingApis}
              className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {checkingApis ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Check APIs
            </button>
            <button
              onClick={() => tab === 'purchases' ? openPurchaseModal() : openTypeModal()}
              className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              {tab === 'purchases' ? 'Add Purchase' : 'Add Material'}
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {loading && stock.length === 0 ? (
            <div className="col-span-1 lg:col-span-4">
              <SkeletonCard count={4} />
            </div>
          ) : (
            [
              { label: 'Current Stock', value: stockStats.current.toLocaleString('en-IN'), Icon: Package },
              { label: 'Purchased', value: stockStats.purchased.toLocaleString('en-IN'), Icon: Truck },
              { label: 'Issued', value: stockStats.issued.toLocaleString('en-IN'), Icon: FileText },
              { label: 'Low Items', value: stockStats.low.toLocaleString('en-IN'), Icon: AlertTriangle },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="theme-surface-card p-4">
                <div className="flex items-center gap-3">
                  <span className="theme-icon-chip flex h-10 w-10 items-center justify-center rounded-lg">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="theme-text-primary text-xl font-black">{value}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="theme-surface-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map(item => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${
                    tab === item.id ? 'theme-tab-active' : 'theme-secondary-btn'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {tab === 'types' && (
                <>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={event => setSearch(event.target.value)}
                      placeholder="Search material types..."
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none"
                    />
                  </div>
                  <select value={status} onChange={event => setStatus(event.target.value as typeof status)} className="h-10 rounded-lg text-sm font-semibold">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="all">All</option>
                  </select>
                </>
              )}
              {tab === 'purchases' && (
                <select value={purchaseStatus} onChange={event => setPurchaseStatus(event.target.value as typeof purchaseStatus)} className="h-10 rounded-lg text-sm font-semibold">
                  <option value="all">All statuses</option>
                  {PURCHASE_STATUSES.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              )}
              <button onClick={loadData} className="theme-secondary-btn inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {loading && ((tab === 'stock' && stock.length === 0) || (tab === 'types' && types.length === 0) || (tab === 'purchases' && purchases.length === 0) || (tab === 'issuances' && issuances.length === 0)) ? (
            <div className="p-4">
              <SkeletonTable rows={6} cols={6} />
            </div>
          ) : tab === 'stock' ? (
            <StockGrid stock={stock} />
          ) : tab === 'types' ? (
            <TypesTable types={types} canUpdate={canUpdate} canDelete={canDelete} onEdit={openTypeModal} onDelete={deleteType} />
          ) : tab === 'purchases' ? (
            <PurchasesTable purchases={purchases} canUpdate={canUpdate} canDelete={canDelete} onEdit={openPurchaseModal} onDelete={deletePurchase} />
          ) : (
            <IssuancesTable issuances={issuances} />
          )}

          {tab !== 'stock' && (
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
          )}
        </div>
      </div>

      {typeModalMode && (
        <TypeModal
          mode={typeModalMode}
          form={typeForm}
          errors={typeFormErrors}
          setForm={setTypeForm}
          suppliers={suppliers}
          saving={saving}
          onClose={() => setTypeModalMode(null)}
          onSubmit={saveType}
        />
      )}

      {purchaseModalMode && (
        <PurchaseModal
          mode={purchaseModalMode}
          form={purchaseForm}
          errors={purchaseFormErrors}
          setForm={setPurchaseForm}
          materialTypes={types}
          suppliers={suppliers}
          saving={saving}
          editing={Boolean(selectedPurchase)}
          onClose={() => setPurchaseModalMode(null)}
          onSubmit={savePurchase}
        />
      )}
    </DashboardLayout>
  );
}

function StockGrid({ stock }: { stock: RawMaterialStockSummary[] }) {
  if (stock.length === 0) {
    return <div className="p-12 text-center text-sm font-medium text-slate-500">No stock data found.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-5 p-4 md:grid-cols-2">
      {stock.map(item => {
        const purchased = Number(item.totalPurchased || 0);
        const current = Number(item.currentStock || 0);
        const stockPercentage = purchased > 0 ? Math.max(0, (current / purchased) * 100) : 0;

        return (
          <div key={item.materialTypeId} className={`flex overflow-hidden rounded-2xl border bg-white ${item.isLow ? 'border-l-4 border-l-theme-status-critical' : 'theme-card-accent'}`}>
            <div className="flex-1 p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <span className="mb-1.5 inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                    {item.unit}
                  </span>
                  <h3 className="theme-text-primary text-[18px] font-bold leading-tight">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">Issued: {item.totalIssued} {item.unit}</p>
                </div>
                {item.isLow ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                    <AlertTriangle className="h-3 w-3" /> Low Stock
                  </span>
                ) : (
                  <span className="theme-badge-soft inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
                    Adequate
                  </span>
                )}
              </div>

              <div className="mb-4 border-t border-slate-100" />
              <div className="mb-4 grid grid-cols-2 gap-4">
                <Metric label="Current Stock" value={`${item.currentStock} ${item.unit}`} />
                <Metric label="Purchased" value={`${item.totalPurchased} ${item.unit}`} />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                  <span>Stock Level</span>
                  <span className="font-semibold text-slate-700">{Math.round(stockPercentage)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${item.isLow ? 'bg-red-600' : 'bg-emerald-600'}`} style={{ width: `${Math.min(stockPercentage, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="theme-text-primary text-[15px] font-bold">{value}</p>
    </div>
  );
}

function TypesTable({
  types,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: {
  types: RawMaterialType[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (material: RawMaterialType) => void;
  onDelete: (material: RawMaterialType) => void;
}) {
  return (
    <TableWrap
      empty={types.length === 0}
      emptyText="No material types found."
      headerLabels={['Item', 'Unit', 'Qty / Stock', 'Status', 'Date', 'Actions']}
    >
      {types.map(material => (
        <tr key={material.id} className="theme-table-row">
          <td className="px-4 py-3">
            <p className="theme-text-primary font-bold">{material.name}</p>
            <p className="text-sm text-slate-500">{material.description || '-'}</p>
          </td>
          <td className="px-4 py-3 text-sm font-semibold">{material.unit}</td>
          <td className="px-4 py-3 text-sm font-semibold">{material.currentStock || '0'}</td>
          <td className="px-4 py-3">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${material.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
              {material.isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td className="px-4 py-3 text-sm text-slate-500">{prettyDate(material.createdAt)}</td>
          <td className="px-4 py-3 text-right">
            <div className="flex justify-end gap-2">
              {canUpdate && (
                <button onClick={() => onEdit(material)} className="theme-secondary-btn rounded-lg p-2" title="Edit material">
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
              {canDelete && (
                <button onClick={() => onDelete(material)} className="theme-danger-btn rounded-lg p-2" title="Delete material">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </td>
        </tr>
      ))}
    </TableWrap>
  );
}

function PurchasesTable({
  purchases,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: {
  purchases: RawMaterialPurchase[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (purchase: RawMaterialPurchase) => void;
  onDelete: (purchase: RawMaterialPurchase) => void;
}) {
  return (
    <TableWrap
      empty={purchases.length === 0}
      emptyText="No purchases found."
      headerLabels={['Item', 'Supplier', 'Qty / Unit', 'Cost / Unit', 'Total', 'Status', 'Date', 'Actions']}
    >
      {purchases.map(purchase => (
        <tr key={purchase.id} className="theme-table-row">
          <td className="px-4 py-3">
            <p className="theme-text-primary font-bold">{purchase.materialType?.name || purchase.materialTypeId}</p>
            <p className="text-sm text-slate-500">{purchase.invoiceNumber || '-'}</p>
          </td>
          <td className="px-4 py-3 text-sm">{purchase.supplier?.name || purchase.supplierId}</td>
          <td className="px-4 py-3 text-sm font-semibold">{purchase.quantity} {purchase.materialType?.unit || ''}</td>
          <td className="px-4 py-3 text-sm">{money(purchase.costPerUnit)}</td>
          <td className="px-4 py-3 text-sm font-bold">{money(purchase.totalCost)}</td>
          <td className="px-4 py-3">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusPill(purchase.status)}`}>{purchase.status}</span>
          </td>
          <td className="px-4 py-3 text-sm text-slate-500">{prettyDate(purchase.purchaseDate)}</td>
          <td className="px-4 py-3 text-right">
            <div className="flex justify-end gap-2">
              {canUpdate && (
                <button onClick={() => onEdit(purchase)} className="theme-secondary-btn rounded-lg p-2" title="Edit purchase">
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
              {canDelete && (
                <button onClick={() => onDelete(purchase)} className="theme-danger-btn rounded-lg p-2" title="Delete purchase">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </td>
        </tr>
      ))}
    </TableWrap>
  );
}

function IssuancesTable({ issuances }: { issuances: RawMaterialIssuance[] }) {
  return (
    <TableWrap
      empty={issuances.length === 0}
      emptyText="No assignment issuances found. Manual issuance creation is disabled."
      headerLabels={['Item', 'Qty / Unit', 'Date', 'Notes']}
    >
      {issuances.map(issuance => (
        <tr key={issuance.id} className="theme-table-row">
          <td className="px-4 py-3">
            <p className="theme-text-primary font-bold">{issuance.materialType?.name || issuance.materialTypeId}</p>
            <p className="text-sm text-slate-500">Assignment: {issuance.assignmentId}</p>
          </td>
          <td className="px-4 py-3 text-sm font-semibold">{issuance.quantity} {issuance.materialType?.unit || ''}</td>
          <td className="px-4 py-3 text-sm text-slate-500">{prettyDate(issuance.issuedAt)}</td>
          <td className="px-4 py-3 text-sm text-slate-500">{issuance.notes || '-'}</td>
        </tr>
      ))}
    </TableWrap>
  );
}

function TableWrap({
  children,
  empty,
  emptyText,
  headerLabels,
}: {
  children: React.ReactNode;
  empty: boolean;
  emptyText: string;
  headerLabels?: string[];
}) {
  if (empty) {
    return <div className="p-12 text-center text-sm font-medium text-slate-500">{emptyText}</div>;
  }

  const headers = headerLabels ?? [
    'Item',
    'Party / Unit',
    'Qty / Stock',
    'Rate / Status',
    'Total / Notes',
    'Status',
    'Date',
    'Actions',
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="theme-table-header">
          <tr>
            {headers.map((label, index) => (
              <th key={label} className={`px-4 py-3 ${index === headers.length - 1 ? 'text-right' : ''}`}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
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

function TypeModal({
  mode,
  form,
  errors,
  setForm,
  suppliers,
  saving,
  onClose,
  onSubmit,
}: {
  mode: TypeModalMode;
  form: TypeForm;
  errors: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<TypeForm>>;
  suppliers: PartyDropdownItem[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
        <form onSubmit={onSubmit} className="theme-modal-panel w-full max-w-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div>
              <h2 className="text-xl font-bold theme-text-primary">{mode === 'create' ? 'Add Material Type' : 'Edit Material Type'}</h2>
              <p className="text-sm text-slate-500">Catalogue name, unit and active status</p>
            </div>
            <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg p-2">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 p-4">
            <Field label="Name" value={form.name} onChange={value => setForm(data => ({ ...data, name: value }))} required error={errors.name} />
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Unit <span className="text-red-500">*</span></span>
              <select value={form.unit} onChange={event => setForm(data => ({ ...data, unit: event.target.value as RawMaterialUnit }))} className={`h-10 w-full text-sm font-semibold ${errors.unit ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                {UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
              </select>
              {errors.unit && <p className="mt-1 text-xs text-red-500">{errors.unit}</p>}
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Description</span>
              <textarea
                value={form.description}
                onChange={event => setForm(data => ({ ...data, description: event.target.value }))}
                rows={3}
                className={`w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[var(--color-accent)] ${errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            </label>
            {mode === 'create' && (
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-4 text-sm font-bold text-slate-700">Opening Stock (Optional)</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Initial Quantity (Pieces/Units)" type="number" value={form.openingStock} onChange={value => setForm(data => ({ ...data, openingStock: value }))} />
                  {Number(form.openingStock) > 0 && (
                    <>
                      <Field label="Cost Per Unit" type="number" value={form.costPerUnit || ''} onChange={value => setForm(data => ({ ...data, costPerUnit: value }))} />
                      <label className="block md:col-span-2">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Supplier for Initial Stock</span>
                        <select
                          value={form.supplierId || ''}
                          onChange={event => setForm(data => ({ ...data, supplierId: event.target.value }))}
                          className="h-10 w-full text-sm font-semibold disabled:bg-slate-100"
                        >
                          <option value="">Select supplier</option>
                          {suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                        </select>
                      </label>
                    </>
                  )}
                </div>
              </div>
            )}
            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              Active material type
              <input type="checkbox" checked={form.isActive} onChange={event => setForm(data => ({ ...data, isActive: event.target.checked }))} />
            </label>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
            <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg px-4 py-2 text-sm font-semibold">Cancel</button>
            <button disabled={saving} className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Material
            </button>
          </div>
        </form>
      </div>
    </Portal>
  );
}

function PurchaseModal({
  mode,
  form,
  errors,
  setForm,
  materialTypes,
  suppliers,
  saving,
  editing,
  onClose,
  onSubmit,
}: {
  mode: PurchaseModalMode;
  form: PurchaseForm;
  errors: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<PurchaseForm>>;
  materialTypes: RawMaterialType[];
  suppliers: PartyDropdownItem[];
  saving: boolean;
  editing: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
        <form onSubmit={onSubmit} className="theme-modal-panel w-full max-w-3xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div>
              <h2 className="text-xl font-bold theme-text-primary">{mode === 'create' ? 'Add Purchase' : 'Edit Purchase'}</h2>
              <p className="text-sm text-slate-500">Supplier intake. Total cost is computed by backend.</p>
            </div>
            <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg p-2">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Material Type <span className="text-red-500">*</span></span>
              <select
                value={form.materialTypeId}
                disabled={editing}
                onChange={event => setForm(data => ({ ...data, materialTypeId: event.target.value }))}
                className={`h-10 w-full text-sm font-semibold disabled:bg-slate-100 ${errors.materialTypeId ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                required
              >
                <option value="">Select material</option>
                {materialTypes.map(material => <option key={material.id} value={material.id}>{material.name} ({material.unit})</option>)}
              </select>
              {errors.materialTypeId && <p className="mt-1 text-xs text-red-500">{errors.materialTypeId}</p>}
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Supplier <span className="text-red-500">*</span></span>
              <select
                value={form.supplierId}
                disabled={editing}
                onChange={event => setForm(data => ({ ...data, supplierId: event.target.value }))}
                className={`h-10 w-full text-sm font-semibold disabled:bg-slate-100 ${errors.supplierId ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                required
              >
                <option value="">Select supplier</option>
                {suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </select>
              {errors.supplierId && <p className="mt-1 text-xs text-red-500">{errors.supplierId}</p>}
            </label>
            <Field label="Quantity" type="number" value={form.quantity} onChange={value => setForm(data => ({ ...data, quantity: value }))} required error={errors.quantity} />
            <Field label="Cost Per Unit" type="number" value={form.costPerUnit} onChange={value => setForm(data => ({ ...data, costPerUnit: value }))} required error={errors.costPerUnit} />
            <Field label="Purchase Date" type="date" value={form.purchaseDate} onChange={value => setForm(data => ({ ...data, purchaseDate: value }))} required error={errors.purchaseDate} />
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Status <span className="text-red-500">*</span></span>
              <select value={form.status} onChange={event => setForm(data => ({ ...data, status: event.target.value as RawMaterialPurchaseStatus }))} className={`h-10 w-full text-sm font-semibold ${errors.status ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                {PURCHASE_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
              {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status}</p>}
            </label>
            <Field label="Invoice Number" value={form.invoiceNumber} onChange={value => setForm(data => ({ ...data, invoiceNumber: value }))} error={errors.invoiceNumber} />
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes</span>
              <textarea
                value={form.notes}
                onChange={event => setForm(data => ({ ...data, notes: event.target.value }))}
                rows={3}
                className={`w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[var(--color-accent)] ${errors.notes ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
              />
              {errors.notes && <p className="mt-1 text-xs text-red-500">{errors.notes}</p>}
            </label>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
            <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg px-4 py-2 text-sm font-semibold">Cancel</button>
            <button disabled={saving} className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Purchase
            </button>
          </div>
        </form>
      </div>
    </Portal>
  );
}
