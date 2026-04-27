'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { KPICards } from '@/components/dashboard/kpi-cards';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { AlertsWidget } from '@/components/dashboard/alerts-widget';
import {
  mockOrders,
  mockInvoices,
  mockInventoryItems,
  mockDashboardAlerts,
} from '@/lib/data';

export default function DashboardPage() {
  // Calculate KPIs from mock data
  const totalSales = mockOrders.reduce((sum, order) => sum + order.totalValue, 0);
  const activeOrders = mockOrders.filter(
    order => order.orderStatus === 'confirmed' || order.orderStatus === 'packed'
  ).length;
  const pendingPayments = mockInvoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);
  const lowStockItems = mockInventoryItems.filter(
    item => item.unpackagedPieces < item.lowStockThreshold
  ).length;

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* KPI Cards */}
        <KPICards
          totalSales={totalSales}
          activeOrders={activeOrders}
          pendingPayments={pendingPayments}
          lowStockItems={lowStockItems}
        />

        {/* Charts and Alerts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart - Spans 2 columns */}
          <div className="lg:col-span-2">
            <SalesChart />
          </div>

          {/* Alerts Widget */}
          <div>
            <AlertsWidget alerts={mockDashboardAlerts} />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-border">
            <p className="text-sm text-muted-foreground mb-2">Total Designs</p>
            <p className="text-2xl font-bold text-primary">6</p>
            <p className="text-xs text-success mt-2">Active designs</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-border">
            <p className="text-sm text-muted-foreground mb-2">Active Workers</p>
            <p className="text-2xl font-bold text-primary">4</p>
            <p className="text-xs text-muted mt-2">1 inactive</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-border">
            <p className="text-sm text-muted-foreground mb-2">Active Dealers</p>
            <p className="text-2xl font-bold text-primary">4</p>
            <p className="text-xs text-warning mt-2">1 overdue</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-border">
            <p className="text-sm text-muted-foreground mb-2">Inventory Items</p>
            <p className="text-2xl font-bold text-primary">3</p>
            <p className="text-xs text-danger mt-2">{lowStockItems} low stock</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
