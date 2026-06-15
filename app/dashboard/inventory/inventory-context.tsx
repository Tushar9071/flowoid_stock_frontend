'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import {
  BackendRecord,
  DesignService,
  InventoryService,
  responseItems,
  SupplementaryService,
} from '@/lib/services/business-modules.service';
import { RawMaterialService } from '@/lib/services/raw-material.service';
import { BackendTenant, RawMaterialStockSummary } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalMode = 'adjustment' | 'packaging' | 'view' | null;
type InventoryLoadingKey = 'stock' | 'rawStock' | 'packagingBatches' | 'alerts' | 'supplementary' | 'designs';
type InventoryLoadingState = Record<InventoryLoadingKey, boolean>;

export function createLoadingState(value: boolean): InventoryLoadingState {
  return { stock: value, rawStock: value, packagingBatches: value, alerts: value, supplementary: value, designs: value };
}

// ─── Utility functions ────────────────────────────────────────────────────────

export function prettyDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

export function designCode(item: BackendRecord) {
  return item.design?.code || item.designCode || item.code || item.designId || '-';
}

export function designName(item: BackendRecord) {
  return item.design?.name || item.designName || item.name || '-';
}

// ─── Context ──────────────────────────────────────────────────────────────────

type InventoryContextValue = {
  tenant: BackendTenant | null;
  loading: InventoryLoadingState;
  stock: BackendRecord[];
  designs: BackendRecord[];
  rawStock: RawMaterialStockSummary[];
  packagingBatches: BackendRecord[];
  alerts: BackendRecord[];
  supplementary: BackendRecord[];
  saving: boolean;
  modalMode: ModalMode;
  selectedStock: BackendRecord | null;
  stockForm: Record<string, any>;
  formError: any;
  search: string;
  page: number;
  canCreate: boolean;
  canUpdate: boolean;
  designOptions: { label: string; value: string }[];
  selectedDesignStock: BackendRecord | null;
  maxPackagableDozens: number;
  currentTypeStock: number;
  allAlerts: BackendRecord[];
  filteredStock: BackendRecord[];
  filteredBatches: BackendRecord[];
  filteredAlerts: BackendRecord[];
  filteredSupplementary: BackendRecord[];
  paginatedStock: BackendRecord[];
  paginatedBatches: BackendRecord[];
  paginatedAlerts: BackendRecord[];
  paginatedSupplementary: BackendRecord[];
  itemsPerPage: number;
  setSearch: (v: string) => void;
  setPage: (p: number) => void;
  setStockForm: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  openAdjustmentForm: (item?: BackendRecord) => void;
  openPackagingForm: () => void;
  closeStockForm: () => void;
  saveStock: (event: React.FormEvent) => Promise<any>;
  viewStockByDesign: (item: BackendRecord) => Promise<any>;
  loadData: () => Promise<any>;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { hasPermission } = useAuth();
  const loadRunRef = useRef(0);
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;
  const [loading, setLoading] = useState<InventoryLoadingState>(() => createLoadingState(true));
  const [stock, setStock] = useState<BackendRecord[]>([]);
  const [designs, setDesigns] = useState<BackendRecord[]>([]);
  const [rawStock, setRawStock] = useState<RawMaterialStockSummary[]>([]);
  const [packagingBatches, setPackagingBatches] = useState<BackendRecord[]>([]);
  const [alerts, setAlerts] = useState<BackendRecord[]>([]);
  const [supplementary, setSupplementary] = useState<BackendRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedStock, setSelectedStock] = useState<BackendRecord | null>(null);
  const [stockForm, setStockForm] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState<any>(null);

  const canCreate = hasPermission('stock_items.create') || hasPermission('inventory.create');
  const canUpdate = hasPermission('inventory.update');

  const loadData = useCallback(async () => {
    const runId = loadRunRef.current + 1;
    loadRunRef.current = runId;
    setLoading(createLoadingState(true));

    const finishLoading = (key: InventoryLoadingKey) => {
      if (loadRunRef.current !== runId) return;
      setLoading(current => ({ ...current, [key]: false }));
    };

    const loadSection = async <T,>(
      key: InventoryLoadingKey,
      request: Promise<{ success: boolean; data: T; error?: { message?: string } }>,
      apply: (data: T) => void
    ) => {
      try {
        const response = await request;
        if (loadRunRef.current !== runId) return;
        if (response.success) apply(response.data);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') console.warn(`Failed to load inventory section "${key}"`, error);
      } finally {
        finishLoading(key);
      }
    };

    try {
      const tenantId = 'owner';
      await Promise.all([
        loadSection('stock', InventoryService.listStock(tenantId, { page: 1, limit: 100 }), data => setStock(responseItems(data))),
        loadSection('rawStock', RawMaterialService.stock(tenantId), data => setRawStock(data || [])),
        loadSection('packagingBatches', InventoryService.listPackagingBatches(tenantId, { page: 1, limit: 100 }), data => setPackagingBatches(responseItems(data))),
        loadSection('alerts', InventoryService.listLowStockAlerts(tenantId, { page: 1, limit: 100 }), data => setAlerts(responseItems(data))),
        loadSection('supplementary', SupplementaryService.list(tenantId, { page: 1, limit: 100 }), data => setSupplementary(responseItems(data))),
        loadSection('designs', DesignService.list(tenantId, { page: 1, limit: 100 }), data => setDesigns(responseItems(data))),
      ]);
    } catch {
      toast.error('Failed to load inventory data');
      if (loadRunRef.current === runId) setLoading(createLoadingState(false));
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [search]);

  const designOptions = designs.map(design => ({
    label: `${design.designCode || design.code || ''} ${design.name || ''}`.trim() || design.id,
    value: String(design.id),
  }));

  const selectedDesignStock = useMemo(() => {
    if (!stockForm.designId) return null;
    return stock.find(s => String(s.designId) === String(stockForm.designId) || String(s.design?.id) === String(stockForm.designId)) || null;
  }, [stockForm.designId, stock]);

  const maxPackagableDozens = selectedDesignStock
    ? Math.floor((selectedDesignStock.unpackagedPieces || selectedDesignStock.availablePieces || 0) / 12)
    : 0;

  const currentTypeStock = selectedDesignStock
    ? stockForm.type === 'PACKAGED'
      ? (selectedDesignStock.packagedDozens || selectedDesignStock.availableDozens || 0)
      : (selectedDesignStock.unpackagedPieces || selectedDesignStock.availablePieces || 0)
    : 0;

  const allAlerts = useMemo(() => {
    const rawAlerts = rawStock.filter(item => item.isLow).map(item => ({
      ...item, id: item.materialTypeId, type: 'raw', name: item.name, module: 'Raw Materials',
      current: `${item.currentStock} ${item.unit}`, threshold: 'Low',
    }));
    const finishedAlerts = alerts.map((alert, index) => ({
      ...alert, id: alert.id || `finished-${index}`, type: 'finished', name: designName(alert),
      module: 'Finished Goods', current: `${alert.availableDozens || 0} doz`, threshold: alert.lowStockThreshold || '-',
    }));
    return [...finishedAlerts, ...rawAlerts];
  }, [alerts, rawStock]);

  const filteredStock = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return stock;
    return stock.filter(item => designCode(item).toLowerCase().includes(term) || designName(item).toLowerCase().includes(term));
  }, [stock, search]);
  const paginatedStock = useMemo(() => filteredStock.slice((page - 1) * itemsPerPage, page * itemsPerPage), [filteredStock, page]);

  const filteredBatches = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return packagingBatches;
    return packagingBatches.filter(batch => String(batch.batchNo || batch.id || '').toLowerCase().includes(term) || designName(batch).toLowerCase().includes(term));
  }, [packagingBatches, search]);
  const paginatedBatches = useMemo(() => filteredBatches.slice((page - 1) * itemsPerPage, page * itemsPerPage), [filteredBatches, page]);

  const filteredAlerts = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return allAlerts;
    return allAlerts.filter(a => String(a.name || '').toLowerCase().includes(term));
  }, [allAlerts, search]);
  const paginatedAlerts = useMemo(() => filteredAlerts.slice((page - 1) * itemsPerPage, page * itemsPerPage), [filteredAlerts, page]);

  const filteredSupplementary = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return supplementary;
    return supplementary.filter(item => String(item.name || '').toLowerCase().includes(term));
  }, [supplementary, search]);
  const paginatedSupplementary = useMemo(() => filteredSupplementary.slice((page - 1) * itemsPerPage, page * itemsPerPage), [filteredSupplementary, page]);

  const openAdjustmentForm = (item?: BackendRecord) => {
    setSelectedStock(item || null);
    setFormError(null);
    setModalMode('adjustment');
    setStockForm({ designId: item?.designId || item?.design?.id || designs[0]?.id || '', type: 'UNPACKAGED', adjustment: 1, notes: '' });
  };

  const openPackagingForm = () => {
    setSelectedStock(null);
    setFormError(null);
    setModalMode('packaging');
    setStockForm({ designId: designs[0]?.id || '', dozensPackaged: 1, notes: '' });
  };

  const closeStockForm = () => { setModalMode(null); setSelectedStock(null); setStockForm({}); setFormError(null); };

  const saveStock = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentTenant = tenant;
    if (!currentTenant?.id) return toast.error('Tenant not found');
    const designId = stockForm.designId || selectedStock?.designId || selectedStock?.design?.id;
    if (modalMode === 'packaging') {
      const dozens = Number(stockForm.dozensPackaged || 0);
      if (dozens <= 0) return toast.error('Dozens packaged must be greater than zero');
      if (dozens > maxPackagableDozens) return toast.error(`Cannot pack more than available stock (${maxPackagableDozens} dozens)`);
    } else if (modalMode === 'adjustment') {
      const adj = Number(stockForm.adjustment || 0);
      if (adj === 0) return toast.error('Adjustment cannot be zero');
      if (adj < 0 && Math.abs(adj) > currentTypeStock) return toast.error(`Cannot reduce by more than current stock (${currentTypeStock})`);
    }
    setSaving(true);
    try {
      let response;
      if (modalMode === 'packaging') {
        response = await InventoryService.createPackagingBatch(currentTenant.id, { designId, dozensPackaged: Number(stockForm.dozensPackaged || 0), notes: stockForm.notes || undefined });
      } else {
        response = await InventoryService.createAdjustment(currentTenant.id, designId, { type: stockForm.type, adjustment: Number(stockForm.adjustment || 0), notes: stockForm.notes });
      }
      if (!response?.success) { setFormError(response.error); return; }
      toast.success('Inventory updated');
      closeStockForm();
      await loadData();
    } catch (error: any) { setFormError(error); } finally { setSaving(false); }
  };

  const viewStockByDesign = async (item: BackendRecord) => {
    const currentTenant = tenant;
    const designId = item.designId || item.design?.id;
    if (!currentTenant?.id || !designId) return toast.error('Tenant or design not found');
    const response = await InventoryService.getStock(currentTenant.id, designId);
    if (response.success) { setSelectedStock({ ...item, details: response.data }); setModalMode('view'); }
    else toast.error('Could not fetch specific stock details');
  };

  return (
    <InventoryContext.Provider value={{
      tenant, loading, stock, designs, rawStock, packagingBatches, alerts, supplementary,
      saving, modalMode, selectedStock, stockForm, formError, search, page,
      canCreate, canUpdate, designOptions, selectedDesignStock, maxPackagableDozens, currentTypeStock,
      allAlerts, filteredStock, filteredBatches, filteredAlerts, filteredSupplementary,
      paginatedStock, paginatedBatches, paginatedAlerts, paginatedSupplementary, itemsPerPage,
      setSearch, setPage, setStockForm,
      openAdjustmentForm, openPackagingForm, closeStockForm, saveStock, viewStockByDesign, loadData,
    }}>
      {children}
    </InventoryContext.Provider>
  );
}
