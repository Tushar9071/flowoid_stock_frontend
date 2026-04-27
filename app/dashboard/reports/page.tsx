'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileText, Package, Users, Wallet, CheckCircle, TrendingUp, Filter } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const salesData = [
  { month: 'Jan', sales: 65000, orders: 8 },
  { month: 'Feb', sales: 78000, orders: 10 },
  { month: 'Mar', sales: 85000, orders: 12 },
  { month: 'Apr', sales: 92000, orders: 14 },
  { month: 'May', sales: 88000, orders: 11 },
  { month: 'Jun', sales: 105000, orders: 16 },
];

const inventoryData = [
  { design: 'D001', current: 120, threshold: 50, status: 'good' },
  { design: 'D002', current: 30, threshold: 60, status: 'low' },
  { design: 'D003', current: 45, threshold: 40, status: 'good' },
];

const workerData = [
  { name: 'Suresh', assignments: 5, completion: 95, rejection: 2 },
  { name: 'Neha', assignments: 4, completion: 98, rejection: 1 },
  { name: 'Arjun', assignments: 3, completion: 90, rejection: 3 },
  { name: 'Meera', assignments: 5, completion: 96, rejection: 2 },
];

export default function ReportsPage() {
  const { role } = useAuth();
  const canExport = role === 'owner' || role === 'manager';

  const reportTypes = [
    { label: 'Sales Report', icon: <TrendingUp className="w-4 h-4 text-[#0d7377]" /> },
    { label: 'Inventory Report', icon: <Package className="w-4 h-4 text-[#f5a623]" /> },
    { label: 'Worker Performance', icon: <Users className="w-4 h-4 text-[#8b5cf6]" /> },
    { label: 'Payment Ageing', icon: <Wallet className="w-4 h-4 text-[#ef4444]" /> },
    { label: 'Design Analysis', icon: <FileText className="w-4 h-4 theme-text-primary" /> },
  ];

  return (
    <DashboardLayout
      title="Reports & Analytics"
      subtitle="View comprehensive metrics and download business reports"
      action={
        canExport ? (
          <button className="theme-accent-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
            <Filter className="w-4 h-4" />
            Advanced Filters
          </button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Quick Download Strip */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {reportTypes.map((report) => (
            <button key={report.label} className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white border border-[#e5e7eb] rounded-xl theme-card-accent hover:border-[#0F2A4A]/30 transition-all">
              <div className="p-2 bg-[#f9fafb] rounded-lg">
                {report.icon}
              </div>
              <span className="text-sm font-semibold theme-text-primary whitespace-nowrap">{report.label}</span>
              <Download className="w-4 h-4 text-[#9ca3af] ml-2" />
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] theme-card-accent p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-1">Total Sales (YTD)</p>
            <p className="text-3xl font-black theme-text-primary">₹7,13,000</p>
            <p className="text-sm font-semibold text-[#1a7a4a] mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +15% vs last year
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#e5e7eb] theme-card-accent p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-1">Avg Order Value</p>
            <p className="text-3xl font-black theme-text-primary">₹22,281</p>
            <p className="text-sm font-semibold text-[#cc2200] mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 rotate-180" /> -8% vs last month
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#e5e7eb] theme-card-accent p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-1">Payment Collection</p>
            <p className="text-3xl font-black theme-text-primary">87%</p>
            <p className="text-sm font-semibold text-[#1a7a4a] mt-2 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Improving trend
            </p>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] theme-card-accent p-6">
          <h3 className="text-[18px] font-bold theme-text-primary mb-6">Sales & Orders Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                <Bar yAxisId="left" dataKey="sales" fill="var(--color-sidebar-bg)" name="Sales (₹)" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar yAxisId="right" dataKey="orders" fill="var(--color-accent)" name="Orders" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2-Col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] theme-card-accent p-6">
             <h3 className="text-[18px] font-bold theme-text-primary mb-6">Inventory Status</h3>
             <div className="space-y-6">
                {inventoryData.map(item => {
                   const isLow = item.status === 'low';
                   const percent = Math.min((item.current / item.threshold) * 100, 100);
                   return (
                     <div key={item.design}>
                        <div className="flex justify-between items-center mb-1.5">
                           <span className="font-semibold theme-text-primary">{item.design}</span>
                           <span className="text-sm font-semibold text-[#6b7280]">{item.current} / {item.threshold}</span>
                        </div>
                        <div className="h-2 bg-[#f3f4f6] rounded-full overflow-hidden">
                           <div className={`h-full ${isLow ? 'bg-[#cc2200]' : 'bg-[#1a7a4a]'}`} style={{ width: `${percent}%` }} />
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e5e7eb] theme-card-accent p-6">
             <h3 className="text-[18px] font-bold theme-text-primary mb-6">Worker Performance</h3>
             <div className="space-y-6">
                {workerData.map(worker => (
                  <div key={worker.name}>
                     <div className="flex justify-between items-center mb-1.5">
                        <span className="font-semibold theme-text-primary">{worker.name}</span>
                        <span className="text-sm font-medium text-[#6b7280]">
                           <span className="text-[#1a7a4a] font-bold">{worker.completion}%</span> comp / <span className="text-[#cc2200] font-bold">{worker.rejection}%</span> rej
                        </span>
                     </div>
                     <div className="flex gap-1 h-2">
                        <div className="h-full bg-[#1a7a4a] rounded-full" style={{ width: `${worker.completion}%` }} />
                        <div className="h-full bg-[#cc2200] rounded-full" style={{ width: `${worker.rejection}%` }} />
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
