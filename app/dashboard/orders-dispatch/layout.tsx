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
    if (modalMode === 'editOrder') return [
      { name: 'orderDate', label: 'Order Date', type: 'datetime-local' },
      { name: 'isCreditOrder', label: 'Credit Order', type: 'checkbox' },
      { name: 'discountAmount', label: 'Overall Discount (₹)', type: 'number' },
      { name: 'taxPercent', label: 'Overall Tax (%)', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ];
    if (modalMode === 'addItem') return [
      { name: 'designId', label: 'Design', type: 'select', required: true, options: designOptions },
      { name: 'quantityDozens', label: 'Quantity Dozens', type: 'number', required: true, hint: selectedDesignAvailability !== null ? `Available: ${selectedDesignAvailability} dozens` : undefined },
      { name: 'pricePerDozen', label: 'Price Per Dozen', type: 'number' },
      { name: 'discountPercent', label: 'Item Discount (%)', type: 'number' },
      { name: 'taxPercent', label: 'Item Tax (%)', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ];
    if (modalMode === 'editItem') return [
      { name: 'quantityDozens', label: 'Quantity Dozens', type: 'number', required: true },
      { name: 'pricePerDozen', label: 'Price Per Dozen', type: 'number' },
      { name: 'discountPercent', label: 'Item Discount (%)', type: 'number' },
      { name: 'taxPercent', label: 'Item Tax (%)', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
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
      {modalMode && modalMode !== 'create' && modalMode !== 'dispatch' && (
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

      {modalMode === 'create' && (
        <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
          <form onSubmit={saveModal} className="theme-modal-panel flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-4">
              <div>
                <h2 className="text-xl font-bold theme-text-primary">Create Order (Multi-Item)</h2>
                <p className="text-sm text-slate-500">Build an entire order cart before submitting</p>
              </div>
              <button type="button" onClick={closeModal} className="theme-secondary-btn rounded-lg p-2"><XCircle className="h-4 w-4" /></button>
            </div>
            
            {formError && (
              <div className="mx-4 mt-4 whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {typeof formError === 'string' ? formError : formError.message || 'Validation error'}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Top Level Order Info */}
              <div className="grid gap-4 md:grid-cols-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Dealer *</span>
                  <select required value={form.dealerId || ''} onChange={e => setForm(c => ({...c, dealerId: e.target.value}))} className="h-10 w-full text-sm font-semibold rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-[var(--color-accent)]">
                    <option value="">Select dealer</option>
                    {dealerOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Order Date</span>
                  <input type="datetime-local" value={form.orderDate || ''} onChange={e => setForm(c => ({...c, orderDate: e.target.value}))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[var(--color-accent)]" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Overall Discount (₹)</span>
                  <input type="number" min="0" value={form.discountAmount || ''} onChange={e => setForm(c => ({...c, discountAmount: e.target.value}))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[var(--color-accent)]" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Overall Tax (%)</span>
                  <input type="number" min="0" max="100" value={form.taxPercent || ''} onChange={e => setForm(c => ({...c, taxPercent: e.target.value}))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[var(--color-accent)]" />
                </label>
                <label className="block md:col-span-4">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes</span>
                  <input type="text" value={form.notes || ''} onChange={e => setForm(c => ({...c, notes: e.target.value}))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[var(--color-accent)]" />
                </label>
                <label className="block flex items-center gap-2">
                  <input type="checkbox" checked={Boolean(form.isCreditOrder)} onChange={e => setForm(c => ({...c, isCreditOrder: e.target.checked}))} className="h-5 w-5 rounded border-slate-300" />
                  <span className="text-sm font-bold theme-text-primary">Credit Order</span>
                </label>
              </div>

              {/* Items Array */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <p className="text-sm font-bold theme-text-primary">Line Items</p>
                  <button type="button" onClick={() => setForm(c => ({ ...c, items: [...(c.items || []), { designId: '', quantityDozens: 1, pricePerDozen: '', discountPercent: 0, taxPercent: 0, _id: Math.random().toString(36).substring(2, 9) }] }))} className="theme-secondary-btn flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold">
                    <Plus className="h-3.5 w-3.5" /> Add Row
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-100 bg-white text-xs font-semibold uppercase text-slate-500">
                        <th className="p-3 pl-4">Design *</th>
                        <th className="p-3 w-24">Qty (Doz) *</th>
                        <th className="p-3 w-24">Rate (₹)</th>
                        <th className="p-3 w-20">Disc %</th>
                        <th className="p-3 w-20">Tax %</th>
                        <th className="p-3 pr-4 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(form.items || []).map((item: any, idx: number) => (
                        <tr key={item._id || idx} className="border-b border-slate-50">
                          <td className="p-2 pl-4">
                            <select required value={item.designId || ''} onChange={e => {
                               const dsgId = e.target.value;
                               // Use useOrders designs state to auto-populate price
                               // Wait, designs is not in OrdersModals scope directly, let's pull it from useOrders()
                               setForm(c => {
                                  const newItems = [...(c.items || [])];
                                  newItems[idx].designId = dsgId;
                                  return { ...c, items: newItems };
                               });
                            }} className="h-9 w-full text-sm font-semibold rounded-lg border border-slate-200 bg-white px-2 outline-none">
                              <option value="">Select...</option>
                              {designOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </td>
                          <td className="p-2"><input type="number" required min="1" value={item.quantityDozens || ''} onChange={e => setForm(c => { const n = [...(c.items||[])]; n[idx].quantityDozens = e.target.value; return {...c, items: n}; })} className="h-9 w-full rounded-lg border border-slate-200 px-2 outline-none" /></td>
                          <td className="p-2"><input type="number" min="0" value={item.pricePerDozen ?? ''} onChange={e => setForm(c => { const n = [...(c.items||[])]; n[idx].pricePerDozen = e.target.value; return {...c, items: n}; })} className="h-9 w-full rounded-lg border border-slate-200 px-2 outline-none" /></td>
                          <td className="p-2"><input type="number" min="0" max="100" value={item.discountPercent ?? ''} onChange={e => setForm(c => { const n = [...(c.items||[])]; n[idx].discountPercent = e.target.value; return {...c, items: n}; })} className="h-9 w-full rounded-lg border border-slate-200 px-2 outline-none" /></td>
                          <td className="p-2"><input type="number" min="0" max="100" value={item.taxPercent ?? ''} onChange={e => setForm(c => { const n = [...(c.items||[])]; n[idx].taxPercent = e.target.value; return {...c, items: n}; })} className="h-9 w-full rounded-lg border border-slate-200 px-2 outline-none" /></td>
                          <td className="p-2 pr-4 text-center">
                            {(form.items || []).length > 1 && (
                              <button type="button" onClick={() => setForm(c => ({...c, items: (c.items||[]).filter((_: any, i: number) => i !== idx)}))} className="text-red-500 hover:text-red-700 p-1 font-bold text-lg leading-none" aria-label="Remove row">&times;</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 p-4">
              <button type="button" onClick={closeModal} className="theme-secondary-btn rounded-lg px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="submit" disabled={saving} className="theme-accent-btn rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">{saving ? 'Saving...' : 'Create Order'}</button>
            </div>
          </form>
        </div>
      )}

      {modalMode === 'dispatch' && (
        <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
          <form onSubmit={saveModal} className="theme-modal-panel flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-4">
              <div>
                <h2 className="text-xl font-bold theme-text-primary">Dispatch Order (Partial or Full)</h2>
                <p className="text-sm text-slate-500">Edit quantities below to perform a partial dispatch</p>
              </div>
              <button type="button" onClick={closeModal} className="theme-secondary-btn rounded-lg p-2"><XCircle className="h-4 w-4" /></button>
            </div>
            
            {formError && (
              <div className="mx-4 mt-4 whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {typeof formError === 'string' ? formError : formError.message || 'Validation error'}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Transport Mode *</span>
                  <input type="text" required value={form.transportMode || ''} onChange={e => setForm(c => ({...c, transportMode: e.target.value}))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Tracking Reference</span>
                  <input type="text" value={form.trackingRef || ''} onChange={e => setForm(c => ({...c, trackingRef: e.target.value}))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Dispatch Time</span>
                  <input type="datetime-local" value={form.dispatchedAt || ''} onChange={e => setForm(c => ({...c, dispatchedAt: e.target.value}))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none" />
                </label>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <p className="text-sm font-bold theme-text-primary">Dispatch Quantities</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-100 bg-white text-xs font-semibold uppercase text-slate-500">
                        <th className="p-3 pl-4">Design Item</th>
                        <th className="p-3 w-32">Pending (Doz)</th>
                        <th className="p-3 pr-4 w-40">Dispatch (Doz) *</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(form.items || []).map((item: any, idx: number) => (
                        <tr key={item.orderItemId || idx} className="border-b border-slate-50">
                          <td className="p-3 pl-4 font-semibold theme-text-primary">{item.designName}</td>
                          <td className="p-3 text-slate-600">{item.pendingQty}</td>
                          <td className="p-2 pr-4">
                            <input 
                              type="number" 
                              min="0" 
                              max={item.pendingQty} 
                              required 
                              value={item.quantityDispatched ?? ''} 
                              onChange={e => setForm(c => { const n = [...(c.items||[])]; n[idx].quantityDispatched = e.target.value; return {...c, items: n}; })} 
                              className={`h-9 w-full rounded-lg border px-2 outline-none ${Number(item.quantityDispatched) > item.pendingQty ? 'border-red-500 bg-red-50' : 'border-slate-200'}`} 
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 p-4">
              <button type="button" onClick={closeModal} className="theme-secondary-btn rounded-lg px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="submit" disabled={saving} className="theme-accent-btn rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">{saving ? 'Processing...' : 'Confirm Dispatch'}</button>
            </div>
          </form>
        </div>
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
