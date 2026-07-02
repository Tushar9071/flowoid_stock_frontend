'use client';

import React, { createContext, FormEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';
import { confirmAction } from '@/components/shared/confirm-action';
import { useAuth } from '@/lib/auth-context';
import { PartyService } from '@/lib/services/party.service';
import { RawMaterialService } from '@/lib/services/raw-material.service';
import { CurrentOwnerService } from '@/lib/services/current-owner.service';
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

// ─── Types ────────────────────────────────────────────────────────────────────

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
  invoiceNumber: string;
  notes: string;
  status?: RawMaterialPurchaseStatus;
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const PAGE_LIMIT = 12;
export const UNITS: RawMaterialUnit[] = ['KG', 'GRAM', 'PIECE', 'METER', 'DOZEN', 'OTHER'];
export const PURCHASE_STATUSES: RawMaterialPurchaseStatus[] = ['DRAFT', 'FINAL', 'CANCELLED'];

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
  invoiceNumber: '',
  notes: '',
  status: 'DRAFT',
});

// ─── Utility functions (exported for sub-pages) ───────────────────────────────

export function numberOrUndefined(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function money(value: string | number | null | undefined) {
  const amount = Number(value || 0);
  return formatCurrency(Number.isFinite(amount) ? amount : 0);
}

export function prettyDate(date?: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function dateInputToIso(date: string) {
  if (!date) return undefined;
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

export function typeFormFromMaterial(material: RawMaterialType): TypeForm {
  return {
     name: material.name,
    unit: material.unit,
    description: material.description || '',
    isActive: material.isActive,
    openingStock: material.currentStock || '',
  };
}

export function purchaseFormFromPurchase(purchase: RawMaterialPurchase): PurchaseForm {
  return {
    materialTypeId: purchase.materialTypeId || purchase.materialId || '',
    supplierId: purchase.supplierId || purchase.supplierPartyId || '',
    quantity: String(purchase.quantity || ''),
    costPerUnit: String(purchase.costPerUnit || ''),
    purchaseDate: purchase.purchaseDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    invoiceNumber: purchase.invoiceNumber || '',
    notes: purchase.notes || '',
    status: purchase.status,
  };
}

export function shortId(id?: string | null) {
  if (!id) return '-';
  return id.length > 10 ? `${id.slice(0, 8)}...` : id;
}

export function materialLabel(row: RawMaterialPurchase | RawMaterialIssuance, types?: RawMaterialType[]) {
  const name = row.materialType?.name || row.material?.name;
  if (name) return name;
  const id = row.materialTypeId || row.materialId;
  const found = types?.find(t => t.id === id);
  return found?.name || shortId(id);
}

export function materialUnit(row: RawMaterialPurchase | RawMaterialIssuance, types?: RawMaterialType[]) {
  const unit = row.materialType?.unit || row.material?.unit;
  if (unit) return unit;
  const id = row.materialTypeId || row.materialId;
  const found = types?.find(t => t.id === id);
  return found?.unit || '';
}

export function supplierLabel(row: RawMaterialPurchase, suppliers?: PartyDropdownItem[]) {
  const name = row.supplier?.name || row.supplierParty?.name;
  if (name) return name;
  const id = row.supplierId || row.supplierPartyId;
  const found = suppliers?.find(s => s.id === id);
  return found?.name || shortId(id);
}

export function statusPill(status: RawMaterialPurchaseStatus) {
  if (status === 'FINAL') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'DRAFT') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-100 text-slate-600';
}

export function formatStatus(status: RawMaterialPurchaseStatus) {
  if (status === 'FINAL') return 'Stock Received';
  if (status === 'DRAFT') return 'Draft';
  if (status === 'CANCELLED') return 'Cancelled';
  return status;
}

// ─── Context ──────────────────────────────────────────────────────────────────

type RawMaterialsContextValue = {
  tenant: BackendTenant | null;
  types: RawMaterialType[];
  stock: RawMaterialStockSummary[];
  purchases: RawMaterialPurchase[];
  issuances: RawMaterialIssuance[];
  suppliers: PartyDropdownItem[];
  pagination: { page: number; totalPages: number; totalItems: number };
  loading: boolean;
  saving: boolean;
  seedLoading: boolean;
  typeModalMode: TypeModalMode | null;
  purchaseModalMode: PurchaseModalMode | null;
  typeForm: TypeForm;
  purchaseForm: PurchaseForm;
  typeFormErrors: Record<string, string>;
  purchaseFormErrors: Record<string, string>;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  search: string;
  stockFilter: 'ALL' | 'LOW_STOCK' | 'ADEQUATE' | 'OUT_OF_STOCK';
  materialFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
  purchaseFilter: 'ALL' | 'DRAFT' | 'FINAL' | 'CANCELLED';
  purchaseDateFilter: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';
  usageFilter: 'ALL' | 'PENDING' | 'ISSUED' | 'CANCELLED';
  usageDateFilter: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';
  page: number;
  filteredStock: RawMaterialStockSummary[];
  setSearch: (v: string) => void;
  setStockFilter: (v: 'ALL' | 'LOW_STOCK' | 'ADEQUATE' | 'OUT_OF_STOCK') => void;
  setMaterialFilter: (v: 'ALL' | 'ACTIVE' | 'INACTIVE') => void;
  setPurchaseFilter: (v: 'ALL' | 'DRAFT' | 'FINAL' | 'CANCELLED') => void;
  setPurchaseDateFilter: (v: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH') => void;
  setUsageFilter: (v: 'ALL' | 'PENDING' | 'ISSUED' | 'CANCELLED') => void;
  setUsageDateFilter: (v: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH') => void;
  setPage: (p: number) => void;
  setTypeForm: React.Dispatch<React.SetStateAction<TypeForm>>;
  setPurchaseForm: React.Dispatch<React.SetStateAction<PurchaseForm>>;
  openTypeModal: (material?: RawMaterialType) => Promise<any>;
  saveType: (event: FormEvent) => Promise<any>;
  deleteType: (material: RawMaterialType) => Promise<any>;
  updateTypeStatus: (id: string, newStatus: string) => Promise<any>;
  openPurchaseModal: (purchase?: RawMaterialPurchase) => Promise<any>;
  savePurchase: (event: FormEvent) => Promise<any>;
  deletePurchase: (purchase: RawMaterialPurchase) => Promise<any>;
  finalisePurchase: (purchase: RawMaterialPurchase) => Promise<any>;
  setTypeModalMode: (mode: TypeModalMode | null) => void;
  setPurchaseModalMode: (mode: PurchaseModalMode | null) => void;
  loadData: () => Promise<any>;
};

const RawMaterialsContext = createContext<RawMaterialsContextValue | null>(null);

export function useRawMaterials() {
  const ctx = useContext(RawMaterialsContext);
  if (!ctx) throw new Error('useRawMaterials must be used within RawMaterialsProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RawMaterialsProvider({
  children,
  activeTab,
}: {
  children: React.ReactNode;
  activeTab: 'stock' | 'types' | 'purchases' | 'issuances';
}) {
  const { hasPermission } = useAuth();
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW_STOCK' | 'ADEQUATE' | 'OUT_OF_STOCK'>('ALL');
  const [materialFilter, setMaterialFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [purchaseFilter, setPurchaseFilter] = useState<'ALL' | 'DRAFT' | 'FINAL' | 'CANCELLED'>('ALL');
  const [purchaseDateFilter, setPurchaseDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [usageFilter, setUsageFilter] = useState<'ALL' | 'PENDING' | 'ISSUED' | 'CANCELLED'>('ALL');
  const [usageDateFilter, setUsageDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
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
  const canApprove = hasPermission('raw_materials.approve') || hasPermission('raw-materials.approve');

  const loadTenant = useCallback(async () => {
    const response = await CurrentOwnerService.getCurrentOwner();
    if (response.success && response.data) {
      setTenant(response.data);
      return response.data;
    }
    toast.error(response.error?.message || 'No business tenant found for this account');
    return null;
  }, []);

  const loadReferenceData = useCallback(async (tenantId: string) => {
    const [typesRes, suppliersRes, stockRes, purchasesRes, movementsRes] = await Promise.all([
      RawMaterialService.listTypes(tenantId, { page: 1, limit: 100, isActive: true }),
      PartyService.dropdown(tenantId, { type: 'SUPPLIER', isActive: true, limit: 100 }),
      RawMaterialService.stock(tenantId),
      RawMaterialService.listPurchases(tenantId, { limit: 100, status: 'FINAL' } as any),
      RawMaterialService.listIssuances(tenantId, { limit: 100 }),
    ]);

    if (typesRes.success) setTypes(typesRes.data.items);
    if (suppliersRes.success) setSuppliers(suppliersRes.data.items);
    
    if (stockRes.success) {
      const purchasesList = purchasesRes.success ? purchasesRes.data.items : [];
      const movementsList = movementsRes.success ? movementsRes.data.items : [];
      
      const enrichedStock = (stockRes.data || []).map(item => {
        const materialId = item.materialTypeId || (item as any).materialId || (item as any).id;
        
        // 1. Purchased: explicit FINAL purchases + positive manual adjustments (like initial stock)
        const purchaseSum = purchasesList
          .filter((p: any) => (p.materialTypeId || p.materialId) === materialId && p.status === 'FINAL')
          .reduce((sum: number, p: any) => sum + Number(p.quantity || 0), 0);
          
        const initialStockSum = movementsList
          .filter((m: any) => (m.materialTypeId || m.materialId) === materialId)
          .filter((m: any) => (m.movementType === 'MANUAL_ADJUSTMENT' || m.notes === 'INITIAL_STOCK') && Number(m.quantity || 0) > 0)
          .reduce((sum: number, m: any) => sum + Number(m.quantity || 0), 0);
          
        const totalPurchased = purchaseSum + initialStockSum;
        
        // 2. Issued: Actual issuances + negative manual adjustments - returned from worker
        // We explicitly EXCLUDE 'PURCHASE' movements (which are cancellations if negative, or duplicates if positive)
        const totalIssued = movementsList
          .filter((m: any) => (m.materialTypeId || m.materialId) === materialId)
          .filter((m: any) => m.movementType === 'ISSUED_TO_WORKER' || ((m.movementType === 'MANUAL_ADJUSTMENT' || (!m.movementType && m.assignmentId)) && Number(m.quantity || 0) < 0))
          .reduce((sum: number, m: any) => sum + Math.abs(Number(m.quantity || 0)), 0)
          - movementsList
          .filter((m: any) => (m.materialTypeId || m.materialId) === materialId)
          .filter((m: any) => m.movementType === 'RETURNED_FROM_WORKER')
          .reduce((sum: number, m: any) => sum + Number(m.quantity || 0), 0);
          
        return {
          ...item,
          totalPurchased: String(totalPurchased),
          totalIssued: String(Math.max(0, totalIssued)), // prevent negative issued
          currentStock: String(totalPurchased - Math.max(0, totalIssued))
        };
      });
      
      setStock(enrichedStock);
    }
  }, []);

  const getDateRange = (filter: string) => {
    if (filter === 'ALL') return {};
    const today = new Date();
    const dateTo = today.toISOString().split('T')[0];
    let dateFrom = dateTo;
    if (filter === 'WEEK') {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      dateFrom = lastWeek.toISOString().split('T')[0];
    } else if (filter === 'MONTH') {
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);
      dateFrom = lastMonth.toISOString().split('T')[0];
    }
    return { dateFrom, dateTo };
  };

  const loadData = useCallback(async () => {
    const currentTenant = tenant || await loadTenant();
    if (!currentTenant) { setLoading(false); return; }

    setLoading(true);
    try {
      await loadReferenceData(currentTenant.id);

      if (activeTab === 'types') {
        const response = await RawMaterialService.listTypes(currentTenant.id, {
          page, limit: PAGE_LIMIT,
          search: search.trim() || undefined,
          isActive: materialFilter === 'ALL' ? undefined : materialFilter === 'ACTIVE',
        });
        if (response.success) {
          setTypes(response.data.items);
          setPagination({ page: response.data.pagination.page, totalPages: response.data.pagination.totalPages, totalItems: response.data.pagination.totalItems });
        } else toast.error(response.error?.message || 'Failed to load raw material types');
      }

      if (activeTab === 'purchases') {
        const response = await RawMaterialService.listPurchases(currentTenant.id, {
          page, limit: PAGE_LIMIT,
          search: search.trim() || undefined,
          status: purchaseFilter === 'ALL' ? undefined : (purchaseFilter as RawMaterialPurchaseStatus),
          ...getDateRange(purchaseDateFilter),
        } as any);
        if (response.success) {
          let items = response.data.items;
          if (purchaseFilter === 'ALL') {
            // Hide cancelled purchases from the default 'ALL' view so they disappear when deleted
            items = items.filter((p: RawMaterialPurchase) => p.status !== 'CANCELLED');
          }
          setPurchases(items);
          setPagination({ page: response.data.pagination.page, totalPages: response.data.pagination.totalPages, totalItems: response.data.pagination.totalItems });
        } else toast.error(response.error?.message || 'Failed to load purchases');
      }

      if (activeTab === 'issuances') {
        const response = await RawMaterialService.listIssuances(currentTenant.id, {
          page, limit: PAGE_LIMIT,
          search: search.trim() || undefined,
          status: usageFilter === 'ALL' ? undefined : usageFilter,
          ...getDateRange(usageDateFilter),
        } as any);
        if (response.success) {
          setIssuances(response.data.items);
          setPagination({ page: response.data.pagination.page, totalPages: response.data.pagination.totalPages, totalItems: response.data.pagination.totalItems });
        } else toast.error(response.error?.message || 'Failed to load issuances');
      }
    } catch {
      toast.error('Failed to load raw material data');
    } finally {
      setLoading(false);
    }
  }, [loadReferenceData, loadTenant, page, search, activeTab, tenant, materialFilter, purchaseFilter, purchaseDateFilter, usageFilter, usageDateFilter]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [search, stockFilter, materialFilter, purchaseFilter, purchaseDateFilter, usageFilter, usageDateFilter]);

  const filteredStock = useMemo(() => {
    return stock.filter(item => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
                          (item as any).materialTypeId?.toLowerCase().includes(search.toLowerCase()) ||
                          item.unit.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (stockFilter === 'ALL') return true;
      const current = Number(item.currentStock || 0);
      if (stockFilter === 'OUT_OF_STOCK') return current <= 0;
      if (stockFilter === 'LOW_STOCK') return item.isLow && current > 0;
      if (stockFilter === 'ADEQUATE') return !item.isLow && current > 0;
      return true;
    });
  }, [stock, search, stockFilter]);

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
    if (!currentTenant) return;
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
        ? await RawMaterialService.updateType(currentTenant.id, selectedType.id, payload)
        : await RawMaterialService.createType(currentTenant.id, payload);
      if (response.success) {
        if (selectedType && typeForm.unit !== selectedType.unit) {
          const unitResponse = await RawMaterialService.updateTypeUnit(currentTenant.id, selectedType.id, typeForm.unit);
          if (!unitResponse.success) toast.error(unitResponse.error?.message || 'Material saved, but unit could not be changed');
        }
        if (selectedType && selectedType.isActive && !typeForm.isActive) {
          await RawMaterialService.deleteType(currentTenant.id, selectedType.id);
        }
        if (!selectedType && Number(typeForm.openingStock) > 0 && typeForm.costPerUnit && typeForm.supplierId) {
          const quantity = parseFloat(typeForm.openingStock);
          const cost = parseFloat(typeForm.costPerUnit);
          if (!isNaN(quantity) && quantity > 0 && !isNaN(cost) && cost > 0) {
            const openingPurchase = await RawMaterialService.createPurchase(currentTenant.id, {
              materialTypeId: response.data.id, supplierId: typeForm.supplierId,
              quantity, costPerUnit: cost, purchaseDate: new Date().toISOString(), notes: 'Opening Stock',
            });
            if (openingPurchase.success) await RawMaterialService.finalisePurchase(currentTenant.id, openingPurchase.data.id);
          }
        }
        toast.success(selectedType ? 'Material type updated' : 'Material type created');
        setTypeModalMode(null);
        setSelectedType(null);
        await loadData();
      } else {
        if (response.error?.details?.fieldErrors) {
          const errors: Record<string, string> = {};
          for (const [key, messages] of Object.entries(response.error.details.fieldErrors as Record<string, string[]>)) errors[key] = messages[0];
          setTypeFormErrors(errors);
          toast.error('Please correct the errors in the form');
        } else toast.error(response.error?.message || 'Failed to save material type');
      }
    } catch { toast.error('Failed to save material type'); } finally { setSaving(false); }
  };

  const deleteType = async (material: RawMaterialType) => {
    const currentTenant = tenant || await loadTenant();
    if (!currentTenant) return;
    if (!canDelete) return toast.error('You do not have permission to delete material types');
    if (!(await confirmAction(`Are you sure you want to delete "${material.name}"?`))) return;
    const response = await RawMaterialService.deleteType(currentTenant.id, material.id);
    if (response.success) { toast.success('Material type deleted'); await loadData(); }
    else toast.error(response.error?.message || 'Failed to delete material type');
  };

  const updateTypeStatus = async (id: string, newStatus: string) => {
    const currentTenant = tenant || await loadTenant();
    if (!currentTenant) throw new Error('Tenant not found');

    const response = await RawMaterialService.updateTypeStatus(currentTenant.id, id, { status: newStatus });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update material status');
    }
    await loadData();
  };

  const openPurchaseModal = async (purchase?: RawMaterialPurchase) => {
    if (purchase && !canUpdate) return toast.error('You do not have permission to update purchases');
    if (purchase && purchase.status !== 'DRAFT') return toast.error('Only DRAFT purchases can be edited');
    if (!purchase && !canCreate) return toast.error('You do not have permission to create purchases');
    const currentTenant = tenant || await loadTenant();
    if (!currentTenant) return;
    await loadReferenceData(currentTenant.id);
    setSelectedPurchase(purchase || null);
    setPurchaseForm(purchase ? purchaseFormFromPurchase(purchase) : {
      ...emptyPurchaseForm(),
      invoiceNumber: `PUR${String(pagination.totalItems + 1).padStart(3, '0')}`
    });
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
        quantity, costPerUnit,
        purchaseDate: dateInputToIso(purchaseForm.purchaseDate) || new Date().toISOString(),
        invoiceNumber: purchaseForm.invoiceNumber.trim() || undefined,
        notes: purchaseForm.notes.trim() || undefined,
      };
      const response = selectedPurchase
        ? await RawMaterialService.updatePurchase(currentTenant.id, selectedPurchase.id, commonPayload as UpdateRawMaterialPurchasePayload)
        : await RawMaterialService.createPurchase(currentTenant.id, {
          ...commonPayload, materialTypeId: purchaseForm.materialTypeId, supplierId: purchaseForm.supplierId,
        } as CreateRawMaterialPurchasePayload);
        
      if (response.success) {
        // If the user selected a status other than DRAFT, handle it immediately
        let finalStatusMessage = '';
        if (purchaseForm.status === 'FINAL') {
          const finRes = await RawMaterialService.finalisePurchase(currentTenant.id, response.data.id);
          if (!finRes.success) toast.error(finRes.error?.message || 'Saved draft, but failed to mark as Stock Received');
          else finalStatusMessage = ' and marked as Stock Received';
        } else if (purchaseForm.status === 'CANCELLED') {
          const delRes = await RawMaterialService.deletePurchase(currentTenant.id, response.data.id);
          if (!delRes.success) toast.error(delRes.error?.message || 'Saved draft, but failed to cancel');
          else finalStatusMessage = ' and cancelled';
        }

        toast.success((selectedPurchase ? 'Purchase updated' : 'Purchase created') + finalStatusMessage);
        setPurchaseModalMode(null);
        setSelectedPurchase(null);
        await loadData();
      } else {
        if (response.error?.details?.fieldErrors) {
          const errors: Record<string, string> = {};
          for (const [key, messages] of Object.entries(response.error.details.fieldErrors as Record<string, string[]>)) errors[key] = messages[0];
          setPurchaseFormErrors(errors);
          toast.error('Please correct the errors in the form');
        } else toast.error(response.error?.message || 'Failed to save purchase');
      }
    } catch { toast.error('Failed to save purchase'); } finally { setSaving(false); }
  };

  const deletePurchase = async (purchase: RawMaterialPurchase) => {
    const currentTenant = tenant || await loadTenant();
    if (!currentTenant) return;
    if (!canUpdate) return toast.error('You do not have permission to cancel purchases');
    if (purchase.status === 'CANCELLED') return toast.error('Purchase is already cancelled');
    if (!(await confirmAction(`Are you sure you want to cancel purchase "${purchase.invoiceNumber || shortId(purchase.id)}"?`, {
      type: 'warning',
      title: 'Cancel Purchase?',
      description: 'This can affect stock if it was already processed.',
      confirmText: 'Cancel Purchase'
    }))) return;
    const response = await RawMaterialService.deletePurchase(currentTenant.id, purchase.id);
    if (response.success) { toast.success('Purchase cancelled'); await loadData(); }
    else toast.error(response.error?.message || 'Failed to delete purchase');
  };

  const finalisePurchase = async (purchase: RawMaterialPurchase) => {
    const currentTenant = tenant || await loadTenant();
    if (!currentTenant) return;
    if (!canApprove) return toast.error('You do not have permission to mark purchases as stock received');
    if (purchase.status !== 'DRAFT') return toast.error('Only DRAFT purchases can be marked as stock received');
    if (!(await confirmAction(`Are you sure you want to mark purchase "${purchase.invoiceNumber || shortId(purchase.id)}" as Stock Received?`, {
      type: 'info',
      title: 'Mark as Received?',
      description: 'Stock and supplier due amount will be updated.',
      confirmText: 'Mark Received'
    }))) return;
    const response = await RawMaterialService.finalisePurchase(currentTenant.id, purchase.id);
    if (response.success) { toast.success('Purchase marked as Stock Received'); await loadData(); }
    else toast.error(response.error?.message || 'Failed to update purchase status');
  };

  return (
    <RawMaterialsContext.Provider value={{
      tenant, types, stock, purchases, issuances, suppliers, pagination,
      loading, saving, seedLoading, typeModalMode, purchaseModalMode,
      typeForm, purchaseForm, typeFormErrors, purchaseFormErrors,
      canCreate, canUpdate, canDelete, canApprove,
      search, stockFilter, materialFilter, purchaseFilter, purchaseDateFilter, usageFilter, usageDateFilter, page,
      filteredStock,
      setSearch, setStockFilter, setMaterialFilter, setPurchaseFilter, setPurchaseDateFilter, setUsageFilter, setUsageDateFilter, setPage,
      setTypeForm, setPurchaseForm,
      openTypeModal, saveType, deleteType, updateTypeStatus,
      openPurchaseModal, savePurchase, deletePurchase, finalisePurchase,
      setTypeModalMode, setPurchaseModalMode,
      loadData,
    }}>
      {children}
    </RawMaterialsContext.Provider>
  );
}

// ─── Portal ───────────────────────────────────────────────────────────────────

export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
