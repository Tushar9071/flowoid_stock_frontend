'use client';

import React from 'react';
import { Truck } from 'lucide-react';
import { SkeletonTable } from '@/components/skeleton/Skeletons';
import { AdvancedDataTable } from '@/components/shared/DataTable';
import { SearchInput } from '@/components/shared/search-input';
import {
  useOrders,
  orderNumber,
  dealerName,
  dealerCode,
  orderTrackingRef,
  orderDispatchDate,
  orderId,
  openOrderDocument,
  prettyDate,
} from '../orders-context';

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const cls =
    normalized === 'delivered' ? 'bg-[#e6f9f0] text-[#1a7a4a]' :
    normalized === 'packed' || normalized === 'dispatched' || normalized === 'partially_dispatched' ? 'bg-[#fffbeb] text-[#d97706]' :
    normalized === 'draft' || normalized === 'cancelled' ? 'bg-[#fff0f0] text-[#cc2200]' :
    'bg-[#f3f4f6] text-[#6b7280]';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>{normalized.replace(/_/g, ' ')}</span>;
}

export default function DispatchPage() {
  const { loading, dispatchedOrders, tenant, search, setSearch, loadDispatchSummary } = useOrders();

  return (
    <div className="space-y-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          containerClassName="max-w-xs flex-1"
          inputClassName="h-9 rounded-lg border-[#e5e7eb] bg-[#f9fafb] focus:border-[#0F2A4A]"
          placeholder="Search dispatches..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      {loading && <SkeletonTable rows={8} cols={6} />}
      {!loading && (
        <AdvancedDataTable
          data={dispatchedOrders}
          searchable={false}
          loading={loading}
          emptyIcon={<Truck className="h-6 w-6 text-slate-400" />}
          emptyTitle="No dispatch records found"
          columns={[
            {
              field: 'orderNumber', header: 'Order ID', sortable: true, filterable: true, filterType: 'text',
              getValue: (row) => orderNumber(row),
              render: (row) => (
                <div className="flex items-center gap-3">
                  <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg"><Truck className="h-4 w-4" /></div>
                  {orderNumber(row)}
                </div>
              )
            },
            {
              field: 'dealerName', header: 'Dealer', sortable: true, filterable: true, filterType: 'text',
              getValue: (row) => dealerName(row),
              render: (row) => (
                <div className="flex flex-col">
                  <span className="font-bold text-[#374151]">{dealerName(row)}</span>
                  {dealerCode(row) !== '-' && <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{dealerCode(row)}</span>}
                </div>
              )
            },
            {
              field: 'trackingRef', header: 'Tracker Number', sortable: true, filterable: true, filterType: 'text',
              getValue: (row) => orderTrackingRef(row),
              render: (row) => <div className={`font-mono ${orderTrackingRef(row) === 'Pending' ? 'text-slate-400 italic text-xs' : 'text-[#6b7280]'}`}>{orderTrackingRef(row)}</div>
            },
            {
              field: 'dispatchedAt', header: 'Dispatch Date', sortable: true, filterable: true, filterType: 'date',
              getValue: (row) => orderDispatchDate(row),
              render: (row) => <div className={!orderDispatchDate(row) ? 'text-slate-400 italic text-xs' : 'text-[#6b7280]'}>{orderDispatchDate(row) ? prettyDate(orderDispatchDate(row)) : 'Pending'}</div>
            },
            {
              field: 'status', header: 'Status', sortable: true, filterable: true, filterType: 'text',
              getValue: (row) => String(row.status || row.orderStatus || '-'),
              render: (row) => <StatusPill status={String(row.status || row.orderStatus || '-')} />
            },
            {
              field: 'actions', header: 'Action',
              render: (row) => (
                <div className="flex justify-end gap-2">
                  <button onClick={() => loadDispatchSummary(row)} className="theme-secondary-btn rounded-lg px-3 py-1.5 text-xs font-semibold">Summary</button>
                  {tenant && orderId(row) && ['DISPATCHED', 'PARTIALLY_DISPATCHED'].includes(String(row.status || row.orderStatus || '').toUpperCase()) && (
                    <>
                      <button onClick={() => openOrderDocument(tenant, row, 'challan')} className="theme-secondary-btn rounded-lg px-3 py-1.5 text-xs font-semibold">Challan</button>
                      <button onClick={() => openOrderDocument(tenant, row, 'invoice')} className="theme-secondary-btn rounded-lg px-3 py-1.5 text-xs font-semibold">Invoice</button>
                    </>
                  )}
                </div>
              )
            }
          ]}
        />
      )}
    </div>
  );
}
