'use client';

import React, { FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, Edit3, FileText, Loader2, Package, Trash2, Truck, X } from 'lucide-react';
import { AdvancedDataTable } from '@/components/shared/DataTable';
import { PremiumSelect } from '@/components/ui/PremiumSelect';
import { RawMaterialIssuance, RawMaterialPurchase, RawMaterialPurchaseStatus, RawMaterialStockSummary, RawMaterialType } from '@/lib/types';
import {
  Portal,
  formatStatus,
  materialLabel,
  materialUnit,
  money,
  prettyDate,
  shortId,
  statusPill,
  supplierLabel,
  PURCHASE_STATUSES,
  UNITS,
} from './raw-materials-context';
import { PartyDropdownItem, RawMaterialUnit } from '@/lib/types';

// ─── TypeForm / PurchaseForm types (re-exported for use in sub-pages) ──────────

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

type TypeModalMode = 'create' | 'edit';
type PurchaseModalMode = 'create' | 'edit';

// ─── Metric ───────────────────────────────────────────────────────────────────

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="theme-text-primary text-[15px] font-bold">{value}</p>
    </div>
  );
}

// ─── StockGrid ────────────────────────────────────────────────────────────────

export function StockGrid({ stock }: { stock: RawMaterialStockSummary[] }) {
  if (stock.length === 0) {
    return <div className="p-12 text-center text-sm font-medium text-slate-500">No stock data found.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-5 p-4 md:grid-cols-2">
      {stock.map((item, index) => {
        const purchased = Number(item.totalPurchased || 0);
        const current = Number(item.currentStock || 0);
        const stockPercentage = purchased > 0 ? Math.max(0, (current / purchased) * 100) : 0;
        const itemKey = item.materialTypeId || (item as any).id || `stock-item-${index}`;
        return (
          <div key={itemKey} className={`flex overflow-hidden rounded-2xl border bg-white ${item.isLow ? 'border-l-4 border-l-theme-status-critical' : 'theme-card-accent'}`}>
            <div className="flex-1 p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <span className="mb-1.5 inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{item.unit}</span>
                  <h3 className="theme-text-primary text-[18px] font-bold leading-tight">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">Issued: {item.totalIssued} {item.unit}</p>
                </div>
                {item.isLow ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                    <AlertTriangle className="h-3 w-3" /> Reorder Required
                  </span>
                ) : (
                  <span className="theme-badge-soft inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">Adequate</span>
                )}
              </div>
              <div className="mb-4 border-t border-slate-100" />
              <div className="mb-4 grid grid-cols-2 gap-4">
                <Metric label="Available Stock" value={`${item.currentStock} ${item.unit}`} />
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

// ─── TypesTable ───────────────────────────────────────────────────────────────

export function TypesTable({ types, canUpdate, canDelete, onEdit, onDelete, loading, page, totalPages, totalItems, onPageChange }: {
  types: RawMaterialType[]; canUpdate: boolean; canDelete: boolean;
  onEdit: (material: RawMaterialType) => void; onDelete: (material: RawMaterialType) => void;
  loading: boolean; page: number; totalPages: number; totalItems: number; onPageChange: (page: number) => void;
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
          field: 'name', header: 'Item', sortable: true, filterable: true, filterType: 'text',
          render: (row) => (
            <div className="flex items-center gap-3">
              <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg"><Package className="h-4 w-4" /></div>
              <div>
                <p className="theme-text-primary font-bold">{row.name}</p>
                <p className="text-sm text-slate-500">{row.description || '-'}</p>
              </div>
            </div>
          )
        },
        { field: 'unit', header: 'Unit', sortable: true, filterable: true, filterType: 'text', render: (row) => <div className="font-semibold">{row.unit}</div> },
        { field: 'currentStock', header: 'Qty / Stock', sortable: true, getValue: (row) => row.currentStock || '0', render: (row) => <div className="font-semibold">{row.currentStock || '0'}</div> },
        {
          field: 'status', header: 'Status', sortable: true, filterable: true, filterType: 'boolean', getValue: (row) => row.isActive,
          render: (row) => <span className={`rounded-full border px-3 py-1 text-xs font-bold ${row.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>{row.isActive ? 'Active' : 'Inactive'}</span>
        },
        { field: 'createdAt', header: 'Date', sortable: true, filterable: true, filterType: 'date', render: (row) => <div className="text-slate-500">{prettyDate(row.createdAt)}</div> },
        {
          field: 'actions', header: 'Actions',
          render: (row) => (
            <div className="flex justify-end gap-2">
              {canUpdate && <button onClick={() => onEdit(row)} className="theme-secondary-btn rounded-lg p-2" title="Edit raw material"><Edit3 className="h-4 w-4" /></button>}
              {canDelete && <button onClick={() => onDelete(row)} className="theme-danger-btn rounded-lg p-2" title="Delete raw material"><Trash2 className="h-4 w-4" /></button>}
            </div>
          )
        }
      ]}
    />
  );
}

// ─── PurchasesTable ───────────────────────────────────────────────────────────

export function PurchasesTable({ purchases, types, suppliers, canUpdate, canDelete, canApprove, onEdit, onDelete, onFinalise, loading, page, totalPages, totalItems, onPageChange }: {
  purchases: RawMaterialPurchase[]; types: RawMaterialType[]; suppliers: PartyDropdownItem[];
  canUpdate: boolean; canDelete: boolean; canApprove: boolean;
  onEdit: (purchase: RawMaterialPurchase) => void;
  onDelete: (purchase: RawMaterialPurchase) => void;
  onFinalise: (purchase: RawMaterialPurchase) => void;
  loading: boolean; page: number; totalPages: number; totalItems: number; onPageChange: (page: number) => void;
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
          field: 'item', header: 'Item', sortable: true, filterable: true, filterType: 'text',
          getValue: (row) => materialLabel(row, types),
          render: (row) => (
            <div className="flex items-center gap-3">
              <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg"><Truck className="h-4 w-4" /></div>
              <div>
                <p className="theme-text-primary font-bold">{materialLabel(row, types)}</p>
                <p className="text-sm text-slate-500">{row.invoiceNumber || `ID ${shortId(row.id)}`}</p>
              </div>
            </div>
          )
        },
        { field: 'supplier', header: 'Supplier', sortable: true, filterable: true, filterType: 'text', getValue: (row) => supplierLabel(row, suppliers), render: (row) => <div>{supplierLabel(row, suppliers)}</div> },
        { field: 'quantity', header: 'Qty / Unit', sortable: true, getValue: (row) => `${row.quantity} ${materialUnit(row, types)}`, render: (row) => <div className="font-semibold">{row.quantity} {materialUnit(row, types)}</div> },
        { field: 'costPerUnit', header: 'Cost / Unit', sortable: true, getValue: (row) => Number(row.costPerUnit || 0), render: (row) => <div>{money(row.costPerUnit)}</div> },
        { field: 'totalCost', header: 'Total', sortable: true, getValue: (row) => Number(row.totalCost || 0), render: (row) => <div className="font-bold">{money(row.totalCost)}</div> },
        { field: 'status', header: 'Status', sortable: true, filterable: true, filterType: 'text', getValue: (row) => row.status, render: (row) => <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusPill(row.status)}`}>{formatStatus(row.status)}</span> },
        { field: 'purchaseDate', header: 'Date', sortable: true, filterable: true, filterType: 'date', getValue: (row) => row.purchaseDate, render: (row) => <div className="text-slate-500">{prettyDate(row.purchaseDate)}</div> },
        {
          field: 'actions', header: 'Actions',
          render: (row) => (
            <div className="flex justify-end gap-2">
              {canUpdate && row.status === 'DRAFT' && <button onClick={() => onEdit(row)} className="theme-secondary-btn rounded-lg p-2" title="Edit material purchase"><Edit3 className="h-4 w-4" /></button>}
              {canApprove && row.status === 'DRAFT' && <button onClick={() => onFinalise(row)} className="theme-accent-btn rounded-lg p-2" title="Mark as Stock Received"><CheckCircle2 className="h-4 w-4" /></button>}
              {canDelete && row.status !== 'CANCELLED' && <button onClick={() => onDelete(row)} className="theme-danger-btn rounded-lg p-2" title="Cancel material purchase"><Trash2 className="h-4 w-4" /></button>}
            </div>
          )
        }
      ]}
    />
  );
}

// ─── IssuancesTable ───────────────────────────────────────────────────────────

export function IssuancesTable({ issuances, types, loading, page, totalPages, totalItems, onPageChange }: {
  issuances: RawMaterialIssuance[]; types: RawMaterialType[];
  loading: boolean; page: number; totalPages: number; totalItems: number; onPageChange: (page: number) => void;
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
          field: 'item', header: 'Item', sortable: true, filterable: true, filterType: 'text',
          getValue: (row) => materialLabel(row, types),
          render: (row) => (
            <div className="flex items-center gap-3">
              <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg"><FileText className="h-4 w-4" /></div>
              <div>
                <p className="theme-text-primary font-bold">{materialLabel(row, types)}</p>
                <p className="text-sm text-slate-500">Reference: {row.assignmentId}</p>
              </div>
            </div>
          )
        },
        { field: 'quantity', header: 'Qty / Unit', sortable: true, getValue: (row) => `${row.quantity} ${materialUnit(row, types)}`, render: (row) => <div className="font-semibold">{row.quantity} {materialUnit(row, types)}</div> },
        { field: 'issuedAt', header: 'Date', sortable: true, filterable: true, filterType: 'date', getValue: (row) => row.issuedAt, render: (row) => <div className="text-slate-500">{prettyDate(row.issuedAt)}</div> },
        { field: 'status', header: 'Status', render: () => <span className="rounded-full border px-3 py-1 text-xs font-bold border-indigo-200 bg-indigo-50 text-indigo-700">Issued</span> },
        { field: 'notes', header: 'Notes', sortable: true, render: (row) => <div className="text-slate-500">{row.notes || '-'}</div> }
      ]}
    />
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

export function Field({ label, value, onChange, disabled, type = 'text', required = false, placeholder, error }: {
  label: string; value: string; onChange: (value: string) => void;
  disabled?: boolean; type?: string; required?: boolean; placeholder?: string; error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        type={type} value={value} onChange={event => onChange(event.target.value)}
        disabled={disabled} required={required} placeholder={placeholder}
        className={`h-10 w-full text-sm disabled:bg-slate-100 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </label>
  );
}

// ─── TypeModal ────────────────────────────────────────────────────────────────

export function TypeModal({ mode, form, errors, setForm, suppliers, saving, onClose, onSubmit }: {
  mode: TypeModalMode; form: TypeForm; errors: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<TypeForm>>; suppliers: PartyDropdownItem[];
  saving: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void;
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
            <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg p-2"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid gap-4">
              <Field label="Name" value={form.name} onChange={value => setForm(data => ({ ...data, name: value }))} required error={errors.name} />
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Unit <span className="text-red-500">*</span></span>
                <PremiumSelect value={form.unit} onChange={(event: any) => setForm((data: any) => ({ ...data, unit: event.target.value as RawMaterialUnit }))} className={`h-10 w-full text-sm font-semibold ${errors.unit ? 'border-red-500' : ''}`}>
                  {UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                </PremiumSelect>
                {errors.unit && <p className="mt-1 text-xs text-red-500">{errors.unit}</p>}
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Description</span>
                <textarea value={form.description} onChange={event => setForm(data => ({ ...data, description: event.target.value }))} rows={3} className={`w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[var(--color-accent)] ${errors.description ? 'border-red-500' : ''}`} />
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
                          <PremiumSelect value={form.supplierId || ''} onChange={(event: any) => setForm((data: any) => ({ ...data, supplierId: event.target.value }))} className="h-10 w-full text-sm font-semibold disabled:bg-slate-100">
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

// ─── PurchaseModal ────────────────────────────────────────────────────────────

export function PurchaseModal({ mode, form, errors, setForm, materialTypes, suppliers, saving, editing, onClose, onSubmit }: {
  mode: PurchaseModalMode; form: PurchaseForm; errors: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<PurchaseForm>>; materialTypes: RawMaterialType[];
  suppliers: PartyDropdownItem[]; saving: boolean; editing: boolean;
  onClose: () => void; onSubmit: (event: FormEvent) => void;
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
            <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg p-2"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Raw Material <span className="text-red-500">*</span></span>
                <PremiumSelect value={form.materialTypeId} disabled={editing} onChange={(event: any) => setForm(data => ({ ...data, materialTypeId: event.target.value }))} className={`h-10 w-full text-sm font-semibold disabled:bg-slate-100 ${errors.materialTypeId ? 'border-red-500' : ''}`}>
                  <option value="">Select raw material</option>
                  {materialTypes.map(material => <option key={material.id} value={material.id}>{material.name} ({material.unit})</option>)}
                </PremiumSelect>
                {errors.materialTypeId && <p className="mt-1 text-xs text-red-500">{errors.materialTypeId}</p>}
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Supplier <span className="text-red-500">*</span></span>
                <PremiumSelect value={form.supplierId} disabled={editing} onChange={(event: any) => setForm(data => ({ ...data, supplierId: event.target.value }))} className={`h-10 w-full text-sm font-semibold disabled:bg-slate-100 ${errors.supplierId ? 'border-red-500' : ''}`}>
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
                <PremiumSelect disabled={form.status === 'CANCELLED'} value={form.status} onChange={(event: any) => setForm(data => ({ ...data, status: event.target.value as RawMaterialPurchaseStatus }))} className={`h-10 w-full text-sm font-semibold disabled:bg-slate-100 ${errors.status ? 'border-red-500' : ''}`}>
                  {PURCHASE_STATUSES.map(status => <option key={status} disabled={!isDraft && status === 'DRAFT'} value={status}>{formatStatus(status)}</option>)}
                </PremiumSelect>
                {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status}</p>}
              </label>
              <Field label="Invoice Number" disabled={!isDraft} value={form.invoiceNumber} onChange={value => setForm(data => ({ ...data, invoiceNumber: value }))} error={errors.invoiceNumber} />
              <label className="block md:col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes</span>
                <textarea disabled={!isDraft} value={form.notes} onChange={event => setForm(data => ({ ...data, notes: event.target.value }))} rows={3} className={`w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[var(--color-accent)] disabled:bg-slate-100 ${errors.notes ? 'border-red-500' : ''}`} />
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
