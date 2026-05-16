'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, FileText, Package, RefreshCw, TrendingUp, Users, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonCard, SkeletonTable } from '@/components/skeleton/Skeletons';
import { formatCurrency } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import { CurrentTenantService } from '@/lib/services/current-tenant.service';
import {
  AssignmentService,
  BackendRecord,
  DesignService,
  InventoryService,
  OrderService,
  PaymentService,
  responseItems,
  WorkerService,
} from '@/lib/services/business-modules.service';
import { BackendTenant } from '@/lib/types';

type ReportKey = 'sales' | 'inventory' | 'workers' | 'payments' | 'designs';

function asNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function prettyDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

function monthKey(value?: string | null) {
  if (!value) return 'No date';
  return new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(value));
}

function downloadCsv(filename: string, rows: BackendRecord[]) {
  if (!rows.length) {
    toast.error('No rows available to download');
    return;
  }

  const headerSet = new Set<string>();
  rows.forEach(row => Object.keys(row).forEach(key => headerSet.add(key)));
  const headers = Array.from(headerSet);

  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(header => {
      const value = row[header] ?? '';
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { hasPermission } = useAuth();
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [activeReport, setActiveReport] = useState<ReportKey>('sales');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<BackendRecord[]>([]);
  const [stock, setStock] = useState<BackendRecord[]>([]);
  const [alerts, setAlerts] = useState<BackendRecord[]>([]);
  const [workers, setWorkers] = useState<BackendRecord[]>([]);
  const [assignments, setAssignments] = useState<BackendRecord[]>([]);
  const [payments, setPayments] = useState<BackendRecord[]>([]);
  const [aging, setAging] = useState<BackendRecord | null>(null);
  const [cashflow, setCashflow] = useState<BackendRecord[]>([]);
  const [designs, setDesigns] = useState<BackendRecord[]>([]);

  const canExport = hasPermission('reports.read') || hasPermission('dashboard.read');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tenantRes = await CurrentTenantService.getCurrentTenant();
      if (!tenantRes.success || !tenantRes.data) {
        toast.error(tenantRes.error?.message || 'No business tenant found');
        return;
      }

      setTenant(tenantRes.data);
      const [
        ordersRes,
        stockRes,
        alertsRes,
        workersRes,
        assignmentsRes,
        paymentsRes,
        agingRes,
        cashflowRes,
        designsRes,
      ] = await Promise.all([
        OrderService.list(tenantRes.data.id, { page: 1, limit: 100 }),
        InventoryService.listStock(tenantRes.data.id, { page: 1, limit: 100 }),
        InventoryService.listLowStockAlerts(tenantRes.data.id, { page: 1, limit: 100 }),
        WorkerService.list(tenantRes.data.id, { page: 1, limit: 100 }),
        AssignmentService.list(tenantRes.data.id, { page: 1, limit: 100 }),
        PaymentService.list(tenantRes.data.id, { page: 1, limit: 100 }),
        PaymentService.agingReport(tenantRes.data.id),
        PaymentService.cashflow(tenantRes.data.id),
        DesignService.list(tenantRes.data.id, { page: 1, limit: 100 }),
      ]);

      if (ordersRes.success) setOrders(responseItems(ordersRes.data));
      if (stockRes.success) setStock(responseItems(stockRes.data));
      if (alertsRes.success) setAlerts(responseItems(alertsRes.data));
      if (workersRes.success) setWorkers(responseItems(workersRes.data));
      if (assignmentsRes.success) setAssignments(responseItems(assignmentsRes.data));
      if (paymentsRes.success) setPayments(responseItems(paymentsRes.data));
      if (agingRes.success) setAging(agingRes.data);
      if (cashflowRes.success) setCashflow(responseItems(cashflowRes.data as any));
      if (designsRes.success) setDesigns(responseItems(designsRes.data));
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const salesRows = useMemo(() => orders.map(order => ({
    order: order.orderNo || order.orderNumber || order.id,
    dealer: order.dealer?.name || order.party?.name || order.dealerName || '-',
    status: order.status || order.orderStatus || '-',
    total: asNumber(order.totalAmount || order.grandTotal || order.totalValue),
    orderedAt: prettyDate(order.orderDate || order.createdAt),
  })), [orders]);

  const inventoryRows = useMemo(() => stock.map(item => ({
    design: item.design?.code || item.designCode || item.code || item.designId || '-',
    name: item.design?.name || item.designName || item.name || '-',
    unpackaged: asNumber(item.unpackagedPieces || item.availablePieces),
    packaged: asNumber(item.packagedDozens || item.availableDozens),
    threshold: asNumber(item.lowStockAlertAt || item.lowStockThreshold || item.threshold),
    updatedAt: prettyDate(item.updatedAt || item.lastUpdated),
  })), [stock]);

  const workerRows = useMemo(() => workers.map(worker => {
    const workerAssignments = assignments.filter(item => item.workerId === worker.id || item.worker?.id === worker.id);
    return {
      worker: worker.name || worker.workerName || worker.id,
      status: worker.isActive === false ? 'Inactive' : 'Active',
      assignments: workerAssignments.length,
      pending: workerAssignments.filter(item => ['pending', 'in_progress'].includes(String(item.status || item.assignmentStatus || '').toLowerCase())).length,
      phone: worker.phone || '-',
    };
  }), [assignments, workers]);

  const paymentRows = useMemo(() => payments.map(payment => ({
    payment: payment.paymentNo || payment.id,
    party: payment.party?.name || payment.dealer?.name || payment.supplier?.name || payment.partyName || '-',
    method: payment.paymentMethod || payment.method || '-',
    status: payment.paymentStatus || payment.status || '-',
    amount: asNumber(payment.amount),
    date: prettyDate(payment.paymentDate || payment.paidAt || payment.createdAt),
  })), [payments]);

  const designRows = useMemo(() => designs.map(design => ({
    code: design.designCode || design.code || design.id,
    name: design.name || '-',
    category: design.category?.name || design.categoryName || '-',
    status: design.status || (design.isActive === false ? 'Inactive' : 'Active'),
    pieceRate: asNumber(design.pieceRateRs || design.pieceRate || design.workerRatePerPiece),
    dozenRate: asNumber(design.salePricePerDozen || design.sellingPricePerDozen || design.defaultPricePerDozen || design.pricePerDozen || design.price),
  })), [designs]);

  const salesByMonth = useMemo(() => {
    const grouped = orders.reduce<Record<string, { month: string; sales: number; orders: number }>>((acc, order) => {
      const key = monthKey(order.orderDate || order.createdAt);
      acc[key] ||= { month: key, sales: 0, orders: 0 };
      acc[key].sales += asNumber(order.totalAmount || order.grandTotal || order.totalValue);
      acc[key].orders += 1;
      return acc;
    }, {});
    return Object.values(grouped);
  }, [orders]);

  const reportTypes = [
    { key: 'sales' as ReportKey, label: 'Sales Report', icon: <TrendingUp className="h-4 w-4 text-[#0d7377]" />, rows: salesRows },
    { key: 'inventory' as ReportKey, label: 'Inventory Report', icon: <Package className="h-4 w-4 text-[#f5a623]" />, rows: inventoryRows },
    { key: 'workers' as ReportKey, label: 'Worker Performance', icon: <Users className="h-4 w-4 text-[#6b7280]" />, rows: workerRows },
    { key: 'payments' as ReportKey, label: 'Payment Ageing', icon: <Wallet className="h-4 w-4 text-[#ef4444]" />, rows: paymentRows },
    { key: 'designs' as ReportKey, label: 'Design Analysis', icon: <FileText className="h-4 w-4 theme-text-primary" />, rows: designRows },
  ];

  const activeRows = reportTypes.find(report => report.key === activeReport)?.rows || [];
  const totalSales = salesRows.reduce((sum, row) => sum + asNumber(row.total), 0);
  const activeOrders = orders.filter(order => ['confirmed', 'packed', 'partially_dispatched'].includes(String(order.status || order.orderStatus || '').toLowerCase())).length;
  const paymentCollected = paymentRows.reduce((sum, row) => sum + asNumber(row.amount), 0);
  const lowStockCount = alerts.length || inventoryRows.filter(row => row.threshold > 0 && (row.unpackaged + row.packaged) <= row.threshold).length;

  return (
    <DashboardLayout
      title="Reports & Analytics"
      subtitle="Live backend analysis from orders, inventory, workers, payments, and designs"
      action={
        <button onClick={loadData} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {reportTypes.map(report => (
            <button
              key={report.key}
              onClick={() => setActiveReport(report.key)}
              className={`flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 transition-all ${activeReport === report.key ? 'border-[#0F2A4A] bg-white shadow-sm' : 'border-[#e5e7eb] bg-white hover:border-[#0F2A4A]/30'}`}
            >
              <div className="rounded-lg bg-[#f9fafb] p-2">{report.icon}</div>
              <span className="whitespace-nowrap text-sm font-semibold theme-text-primary">{report.label}</span>
              {canExport && (
                <Download
                  onClick={event => {
                    event.stopPropagation();
                    downloadCsv(`${report.key}-report.csv`, report.rows);
                  }}
                  className="ml-2 h-4 w-4 text-[#9ca3af]"
                />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <>
            <SkeletonCard count={3} />
            <SkeletonTable rows={8} cols={5} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
              <SummaryCard label="Total Sales" value={formatCurrency(totalSales)} hint={`${orders.length} orders`} />
              <SummaryCard label="Active Orders" value={String(activeOrders)} hint="Confirmed or packed" />
              <SummaryCard label="Collected" value={formatCurrency(paymentCollected)} hint={`${payments.length} payments`} />
              <SummaryCard label="Low Stock" value={String(lowStockCount)} hint="Finished goods alerts" danger={lowStockCount > 0} />
            </div>

            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 theme-card-accent">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-[18px] font-bold theme-text-primary">Sales & Orders Trend</h3>
                  <p className="text-sm text-[#6b7280]">Built from live order totals returned by the API.</p>
                </div>
                {canExport && (
                  <button onClick={() => downloadCsv('sales-trend.csv', salesByMonth)} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold">
                    <Download className="h-3.5 w-3.5" />
                    CSV
                  </button>
                )}
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                    <Bar yAxisId="left" dataKey="sales" fill="var(--color-sidebar-bg)" name="Sales" radius={[4, 4, 0, 0]} barSize={32} />
                    <Bar yAxisId="right" dataKey="orders" fill="var(--color-accent)" name="Orders" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <AnalysisList
                title="Inventory Attention"
                rows={inventoryRows.slice(0, 5).map(row => ({
                  label: `${row.design} - ${row.name}`,
                  value: `${row.unpackaged} pcs / ${row.packaged} doz`,
                  danger: row.threshold > 0 && row.unpackaged + row.packaged <= row.threshold,
                }))}
              />
              <AnalysisList
                title="Payment Health"
                rows={[
                  { label: 'Total outstanding', value: formatCurrency(asNumber(aging?.totalOutstanding || aging?.summary?.totalOutstanding)) },
                  { label: 'Cashflow rows', value: String(cashflow.length) },
                  { label: 'Pending payments', value: String(payments.filter(payment => String(payment.paymentStatus || payment.status || '').toLowerCase() === 'pending').length), danger: true },
                ]}
              />
            </div>

            <ReportTable title={reportTypes.find(report => report.key === activeReport)?.label || 'Report'} rows={activeRows} onDownload={() => downloadCsv(`${activeReport}-report.csv`, activeRows)} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({ label, value, hint, danger }: { label: string; value: string; hint: string; danger?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 theme-card-accent">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
      <p className="text-2xl font-black theme-text-primary">{value}</p>
      <p className={`mt-2 text-sm font-semibold ${danger ? 'text-[#cc2200]' : 'text-[#1a7a4a]'}`}>{hint}</p>
    </div>
  );
}

function AnalysisList({ title, rows }: { title: string; rows: Array<{ label: string; value: string; danger?: boolean }> }) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 theme-card-accent">
      <h3 className="mb-5 text-[18px] font-bold theme-text-primary">{title}</h3>
      <div className="space-y-4">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between gap-4 border-b border-[#f3f4f6] pb-3 last:border-0 last:pb-0">
            <span className="min-w-0 truncate text-sm font-semibold theme-text-primary">{row.label}</span>
            <span className={`flex-none text-sm font-bold ${row.danger ? 'text-[#cc2200]' : 'text-[#374151]'}`}>{row.value}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-[#6b7280]">No rows returned by API.</p>}
      </div>
    </div>
  );
}

function ReportTable({ title, rows, onDownload }: { title: string; rows: BackendRecord[]; onDownload: () => void }) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white theme-card-accent">
      <div className="flex items-center justify-between gap-3 border-b border-[#e5e7eb] p-4">
        <h3 className="text-[16px] font-bold theme-text-primary">{title}</h3>
        <button onClick={onDownload} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold">
          <Download className="h-3.5 w-3.5" />
          Download CSV
        </button>
      </div>
      {headers.length === 0 ? (
        <div className="p-10 text-center text-sm font-medium text-[#6b7280]">No report rows found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#f5f6fa]">
                {headers.map(header => (
                  <th key={header} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280]">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {rows.map((row, index) => (
                <tr key={index} className={index % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'}>
                  {headers.map(header => (
                    <td key={header} className="px-5 py-3.5 text-sm text-[#374151]">{String(row[header] ?? '-')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
