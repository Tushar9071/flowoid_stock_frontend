'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Plus, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { SimpleRecordModal, SimpleField } from '@/components/shared/simple-record-modal';
import { InventoryProvider, useInventory, designCode, designName, prettyDate } from './inventory-context';

function InventoryModals() {
  const {
    modalMode, selectedStock, saving, stockForm, formError, designOptions,
    selectedDesignStock, maxPackagableDozens, currentTypeStock,
    setStockForm, closeStockForm, saveStock,
  } = useInventory();

  const stockFields: SimpleField[] = modalMode === 'packaging'
    ? [
        { name: 'designId', label: 'Design', type: 'select', required: true, options: designOptions },
        {
          name: 'dozensPackaged', label: 'Dozens Packaged', type: 'number', required: true,
          min: 1,
          max: maxPackagableDozens > 0 ? maxPackagableDozens : undefined,
          hint: selectedDesignStock ? `Available to pack: ${maxPackagableDozens} dozens (${selectedDesignStock.unpackagedPieces || selectedDesignStock.availablePieces || 0} pieces)` : 'Select a design to see available pieces',
        },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]
    : [
        { name: 'designId', label: 'Design', type: 'select', required: true, options: designOptions },
        {
          name: 'adjustment', label: 'Adjustment (Packaged Dozens)', type: 'number', required: true,
          hint: 'Add a negative number to reduce stock. Only packaged dozens can be manually adjusted.',
        },
        { name: 'notes', label: 'Notes', type: 'textarea', required: true },
      ];

  return (
    <>
      {modalMode && modalMode !== 'view' && (
        <SimpleRecordModal
          title={modalMode === 'packaging' ? 'Create Packaging Batch' : 'Adjust Stock'}
          subtitle={modalMode === 'packaging' ? 'Convert unpackaged items into packaged dozens' : 'Manually adjust stock levels for a design'}
          fields={stockFields}
          values={stockForm}
          saving={saving}
          apiError={formError}
          submitLabel={modalMode === 'packaging' ? 'Create Batch' : 'Save Adjustment'}
          onChange={(name, value) => setStockForm(current => ({ ...current, [name]: value }))}
          onClose={closeStockForm}
          onSubmit={saveStock}
        />
      )}

      {modalMode === 'view' && selectedStock && (
        <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
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
    </>
  );
}

function InventoryLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { canCreate, openPackagingForm, openAdjustmentForm } = useInventory();

  let title = 'Inventory Management';
  let subtitle = 'Backend connected finished stock, packaging batches, low stock alerts, raw and supplementary stock';
  let action: React.ReactNode = undefined;

  if (pathname === '/dashboard/inventory') {
    title = 'Finished Stock';
    subtitle = 'Unpackaged pieces and packaged dozens per design';
    if (canCreate) action = (
      <button onClick={() => openAdjustmentForm()} className="inline-flex items-center gap-2 rounded-lg theme-accent-btn px-5 py-2.5 text-sm font-semibold transition-colors">
        <Plus className="h-4 w-4" /> Adjust Stock
      </button>
    );
  } else if (pathname.startsWith('/dashboard/inventory/packaging')) {
    title = 'Packaging Batches';
    subtitle = 'Convert unpackaged items into packaged dozens';
    if (canCreate) action = (
      <button onClick={openPackagingForm} className="inline-flex items-center gap-2 rounded-lg theme-accent-btn px-5 py-2.5 text-sm font-semibold transition-colors">
        <Plus className="h-4 w-4" /> Create Packaging
      </button>
    );

  } else if (pathname.startsWith('/dashboard/inventory/supplementary')) {
    title = 'Supplementary Stock';
    subtitle = 'Additional stock items and supplementary inventory';
  }

  return (
    <DashboardLayout title={title} subtitle={subtitle} action={action}>
      {children}
      <InventoryModals />
    </DashboardLayout>
  );
}

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <InventoryProvider>
      <InventoryLayoutInner>
        {children}
      </InventoryLayoutInner>
    </InventoryProvider>
  );
}
