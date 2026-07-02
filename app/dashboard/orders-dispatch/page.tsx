'use client';

import React, { useState } from 'react';
import Head from 'next/head';
import { Plus, Edit3, Trash2, FileText, Search } from 'lucide-react';
import { SkeletonList } from '@/components/skeleton/Skeletons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useOrders, orderNumber, dealerName, dealerCode, orderItems, orderId,
  orderTrackingRef, orderDispatchDate, canDownloadOrderDocuments, openOrderDocument,
  normalizedOrderStatus, prettyDate, formatCurrency
} from './orders-context';
import { BackendRecord } from '@/lib/services/business-modules.service';

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

function formatLakhs(val: number) {
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  return formatCurrency(val);
}

export default function AllOrdersPage() {
  const {
    loading, orders, tenant, saving,
    canUpdate, canDispatch, canCancel, canCreate,
    openCreateOrder, openEditOrder, openAddItem, openEditItem, openDispatch, openCancel,
    runOrderAction, deleteItem, loadDispatchSummary,
  } = useOrders();

  const [activeFilter, setActiveFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc'>('date_desc');

  const statusCounts = orders.reduce((acc, o) => {
    const s = normalizedOrderStatus(o);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let displayedOrders = [...orders.filter(o => {
    const matchesStatus = activeFilter === 'all' || normalizedOrderStatus(o) === activeFilter;
    const term = search.toLowerCase();
    const matchesSearch = !term || orderNumber(o).toLowerCase().includes(term) || dealerName(o).toLowerCase().includes(term) || (dealerCode(o) && dealerCode(o).toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  })];

  if (sortBy === 'date_desc') {
    displayedOrders.sort((a, b) => new Date(b.createdAt || b.orderDate || 0).getTime() - new Date(a.createdAt || a.orderDate || 0).getTime());
  } else if (sortBy === 'date_asc') {
    displayedOrders.sort((a, b) => new Date(a.createdAt || a.orderDate || 0).getTime() - new Date(b.createdAt || b.orderDate || 0).getTime());
  } else if (sortBy === 'amount_desc') {
    displayedOrders.sort((a, b) => (Number(b.totalAmount || b.grandTotal || 0) || 0) - (Number(a.totalAmount || a.grandTotal || 0) || 0));
  }

  const getRailWidth = (status: string) => {
    switch (status) {
      case 'draft': return '16%';
      case 'confirmed': return '34%';
      case 'packed': return '52%';
      case 'partially_dispatched':
      case 'dispatched': return '78%';
      case 'delivered': return '100%';
      default: return '0%';
    }
  };

  const getStatusColor = (status: string) => `var(--${status === 'partially_dispatched' ? 'dispatched' : status})`;

  if (tenant === null) {
    return (
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center text-sm font-medium text-[#6b7280]">
        A tenant is required before records can be loaded.
      </div>
    );
  }

  return (
    <>
      <style>{`
        .custom-orders-page {
          --navy: #0F2A4A;
          --navy-2: #1e3a8a;
          --gold: #d97706;
          --gold-light: #fef3c7;
          --ivory: transparent;
          --card: #FFFFFF;
          --line: #e5e7eb;
          --text-1: #111827;
          --text-2: #6b7280;
          --text-3: #9ca3af;

          --draft: #92400E;      --draft-bg: #FEF3C7;
          --confirmed: #1D4ED8;  --confirmed-bg: #DBEAFE;
          --packed: #6B21A8;     --packed-bg: #E9D5FF;
          --dispatched: #15803D; --dispatched-bg: #DCFCE7;
          --delivered: #065F46;  --delivered-bg: #D1FAE5;
          --cancelled: #DC2626;  --cancelled-bg: #FEE2E2;
        }

        .custom-orders-page .filter-tabs-wrapper {
          width: 100%; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; margin-bottom: 16px;
        }
        .custom-orders-page .filter-tabs-wrapper::-webkit-scrollbar { display: none; }
        
        .custom-orders-page .filter-tabs {
          display:flex; gap:12px; flex-wrap:nowrap;
        }
        @media (min-width: 768px) {
          .custom-orders-page .filter-tabs { flex-wrap:wrap; }
        }

        .custom-orders-page .filter-tab {
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          height:36px; padding:0 16px; border-radius:999px; cursor:pointer;
          font-size:14px; font-weight:500; color:var(--text-2);
          border:1px solid #e5e7eb; background:#ffffff; 
          transition:all .2s ease; white-space:nowrap;
        }
        .custom-orders-page .filter-tab .count {
          font-size:12px; font-weight:600; padding:2px 8px; border-radius:999px;
          background:#f3f4f6; color:var(--text-2); transition:all .2s ease;
        }

        /* Hover states */
        .custom-orders-page .filter-tab:hover { background:#f9fafb; border-color:#d1d5db; color:var(--navy); }
        .custom-orders-page .filter-tab.all:hover { background:#f1f5f9; color:#0f172a; }
        .custom-orders-page .filter-tab.draft:hover { background:#fef3c7; color:var(--draft); border-color:#fde68a; }
        .custom-orders-page .filter-tab.confirmed:hover { background:#dbeafe; color:var(--confirmed); border-color:#bfdbfe; }
        .custom-orders-page .filter-tab.packed:hover { background:#f3e8ff; color:var(--packed); border-color:#e9d5ff; }
        .custom-orders-page .filter-tab.dispatched:hover { background:#dcfce7; color:var(--dispatched); border-color:#bbf7d0; }
        .custom-orders-page .filter-tab.delivered:hover { background:#d1fae5; color:var(--delivered); border-color:#a7f3d0; }
        .custom-orders-page .filter-tab.cancelled:hover { background:#fee2e2; color:var(--cancelled); border-color:#fecaca; }

        /* Active states */
        .custom-orders-page .filter-tab.active { font-weight:600; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        
        .custom-orders-page .filter-tab.active.all { color:#0f172a; background:#e2e8f0; border-color:#cbd5e1; }
        .custom-orders-page .filter-tab.active.all .count { background:#94a3b8; color:#fff; }

        .custom-orders-page .filter-tab.active.draft { color:var(--draft); background:var(--draft-bg); border-color:#fcd34d; }
        .custom-orders-page .filter-tab.active.draft .count { background:#d97706; color:#fff; }

        .custom-orders-page .filter-tab.active.confirmed { color:var(--confirmed); background:var(--confirmed-bg); border-color:#93c5fd; }
        .custom-orders-page .filter-tab.active.confirmed .count { background:#3b82f6; color:#fff; }

        .custom-orders-page .filter-tab.active.packed { color:var(--packed); background:var(--packed-bg); border-color:#d8b4fe; }
        .custom-orders-page .filter-tab.active.packed .count { background:#9333ea; color:#fff; }

        .custom-orders-page .filter-tab.active.dispatched { color:var(--dispatched); background:var(--dispatched-bg); border-color:#86efac; }
        .custom-orders-page .filter-tab.active.dispatched .count { background:#16a34a; color:#fff; }

        .custom-orders-page .filter-tab.active.delivered { color:var(--delivered); background:var(--delivered-bg); border-color:#6ee7b7; }
        .custom-orders-page .filter-tab.active.delivered .count { background:#059669; color:#fff; }

        .custom-orders-page .filter-tab.active.cancelled { color:var(--cancelled); background:var(--cancelled-bg); border-color:#fca5a5; }
        .custom-orders-page .filter-tab.active.cancelled .count { background:#dc2626; color:#fff; }

        .custom-orders-page .orders-list {display:flex; flex-direction:column; gap:16px;}

        .custom-orders-page .order-card {
          background:var(--card); border:1px solid var(--line); border-radius:14px;
          overflow:hidden; transition:border-color .15s ease;
          border-left: 4px solid transparent;
        }
        .custom-orders-page .order-card:hover {border-color:#cbd5e1;}

        .custom-orders-page .order-head {
          display:flex; justify-content:space-between; align-items:flex-start;
          padding:24px 24px 16px; gap:16px;
        }
        .custom-orders-page .order-id {
          font-size:0.75rem; font-weight:700; color:var(--text-2);
          letter-spacing:.04em; text-transform:uppercase; margin-bottom:8px;
          display:block;
        }
        .custom-orders-page .order-customer {
          font-size:1.125rem; font-weight:700; color:var(--navy);
        }
        .custom-orders-page .order-meta {
          display:flex; gap:14px; margin-top:6px; font-size:0.875rem; color:var(--text-2); flex-wrap: wrap; font-weight: 500;
        }
        .custom-orders-page .order-meta span {display:flex; align-items:center; gap:5px;}
        .custom-orders-page .order-meta svg {width:14px; height:14px; opacity:.7;}

        .custom-orders-page .order-right {display:flex; flex-direction:column; align-items:flex-end; gap:10px;}
        .custom-orders-page .order-amount {
          font-size:1.5rem; font-weight:800; color:var(--navy);
        }

        .custom-orders-page .stamp {
          display:inline-flex; align-items:center; justify-content:center;
          padding:0 18px; border-radius:999px; height:34px;
          font-size:13.5px; font-weight:700; letter-spacing:0; text-transform:uppercase;
        }
        .custom-orders-page .stamp.draft {color:var(--draft); background:var(--draft-bg);}
        .custom-orders-page .stamp.confirmed {color:var(--confirmed); background:var(--confirmed-bg);}
        .custom-orders-page .stamp.packed {color:var(--packed); background:var(--packed-bg);}
        .custom-orders-page .stamp.partially_dispatched,
        .custom-orders-page .stamp.dispatched {color:var(--dispatched); background:var(--dispatched-bg);}
        .custom-orders-page .stamp.delivered {color:var(--delivered); background:var(--delivered-bg);}
        .custom-orders-page .stamp.cancelled {color:var(--cancelled); background:var(--cancelled-bg);}

        .custom-orders-page .rail {padding:0 22px; margin-bottom:16px;}
        .custom-orders-page .rail-track {
          display:flex; align-items:center; height:4px; border-radius:4px;
          background:#f3f4f6; overflow:hidden;
        }
        .custom-orders-page .rail-fill {height:100%; border-radius:4px; transition:width .2s ease;}

        .custom-orders-page .items {
          border-top:1px solid var(--line); border-bottom:1px solid var(--line);
          background:#f9fafb;
        }
        .custom-orders-page .items-label {
          display:flex; justify-content:space-between; align-items:center;
          padding:12px 22px 8px; font-size:0.75rem; font-weight:700; color:var(--text-3);
          letter-spacing:.06em; text-transform:uppercase;
        }
        .custom-orders-page .item-add-btn {
          display:inline-flex; align-items:center; gap:4px;
          padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:600;
          background: #f3f4f6; color: var(--navy); border: none; cursor: pointer; transition: all .15s ease;
        }
        .custom-orders-page .item-add-btn:hover { background: #e5e7eb; }
        .custom-orders-page .item-add-btn svg { width: 12px; height: 12px; }

        .custom-orders-page .item-row {
          display:flex; align-items:center; gap:14px; padding:9px 22px;
        }
        .custom-orders-page .item-icon {
          width:34px; height:34px; border-radius:8px; background:var(--gold-light);
          display:flex; align-items:center; justify-content:center; flex-shrink:0; color:var(--gold);
        }
        .custom-orders-page .item-icon.cancelled {
          background:var(--cancelled-bg); color:var(--cancelled);
        }
        .custom-orders-page .item-icon svg {width:16px; height:16px;}
        .custom-orders-page .item-info {flex:1; min-width:0;}
        .custom-orders-page .item-name {font-size:0.875rem; font-weight:600; color:var(--text-1);}
        .custom-orders-page .item-qty {font-size:0.875rem; color:var(--text-2); margin-top:2px; font-weight: 500;}
        .custom-orders-page .item-amount {font-size:0.875rem; font-weight:700; color:var(--navy);}

        .custom-orders-page .order-foot {
          display:flex; justify-content:space-between; align-items:center;
          padding:16px 22px; flex-wrap:wrap; gap:12px;
        }
        .custom-orders-page .payment-tag {
          font-size:0.875rem; color:var(--text-2); display:flex; align-items:center; gap:6px; font-weight: 500;
        }
        .custom-orders-page .payment-tag b {color:var(--navy); font-weight:600;}
        .custom-orders-page .payment-tag .pmode {
          background:#f3f4f6; padding:3px 9px; border-radius:6px; font-weight:700; color:var(--text-1);
        }

        .custom-orders-page .actions {display:flex; gap:8px; flex-wrap:wrap;}
        
        .custom-orders-page .btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:8px 14px; border-radius:8px; font-size:0.875rem; font-weight:600;
          cursor:pointer; transition:all .15s ease; border: 1px solid transparent;
        }
        .custom-orders-page .btn svg {width:14px; height:14px;}
        
        /* Outline Ghost */
        .custom-orders-page .btn.ghost {
          background: #ffffff; border-color: #e5e7eb; color: #4b5563;
        }
        .custom-orders-page .btn.ghost:hover {
          background: #f9fafb; border-color: #d1d5db; color: #111827;
        }
        
        /* Theme Primary Action Buttons */
        .custom-orders-page .btn.action-confirm { background: var(--confirmed); color: white; }
        .custom-orders-page .btn.action-confirm:hover { background: #1d4ed8; }
        
        .custom-orders-page .btn.action-pack { background: var(--packed); color: white; }
        .custom-orders-page .btn.action-pack:hover { background: #6d28d9; }
        
        .custom-orders-page .btn.action-dispatch { background: var(--dispatched); color: white; }
        .custom-orders-page .btn.action-dispatch:hover { background: #0f766e; }

        .custom-orders-page .btn.action-danger { background: var(--cancelled-bg); color: var(--cancelled); border-color: transparent; }
        .custom-orders-page .btn.action-danger:hover { background: #fecaca; }

        @media (max-width:640px){
          .custom-orders-page .order-head {flex-direction:column;}
          .custom-orders-page .order-right {align-items:flex-start; width:100%; flex-direction:row; justify-content:space-between;}
          .custom-orders-page .actions {width:100%;}
          .custom-orders-page .btn {flex:1; justify-content:center;}
        }
      `}</style>
      
      <div className="custom-orders-page space-y-4">

        {/* TOOLBAR */}
        <div className="flex flex-col gap-4 mb-2">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
              <input
                type="text"
                placeholder="Search by order ID, dealer or item…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full !pl-[42px] !pr-4 !py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]/20 focus:border-[#0F2A4A] transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                <SelectTrigger className="w-[160px] h-[42px] bg-white border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors focus:ring-0 focus:ring-offset-0 focus:border-[#0F2A4A]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc" className="font-medium cursor-pointer">Newest first</SelectItem>
                  <SelectItem value="date_asc" className="font-medium cursor-pointer">Oldest first</SelectItem>
                  <SelectItem value="amount_desc" className="font-medium cursor-pointer">Highest amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="filter-tabs-wrapper">
            <div className="filter-tabs">
              <button className={`filter-tab all ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
                All <span className="count">{orders.length}</span>
              </button>
              {['draft', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled'].map(status => (
                <button 
                  key={status} 
                  className={`filter-tab ${status} ${activeFilter === status ? 'active' : ''}`} 
                  onClick={() => setActiveFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)} <span className="count">{statusCounts[status] || 0}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ORDERS LIST */}
        <div className="orders-list">
          {loading && <SkeletonList count={4} />}
          
          {!loading && displayedOrders.map(order => {
            const status = normalizedOrderStatus(order);
            const isDraftOrPending = status === 'draft' || status === 'pending';
            const isConfirmed = status === 'confirmed';
            const isPacked = status === 'packed';
            const isCancelled = status === 'cancelled';
            const canBeDispatched = isPacked || status === 'partially_dispatched';
            const canBeCancelled = isDraftOrPending || isConfirmed || isPacked;
            const items = orderItems(order);

            return (
              <div key={order.id} className="order-card" style={{ borderLeftColor: getStatusColor(status) }}>
                <div className="order-head">
                  <div>
                    <span className="order-id">{orderNumber(order)}</span>
                    <div className="order-customer">{dealerName(order)}</div>
                    <div className="order-meta">
                      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>Ordered {prettyDate(order.orderDate || order.createdAt)}</span>
                      {dealerCode(order) !== '-' && (
                        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>{dealerCode(order)}</span>
                      )}
                    </div>
                  </div>
                  <div className="order-right">
                    <span className={`stamp ${status}`}>{status.replace(/_/g, ' ')}</span>
                    <div className="order-amount" style={isCancelled ? { color: 'var(--text-3)', textDecoration: 'line-through', textDecorationColor: 'var(--cancelled)' } : undefined}>
                      {formatCurrency(Number(order.totalAmount || order.grandTotal || order.totalValue || 0))}
                    </div>
                  </div>
                </div>

                {!isCancelled && (
                  <div className="rail">
                    <div className="rail-track"><div className="rail-fill" style={{ width: getRailWidth(status), background: getStatusColor(status) }}></div></div>
                  </div>
                )}

                <div className="items">
                  <div className="items-label">
                    <span>Order items <span className="ml-1 text-[11px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-full">{items.length}</span></span>
                    {canUpdate && order.id && isDraftOrPending && (
                      <button onClick={() => openAddItem(order)} className="item-add-btn">
                        <Plus /> Add Item
                      </button>
                    )}
                  </div>
                  {items.map((item: BackendRecord, idx: number) => {
                    const name = item.design?.name || item.design?.code || item.designName || item.designCode || item.name || item.designId || '-';
                    const qty = item.quantityDozens || item.quantity || item.dozens || item.orderedQuantity || item.pieces || 0;
                    const rate = item.pricePerDozen || item.rate || item.unitPrice || item.price || 0;
                    const itemTotal = item.totalAmount || item.total || item.lineTotal || (qty * rate);

                    return (
                      <div key={item.id || idx} className="item-row">
                        <div className={`item-icon ${isCancelled ? 'cancelled' : ''}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>
                        </div>
                        <div className="item-info">
                          <div className="item-name">{name}</div>
                          <div className="item-qty">{qty} doz × {formatCurrency(Number(rate))}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="item-amount">{formatCurrency(Number(itemTotal))}</div>
                          {canUpdate && item.id && isDraftOrPending && (
                            <div className="flex gap-1">
                              <button onClick={() => openEditItem(order, item)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors" title="Edit Item"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => deleteItem(order, item)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete Item"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && <div className="item-row"><div className="item-info"><div className="item-qty">No items</div></div></div>}
                </div>

                <div className="order-foot">
                  <div className="payment-tag">
                    {isCancelled ? 'Reason' : 'Payment'} 
                    <span className="pmode">{isCancelled ? (order.cancelReason || 'Cancelled') : (order.paymentStatus || (order.isCreditOrder ? 'Credit' : 'Cash'))}</span>
                  </div>
                  <div className="actions">
                    {canUpdate && (isDraftOrPending || isConfirmed) && (
                      <button disabled={saving} onClick={() => openEditOrder(order)} className="btn ghost"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit</button>
                    )}
                    <button onClick={() => loadDispatchSummary(order)} className="btn ghost"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 17H4v-5M4 7h5v5M20 7h-5v5M20 17h-5v-5"/></svg>Summary</button>
                    {tenant && orderId(order) && (
                      <>
                        <button onClick={() => openOrderDocument(tenant, order, 'invoice')} className={`btn ghost ${!canDownloadOrderDocuments(order) ? 'opacity-60' : ''}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>Invoice</button>
                        <button onClick={() => openOrderDocument(tenant, order, 'challan')} className={`btn ghost ${!canDownloadOrderDocuments(order) ? 'opacity-60' : ''}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>Challan</button>
                      </>
                    )}
                    {canCancel && canBeCancelled && (
                      <button disabled={saving} onClick={() => openCancel(order)} className="btn action-danger">Cancel</button>
                    )}
                    {canUpdate && isDraftOrPending && (
                      <button disabled={saving} onClick={() => runOrderAction(order, 'confirm')} className="btn action-confirm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5"/></svg>Confirm order</button>
                    )}
                    {canUpdate && isConfirmed && (
                      <button disabled={saving} onClick={() => runOrderAction(order, 'pack')} className="btn action-pack"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8L12 3 3 8l9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/></svg>Mark packed</button>
                    )}
                    {canDispatch && canBeDispatched && (
                      <button disabled={saving} onClick={() => openDispatch(order)} className="btn action-dispatch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h5v5H3zM16 3h5v5h-5zM3 16h5v5H3zM16 16h5v5h-5z"/></svg>Dispatch order</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && displayedOrders.length === 0 && (
            <EmptyState title="No orders match" subtitle="Try a different status or search term." icon={<FileText className="h-6 w-6" />} tenant={tenant} />
          )}
        </div>
      </div>
    </>
  );
}
