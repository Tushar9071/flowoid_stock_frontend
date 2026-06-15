'use client';

import React from 'react';
import { Edit3, FileText, Package, Plus, Trash2, Truck } from 'lucide-react';
import { SkeletonList } from '@/components/skeleton/Skeletons';
import { SearchInput } from '@/components/shared/search-input';
import {
  useOrders,
  orderNumber,
  dealerName,
  dealerCode,
  orderItems,
  orderId,
  orderTrackingRef,
  orderDispatchDate,
  canDownloadOrderDocuments,
  openOrderDocument,
  normalizedOrderStatus,
  prettyDate,
  formatCurrency,
} from './orders-context';
import { BackendRecord } from '@/lib/services/business-modules.service';
import { CheckCircle2 } from 'lucide-react';
import { XCircle } from 'lucide-react';

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const cls =
    normalized === 'delivered' ? 'bg-[#e6f9f0] text-[#1a7a4a]' :
    normalized === 'packed' || normalized === 'dispatched' || normalized === 'partially_dispatched' ? 'bg-[#fffbeb] text-[#d97706]' :
    normalized === 'draft' || normalized === 'cancelled' ? 'bg-[#fff0f0] text-[#cc2200]' :
    'bg-[#f3f4f6] text-[#6b7280]';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>{normalized.replace(/_/g, ' ')}</span>;
}

function EmptyState({ text, tenant, icon, title, subtitle }: { text?: string; tenant?: any; icon?: React.ReactNode; title?: string; subtitle?: string }) {
  if (tenant === null) {
    return (
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center text-sm font-medium text-[#6b7280]">
        A tenant is required before records can be loaded.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center">
      <div className="theme-icon-chip mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
        {icon || <FileText className="h-6 w-6" />}
      </div>
      <p className="text-lg font-bold theme-text-primary">{title || text || 'No records found'}</p>
      {subtitle && <p className="mt-1 text-sm text-[#6b7280]">{subtitle}</p>}
    </div>
  );
}

export default function AllOrdersPage() {
  const {
    loading, filteredOrders, tenant, saving,
    canUpdate, canDispatch, canCancel,
    search, setSearch,
    openEditOrder, openAddItem, openEditItem, openDispatch, openCancel,
    runOrderAction, deleteItem, loadDispatchSummary,
  } = useOrders();

  return (
    <div className="space-y-4">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          containerClassName="max-w-xs flex-1"
          inputClassName="h-9 rounded-lg border-[#e5e7eb] bg-[#f9fafb] focus:border-[#0F2A4A]"
          placeholder="Search orders..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      {loading && <SkeletonList count={6} />}

      {!loading && (
        <>
          {filteredOrders.map(order => (
            <div key={order.id} className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white theme-card-accent">
              <div className="p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <span className="mb-1.5 inline-block rounded bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-semibold text-[#6b7280]">{orderNumber(order)}</span>
                    <h3 className="text-[18px] font-bold theme-text-primary">{dealerName(order)}</h3>
                    {dealerCode(order) !== '-' && (
                      <p className="mt-0.5 text-[12px] font-semibold text-[#6b7280]">{dealerCode(order)}</p>
                    )}
                    <p className="mt-0.5 text-sm text-[#6b7280]">Ordered on {prettyDate(order.orderDate || order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <StatusPill status={String(order.status || order.orderStatus || 'draft')} />
                    <p className="mt-2 text-[18px] font-bold theme-text-primary">{formatCurrency(Number(order.totalAmount || order.grandTotal || order.totalValue || 0))}</p>
                  </div>
                </div>

                <div className="mb-5 space-y-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">Order Items</p>
                    {canUpdate && order.id && (
                      <button onClick={() => openAddItem(order)} className="theme-secondary-btn inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold">
                        <Plus className="h-3.5 w-3.5" /> Item
                      </button>
                    )}
                  </div>
                  {orderItems(order).map((item: BackendRecord, index: number) => {
                    const name = item.design?.name || item.design?.code || item.designName || item.designCode || item.name || item.designId || '-';
                    const qty = item.quantityDozens || item.quantity || item.dozens || item.orderedQuantity || item.pieces || 0;
                    const rate = item.pricePerDozen || item.rate || item.unitPrice || item.price || 0;
                    const itemTotal = item.totalAmount || item.total || (qty * rate);

                    return (
                      <div key={item.id || index} className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 flex-none items-center justify-center rounded border border-[#e5e7eb] bg-white">
                            <Package className="h-4 w-4 text-[#9ca3af]" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold theme-text-primary">{name}</p>
                            <p className="text-[12px] text-[#6b7280]">{qty} doz x {formatCurrency(Number(rate))}</p>
                          </div>
                        </div>
                        <div className="flex flex-none items-center gap-2">
                          <p className="text-sm font-bold theme-text-primary">{formatCurrency(Number(itemTotal))}</p>
                          {canUpdate && item.id && (
                            <>
                              <button onClick={() => openEditItem(order, item)} className="theme-secondary-btn rounded-lg p-1.5" aria-label="Edit item"><Edit3 className="h-3.5 w-3.5" /></button>
                              <button onClick={() => deleteItem(order, item)} className="theme-secondary-btn rounded-lg p-1.5 text-[#cc2200]" aria-label="Delete item"><Trash2 className="h-3.5 w-3.5" /></button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {orderItems(order).length === 0 && <p className="text-sm text-[#6b7280]">No line items returned by API.</p>}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f3f4f6] pt-4">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">Payment:</p>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F2A4A]">{order.paymentStatus || (order.isCreditOrder ? 'credit' : 'cash')}</span>
                  </div>
                  {orderTrackingRef(order) !== 'Pending' && (
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">Tracker No:</p>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F2A4A]">{orderTrackingRef(order)}</span>
                    </div>
                  )}
                  {orderDispatchDate(order) && (
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">Dispatch Date:</p>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F2A4A]">{prettyDate(orderDispatchDate(order))}</span>
                    </div>
                  )}
                  {/* Actions */}
                  <div className="flex flex-wrap justify-end gap-2">
                    {(() => {
                      const status = normalizedOrderStatus(order);
                      const isDraftOrPending = status === 'draft' || status === 'pending';
                      const isConfirmed = status === 'confirmed';
                      const isPacked = status === 'packed';
                      const canBeDispatched = isPacked || status === 'partially_dispatched';
                      const canBeCancelled = isDraftOrPending || isConfirmed || isPacked;
                      return (
                        <>
                          {canUpdate && (isDraftOrPending || isConfirmed) && <button disabled={saving} onClick={() => openEditOrder(order)} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold"><Edit3 className="h-3.5 w-3.5" /> Edit</button>}
                          {canUpdate && isDraftOrPending && <button disabled={saving} onClick={() => runOrderAction(order, 'confirm')} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold"><CheckCircle2 className="h-3.5 w-3.5" /> Confirm</button>}
                          {canUpdate && isConfirmed && <button disabled={saving} onClick={() => runOrderAction(order, 'pack')} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold"><Package className="h-3.5 w-3.5" /> Pack</button>}
                          {canDispatch && canBeDispatched && <button disabled={saving} onClick={() => openDispatch(order)} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold"><Truck className="h-3.5 w-3.5" /> Dispatch</button>}
                          <button onClick={() => loadDispatchSummary(order)} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold"><FileText className="h-3.5 w-3.5" /> Summary</button>
                          {tenant && orderId(order) && (
                            <>
                              <button onClick={() => openOrderDocument(tenant, order, 'invoice')} className={`theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${!canDownloadOrderDocuments(order) ? 'opacity-60' : ''}`}>Invoice</button>
                              <button onClick={() => openOrderDocument(tenant, order, 'challan')} className={`theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${!canDownloadOrderDocuments(order) ? 'opacity-60' : ''}`}>Challan</button>
                            </>
                          )}
                          {canCancel && canBeCancelled && <button disabled={saving} onClick={() => openCancel(order)} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#cc2200]"><XCircle className="h-3.5 w-3.5" /> Cancel</button>}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
            <EmptyState title="No orders found" subtitle="Try adjusting search or filters." icon={<FileText className="h-6 w-6" />} tenant={tenant} />
          )}
        </>
      )}
    </div>
  );
}
