'use client';

import React, { useEffect, useState } from 'react';
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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  
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
          return; // No tenant yet
        }
        const tenantId = tenantRes.data.id;

        const [
          ordersRes,
          agingRes,
          alertsRes,
          stockRes,
          designsRes,
          workersRes,
          dealersRes
        ] = await Promise.all([
          OrderService.list(tenantId, { page: 1, limit: 100 }),
          PaymentService.agingReport(tenantId),
          InventoryService.listLowStockAlerts(tenantId, { page: 1, limit: 100 }),
          InventoryService.listStock(tenantId, { page: 1, limit: 100 }),
          DesignService.list(tenantId, { page: 1, limit: 100 }),
          WorkerService.list(tenantId, { page: 1, limit: 100 }),
          PartyService.list(tenantId, { type: 'DEALER', page: 1, limit: 100 })
        ]);

        // Process Orders -> Total Sales, Active Orders, and Sales Chart
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

        // Process Payments -> Pending Payments
        if (agingRes.success) {
          const agingItems = Array.isArray(agingRes.data) ? agingRes.data : (agingRes.data?.items || [agingRes.data].filter(Boolean));
          const totalPending = agingItems.reduce((acc: number, item: any) => acc + Number(item.totalOutstanding || 0), 0);
          setPendingPayments(totalPending);
        }

        // Process Inventory & Alerts
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

        if (stockRes.success) {
          setTotalInventoryItems(responseItems(stockRes.data).length);
        }
        
        if (designsRes.success) {
          const designs = responseItems(designsRes.data);
          setActiveDesigns(designs.filter((d: any) => d.isActive !== false).length);
        }

        if (workersRes.success) {
          const workers = responseItems(workersRes.data);
          const active = workers.filter((w: any) => w.isActive !== false).length;
          setActiveWorkers(active);
          setInactiveWorkers(workers.length - active);
        }

        if (dealersRes.success) {
          const dealers = responseItems(dealersRes.data);
          setActiveDealers(dealers.filter((d: any) => d.isActive !== false).length);
        }

        // Debugging failures
        const failed = [
          { name: 'Orders', res: ordersRes },
          { name: 'Aging', res: agingRes },
          { name: 'Alerts', res: alertsRes },
          { name: 'Stock', res: stockRes },
          { name: 'Designs', res: designsRes },
          { name: 'Workers', res: workersRes },
          { name: 'Dealers', res: dealersRes },
        ].filter(x => !x.res.success);

        if (failed.length > 0) {
          console.error('Dashboard APIs Failed:', failed.map(x => `${x.name}: ${x.res.error?.message}`).join(', '));
          toast.error(`Dashboard data partially loaded. Check console.`);
        }

      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* KPI Cards */}
        <KPICards
          totalSales={totalSales}
          activeOrders={activeOrders}
          pendingPayments={pendingPayments}
          lowStockItems={lowStockCount}
        />

        {/* Charts and Alerts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart - Spans 2 columns */}
          <div className="lg:col-span-2">
            <SalesChart data={salesData} />
          </div>

          {/* Alerts Widget */}
          <div>
            <AlertsWidget alerts={alerts} />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-between">
            <div>
              <h3 className="text-[18px] font-bold theme-text-primary">Recent Orders</h3>
              <p className="text-sm text-[#6b7280] mt-1">Latest 5 sales entries from your dispatch ledger</p>
            </div>
            <a href="/dashboard/orders-dispatch" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              View All
            </a>
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
                    <tr key={order.id || order.orderNumber} className="hover:bg-[#f9fafb]/50 transition-colors">
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
        </div>
      </div>
    </DashboardLayout>
  );
}
