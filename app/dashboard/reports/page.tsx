'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, FileText, Package, TrendingUp, Users, Wallet } from 'lucide-react';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { SkeletonCard, SkeletonTable } from '@/components/skeleton/Skeletons';
import { formatCurrency } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';

import {
  AssignmentService,
  BackendRecord,
  DesignService,
  InventoryService,
  OrderService,
  PaymentService,
  ReportService,
  responseItems,
  WorkerService,
} from '@/lib/services/business-modules.service';
import { BackendTenant } from '@/lib/types';
import { CurrentOwnerService } from '@/lib/services/current-owner.service';

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

async function downloadPdf(filename: string, title: string, rows: BackendRecord[], tenant: BackendTenant | null) {
  if (!rows.length) {
    toast.error('No rows available to download');
    return;
  }
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let startY = 20;

  if (tenant?.logoUrl) {
    try {
      let logoSrc = tenant.logoUrl;
      if (!/^https?:\/\//i.test(logoSrc)) {
         let normalized = logoSrc.replace(/\\/g, '/').replace(/^\/?api\//, '/');
         if (!normalized.startsWith('/')) normalized = '/' + normalized;
         logoSrc = window.location.origin + normalized;
      }
      
      const imgData = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
             ctx.drawImage(img, 0, 0);
             resolve(canvas.toDataURL('image/png'));
          } else reject('no ctx');
        };
        img.onerror = reject;
        img.src = logoSrc;
      });
      
      doc.addImage(imgData, 'PNG', pageWidth / 2 - 15, startY, 30, 30);
      startY += 35;
    } catch (err) {
      console.warn('Failed to load logo for PDF', err);
    }
  }

  doc.setFontSize(20);
  doc.setTextColor(15, 42, 74);
  const businessName = tenant?.name || 'Business Report';
  doc.text(businessName, pageWidth / 2, startY, { align: 'center' });
  startY += 8;

  doc.setFontSize(10);
  doc.setTextColor(100);
  const details = [
    tenant?.address,
    tenant?.phone ? `Ph: ${tenant.phone}` : null,
    tenant?.email ? `Email: ${tenant.email}` : null
  ].filter(Boolean).join(' | ');

  if (details) {
    doc.text(details, pageWidth / 2, startY, { align: 'center' });
    startY += 8;
  }

  startY += 10;
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(title, 14, startY);
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, startY + 7);
  
  startY += 12;

  const headers = Object.keys(rows[0]);
  const data = rows.map(row => headers.map(header => String(row[header] ?? '-')));

  autoTable(doc, {
    startY: startY,
    head: [headers.map(h => h.toUpperCase())],
    body: data,
    theme: 'striped',
    headStyles: { fillColor: [15, 42, 74] },
    styles: { fontSize: 8 },
  });

  doc.save(filename);
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
  const [workerPayments, setWorkerPayments] = useState<BackendRecord[]>([]);
  const [aging, setAging] = useState<BackendRecord | null>(null);
  const [cashflow, setCashflow] = useState<BackendRecord[]>([]);
  const [designs, setDesigns] = useState<BackendRecord[]>([]);

  const [reportData, setReportData] = useState<Record<string, any>>({});

  // Default date range: last 30 days
  const defaultToDate = new Date().toISOString().slice(0, 10);
  const defaultFromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);

  const canExport = hasPermission('reports.read') || hasPermission('dashboard.read');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tenantRes = await CurrentOwnerService.getCurrentOwner();
      if (!tenantRes.success || !tenantRes.data) {
        toast.error(tenantRes.error?.message || 'No business tenant found');
        return;
      }

      setTenant(tenantRes.data);
      const dateRange = { fromDate, toDate };

      const [
        ordersRes,
        stockRes,
        alertsRes,
        workersRes,
        assignmentsRes,
        paymentsRes,
        workerPaymentsRes,
        designsRes,
        // Real backend report endpoints
        salesSummaryRes,
        stockMovementRes,
        workerProdRes,
        paymentCollectionRes,
        inventoryValuationRes,
        ledgerAgingRes,
      ] = await Promise.all([
        OrderService.list(tenantRes.data.id, { page: 1, per_page: 100 }),
        InventoryService.listStock(tenantRes.data.id, { page: 1, per_page: 100 }),
        InventoryService.listLowStockAlerts(tenantRes.data.id, { page: 1, per_page: 100 }),
        WorkerService.list(tenantRes.data.id, { page: 1, per_page: 100 }),
        AssignmentService.list(tenantRes.data.id, { page: 1, per_page: 100 }),
        PaymentService.list(tenantRes.data.id, { page: 1, per_page: 100 }),
        WorkerService.listPayments(tenantRes.data.id, { page: 1, per_page: 100 }),
        DesignService.list(tenantRes.data.id, { page: 1, per_page: 100 }),
        // Real backend dedicated report endpoints
        ReportService.salesSummary(tenantRes.data.id, { ...dateRange, groupBy: 'month' }),
        ReportService.stockMovement(tenantRes.data.id, dateRange),
        ReportService.workerProductivity(tenantRes.data.id, dateRange),
        ReportService.paymentCollection(tenantRes.data.id, dateRange),
        ReportService.inventoryValuation(tenantRes.data.id),
        ReportService.ledgerAging(tenantRes.data.id, { ...dateRange, partyType: 'DEALER' }),
      ]);

      if (ordersRes.success) setOrders(responseItems(ordersRes.data));
      if (stockRes.success) setStock(responseItems(stockRes.data));
      if (alertsRes.success) setAlerts(responseItems(alertsRes.data));
      if (workersRes.success) setWorkers(responseItems(workersRes.data));
      if (assignmentsRes.success) setAssignments(responseItems(assignmentsRes.data));
      if (workerPaymentsRes.success) setWorkerPayments(responseItems(workerPaymentsRes.data));
      if (paymentsRes.success) {
        const pItems = responseItems(paymentsRes.data);
        setPayments(pItems);
        
        const daysMap: Record<string, { date: string, inflow: number, outflow: number }> = {};
        pItems.forEach(payment => {
          if (!['CLEARED', 'COMPLETED', 'PAID', 'SUCCESS'].includes(String(payment.status || payment.paymentStatus).toUpperCase())) return;
          const dateStr = String(payment.paymentDate || payment.paidAt || payment.createdAt).split('T')[0];
          if (!daysMap[dateStr]) daysMap[dateStr] = { date: dateStr, inflow: 0, outflow: 0 };
          const amt = Number(payment.amount || 0);
          const nature = String(payment.nature || payment.paymentNature || '');
          if (nature === 'DEALER_RECEIPT' || nature === 'DEALER_ADVANCE') {
             daysMap[dateStr].inflow += amt;
          } else if (nature === 'SUPPLIER_PAYMENT' || nature === 'SUPPLIER_ADVANCE') {
             daysMap[dateStr].outflow += amt;
          } else {
             const pType = String(payment.party?.type || payment.party?.partyType || payment.partyType || 'DEALER');
             if (pType === 'DEALER') daysMap[dateStr].inflow += amt;
             else daysMap[dateStr].outflow += amt;
          }
        });
        const cashItems = Object.values(daysMap)
          .map(d => ({ ...d, netCashFlow: d.inflow - d.outflow }))
          .sort((a, b) => b.date.localeCompare(a.date));
        setCashflow(cashItems);
      }
      
      if (designsRes.success) setDesigns(responseItems(designsRes.data));

      if (ledgerAgingRes.success) {
        const items = Array.isArray(ledgerAgingRes.data) ? ledgerAgingRes.data : (ledgerAgingRes.data?.report || [ledgerAgingRes.data].filter(Boolean));
        let totalOutstanding = 0;
        items.forEach((item: any) => {
          totalOutstanding += Number(item.currentBalance || item.totalOutstanding || 0);
        });
        setAging({ totalOutstanding });
      }

      // Store raw report data from dedicated report endpoints
      setReportData({
        salesSummary: salesSummaryRes.success ? salesSummaryRes.data : null,
        stockMovement: stockMovementRes.success ? stockMovementRes.data : null,
        workerProductivity: workerProdRes.success ? workerProdRes.data : null,
        paymentCollection: paymentCollectionRes.success ? paymentCollectionRes.data : null,
        inventoryValuation: inventoryValuationRes.success ? inventoryValuationRes.data : null,
      });
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  const pathname = usePathname();

  useEffect(() => {
    loadData();
  }, [loadData, pathname]);

  const salesRows = useMemo(() => orders.map(order => ({
    order: order.orderNo || order.orderNumber || order.id,
    dealer: order.dealer?.name || order.party?.name || order.dealerName || '-',
    items: order.items?.length || 0,
    status: order.status || order.orderStatus || '-',
    subtotal: asNumber(order.subtotal || 0),
    discount: asNumber(order.discount || 0),
    taxPercent: asNumber(order.taxPercent || 0),
    total: asNumber(order.totalAmount || order.grandTotal || order.totalValue),
    outstanding: asNumber(order.outstandingAmount || 0),
    orderedAt: prettyDate(order.orderDate || order.createdAt),
  })), [orders]);

  const inventoryRows = useMemo(() => stock.map(item => ({
    design: item.design?.code || item.designCode || item.code || item.designId || '-',
    name: item.design?.name || item.designName || item.name || '-',
    unpackaged: asNumber(item.unpackagedPieces || item.availablePieces),
    packaged: asNumber(item.packagedDozens || item.totalPackaged),
    available: asNumber(item.availableDozens),
    reserved: asNumber(item.reservedDozens),
    dispatched: asNumber(item.dispatchedDozens),
    threshold: asNumber(item.lowStockAlertAt || item.lowStockThreshold || item.threshold),
    updatedAt: prettyDate(item.updatedAt || item.lastUpdated),
  })), [stock]);

  const workerRows = useMemo(() => workers.map(worker => {
    const workerAssignments = assignments.filter(item => item.workerId === worker.id || item.worker?.id === worker.id);
    const completed = workerAssignments.filter(item => ['completed', 'done', 'returned'].includes(String(item.status || item.assignmentStatus || '').toLowerCase())).length;
    const pending = workerAssignments.length - completed;
    const successRatio = workerAssignments.length > 0 ? ((completed / workerAssignments.length) * 100).toFixed(1) + '%' : '0%';

    let totalSalary = 0;
    workerAssignments.forEach(assignment => {
      const design = designs.find(d => d.id === assignment.designId || d.id === assignment.design?.id);
      const pieceRate = asNumber(design?.pieceRateRs || design?.pieceRate || design?.workerRatePerPiece || 0);
      let piecesReturned = 0;
      if (assignment.returns && Array.isArray(assignment.returns)) {
        piecesReturned = assignment.returns.reduce((sum, r) => sum + asNumber(r.piecesReturned), 0);
      } else {
        piecesReturned = asNumber(assignment.piecesReturned || assignment.deliveredPieces || 0);
      }
      totalSalary += piecesReturned * pieceRate;
    });

    const workerPaymentsForWorker = workerPayments.filter(p => p.workerId === worker.id || p.party?.id === worker.id || p.partyId === worker.id);
    const paidAmount = workerPaymentsForWorker.reduce((sum, p) => sum + asNumber(p.amount), 0);
    const outstandingAmount = totalSalary - paidAmount;

    return {
      worker: worker.name || worker.workerName || worker.id,
      phone: worker.phone || '-',
      status: worker.isActive === false || worker.status === 'INACTIVE' ? 'Inactive' : 'Active',
      assignments: workerAssignments.length,
      pending: pending,
      completed: completed,
      successRatio: successRatio,
      totalSalary: totalSalary,
      paidAmount: paidAmount,
      outstandingAmount: outstandingAmount,
      role: worker.role || '-',
      joinedAt: prettyDate(worker.joinedAt || worker.createdAt),
    };
  }), [assignments, workers, designs, workerPayments]);

  const paymentRows = useMemo(() => payments.map(payment => ({
    payment: payment.paymentNo || payment.id,
    party: payment.party?.name || payment.dealer?.name || payment.supplier?.name || payment.partyName || '-',
    method: payment.paymentMethod || payment.method || '-',
    nature: payment.nature || payment.paymentNature || '-',
    status: payment.paymentStatus || payment.status || '-',
    amount: asNumber(payment.amount),
    reference: payment.referenceNo || payment.reference || '-',
    date: prettyDate(payment.paymentDate || payment.paidAt || payment.createdAt),
  })), [payments]);

  const designRows = useMemo(() => designs.map(design => ({
    code: design.designCode || design.code || design.id,
    name: design.name || '-',
    category: design.category?.name || design.categoryName || '-',
    hsnCode: design.hsnCode || '-',
    colors: design.colors?.length || 0,
    sizes: design.sizes?.length || 0,
    status: design.status || (design.isActive === false ? 'Inactive' : 'Active'),
    pieceRate: asNumber(design.pieceRateRs || design.pieceRate || design.workerRatePerPiece),
    dozenRate: asNumber(design.salePricePerDozen || design.sellingPricePerDozen || design.defaultPricePerDozen || design.pricePerDozen || design.price),
    createdAt: prettyDate(design.createdAt),
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
  const lowStockCount = alerts.length || inventoryRows.filter(row => row.threshold > 0 && row.packaged <= row.threshold).length;

  return (
    <DashboardLayout
      title="Reports & Analytics"
      subtitle="Live backend analysis from orders, inventory, workers, payments, and designs"
      action={null}
    >
      <div className="space-y-6">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {reportTypes.map(report => (
            <div
              key={report.key}
              onClick={() => setActiveReport(report.key)}
              role="button"
              tabIndex={0}
              className={`flex shrink-0 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${activeReport === report.key ? 'border-[#0F2A4A] bg-white shadow-sm' : 'border-[#e5e7eb] bg-white hover:border-[#0F2A4A]/30'}`}
            >
              <div className="rounded-lg bg-[#f9fafb] p-2">{report.icon}</div>
              <span className="whitespace-nowrap text-sm font-semibold theme-text-primary">{report.label}</span>
              {canExport && (
                <div className="ml-2 flex items-center gap-1">
                  <button
                    onClick={event => {
                      event.stopPropagation();
                      downloadCsv(`${report.key}-report.csv`, report.rows);
                    }}
                    className="rounded p-1 hover:bg-[#e5e7eb] text-[#9ca3af] transition-colors"
                    title="Download CSV"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={event => {
                      event.stopPropagation();
                      downloadPdf(`${report.key}-report.pdf`, report.label, report.rows, tenant);
                    }}
                    className="rounded p-1 hover:bg-[#e5e7eb] text-[#9ca3af] transition-colors"
                    title="Download PDF"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
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
                rows={(alerts.length > 0 ? alerts.map(item => ({
                  design: item.design?.code || item.designCode || item.code || item.designId || '-',
                  name: item.design?.name || item.designName || item.name || '-',
                  unpackaged: asNumber(item.unpackagedPieces || item.availablePieces),
                  packaged: asNumber(item.packagedDozens || item.availableDozens),
                  threshold: asNumber(item.lowStockAlertAt || item.lowStockThreshold || item.threshold),
                })) : [...inventoryRows])
                  .sort((a, b) => (a.packaged - a.threshold) - (b.packaged - b.threshold))
                  .slice(0, 5)
                  .map(row => ({
                    label: `${row.design} - ${row.name}`,
                    value: `${row.unpackaged} pcs / ${row.packaged} doz`,
                    danger: row.threshold > 0 && row.packaged <= row.threshold,
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

            <ReportTable 
              title={reportTypes.find(report => report.key === activeReport)?.label || 'Report'} 
              rows={activeRows} 
              onDownloadCsv={() => downloadCsv(`${activeReport}-report.csv`, activeRows)}
              onDownloadPdf={() => downloadPdf(`${activeReport}-report.pdf`, reportTypes.find(r => r.key === activeReport)?.label || 'Report', activeRows, tenant)}
            />
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

function ReportTable({ title, rows, onDownloadCsv, onDownloadPdf }: { title: string; rows: BackendRecord[]; onDownloadCsv: () => void; onDownloadPdf: () => void }) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white theme-card-accent">
      <div className="flex items-center justify-between gap-3 border-b border-[#e5e7eb] p-4">
        <h3 className="text-[16px] font-bold theme-text-primary">{title}</h3>
        <div className="flex gap-2">
          <button onClick={onDownloadCsv} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold">
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button onClick={onDownloadPdf} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold">
            <FileText className="h-3.5 w-3.5" />
            PDF
          </button>
        </div>
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
