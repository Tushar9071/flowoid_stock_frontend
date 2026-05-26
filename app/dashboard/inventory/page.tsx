'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AlertTriangle, Plus, Package, Layers, Gem, Bell, XCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { SkeletonCard, SkeletonForm, SkeletonTable } from '@/components/skeleton/Skeletons';
import { DataTable } from '@/components/shared/DataTable';
import { SimpleRecordModal, SimpleField } from '@/components/shared/simple-record-modal';
import { SearchInput } from '@/components/shared/search-input';
import { formatDate } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import { CurrentTenantService } from '@/lib/services/current-tenant.service';
import {
  BackendRecord,
  DesignService,
  InventoryService,
  responseItems,
  SupplementaryService,
} from '@/lib/services/business-modules.service';
import { RawMaterialService } from '@/lib/services/raw-material.service';
import { BackendTenant, RawMaterialStockSummary } from '@/lib/types';

type Tab = 'unpackaged' | 'packaged' | 'alerts' | 'supplementary';
type ModalMode = 'adjustment' | 'packaging' | 'alert' | 'view' | null;
type InventoryLoadingKey = 'stock' | 'rawStock' | 'packagingBatches' | 'alerts' | 'supplementary' | 'designs';
type InventoryLoadingState = Record<InventoryLoadingKey, boolean>;

function createLoadingState(value: boolean): InventoryLoadingState {
  return {
    stock: value,
    rawStock: value,
    packagingBatches: value,
    alerts: value,
    supplementary: value,
    designs: value,
  };
}

function prettyDate(value?: string | null) {
  if (!value) return '-';
  return formatDate(new Date(value));
}

function designCode(item: BackendRecord) {
  return item.design?.code || item.designCode || item.code || item.designId || '-';
}

function designName(item: BackendRecord) {
  return item.design?.name || item.designName || item.name || '-';
}

export default function InventoryPage() {
  const { hasPermission } = useAuth();
  const loadRunRef = useRef(0);
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [tab, setTab] = useState<Tab>('unpackaged');
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
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedStock, setSelectedStock] = useState<BackendRecord | null>(null);
  const [stockForm, setStockForm] = useState<Record<string, any>>({});

  const canCreate = hasPermission('stock_items.create') || hasPermission('inventory.create');
  const canUpdate = hasPermission('inventory.update');
  const isLoading = Object.values(loading).some(Boolean);
  const tabLoading =
    tab === 'unpackaged'
      ? loading.stock
      : tab === 'packaged'
        ? loading.packagingBatches
        : tab === 'alerts'
          ? loading.alerts || loading.rawStock
          : loading.supplementary;

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
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Failed to load inventory section "${key}"`, error);
        }
      } finally {
        finishLoading(key);
      }
    };

    try {
      const tenantRes = await CurrentTenantService.getCurrentTenant();
      if (!tenantRes.success || !tenantRes.data) {
        toast.error(tenantRes.error?.message || 'No business tenant found');
        if (loadRunRef.current === runId) {
          setLoading(createLoadingState(false));
        }
        return;
      }

      setTenant(tenantRes.data);
      const tenantId = tenantRes.data.id;

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
      if (loadRunRef.current === runId) {
        setLoading(createLoadingState(false));
      }
    }
  }, []);

  const pathname = usePathname();

  useEffect(() => {
    loadData();
  }, [loadData, pathname]);

  useEffect(() => {
    setPage(1);
  }, [tab, search]);



  const filteredStock = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return stock;
    return stock.filter(item =>
      designCode(item).toLowerCase().includes(term) ||
      designName(item).toLowerCase().includes(term)
    );
  }, [stock, search]);
  const paginatedStock = useMemo(() => filteredStock.slice((page - 1) * itemsPerPage, page * itemsPerPage), [filteredStock, page]);

  const filteredBatches = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return packagingBatches;
    return packagingBatches.filter(batch =>
      String(batch.batchNo || batch.id || '').toLowerCase().includes(term) ||
      designName(batch).toLowerCase().includes(term)
    );
  }, [packagingBatches, search]);
  const paginatedBatches = useMemo(() => filteredBatches.slice((page - 1) * itemsPerPage, page * itemsPerPage), [filteredBatches, page]);

  const allAlerts = useMemo(() => {
    const rawAlerts = rawStock.filter(item => item.isLow).map(item => ({
      ...item,
      id: item.materialTypeId,
      type: 'raw',
      name: item.name,
      module: 'Raw Materials',
      current: `${item.currentStock} ${item.unit}`,
      threshold: 'Low'
    }));
    const finishedAlerts = alerts.map((alert, index) => ({
      ...alert,
      id: alert.id || `finished-${index}`,
      type: 'finished',
      name: designName(alert),
      module: 'Finished Goods',
      current: alert.currentStock || alert.currentPieces || 0,
      threshold: alert.threshold || alert.lowStockThreshold || '-'
    }));
    return [...finishedAlerts, ...rawAlerts];
  }, [alerts, rawStock]);
  
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

  const tabs = [
    { id: 'unpackaged' as Tab, label: 'Finished Stock', icon: <Package className="h-4 w-4" />, count: stock.length },
    { id: 'packaged' as Tab, label: 'Packaging Batches', icon: <Layers className="h-4 w-4" />, count: packagingBatches.length },
    { id: 'alerts' as Tab, label: 'Low Stock Alerts', icon: <AlertTriangle className="h-4 w-4" />, count: alerts.length + rawStock.filter(item => item.isLow).length },
    { id: 'supplementary' as Tab, label: 'Supplementary', icon: <Plus className="h-4 w-4" />, count: supplementary.length },
  ];

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

  const stockFields: SimpleField[] = modalMode === 'packaging'
    ? [
        { name: 'designId', label: 'Design', type: 'select', required: true, options: designOptions },
        { 
          name: 'dozensPackaged', 
          label: 'Dozens Packaged', 
          type: 'number', 
          required: true,
          min: 1,
          max: maxPackagableDozens > 0 ? maxPackagableDozens : undefined,
          hint: selectedDesignStock ? `Available to pack: ${maxPackagableDozens} dozens (${selectedDesignStock.unpackagedPieces || selectedDesignStock.availablePieces || 0} pieces)` : 'Select a design to see available pieces'
        },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]
    : modalMode === 'alert'
      ? [
          { name: 'lowStockAlertAt', label: 'Low Stock Alert At', type: 'number', required: true, min: 0 },
        ]
      : [
          { name: 'designId', label: 'Design', type: 'select', required: true, options: designOptions },
          { name: 'type', label: 'Stock Type', type: 'select', required: true, options: [{ label: 'Unpackaged Pieces', value: 'UNPACKAGED' }, { label: 'Packaged Dozens', value: 'PACKAGED' }] },
          { 
            name: 'adjustment', 
            label: 'Adjustment', 
            type: 'number', 
            required: true,
            hint: selectedDesignStock ? `Current ${stockForm.type === 'PACKAGED' ? 'packaged' : 'unpackaged'} stock: ${currentTypeStock}. Add a negative number to reduce stock.` : ''
          },
          { name: 'notes', label: 'Notes', type: 'textarea', required: true },
        ];

  const openAdjustmentForm = (item?: BackendRecord) => {
    setSelectedStock(item || null);
    setModalMode('adjustment');
    setStockForm({
      designId: item?.designId || item?.design?.id || designs[0]?.id || '',
      type: 'UNPACKAGED',
      adjustment: 1,
      notes: '',
    });
  };

  const openPackagingForm = () => {
    setSelectedStock(null);
    setModalMode('packaging');
    setStockForm({ designId: designs[0]?.id || '', dozensPackaged: 1, notes: '' });
  };

  const openAlertForm = (item: BackendRecord) => {
    setSelectedStock(item);
    setModalMode('alert');
    setStockForm({
      lowStockAlertAt: item.lowStockAlertAt || item.lowStockThreshold || item.threshold || 0,
    });
  };

  const closeStockForm = () => {
    setModalMode(null);
    setSelectedStock(null);
    setStockForm({});
  };

  const saveStock = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentTenant = tenant || (await CurrentTenantService.getCurrentTenant()).data;
    if (!currentTenant?.id) return toast.error('Tenant not found');

    const designId = stockForm.designId || selectedStock?.designId || selectedStock?.design?.id;

    if (modalMode === 'packaging') {
      const dozens = Number(stockForm.dozensPackaged || 0);
      if (dozens <= 0) return toast.error('Dozens packaged must be greater than zero');
      if (dozens > maxPackagableDozens) return toast.error(`Cannot pack more than available stock (${maxPackagableDozens} dozens)`);
    } else if (modalMode === 'adjustment') {
      const adj = Number(stockForm.adjustment || 0);
      if (adj === 0) return toast.error('Adjustment cannot be zero');
      if (adj < 0 && Math.abs(adj) > currentTypeStock) {
        return toast.error(`Cannot reduce by more than current stock (${currentTypeStock})`);
      }
    }

    setSaving(true);
    try {
      let response;

      if (modalMode === 'packaging') {
        response = await InventoryService.createPackagingBatch(currentTenant.id, {
          designId,
          dozensPackaged: Number(stockForm.dozensPackaged || 0),
          notes: stockForm.notes || undefined,
        });
      } else if (modalMode === 'alert') {
        response = await InventoryService.updateLowStockAlert(currentTenant.id, designId, {
          lowStockAlertAt: Number(stockForm.lowStockAlertAt || 0),
        });
      } else {
        response = await InventoryService.createAdjustment(currentTenant.id, designId, {
          type: stockForm.type,
          adjustment: Number(stockForm.adjustment || 0),
          notes: stockForm.notes,
        });
      }

      if (!response?.success) throw new Error(response?.error?.message || 'Failed to save inventory action');
      toast.success('Inventory updated');
      closeStockForm();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save inventory action');
    } finally {
      setSaving(false);
    }
  };

  const viewStockByDesign = async (item: BackendRecord) => {
    const currentTenant = tenant || (await CurrentTenantService.getCurrentTenant()).data;
    const designId = item.designId || item.design?.id;
    if (!currentTenant?.id || !designId) return toast.error('Tenant or design not found');

    const response = await InventoryService.getStock(currentTenant.id, designId);
    if (response.success) {
      setSelectedStock({ ...item, details: response.data });
      setModalMode('view');
    } else {
      toast.error('Could not fetch specific stock details');
    }
  };

  return (
    <DashboardLayout
      title="Inventory Management"
      subtitle="Backend connected finished stock, packaging batches, low stock alerts, raw and supplementary stock"
      action={
        <div className="flex flex-wrap gap-2">
          {canCreate && (
            <button onClick={tab === 'packaged' ? openPackagingForm : () => openAdjustmentForm()} className="inline-flex items-center gap-2 rounded-lg theme-accent-btn px-5 py-2.5 text-sm font-semibold transition-colors">
              <Plus className="h-4 w-4" />
              {tab === 'packaged' ? 'Create Packaging' : 'Adjust Stock'}
            </button>
          )}
        </div>
      }
    >
      <div className="mb-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-[#e5e7eb] p-1">
        {tabs.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all ${tab === item.id ? 'theme-tab-active' : 'theme-tab-inactive'}`}>
            {item.icon} {item.label}
            <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-bold">{item.count}</span>
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          containerClassName="max-w-sm flex-1"
          inputClassName="h-9 rounded-lg border-[#e5e7eb] bg-[#f9fafb] focus:border-[#0F2A4A]"
          placeholder="Search design..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        {/* Refresh button removed — auto-refresh on route change */}
      </div>

      {tabLoading && tab === 'unpackaged' && <SkeletonTable rows={8} cols={6} />}
      {tabLoading && tab === 'packaged' && <SkeletonCard count={6} />}
      {tabLoading && tab === 'alerts' && <SkeletonTable rows={6} cols={5} />}
      {tabLoading && tab === 'supplementary' && <SkeletonForm fields={4} />}

      {!tabLoading && tab === 'unpackaged' && (
        <DataTable
          headers={['Design Code', 'Design Name', 'Unpackaged', 'Packaged', 'Threshold', 'Last Updated', 'Actions']}
          loading={loading.stock}
          page={page}
          totalPages={Math.ceil(filteredStock.length / itemsPerPage)}
          totalItems={filteredStock.length}
          onPageChange={setPage}
          emptyIcon={<Package className="h-6 w-6 text-slate-400" />}
          emptyTitle="No finished stock found"
        >
          {paginatedStock.map((item, index) => (
            <tr key={item.id || index} className="theme-table-row hover:bg-slate-50/50">
              <td className="px-5 py-3.5 text-sm font-semibold theme-text-primary">
                <div className="flex items-center gap-3">
                  <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg">
                    <Package className="h-4 w-4" />
                  </div>
                  {designCode(item)}
                </div>
              </td>
              <td className="px-5 py-3.5 text-sm font-bold text-[#374151]">{designName(item)}</td>
              <td className="px-5 py-3.5 text-right text-sm font-bold text-[#1a7a4a]">{item.unpackagedPieces || item.availablePieces || 0}</td>
              <td className="px-5 py-3.5 text-right text-sm font-semibold theme-text-primary">{item.packagedDozens || item.availableDozens || 0}</td>
              <td className="px-5 py-3.5 text-right text-sm text-[#6b7280]">{item.lowStockThreshold || item.threshold || '-'}</td>
              <td className="px-5 py-3.5 text-sm text-[#6b7280]">{prettyDate(item.updatedAt || item.lastUpdated)}</td>
              <td className="px-5 py-3.5">
                <div className="flex justify-end gap-2">
                  <button onClick={() => viewStockByDesign(item)} className="theme-secondary-btn rounded-lg px-3 py-1.5 text-xs font-semibold">View</button>
                  {canCreate && <button onClick={() => openAdjustmentForm(item)} className="theme-secondary-btn rounded-lg px-3 py-1.5 text-xs font-semibold">Adjust</button>}
                  {canUpdate && <button onClick={() => openAlertForm(item)} className="theme-secondary-btn rounded-lg px-3 py-1.5 text-xs font-semibold">Alert</button>}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {!tabLoading && tab === 'packaged' && (
        <DataTable
          headers={['Batch No', 'Design', 'Packaged (Dozens)', 'Date']}
          loading={loading.packagingBatches}
          page={page}
          totalPages={Math.ceil(filteredBatches.length / itemsPerPage)}
          totalItems={filteredBatches.length}
          onPageChange={setPage}
          emptyIcon={<Layers className="h-6 w-6 text-slate-400" />}
          emptyTitle="No packaging batches found"
        >
          {paginatedBatches.map(batch => (
            <tr key={batch.id} className="theme-table-row">
              <td className="px-5 py-3.5 text-sm font-semibold theme-text-primary">
                <div className="flex items-center gap-3">
                  <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg">
                    <Layers className="h-4 w-4" />
                  </div>
                  {batch.batchNo || batch.id?.slice(0, 8)}
                </div>
              </td>
              <td className="px-5 py-3.5 text-sm font-bold theme-text-primary">{designName(batch)}</td>
              <td className="px-5 py-3.5 text-right text-sm font-bold text-[#1a7a4a]">{batch.dozensPackaged || batch.packagedDozens || batch.dozenCount || 0} doz</td>
              <td className="px-5 py-3.5 text-right text-sm text-[#6b7280]">{prettyDate(batch.createdAt || batch.packagedAt)}</td>
            </tr>
          ))}
        </DataTable>
      )}

      {!tabLoading && tab === 'alerts' && (
        <DataTable
          headers={['Item', 'Module', 'Current', 'Threshold', 'Status', 'Action']}
          loading={loading.alerts || loading.rawStock}
          page={page}
          totalPages={Math.ceil(filteredAlerts.length / itemsPerPage)}
          totalItems={filteredAlerts.length}
          onPageChange={setPage}
          emptyIcon={<AlertTriangle className="h-6 w-6 text-slate-400" />}
          emptyTitle="No low stock alerts"
          emptySubtitle="All your items are well stocked!"
        >
          {paginatedAlerts.map((alert, index) => (
            <AlertRow 
              key={alert.id || index} 
              name={alert.name} 
              module={alert.module} 
              current={alert.current} 
              threshold={alert.threshold} 
              action={alert.type === 'finished' && canUpdate ? <button onClick={() => openAlertForm(alert)} className="theme-secondary-btn rounded-lg px-3 py-1.5 text-xs font-semibold">Update</button> : '-'} 
            />
          ))}
        </DataTable>
      )}

      {!tabLoading && tab === 'supplementary' && (
        <DataTable
          headers={['Item', 'Unit', 'Current Stock', 'Status', 'Updated']}
          loading={loading.supplementary}
          page={page}
          totalPages={Math.ceil(filteredSupplementary.length / itemsPerPage)}
          totalItems={filteredSupplementary.length}
          onPageChange={setPage}
          emptyIcon={<Plus className="h-6 w-6 text-slate-400" />}
          emptyTitle="No supplementary stock found"
        >
          {paginatedSupplementary.map((item, index) => (
            <tr key={item.id || index} className="theme-table-row">
              <td className="px-5 py-3.5 text-sm font-bold theme-text-primary">
                <div className="flex items-center gap-3">
                  <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg">
                    <Plus className="h-4 w-4" />
                  </div>
                  {item.name || '-'}
                </div>
              </td>
              <td className="px-5 py-3.5 text-sm text-[#6b7280]">{item.unit || '-'}</td>
              <td className="px-5 py-3.5 text-right text-sm font-bold text-[#1a7a4a]">{item.quantity || item.currentStock || item.stock || item.availablePieces || 0}</td>
              <td className="px-5 py-3.5"><StatusPill active={item.isActive !== false} /></td>
              <td className="px-5 py-3.5 text-right text-sm text-[#6b7280]">{prettyDate(item.updatedAt || item.createdAt)}</td>
            </tr>
          ))}
        </DataTable>
      )}

      {modalMode && modalMode !== 'view' && (
        <SimpleRecordModal
          title={modalMode === 'packaging' ? 'Create Packaging Batch' : modalMode === 'alert' ? 'Set Low Stock Alert' : 'Adjust Stock'}
          subtitle={modalMode === 'packaging' ? 'Convert unpackaged items into packaged dozens' : modalMode === 'alert' ? 'Get notified when stock falls below this threshold' : 'Manually adjust stock levels for a design'}
          fields={stockFields}
          values={stockForm}
          saving={saving}
          submitLabel={modalMode === 'packaging' ? 'Create Batch' : modalMode === 'alert' ? 'Save Alert' : 'Save Adjustment'}
          onChange={(name, value) => setStockForm(current => ({ ...current, [name]: value }))}
          onClose={closeStockForm}
          onSubmit={saveStock}
        />
      )}

      {modalMode === 'view' && selectedStock && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
          <div className="theme-modal-panel w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <h2 className="text-xl font-bold theme-text-primary">Stock Details</h2>
                <p className="text-sm text-slate-500">{designCode(selectedStock)} - {designName(selectedStock)}</p>
              </div>
              <button onClick={closeStockForm} className="theme-secondary-btn rounded-lg p-2 hover:bg-slate-100 transition-colors">
                <XCircle className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Unpackaged Pieces</p>
                  <p className="mt-1 text-3xl font-black theme-text-primary">{selectedStock.details?.unpackagedPieces || selectedStock.unpackagedPieces || selectedStock.availablePieces || 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Packaged Dozens</p>
                  <p className="mt-1 text-3xl font-black text-[#1a7a4a]">{selectedStock.details?.packagedDozens || selectedStock.packagedDozens || selectedStock.availableDozens || 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Low Stock Threshold</p>
                  <p className="mt-1 text-2xl font-black text-[#D97706]">{selectedStock.details?.lowStockThreshold || selectedStock.lowStockThreshold || selectedStock.threshold || '-'}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Last Updated</p>
                  <p className="text-sm font-bold theme-text-primary mt-1">{prettyDate(selectedStock.details?.updatedAt || selectedStock.updatedAt || selectedStock.lastUpdated)}</p>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-end">
               <button onClick={closeStockForm} className="theme-secondary-btn rounded-lg px-6 py-2.5 text-sm font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}


function AlertRow({ name, module, current, threshold, action }: { name: string; module: string; current: React.ReactNode; threshold: React.ReactNode; action: React.ReactNode }) {
  return (
    <tr className="theme-table-row">
      <td className="px-5 py-3.5 text-sm font-semibold theme-text-primary">{name}</td>
      <td className="px-5 py-3.5 text-sm text-[#6b7280]">{module}</td>
      <td className="px-5 py-3.5 text-sm font-semibold">{current}</td>
      <td className="px-5 py-3.5 text-sm text-[#6b7280]">{threshold}</td>
      <td className="px-5 py-3.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0f0] px-2.5 py-1 text-xs font-semibold text-[#cc2200]">
          <AlertTriangle className="h-3 w-3" /> Low
        </span>
      </td>
      <td className="px-5 py-3.5">{action}</td>
    </tr>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-[#e6f9f0] text-[#1a7a4a]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>{active ? 'Active' : 'Inactive'}</span>;
}

function EmptyState({ text, tenant }: { text: string; tenant?: BackendTenant | null }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center text-sm font-medium text-[#6b7280]">
      {tenant === null ? 'A tenant is required before inventory can be loaded.' : text}
    </div>
  );
}
