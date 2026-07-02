'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { SkeletonTable, SkeletonCard } from '@/components/skeleton/Skeletons';
import { AdvancedDataTable } from '@/components/shared/DataTable';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  AlertTriangle,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Database,
  Edit3,
  FileText,
  CheckCircle2,
  Loader2,
  Package,
  Plus,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import { PartyService } from '@/lib/services/party.service';
import { RawMaterialService } from '@/lib/services/raw-material.service';
import { CurrentOwnerService } from '@/lib/services/current-owner.service';

import { SearchInput } from '@/components/shared/search-input';
import { confirmAction } from '@/components/shared/confirm-action';
import { PremiumSelect } from '@/components/ui/PremiumSelect';
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
  invoiceNumber: string;
  notes: string;
  status?: RawMaterialPurchaseStatus;
};

const PAGE_LIMIT = 12;
const UNITS: RawMaterialUnit[] = ['KG', 'GRAM', 'PIECE', 'METER', 'DOZEN', 'OTHER'];
const PURCHASE_STATUSES: RawMaterialPurchaseStatus[] = ['DRAFT', 'FINAL', 'CANCELLED'];

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

function shortId(id?: string | null) {
  if (!id) return '-';
  return id.length > 10 ? `${id.slice(0, 8)}...` : id;
}

function materialLabel(row: RawMaterialPurchase | RawMaterialIssuance, types?: RawMaterialType[]) {
  const name = row.materialType?.name || row.material?.name;
  if (name) return name;
  const id = row.materialTypeId || row.materialId;
  const found = types?.find(t => t.id === id);
  return found?.name || shortId(id);
}

function materialUnit(row: RawMaterialPurchase | RawMaterialIssuance, types?: RawMaterialType[]) {
  const unit = row.materialType?.unit || row.material?.unit;
  if (unit) return unit;
  const id = row.materialTypeId || row.materialId;
  const found = types?.find(t => t.id === id);
  return found?.unit || '';
}

function supplierLabel(row: RawMaterialPurchase, suppliers?: PartyDropdownItem[]) {
  const name = row.supplier?.name || row.supplierParty?.name;
  if (name) return name;
  const id = row.supplierId || row.supplierPartyId;
  const found = suppliers?.find(s => s.id === id);
  return found?.name || shortId(id);
}

function statusPill(status: RawMaterialPurchaseStatus) {
  if (status === 'FINAL') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'DRAFT') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-100 text-slate-600';
}

function formatStatus(status: RawMaterialPurchaseStatus) {
  if (status === 'FINAL') return 'Stock Received';
  if (status === 'DRAFT') return 'Draft';
  if (status === 'CANCELLED') return 'Cancelled';
  return status;
}

export type RawMaterialsPageProps = {
  fixedTab?: Tab;
  title?: string;
  subtitle?: string;
};

export default function RawMaterialsPage({
  fixedTab,
  title,
  subtitle,
}: RawMaterialsPageProps = {}) {
  const { hasPermission } = useAuth();
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [tab, setTab] = useState<Tab>(fixedTab ?? 'stock');
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
      RawMaterialService.listTypes(tenantId, { page: 1, limit: 1000, isActive: true }),
      PartyService.dropdown(tenantId, { type: 'SUPPLIER', isActive: true, limit: 1000 }),
      RawMaterialService.stock(tenantId),
      RawMaterialService.listPurchases(tenantId, { limit: 10000, status: 'FINAL' } as any),
      RawMaterialService.listIssuances(tenantId, { limit: 10000 }),
    ]);

    if (typesRes.success) setTypes(typesRes.data.items);
    if (suppliersRes.success) setSuppliers(suppliersRes.data.items);
    
    if (stockRes.success) {
      const stockItems = stockRes.data || [];
      const purchases = purchasesRes.success ? purchasesRes.data.items : [];
      const movements = movementsRes.success ? movementsRes.data.items : [];
      const purchasesList = purchasesRes.success ? purchasesRes.data.items : [];
      const movementsList = movementsRes.success ? movementsRes.data.items : [];
      
      const enrichedStock = stockItems.map(item => {
        const materialId = item.materialTypeId;
        
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
          totalIssued: String(Math.max(0, totalIssued)),
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
          isActive: materialFilter === 'ALL' ? undefined : materialFilter === 'ACTIVE',
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
          search: search.trim() || undefined,
          status: purchaseFilter === 'ALL' ? undefined : (purchaseFilter as RawMaterialPurchaseStatus),
          ...getDateRange(purchaseDateFilter),
        } as any);
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
          search: search.trim() || undefined,
          status: usageFilter === 'ALL' ? undefined : usageFilter,
          ...getDateRange(usageDateFilter),
        } as any);
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
  }, [loadReferenceData, loadTenant, page, search, tab, tenant, materialFilter, purchaseFilter, purchaseDateFilter, usageFilter, usageDateFilter]);

  const pathname = usePathname();

  useEffect(() => {
    loadData();
  }, [loadData, pathname]);

  useEffect(() => {
    if (fixedTab && tab !== fixedTab) {
      setTab(fixedTab);
      setSearch('');
    }
  }, [fixedTab, tab]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, stockFilter, materialFilter, purchaseFilter, purchaseDateFilter, usageFilter, usageDateFilter]);

  const stockStats = useMemo(() => {
    const current = stock.reduce((sum, item) => sum + Number(item.currentStock || 0), 0);
    const purchased = stock.reduce((sum, item) => sum + Number(item.totalPurchased || 0), 0);
    const issued = stock.reduce((sum, item) => sum + Number(item.totalIssued || 0), 0);
    const low = stock.filter(item => item.isLow).length;
    return { current, purchased, issued, low };
  }, [stock]);

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
          if (!unitResponse.success) {
            toast.error(unitResponse.error?.message || 'Material saved, but unit could not be changed');
          }
        }

        if (selectedType && selectedType.isActive && !typeForm.isActive) {
          // If deactivated during edit, call deleteType
          await RawMaterialService.deleteType(currentTenant.id, selectedType.id);
        }

          if (!selectedType && Number(typeForm.openingStock) > 0 && typeForm.costPerUnit && typeForm.supplierId) {
          const quantity = parseFloat(typeForm.openingStock);
          const cost = parseFloat(typeForm.costPerUnit);
          if (!isNaN(quantity) && quantity > 0 && !isNaN(cost) && cost > 0) {
            const openingPurchase = await RawMaterialService.createPurchase(currentTenant.id, {
              materialTypeId: response.data.id,
              supplierId: typeForm.supplierId,
              quantity,
              costPerUnit: cost,
              purchaseDate: new Date().toISOString(),
              notes: 'Opening Stock',
            });
            if (openingPurchase.success) {
              await RawMaterialService.finalisePurchase(currentTenant.id, openingPurchase.data.id);
            }
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
    if (!(await confirmAction(`Are you sure you want to delete "${material.name}"?`))) return;

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
        quantity,
        costPerUnit,
        purchaseDate: dateInputToIso(purchaseForm.purchaseDate) || new Date().toISOString(),
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
    if (!canUpdate) return toast.error('You do not have permission to cancel purchases');
    if (purchase.status === 'CANCELLED') return toast.error('Purchase is already cancelled');
    if (!(await confirmAction(`Are you sure you want to cancel purchase "${purchase.invoiceNumber || shortId(purchase.id)}"?`, {
      type: 'warning',
      title: 'Cancel Purchase?',
      description: 'This can affect stock if it was already processed.',
      confirmText: 'Cancel Purchase'
    }))) return;

    const response = await RawMaterialService.deletePurchase(currentTenant.id, purchase.id);
    if (response.success) {
      toast.success('Purchase cancelled');
      await loadData();
    } else {
      toast.error(response.error?.message || 'Failed to delete purchase');
    }
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
    if (response.success) {
      toast.success('Purchase marked as Stock Received');
      await loadData();
    } else {
      toast.error(response.error?.message || 'Failed to update purchase status');
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
      const existingNames = new Set((existingRes.success ? existingRes.data.items : []).map((item: RawMaterialType) => item.name.toLowerCase()));

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

  const tabs = [
    { id: 'stock' as Tab, label: 'Stock', icon: Boxes },
    { id: 'types' as Tab, label: 'Raw Materials', icon: Package },
    { id: 'purchases' as Tab, label: 'Material Purchases', icon: Truck },
    { id: 'issuances' as Tab, label: 'Material Usage', icon: FileText },
  ];

  return (
    <DashboardLayout
      title={title || 'Raw Materials'}
      subtitle={subtitle || 'Tenant-scoped raw materials, supplier purchases, stock and material usage'}
      action={
        canCreate ? (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() => tab === 'purchases' ? openPurchaseModal() : openTypeModal()}
              className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              {tab === 'purchases' ? 'Add Material Purchase' : 'Add Raw Material'}
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Module Tabs (Non-Sticky) - Hide if fixedTab is provided */}
        {!fixedTab && (
          <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap gap-2 pb-1 hide-scrollbar">
            {tabs.map(item => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSearch(''); }}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition whitespace-nowrap flex-shrink-0 ${
                tab === item.id ? 'theme-tab-active shadow-sm' : 'theme-secondary-btn bg-white border border-[#e5e7eb]'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
        )}

        {/* Search & Filters Container */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex w-full sm:max-w-sm">
            <SearchInput
              containerClassName="w-full"
              inputClassName="border-slate-200 bg-slate-50/50"
              placeholder={
                tab === 'stock' ? 'Search stock by material name or code...' :
                tab === 'types' ? 'Search raw materials...' :
                tab === 'purchases' ? 'Search purchases...' :
                'Search material usage...'
              }
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>

          <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap gap-2 pb-1 hide-scrollbar items-center">
            {tab === 'stock' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginRight: '8px', borderRight: '1px solid #E5E7EB', paddingRight: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Status</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '18px', height: '12px', background: '#059669', transform: 'rotate(-3deg)', clipPath: 'polygon(4px 0%, 100% 0%, 100% 100%, 4px 100%, 0% 50%)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E3A8A' }}>Adequate</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '18px', height: '12px', background: '#D97706', transform: 'rotate(-3deg)', clipPath: 'polygon(4px 0%, 100% 0%, 100% 100%, 4px 100%, 0% 50%)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E3A8A' }}>Low Stock</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '18px', height: '12px', background: '#DC2626', transform: 'rotate(-3deg)', clipPath: 'polygon(4px 0%, 100% 0%, 100% 100%, 4px 100%, 0% 50%)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E3A8A' }}>Out of Stock</span>
                </div>
              </div>
            )}
            {tab === 'stock' && (
              <select value={stockFilter} onChange={e => setStockFilter(e.target.value as any)} className="h-10 rounded-lg text-sm font-semibold border-slate-200 bg-white">
                <option value="ALL">All Materials</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="ADEQUATE">Adequate Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            )}
            {tab === 'types' && (
              <select value={materialFilter} onChange={e => setMaterialFilter(e.target.value as any)} className="h-10 rounded-lg text-sm font-semibold border-slate-200 bg-white">
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            )}
            {tab === 'purchases' && (
              <>
                <select value={purchaseFilter} onChange={e => setPurchaseFilter(e.target.value as any)} className="h-10 rounded-lg text-sm font-semibold border-slate-200 bg-white">
                  <option value="ALL">All Purchases</option>
                  <option value="DRAFT">Draft</option>
                  <option value="FINAL">Stock Received</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <select value={purchaseDateFilter} onChange={e => setPurchaseDateFilter(e.target.value as any)} className="h-10 rounded-lg text-sm font-semibold border-slate-200 bg-white">
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="WEEK">This Week</option>
                  <option value="MONTH">This Month</option>
                </select>
              </>
            )}
            {tab === 'issuances' && (
              <>
                <select value={usageFilter} onChange={e => setUsageFilter(e.target.value as any)} className="h-10 rounded-lg text-sm font-semibold border-slate-200 bg-white">
                  <option value="ALL">All Usage</option>
                  <option value="PENDING">Pending</option>
                  <option value="ISSUED">Issued</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <select value={usageDateFilter} onChange={e => setUsageDateFilter(e.target.value as any)} className="h-10 rounded-lg text-sm font-semibold border-slate-200 bg-white">
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="WEEK">This Week</option>
                  <option value="MONTH">This Month</option>
                </select>
              </>
            )}
          </div>
        </div>

        <div className="theme-surface-card overflow-hidden">
          {loading && ((tab === 'stock' && stock.length === 0) || (tab === 'types' && types.length === 0) || (tab === 'purchases' && purchases.length === 0) || (tab === 'issuances' && issuances.length === 0)) ? (
            <div className="p-4">
              <SkeletonTable rows={6} cols={6} />
            </div>
          ) : tab === 'stock' ? (
            <StockGrid stock={filteredStock} />
          ) : tab === 'types' ? (
            <TypesTable types={types} canUpdate={canUpdate} canDelete={canDelete} onEdit={openTypeModal} onDelete={deleteType} loading={loading} page={page} totalPages={pagination.totalPages} totalItems={pagination.totalItems} onPageChange={setPage} />
          ) : tab === 'purchases' ? (
            <PurchasesTable purchases={purchases} types={types} suppliers={suppliers} canUpdate={canUpdate} canDelete={canUpdate} canApprove={canApprove} onEdit={openPurchaseModal} onDelete={deletePurchase} onFinalise={finalisePurchase} loading={loading} page={page} totalPages={pagination.totalPages} totalItems={pagination.totalItems} onPageChange={setPage} />
          ) : (
            <IssuancesTable issuances={issuances} types={types} loading={loading} page={page} totalPages={pagination.totalPages} totalItems={pagination.totalItems} onPageChange={setPage} />
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
          editing={purchaseModalMode === 'edit'}
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
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px] p-[24px]">
        {stock.map((item, index) => {
          const purchased = Number(item.totalPurchased || 0);
          const current   = Number(item.currentStock  || 0);
          const issued    = Number(item.totalIssued   || 0);
          const stockPct  = purchased > 0 ? Math.max(0, Math.min((current / purchased) * 100, 100)) : 0;
          const isOut = current <= 0;
          const isLow = !isOut && (stockPct <= 20 || !!item.isLow);

          const statusColor  = isOut ? '#DC2626' : isLow ? '#D97706' : '#059669';
          const statusBg     = isOut ? '#FEF2F2'  : isLow ? '#FFF7ED'  : '#ECFDF5';
          const statusLabel  = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock';
          
          const primaryColor = isOut ? '#EF4444' : isLow ? '#F59E0B' : '#10B981';

          const hintText = isOut
            ? '✕ Restock Required'
            : isLow
            ? '⚠ Running Low'
            : '✓ Fully Available';

          const itemKey = item.materialTypeId || (item as any).id || `stock-item-${index}`;
          return (
            <div
              key={itemKey}
              style={{
                background: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 6px 24px rgba(15,23,42,0.06)',
                padding: '24px',
                transition: 'transform 250ms ease, box-shadow 250ms ease',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(15,23,42,0.10)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(15,23,42,0.06)'; }}
            >
              {/* Status Tag */}
              <div style={{
                position: 'absolute',
                top: '24px',
                right: '-2px',
                background: isOut ? '#DC2626' : isLow ? '#D97706' : '#059669',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 800,
                padding: '6px 12px 6px 16px',
                zIndex: 10,
                transform: 'rotate(-3deg)',
                clipPath: 'polygon(10px 0%, 100% 0%, 100% 100%, 10px 100%, 0% 50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{ width: '4px', height: '4px', background: '#FFFFFF', borderRadius: '50%' }} />
                {isOut ? 'OUT' : isLow ? 'LOW' : 'ADQ'}
              </div>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', paddingRight: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', background: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.2 }}>
                      {item.name}
                    </h3>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', margin: '4px 0 0 0' }}>
                      Raw Material • {item.unit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Stock Value */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '42px', fontWeight: 800, color: isOut ? '#EF4444' : '#111827', lineHeight: 1 }}>
                    {current.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 600, color: '#6B7280' }}>
                    {item.unit}
                  </span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 500, color: '#6B7280', marginTop: '6px' }}>
                  Available Stock
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: primaryColor, marginTop: '8px' }}>
                  {hintText}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#F1F5F9', margin: '0 0 18px 0' }} />

              {/* Statistics Inline Layout */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>Purchased</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{purchased.toLocaleString()}</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280' }}>{item.unit}</span>
                  </div>
                </div>
                <div style={{ width: '1px', height: '32px', background: '#E5E7EB', margin: '0 16px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>Issued</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{issued.toLocaleString()}</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280' }}>{item.unit}</span>
                  </div>
                </div>
                <div style={{ width: '1px', height: '32px', background: '#E5E7EB', margin: '0 16px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>Remaining</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{current.toLocaleString()}</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280' }}>{item.unit}</span>
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div style={{ marginTop: 'auto', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Inventory Level</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{Math.round(stockPct)}%</span>
                </div>
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${stockPct}%`,
                    background: primaryColor,
                    borderRadius: '999px', transition: 'width 700ms ease'
                  }} />
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9CA3AF' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <span style={{ fontSize: '12px', fontWeight: 500 }}>Updated 2 mins ago</span>
                </div>
                <Link href="/dashboard/raw-materials/material-list" style={{ textDecoration: 'none' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#6366F1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View Details <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </div>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function TypesTable({
  types,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  loading,
  page,
  totalPages,
  totalItems,
  onPageChange
}: {
  types: RawMaterialType[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (material: RawMaterialType) => void;
  onDelete: (material: RawMaterialType) => void;
  loading: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <AdvancedDataTable
      data={types}
      searchable={false}
      loading={loading}
      emptyIcon={<Package className="h-6 w-6 text-slate-400" />}
      emptyTitle="No raw materials found"
      columns={[
        {
          field: 'name',
          header: 'Item',
          sortable: true,
          filterable: true,
          filterType: 'text',
          render: (row) => (
            <div className="flex items-center gap-3">
              <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <p className="theme-text-primary font-bold">{row.name}</p>
                <p className="text-sm text-slate-500">{row.description || '-'}</p>
              </div>
            </div>
          )
        },
        {
          field: 'unit',
          header: 'Unit',
          sortable: true,
          filterable: true,
          filterType: 'text',
          render: (row) => <div className="font-semibold">{row.unit}</div>
        },
        {
          field: 'currentStock',
          header: 'Qty / Stock',
          sortable: true,
          getValue: (row) => row.currentStock || '0',
          render: (row) => <div className="font-semibold">{row.currentStock || '0'}</div>
        },
        {
          field: 'status',
          header: 'Status',
          sortable: true,
          filterable: true,
          filterType: 'boolean',
          getValue: (row) => row.isActive,
          render: (row) => (
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${row.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
              {row.isActive ? 'Active' : 'Inactive'}
            </span>
          )
        },
        {
          field: 'createdAt',
          header: 'Date',
          sortable: true,
          filterable: true,
          filterType: 'date',
          render: (row) => <div className="text-slate-500">{prettyDate(row.createdAt)}</div>
        },
        {
          field: 'actions',
          header: 'Actions',
          render: (row) => (
            <div className="flex justify-end gap-2">
              {canUpdate && (
                <button onClick={() => onEdit(row)} className="theme-secondary-btn rounded-lg p-2" title="Edit raw material">
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
              {canDelete && (
                <button onClick={() => onDelete(row)} className="theme-danger-btn rounded-lg p-2" title="Delete raw material">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )
        }
      ]}
    />
  );
}

function PurchasesTable({
  purchases,
  types,
  suppliers,
  canUpdate,
  canDelete,
  canApprove,
  onEdit,
  onDelete,
  onFinalise,
  loading,
  page,
  totalPages,
  totalItems,
  onPageChange
}: {
  purchases: RawMaterialPurchase[];
  types: RawMaterialType[];
  suppliers: PartyDropdownItem[];
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  onEdit: (purchase: RawMaterialPurchase) => void;
  onDelete: (purchase: RawMaterialPurchase) => void;
  onFinalise: (purchase: RawMaterialPurchase) => void;
  loading: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <AdvancedDataTable
      data={purchases}
      searchable={false}
      loading={loading}
      emptyIcon={<Truck className="h-6 w-6 text-slate-400" />}
      emptyTitle="No material purchases found"
      columns={[
        {
          field: 'item',
          header: 'Item',
          sortable: true,
          filterable: true,
          filterType: 'text',
          getValue: (row) => materialLabel(row, types),
          render: (row) => (
            <div className="flex items-center gap-3">
              <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <p className="theme-text-primary font-bold">{materialLabel(row, types)}</p>
                <p className="text-sm text-slate-500">{row.invoiceNumber || `ID ${shortId(row.id)}`}</p>
              </div>
            </div>
          )
        },
        {
          field: 'supplier',
          header: 'Supplier',
          sortable: true,
          filterable: true,
          filterType: 'text',
          getValue: (row) => supplierLabel(row, suppliers),
          render: (row) => <div>{supplierLabel(row, suppliers)}</div>
        },
        {
          field: 'quantity',
          header: 'Qty / Unit',
          sortable: true,
          getValue: (row) => `${row.quantity} ${materialUnit(row, types)}`,
          render: (row) => <div className="font-semibold">{row.quantity} {materialUnit(row, types)}</div>
        },
        {
          field: 'costPerUnit',
          header: 'Cost / Unit',
          sortable: true,
          getValue: (row) => Number(row.costPerUnit || 0),
          render: (row) => <div>{money(row.costPerUnit)}</div>
        },
        {
          field: 'totalCost',
          header: 'Total',
          sortable: true,
          getValue: (row) => Number(row.totalCost || 0),
          render: (row) => <div className="font-bold">{money(row.totalCost)}</div>
        },
        {
          field: 'status',
          header: 'Status',
          sortable: true,
          filterable: true,
          filterType: 'text',
          getValue: (row) => row.status,
          render: (row) => <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusPill(row.status)}`}>{formatStatus(row.status)}</span>
        },
        {
          field: 'purchaseDate',
          header: 'Date',
          sortable: true,
          filterable: true,
          filterType: 'date',
          getValue: (row) => row.purchaseDate,
          render: (row) => <div className="text-slate-500">{prettyDate(row.purchaseDate)}</div>
        },
        {
          field: 'actions',
          header: 'Actions',
          render: (row) => (
            <div className="flex justify-end gap-2">
              {canUpdate && row.status === 'DRAFT' && (
                <button onClick={() => onEdit(row)} className="theme-secondary-btn rounded-lg p-2" title="Edit material purchase">
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
              {canApprove && row.status === 'DRAFT' && (
                <button onClick={() => onFinalise(row)} className="theme-accent-btn rounded-lg p-2" title="Mark as Stock Received">
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
              {canDelete && row.status !== 'CANCELLED' && (
                <button onClick={() => onDelete(row)} className="theme-danger-btn rounded-lg p-2" title="Cancel material purchase">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )
        }
      ]}
    />
  );
}

function IssuancesTable({
  issuances,
  types,
  loading,
  page,
  totalPages,
  totalItems,
  onPageChange
}: {
  issuances: RawMaterialIssuance[];
  types: RawMaterialType[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <AdvancedDataTable
      data={issuances}
      searchable={false}
      loading={loading}
      emptyIcon={<FileText className="h-6 w-6 text-slate-400" />}
      emptyTitle="No material usage found"
      emptySubtitle="Manual material usage creation is disabled."
      columns={[
        {
          field: 'item',
          header: 'Item',
          sortable: true,
          filterable: true,
          filterType: 'text',
          getValue: (row) => materialLabel(row, types),
          render: (row) => {
            const isPurchase = Number(row.quantity) > 0;
            const refText = isPurchase 
              ? (row.notes?.includes('PUR') ? row.notes : (row.notes === 'INITIAL_STOCK' ? 'Initial Stock' : (row.assignmentId || 'Purchase')))
              : (row.assignmentId === 'OWNER' ? 'Owner' : row.assignmentId);
            return (
              <div className="flex items-center gap-3">
                <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="theme-text-primary font-bold">{materialLabel(row, types)}</p>
                  <p className="text-sm text-slate-500">{refText}</p>
                </div>
              </div>
            );
          }
        },
        {
          field: 'quantity',
          header: 'Qty / Unit',
          sortable: true,
          getValue: (row) => `${Math.abs(Number(row.quantity))} ${materialUnit(row, types)}`,
          render: (row) => {
            const isPurchase = Number(row.quantity) > 0;
            return <div className={`font-semibold ${isPurchase ? 'text-emerald-600' : 'text-red-500'}`}>{isPurchase ? '+' : '-'}{Math.abs(Number(row.quantity))} {materialUnit(row, types)}</div>;
          }
        },
        {
          field: 'issuedAt',
          header: 'Date',
          sortable: true,
          filterable: true,
          filterType: 'date',
          getValue: (row) => row.issuedAt,
          render: (row) => <div className="text-slate-500">{prettyDate(row.issuedAt)}</div>
        },
        {
          field: 'status',
          header: 'Status',
          render: (row) => {
            const isPurchase = Number(row.quantity) > 0;
            if (isPurchase || row.assignmentId === 'OWNER') {
              return <span className="rounded-full border px-3 py-1 text-xs font-bold border-emerald-200 bg-emerald-50 text-emerald-700">Purchased</span>;
            }
            return <span className="rounded-full border px-3 py-1 text-xs font-bold border-indigo-200 bg-indigo-50 text-indigo-700">Issued</span>;
          }
        },
        {
          field: 'notes',
          header: 'Notes',
          sortable: true,
          render: (row) => {
            const displayNotes = row.notes === 'INITIAL_STOCK' || row.notes === 'PURCHASE' || row.notes === 'ASSIGNMENT' ? '-' : (row.notes || '-');
            return <div className="text-slate-500">{displayNotes}</div>;
          }
        }
      ]}
    />
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
      <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
        <form onSubmit={onSubmit} className="theme-modal-panel flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-4">
            <div>
              <h2 className="text-xl font-bold theme-text-primary">{mode === 'create' ? 'Add Raw Material' : 'Edit Raw Material'}</h2>
              <p className="text-sm text-slate-500">Catalogue name, unit and active status</p>
            </div>
            <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg p-2">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid gap-4">
            <Field label="Name" value={form.name} onChange={value => setForm(data => ({ ...data, name: value }))} required error={errors.name} />
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Unit <span className="text-red-500">*</span></span>
              <PremiumSelect value={form.unit} onChange={(event: any) => setForm((data: any) => ({ ...data, unit: event.target.value as RawMaterialUnit }))} className={`h-10 w-full text-sm font-semibold ${errors.unit ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                {UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
              </PremiumSelect>
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
                        <PremiumSelect
                          value={form.supplierId || ''}
                          onChange={(event: any) => setForm((data: any) => ({ ...data, supplierId: event.target.value }))}
                          className="h-10 w-full text-sm font-semibold disabled:bg-slate-100"
                        >
                          <option value="">Select supplier</option>
                          {suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                        </PremiumSelect>
                      </label>
                    </>
                  )}
                </div>
              </div>
            )}
            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              Active raw material
              <input type="checkbox" disabled={!form.isActive && mode === 'edit'} checked={form.isActive} onChange={event => setForm(data => ({ ...data, isActive: event.target.checked }))} />
            </label>
            </div>
          </div>
          <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 p-4">
            <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg px-4 py-2 text-sm font-semibold">Cancel</button>
            <button disabled={saving} className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Raw Material
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
  const isDraft = !editing || (editing && form.status === 'DRAFT');
  
  return (
    <Portal>
      <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
        <form onSubmit={onSubmit} className="theme-modal-panel flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-4">
            <div>
              <h2 className="text-xl font-bold theme-text-primary">{mode === 'create' ? 'Add Material Purchase' : 'Edit Material Purchase'}</h2>
              <p className="text-sm text-slate-500">Supplier intake. Total cost is computed by backend.</p>
            </div>
            <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg p-2">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Raw Material <span className="text-red-500">*</span></span>
              <PremiumSelect
                value={form.materialTypeId}
                disabled={editing}
                onChange={(event: any) => setForm(data => ({ ...data, materialTypeId: event.target.value }))}
                className={`h-10 w-full text-sm font-semibold disabled:bg-slate-100 ${errors.materialTypeId ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
              >
                <option value="">Select raw material</option>
                {materialTypes.map(material => <option key={material.id} value={material.id}>{material.name} ({material.unit})</option>)}
              </PremiumSelect>
              {errors.materialTypeId && <p className="mt-1 text-xs text-red-500">{errors.materialTypeId}</p>}
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Supplier <span className="text-red-500">*</span></span>
              <PremiumSelect
                value={form.supplierId}
                disabled={editing}
                onChange={(event: any) => setForm(data => ({ ...data, supplierId: event.target.value }))}
                className={`h-10 w-full text-sm font-semibold disabled:bg-slate-100 ${errors.supplierId ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
              >
                <option value="">Select supplier</option>
                {suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </PremiumSelect>
              {errors.supplierId && <p className="mt-1 text-xs text-red-500">{errors.supplierId}</p>}
            </label>
            <Field label="Quantity" type="number" disabled={!isDraft} value={form.quantity} onChange={value => setForm(data => ({ ...data, quantity: value }))} required error={errors.quantity} />
            <Field label="Cost Per Unit" type="number" disabled={!isDraft} value={form.costPerUnit} onChange={value => setForm(data => ({ ...data, costPerUnit: value }))} required error={errors.costPerUnit} />
            <Field label="Purchase Date" type="date" disabled={!isDraft} value={form.purchaseDate} onChange={value => setForm(data => ({ ...data, purchaseDate: value }))} required error={errors.purchaseDate} />
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Status <span className="text-red-500">*</span></span>
              <PremiumSelect disabled={form.status === 'CANCELLED'} value={form.status} onChange={(event: any) => setForm(data => ({ ...data, status: event.target.value as RawMaterialPurchaseStatus }))} className={`h-10 w-full text-sm font-semibold disabled:bg-slate-100 ${errors.status ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                {PURCHASE_STATUSES.map(status => <option key={status} disabled={!isDraft && status === 'DRAFT'} value={status}>{formatStatus(status)}</option>)}
              </PremiumSelect>
              {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status}</p>}
            </label>
            <Field label="Invoice Number" disabled={!isDraft} value={form.invoiceNumber} onChange={value => setForm(data => ({ ...data, invoiceNumber: value }))} error={errors.invoiceNumber} />
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes</span>
              <textarea
                disabled={!isDraft}
                value={form.notes}
                onChange={event => setForm(data => ({ ...data, notes: event.target.value }))}
                rows={3}
                className={`w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[var(--color-accent)] disabled:bg-slate-100 ${errors.notes ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
              />
              {errors.notes && <p className="mt-1 text-xs text-red-500">{errors.notes}</p>}
            </label>
            </div>
          </div>
          <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 p-4">
            <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg px-4 py-2 text-sm font-semibold">Cancel</button>
            <button disabled={saving} className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Material Purchase
            </button>
          </div>
        </form>
      </div>
    </Portal>
  );
}
