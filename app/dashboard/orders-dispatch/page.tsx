'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { mockOrders, mockDispatches } from '@/lib/data';
import { formatCurrency, formatDate } from '@/lib/constants';
import { Plus, Truck, Search, ChevronDown, Package, FileText, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { normalizeRole } from '@/lib/roles';
import { SkeletonList, SkeletonTable } from '@/components/skeleton/Skeletons';

type Tab = 'orders' | 'dispatch';

export default function OrdersDispatchPage() {
  const { role } = useAuth();
  const [tab, setTab] = useState<Tab>('orders');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<typeof mockOrders>([]);
  const [dispatches, setDispatches] = useState<typeof mockDispatches>([]);

  useEffect(() => {
    let isMounted = true;

    const loadOrdersAndDispatches = async () => {
      setIsLoading(true);
      // Placeholder async flow until API integration.
      await new Promise(resolve => setTimeout(resolve, 700));
      if (!isMounted) return;
      setOrders(mockOrders);
      setDispatches(mockDispatches);
      setIsLoading(false);
    };

    loadOrdersAndDispatches();

    return () => {
      isMounted = false;
    };
  }, []);

  const roleKey = normalizeRole(role);
  const canEdit = roleKey === 'owner' || roleKey === 'manager';

  const filteredOrders = orders.filter(
    o =>
      o.orderId.toLowerCase().includes(search.toLowerCase()) ||
      o.dealerName.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredDispatches = dispatches.filter(
    d =>
      d.orderId.toLowerCase().includes(search.toLowerCase()) ||
      d.dealerName.toLowerCase().includes(search.toLowerCase()),
  );

  const tabs = [
    { id: 'orders' as Tab, label: 'All Orders', icon: <FileText className="w-4 h-4" /> },
    { id: 'dispatch' as Tab, label: 'Dispatch Status', icon: <Truck className="w-4 h-4" /> },
  ];

  return (
    <DashboardLayout
      title="Orders & Dispatch"
      subtitle="Manage customer orders, tracking, and delivery status"
      action={
        canEdit && tab === 'orders' ? (
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg theme-accent-btn text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            Create Order
          </button>
        ) : undefined
      }
    >
      <div className="flex gap-1 p-1 bg-[#e5e7eb] rounded-xl mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm transition-all ${
              tab === t.id
                ? 'theme-tab-active'
                : 'theme-tab-inactive'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${tab}...`}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] focus:bg-white focus:ring-2 focus:ring-[#0F2A4A]/10 focus:border-[#0F2A4A] outline-none transition-all"
          />
        </div>
        <button className="h-9 px-3 rounded-lg border border-[#e5e7eb] bg-white text-sm text-[#374151] flex items-center gap-1.5 hover:bg-[#f9fafb] transition-colors w-fit">
          Filter <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading && tab === 'orders' && <SkeletonList count={6} />}
      {isLoading && tab === 'dispatch' && <SkeletonTable rows={8} cols={5} />}

      {!isLoading && tab === 'orders' && (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-[#e5e7eb] theme-card-accent overflow-hidden">
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded bg-[#f3f4f6] text-[11px] font-semibold text-[#6b7280] mb-1.5">
                      {order.orderId}
                    </span>
                    <h3 className="text-[18px] font-bold theme-text-primary">{order.dealerName}</h3>
                    <p className="text-sm text-[#6b7280] mt-0.5">Ordered on {formatDate(order.date)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-2 ${
                      order.orderStatus === 'delivered' ? 'bg-[#e6f9f0] text-[#1a7a4a]' :
                      order.orderStatus === 'packed' || order.orderStatus === 'dispatched' ? 'bg-[#fffbeb] text-[#d97706]' :
                      order.orderStatus === 'draft' ? 'bg-[#fff0f0] text-[#cc2200]' :
                      'bg-[#f3f4f6] text-[#6b7280]'
                    }`}>
                      {order.orderStatus}
                    </span>
                    <p className="text-[18px] font-bold theme-text-primary">{formatCurrency(order.totalValue)}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 space-y-3 mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-2">Order Items</p>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white border border-[#e5e7eb] flex items-center justify-center">
                          <Package className="w-4 h-4 text-[#9ca3af]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold theme-text-primary">{item.designCode}</p>
                          <p className="text-[12px] text-[#6b7280]">{item.quantity} units × {formatCurrency(item.unitPrice)}</p>
                        </div>
                      </div>
                      <p className="font-bold theme-text-primary text-sm">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-[#f3f4f6] pt-4">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">Payment:</p>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      order.paymentStatus === 'paid' ? 'text-[#1a7a4a]' :
                      order.paymentStatus === 'partial' ? 'text-[#d97706]' :
                      'text-[#cc2200]'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <button className="text-sm font-semibold theme-text-primary hover:underline">
                    View Full Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && tab === 'dispatch' && (
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f5f6fa] border-b border-[#e5e7eb]">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-left">Order ID</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-left">Dealer</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-left">Tracker Number</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-left">Status</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {filteredDispatches.map((dispatch, idx) => (
                  <tr key={dispatch.id} className={`transition-colors hover:bg-[#f0f4ff] ${idx % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'}`}>
                    <td className="px-5 py-4 text-sm font-semibold theme-text-primary">{dispatch.orderId}</td>
                    <td className="px-5 py-4 text-sm font-medium text-[#374151]">{dispatch.dealerName}</td>
                    <td className="px-5 py-4 text-sm font-mono text-[#6b7280]">
                      {dispatch.trackerNumber || <span className="text-[#9ca3af] italic">Not Assigned</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                        dispatch.status === 'delivered' ? 'bg-[#e6f9f0] text-[#1a7a4a]' :
                        dispatch.status === 'shipped' ? 'bg-[#e0f2fe] text-[#0284c7]' :
                        'bg-[#fffbeb] text-[#d97706]'
                      }`}>
                        {dispatch.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="px-3 py-1.5 rounded bg-white border border-[#e5e7eb] text-xs font-semibold theme-text-primary hover:bg-[#f9fafb] transition-colors">
                        Track Package
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
