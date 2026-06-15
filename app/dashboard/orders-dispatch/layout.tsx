'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { FileText, Plus, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { SimpleField, SimpleRecordModal } from '@/components/shared/simple-record-modal';
import { OrdersProvider, useOrders, normalizedOrderStatus, orderDispatchDate, orderItems, orderId, orderTrackingRef, openOrderDocument, prettyDate, dealerCode, dealerName, orderNumber, formatCurrency } from './orders-context';

function OrdersModals() {
  const {
    modalMode, form, formError, saving, selectedOrder, selectedDesignAvailability,
    designOptions, dealerOptions, tenant,
    setForm, closeModal, saveModal, dispatchSummary, setDispatchSummary,
  } = useOrders();

  function modalTitle(mode: NonNullable<typeof modalMode>) {
    return { create: 'Create Order', editOrder: 'Edit Order', addItem: 'Add Order Item', editItem: 'Edit Order Item', dispatch: 'Dispatch Order', cancel: 'Cancel Order' }[mode];
  }
  function modalSubmit(mode: NonNullable<typeof modalMode>) {
    return { create: 'Create Order', editOrder: 'Update Order', addItem: 'Add Item', editItem: 'Update Item', dispatch: 'Dispatch', cancel: 'Cancel Order' }[mode];
  }

  const modalFields = React.useMemo<SimpleField[]>(() => {
    if (modalMode === 'create') return [
      { name: 'dealerId', label: 'Dealer', type: 'select', required: true, options: dealerOptions },
      { name: 'designId', label: 'Design', type: 'select', required: true, options: designOptions },
      { name: 'quantityDozens', label: 'Quantity Dozens', type: 'number', required: true, hint: selectedDesignAvailability !== null ? `Available: ${selectedDesignAvailability} dozens` : undefined },
      { name: 'pricePerDozen', label: 'Price Per Dozen', type: 'number', required: true },
      { name: 'isCreditOrder', label: 'Credit Order', type: 'checkbox' },
      { name: 'discountAmount', label: 'Discount', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ];
    if (modalMode === 'editOrder') return [
      { name: 'isCreditOrder', label: 'Credit Order', type: 'checkbox' },
      { name: 'discountAmount', label: 'Discount', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ];
    if (modalMode === 'addItem') return [
      { name: 'designId', label: 'Design', type: 'select', required: true, options: designOptions },
      { name: 'quantityDozens', label: 'Quantity Dozens', type: 'number', required: true, hint: selectedDesignAvailability !== null ? `Available: ${selectedDesignAvailability} dozens` : undefined },
      { name: 'pricePerDozen', label: 'Price Per Dozen', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ];
    if (modalMode === 'editItem') return [
      { name: 'quantityDozens', label: 'Quantity Dozens', type: 'number', required: true },
      { name: 'pricePerDozen', label: 'Price Per Dozen', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ];
    if (modalMode === 'dispatch') return [
      { name: 'transportMode', label: 'Transport Mode', required: true },
      { name: 'trackingRef', label: 'Tracking Reference' },
      { name: 'dispatchedAt', label: 'Dispatch Time', type: 'datetime-local' },
    ];
    if (modalMode === 'cancel') return [{ name: 'cancelReason', label: 'Cancel Reason', type: 'textarea', required: true }];
    return [];
  }, [dealerOptions, designOptions, modalMode, selectedDesignAvailability]);

  // dispatch summary status pill
  const StatusPill = ({ status }: { status: string }) => {
    const normalized = status.toLowerCase();
    const cls =
      normalized === 'delivered' ? 'bg-[#e6f9f0] text-[#1a7a4a]' :
      normalized === 'packed' || normalized === 'dispatched' || normalized === 'partially_dispatched' ? 'bg-[#fffbeb] text-[#d97706]' :
      normalized === 'draft' || normalized === 'cancelled' ? 'bg-[#fff0f0] text-[#cc2200]' :
      'bg-[#f3f4f6] text-[#6b7280]';
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>{normalized.replace(/_/g, ' ')}</span>;
  };

  return (
    <>
      {modalMode && (
        <SimpleRecordModal
          title={modalTitle(modalMode)}
          subtitle="Saved through the tenant scoped Swagger order APIs"
          fields={modalFields}
          values={form}
          saving={saving}
          apiError={formError}
          submitLabel={modalSubmit(modalMode)}
          onChange={(name, value) => setForm(current => ({ ...current, [name]: value }))}
          onClose={closeModal}
          onSubmit={saveModal}
        />
      )}

      {dispatchSummary && (
        <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
          <div className="theme-modal-panel w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <h2 className="text-xl font-bold theme-text-primary">Dispatch Summary</h2>
                <p className="text-sm text-slate-500">{dispatchSummary.orderNo || dispatchSummary.orderNumber || dispatchSummary.id || 'Order dispatch details'}</p>
              </div>
              <button onClick={() => setDispatchSummary(null)} className="theme-secondary-btn rounded-lg p-2"><XCircle className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-4 sm:p-6 bg-slate-50">
              {/* Compact order summary */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div><p className="text-xs uppercase text-slate-400 font-semibold">Order No</p><p className="mt-1 font-bold theme-text-primary">{dispatchSummary.orderNo || dispatchSummary.orderNumber || dispatchSummary.id}</p></div>
                  <div><p className="text-xs uppercase text-slate-400 font-semibold">Status</p><div className="mt-1"><StatusPill status={normalizedOrderStatus(dispatchSummary)} /></div></div>
                  <div><p className="text-xs uppercase text-slate-400 font-semibold">Dealer</p><p className="mt-1 font-semibold theme-text-primary text-sm">{dispatchSummary.party?.name || dispatchSummary.dealer?.name || '-'}</p></div>
                  <div><p className="text-xs uppercase text-slate-400 font-semibold">Total</p><p className="mt-1 font-bold text-[#1a7a4a]">{formatCurrency(dispatchSummary.totalAmount || dispatchSummary.total || 0)}</p></div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200"><p className="text-sm font-bold theme-text-primary">Order Items</p></div>
                  {(dispatchSummary.items || dispatchSummary.orderItems || []).length === 0
                    ? <p className="p-4 text-sm text-center text-slate-500">No items found.</p>
                    : (dispatchSummary.items || dispatchSummary.orderItems || []).map((item: any, idx: number) => {
                        const qty = item.quantityDozens || item.quantity || 0;
                        const rate = item.pricePerDozen || item.rate || item.unitPrice || 0;
                        const total = item.lineTotal || item.total || (qty * rate);
                        return (
                          <div key={item.id || idx} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
                            <p className="font-semibold theme-text-primary text-sm">{item.design?.name || item.designName || item.designId || 'Design'}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <span>{qty} doz</span>
                              <span>×</span>
                              <span>{formatCurrency(rate)}</span>
                              <span className="font-bold theme-text-primary">{formatCurrency(total)}</span>
                            </div>
                          </div>
                        );
                      })
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function OrdersLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { canCreate, openCreateOrder } = useOrders();

  let title = 'Orders & Dispatch';
  let subtitle = 'Backend connected order lifecycle, line items, dispatch actions and documents';
  let action: React.ReactNode = undefined;

  if (pathname === '/dashboard/orders-dispatch') {
    title = 'All Orders';
    subtitle = 'View and manage all orders, items, and lifecycle status';
    if (canCreate) action = (
      <button onClick={openCreateOrder} className="inline-flex items-center gap-2 rounded-lg theme-accent-btn px-5 py-2.5 text-sm font-semibold transition-colors">
        <Plus className="h-4 w-4" /> Create Order
      </button>
    );
  } else if (pathname.startsWith('/dashboard/orders-dispatch/dispatch')) {
    title = 'Dispatch Status';
    subtitle = 'Packed and dispatched orders with tracking information';
  }

  return (
    <DashboardLayout title={title} subtitle={subtitle} action={action}>
      {children}
      <OrdersModals />
    </DashboardLayout>
  );
}

export default function OrdersDispatchLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrdersProvider>
      <OrdersLayoutInner>
        {children}
      </OrdersLayoutInner>
    </OrdersProvider>
  );
}
