'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { KPICards } from '@/components/dashboard/kpi-cards';
import { SalesChart, SalesDataPoint } from '@/components/dashboard/sales-chart';
import { RecentActivityWidget } from '@/components/dashboard/recent-activity-widget';
import { useRecentActivity } from '@/lib/hooks/use-activity-context';

import {
  OrderService,
  PaymentService,
  ReportService,
  InventoryService,
  DesignService,
  WorkerService,
  responseItems
} from '@/lib/services/business-modules.service';
import { PartyService } from '@/lib/services/party.service';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // KPI States
  const [totalSales, setTotalSales] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Widget States
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const { activities, loading: activitiesLoading } = useRecentActivity();

  // Quick Stats States
  const [activeDesigns, setActiveDesigns] = useState(0);
  const [activeWorkers, setActiveWorkers] = useState(0);
  const [inactiveWorkers, setInactiveWorkers] = useState(0);
  const [activeDealers, setActiveDealers] = useState(0);
  const [totalInventoryItems, setTotalInventoryItems] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        const tenantId = "owner";

        const apiPromises = [
          OrderService.list(tenantId, { page: 1, limit: 5 }), // exactly 5 for recent orders table
          ReportService.ledgerAging(tenantId, { 
            fromDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0], 
            toDate: new Date().toISOString().split('T')[0], 
            partyType: 'DEALER' 
          }),
          InventoryService.listLowStockAlerts(tenantId, { page: 1, limit: 1 }),
          InventoryService.listStock(tenantId, { page: 1, limit: 1 }),
          DesignService.list(tenantId, { page: 1, limit: 1 }),
          WorkerService.list(tenantId, { page: 1, limit: 1 }),
          PartyService.list(tenantId, { type: 'DEALER', page: 1, limit: 1 }),
          ReportService.salesSummary(tenantId, { 
            fromDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0], 
            toDate: new Date().toISOString().split('T')[0],
            groupBy: 'month'
          }),
          // 4 explicit calls to get precise active order counts without backend modifications
          OrderService.list(tenantId, { limit: 1, status: 'DRAFT' }),
          OrderService.list(tenantId, { limit: 1, status: 'CONFIRMED' }),
          OrderService.list(tenantId, { limit: 1, status: 'PACKED' }),
          OrderService.list(tenantId, { limit: 1, status: 'PARTIALLY_DISPATCHED' })
        ];

        const [
          ordersRes,
          agingRes,
          alertsRes,
          stockRes,
          designsRes,
          workersRes,
          dealersRes,
          salesSummaryRes,
          draftRes,
          confirmedRes,
          packedRes,
          partDispatchedRes
        ] = await Promise.all(apiPromises) as any[];

        if (!isMounted) return;

        // --- Process Recent Orders ---
        if (ordersRes?.success) {
          const orders = responseItems(ordersRes.data);
          const sorted = [...orders].sort((a, b) => new Date(b.orderDate || b.createdAt || 0).getTime() - new Date(a.orderDate || a.createdAt || 0).getTime());
          setRecentOrders(sorted.slice(0, 5));
        }

        // --- Process Active Orders ---
        let exactActiveOrders = 0;
        [draftRes, confirmedRes, packedRes, partDispatchedRes].forEach(res => {
          if (res?.success) {
            exactActiveOrders += res.data?.pagination?.totalItems || (res.data as any).total || (res.data as any).count || responseItems(res.data).length || 0;
          }
        });
        setActiveOrders(exactActiveOrders);

        // --- Process Sales Summary ---
        if (salesSummaryRes?.success) {
          const data = salesSummaryRes.data?.report || salesSummaryRes.data || {};
          setTotalSales(Number(data.totalRevenue || data.totalSales || data.amount || 0));
          
          const timeline = data.timeline || data.items || [];
          const monthMap: Record<string, number> = {};
          timeline.forEach((item: any) => {
             const month = new Date(item.period || item.date || item.month).toLocaleString('en-US', { month: 'short' });
             if (month !== 'Invalid Date') {
               monthMap[month] = (monthMap[month] || 0) + Number(item.revenue || item.sales || item.amount || 0);
             }
          });
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          setSalesData(months.map(m => ({ month: m, sales: monthMap[m] || 0 })));
        }

        // --- Process Ledger Aging (Pending Payments) ---
        if (agingRes?.success) {
          const agingItems = Array.isArray(agingRes.data) ? agingRes.data : (agingRes.data?.report || agingRes.data?.items || [agingRes.data].filter(Boolean));
          const totalPending = agingItems.reduce((acc: number, item: any) => acc + Number(item.currentBalance || item.totalOutstanding || 0), 0);
          setPendingPayments(totalPending);
        }

        // --- Process Low Stock Alerts ---
        if (alertsRes?.success) {
          setLowStockCount(responseItems(alertsRes.data).length);
        }

        // --- Process Inventory Items ---
        if (stockRes?.success) {
          setTotalInventoryItems(stockRes.data?.pagination?.totalItems || (stockRes.data as any).total || (stockRes.data as any).count || responseItems(stockRes.data).length);
        }

        // --- Process Designs ---
        if (designsRes?.success) {
          setActiveDesigns(designsRes.data?.pagination?.totalItems || (designsRes.data as any).total || (designsRes.data as any).count || responseItems(designsRes.data).length);
        }

        // --- Process Workers ---
        if (workersRes?.success) {
          const workers = responseItems(workersRes.data);
          const active = workers.filter((w: any) => w.isActive !== false).length;
          setActiveWorkers(active);
          setInactiveWorkers(workers.length - active);
        }

        // --- Process Dealers ---
        if (dealersRes?.success) {
          setActiveDealers(dealersRes.data?.pagination?.totalItems || (dealersRes.data as any).total || (dealersRes.data as any).count || responseItems(dealersRes.data).length);
        }

      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        if (isMounted) {
          setIsDashboardLoading(false);
        }
      }
    };

    setIsDashboardLoading(true);
    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Show skeleton if dashboard explicitly loading OR recent activities context is still loading
  if (isDashboardLoading || activitiesLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="space-y-8 p-4 sm:p-6 lg:p-8">
          {/* KPI Cards Skeleton */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-xl" />
            ))}
          </div>

          {/* Charts and Alerts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[400px] rounded-xl lg:col-span-2" />
            <Skeleton className="h-[400px] rounded-xl" />
          </div>

          {/* Quick Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px] rounded-xl" />
            ))}
          </div>

          {/* Table Skeleton */}
          <Skeleton className="h-[300px] rounded-xl w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <KPICards
            totalSales={totalSales}
            activeOrders={activeOrders}
            pendingPayments={pendingPayments}
            lowStockItems={lowStockCount}
          />
        </motion.div>

        {/* Charts and Alerts Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Sales Chart - Spans 2 columns */}
          <div className="lg:col-span-2">
            <SalesChart data={salesData} />
          </div>

          {/* Recent Activity Widget */}
          <div>
            <RecentActivityWidget activities={activities} loading={activitiesLoading} />
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-xl p-4 theme-card-accent border border-border">
            <p className="text-sm text-muted-foreground mb-2">Total Designs</p>
            <p className="text-2xl font-bold theme-text-primary">{activeDesigns}</p>
            <p className="text-xs text-success mt-2">Active designs</p>
          </div>
          <div className="bg-white rounded-xl p-4 theme-card-accent border border-border">
            <p className="text-sm text-muted-foreground mb-2">Active Workers</p>
            <p className="text-2xl font-bold theme-text-primary">{activeWorkers}</p>
            <p className="text-xs text-muted mt-2">{inactiveWorkers} inactive</p>
          </div>
          <div className="bg-white rounded-xl p-4 theme-card-accent border border-border">
            <p className="text-sm text-muted-foreground mb-2">Active Dealers</p>
            <p className="text-2xl font-bold theme-text-primary">{activeDealers}</p>
            <p className="text-xs text-warning mt-2">from party ledger</p>
          </div>
          <div className="bg-white rounded-xl p-4 theme-card-accent border border-border">
            <p className="text-sm text-muted-foreground mb-2">Inventory Items</p>
            <p className="text-2xl font-bold theme-text-primary">{totalInventoryItems}</p>
            <p className="text-xs text-danger mt-2">{lowStockCount} low stock</p>
          </div>
        </motion.div>

        {/* Recent Orders Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden"
        >
          <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-between">
            <div>
              <h3 className="text-[18px] font-bold theme-text-primary">Recent Orders</h3>
              <p className="text-sm text-[#6b7280] mt-1">Latest 5 sales entries from your dispatch ledger</p>
            </div>
            <button 
              onClick={() => {
                setIsRedirecting(true);
                router.push('/dashboard/orders-dispatch');
              }} 
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-2"
              disabled={isRedirecting}
            >
              {isRedirecting && <Loader2 className="h-4 w-4 animate-spin" />}
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#374151]">
              <thead className="bg-[#f9fafb] text-[#6b7280]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Order ID</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Dealer</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#6b7280]">
                      No orders found in the system.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr 
                      key={order.id || order.orderNumber} 
                      className="hover:bg-[#f9fafb]/50 transition-colors cursor-pointer"
                      onClick={() => router.push('/dashboard/orders-dispatch')}
                    >
                      <td className="px-6 py-4 font-medium theme-text-primary">
                        {order.orderNumber || order.orderNo || order.id?.slice(0,8)}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(order.orderDate || order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {order.dealer?.name || order.dealerName || 'Walk-in Customer'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          order.status === 'COMPLETED' || order.status === 'DISPATCHED' ? 'bg-[#d1fae5] text-[#065f46]' :
                          order.status === 'CANCELLED' ? 'bg-[#fee2e2] text-[#991b1b]' :
                          'bg-[#fef3c7] text-[#92400e]'
                        }`}>
                          {String(order.status || 'Unknown').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#1a7a4a]">
                        ₹{Number(order.totalAmount || order.total || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
