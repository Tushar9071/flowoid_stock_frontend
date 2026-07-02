'use client';

import React, { FormEvent } from 'react';
import Link from 'next/link';
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

export function StockGrid({ stock, hasFilter }: { stock: RawMaterialStockSummary[]; hasFilter?: boolean }) {
  if (stock.length === 0) {
    return <StockEmptyState hasFilter={!!hasFilter} />;
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

function StockEmptyState({ hasFilter }: { hasFilter: boolean }) {
  if (hasFilter) {
    return (
      <div style={{ border: '1px dashed #D6DBE3', borderRadius: '14px', padding: '40px 24px', textAlign: 'center', margin: '16px', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: '#F1F3F7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7688" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0B1629', margin: '0 0 6px' }}>No materials match your search.</h3>
        <p style={{ fontSize: 13, color: '#6B7688', margin: 0 }}>Try a different term or clear the filter to see all stock.</p>
      </div>
    );
  }
  return (
    <div style={{ border: '1px dashed #D6DBE3', borderRadius: '14px', padding: '40px 24px', textAlign: 'center', margin: '16px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: 52, height: 52, borderRadius: 12, background: '#F1F3F7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7688" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
        </svg>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0B1629', margin: '0 0 6px' }}>No raw materials added yet.</h3>
      <p style={{ fontSize: 13, color: '#6B7688', margin: 0 }}>Add a raw material type first to start tracking stock levels.</p>
    </div>
  );
}

// ─── TypesTable ───────────────────────────────────────────────────────────────

export function TypesTable({ types, canUpdate, canDelete, onEdit, onDelete, onStatusChange, loading, page, totalPages, totalItems, onPageChange }: {
  types: RawMaterialType[]; canUpdate: boolean; canDelete: boolean;
  onEdit: (material: RawMaterialType) => void; onDelete: (material: RawMaterialType) => void;
  onStatusChange?: (id: string, newStatus: string) => Promise<any>;
  loading: boolean; page: number; totalPages: number; totalItems: number; onPageChange: (page: number) => void;
}) {
  return (
    <AdvancedDataTable
      data={types}
      searchable={false}
      loading={loading}
      emptyIcon={<Package className="h-6 w-6 text-slate-400" />}
      emptyTitle="No raw materials found"
      onStatusChange={onStatusChange}
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
          render: (row) => {
            const isPurchase = Number(row.quantity) > 0;
            
            const formatId = (id?: string, isPur = false) => {
              if (!id) return '';
              return id.length > 20 ? `${isPur ? 'PUR' : 'ID'}-${shortId(id).toUpperCase()}` : id;
            };

            const refText = isPurchase 
              ? (row.notes?.includes('PUR') ? row.notes : (row.notes === 'INITIAL_STOCK' ? 'Initial Stock' : (formatId(row.assignmentId, true) || 'Purchase')))
              : (row.assignmentId === 'OWNER' ? 'Owner' : (row.notes || formatId(row.assignmentId, false)));

            return (
              <div className="flex items-center gap-3">
                <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg"><FileText className="h-4 w-4" /></div>
                <div>
                  <p className="theme-text-primary font-bold">{materialLabel(row, types)}</p>
                  <p className="text-sm text-slate-500">{refText}</p>
                </div>
              </div>
            );
          }
        },
        { field: 'quantity', header: 'Qty / Unit', sortable: true, getValue: (row) => `${Math.abs(Number(row.quantity))} ${materialUnit(row, types)}`, render: (row) => {
            const isPurchase = Number(row.quantity) > 0;
            return <div className={`font-semibold ${isPurchase ? 'text-emerald-600' : 'text-red-500'}`}>{isPurchase ? '+' : '-'}{Math.abs(Number(row.quantity))} {materialUnit(row, types)}</div>;
        } },
        { field: 'issuedAt', header: 'Date', sortable: true, filterable: true, filterType: 'date', getValue: (row) => row.issuedAt, render: (row) => <div className="text-slate-500">{prettyDate(row.issuedAt)}</div> },
        { field: 'status', header: 'Status', render: (row) => {
            const isPurchase = Number(row.quantity) > 0;
            if (isPurchase || row.assignmentId === 'OWNER') {
              return <span className="rounded-full border px-3 py-1 text-xs font-bold border-emerald-200 bg-emerald-50 text-emerald-700">Purchased</span>;
            }
            return <span className="rounded-full border px-3 py-1 text-xs font-bold border-indigo-200 bg-indigo-50 text-indigo-700">Issued</span>;
        } },
        { field: 'notes', header: 'Notes', sortable: true, render: (row) => {
            let displayNotes = row.notes === 'INITIAL_STOCK' || row.notes === 'PURCHASE' || row.notes === 'ASSIGNMENT' ? '-' : (row.notes || '-');
            
            const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
            if (displayNotes.match(uuidRegex)) {
              const prefix = Number(row.quantity) > 0 ? 'PUR' : 'ID';
              displayNotes = displayNotes.replace(uuidRegex, (match) => `${prefix}-${shortId(match).toUpperCase()}`);
            }
            
            return <div className="text-slate-500">{displayNotes}</div>;
        } }
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
