'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { KPICards } from '@/components/dashboard/kpi-cards';
import { SalesChart, SalesDataPoint } from '@/components/dashboard/sales-chart';
import { AlertsWidget } from '@/components/dashboard/alerts-widget';
import { CurrentTenantService } from '@/lib/services/current-tenant.service';
import {
  OrderService,
  PaymentService,
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
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // KPI States
  const [totalSales, setTotalSales] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Widget States
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Quick Stats States
  const [activeDesigns, setActiveDesigns] = useState(0);
  const [activeWorkers, setActiveWorkers] = useState(0);
  const [inactiveWorkers, setInactiveWorkers] = useState(0);
  const [activeDealers, setActiveDealers] = useState(0);
  const [totalInventoryItems, setTotalInventoryItems] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const tenantRes = await CurrentTenantService.getCurrentTenant();
        if (!tenantRes.success || !tenantRes.data) {
          setLoading(false);
          return; // No tenant yet
        }
        const tenantId = tenantRes.data.id;

        // Fetch critical data first (Orders for Chart and Table)
        OrderService.list(tenantId, { page: 1, limit: 20 }).then(ordersRes => {
          if (ordersRes.success) {
            const orders = responseItems(ordersRes.data);
            let sumSales = 0;
            let sumActive = 0;
            
            const monthMap: Record<string, number> = {};
            
            orders.forEach((o: any) => {
              const amount = Number(o.totalAmount || o.total || 0);
              
              const status = String(o.status || '').toUpperCase();
              if (status !== 'CANCELLED') {
                sumSales += amount;
              }
              
              if (['DRAFT', 'CONFIRMED', 'PACKED', 'PARTIALLY_DISPATCHED'].includes(status)) {
                sumActive++;
              }

              // Sales Chart logic
              const dateStr = o.orderDate || o.createdAt;
              const date = dateStr ? new Date(dateStr) : null;
              if (date && !isNaN(date.getTime()) && status !== 'CANCELLED') {
                const month = date.toLocaleString('en-US', { month: 'short' });
                monthMap[month] = (monthMap[month] || 0) + amount;
              }
            });
            
            setTotalSales(sumSales);
            setActiveOrders(sumActive);
            
            // Sort by date descending and take top 5 for Recent Orders
            const sorted = [...orders].sort((a, b) => new Date(b.orderDate || b.createdAt || 0).getTime() - new Date(a.orderDate || a.createdAt || 0).getTime());
            setRecentOrders(sorted.slice(0, 5));

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            setSalesData(months.map(m => ({ month: m, sales: monthMap[m] || 0 })));
          }
          // Set loading to false as soon as orders load to make it feel fast!
          setLoading(false);
        });

        // Fetch non-critical data independently in background
        PaymentService.agingReport(tenantId).then(agingRes => {
          if (agingRes.success) {
            const agingItems = Array.isArray(agingRes.data) ? agingRes.data : (agingRes.data?.items || [agingRes.data].filter(Boolean));
            const totalPending = agingItems.reduce((acc: number, item: any) => acc + Number(item.totalOutstanding || 0), 0);
            setPendingPayments(totalPending);
          }
        });

        InventoryService.listLowStockAlerts(tenantId, { page: 1, limit: 10 }).then(alertsRes => {
          if (alertsRes.success) {
            const rawAlerts = responseItems(alertsRes.data);
            setLowStockCount(rawAlerts.length);
            setAlerts(rawAlerts.map((a: any) => ({
              id: a.id || Math.random().toString(),
              title: `Low Stock: ${a.designName || a.design?.name || 'Unknown Design'}`,
              message: `Current stock is ${a.currentStock} ${a.unit || 'dozens'} (Threshold: ${a.threshold})`,
              severity: 'warning',
              timestamp: new Date(a.createdAt || new Date()),
              type: 'low_stock'
            })));
          }
        });

        InventoryService.listStock(tenantId, { page: 1, limit: 1 }).then(stockRes => {
          if (stockRes.success) {
            const total = (stockRes.data as any).total || (stockRes.data as any).count || responseItems(stockRes.data).length;
            setTotalInventoryItems(total);
          }
        });

        DesignService.list(tenantId, { page: 1, limit: 1 }).then(designsRes => {
          if (designsRes.success) {
            const total = (designsRes.data as any).total || (designsRes.data as any).count || responseItems(designsRes.data).length;
            setActiveDesigns(total);
          }
        });

        WorkerService.list(tenantId, { page: 1, limit: 100 }).then(workersRes => {
          if (workersRes.success) {
            const workers = responseItems(workersRes.data);
            const active = workers.filter((w: any) => w.isActive !== false).length;
            setActiveWorkers(active);
            setInactiveWorkers(workers.length - active);
          }
        });

        PartyService.list(tenantId, { type: 'DEALER', page: 1, limit: 1 }).then(dealersRes => {
          if (dealersRes.success) {
            const total = (dealersRes.data as any).total || (dealersRes.data as any).count || responseItems(dealersRes.data).length;
            setActiveDealers(total);
          }
        });

      } catch (error) {
        console.error('Error loading dashboard:', error);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
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

          {/* Alerts Widget */}
          <div>
            <AlertsWidget alerts={alerts} />
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
