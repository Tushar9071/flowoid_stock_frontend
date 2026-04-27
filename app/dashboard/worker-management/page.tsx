'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Plus, Search, ChevronDown, Trash2, Users, ClipboardList, Package, Wallet } from 'lucide-react';
import {
  mockWorkers, mockAssignments, mockFinishedGoods, mockWorkerPayments,
} from '@/lib/data';
import { formatCurrency, formatDate } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';

type Tab = 'workers' | 'assignments' | 'finished-goods' | 'payments';

export default function WorkerManagementPage() {
  const { role } = useAuth();
  const [tab, setTab] = useState<Tab>('workers');
  const [search, setSearch] = useState('');
  const canEdit = role === 'owner';

  const filteredWorkers = mockWorkers.filter(
    w =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.code.toLowerCase().includes(search.toLowerCase()),
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'workers', label: 'Worker List', icon: <Users className="w-4 h-4" /> },
    { id: 'assignments', label: 'Assignments', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'finished-goods', label: 'Finished Goods', icon: <Package className="w-4 h-4" /> },
    { id: 'payments', label: 'Payment Settlement', icon: <Wallet className="w-4 h-4" /> },
  ];

  const TH = ({ children, right }: { children: string; right?: boolean }) => (
    <th className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );

  return (
    <DashboardLayout
      title="Worker Management"
      subtitle="Track workers, job assignments, finished goods and payment settlements"
      action={
        canEdit ? (
          <button className="theme-accent-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            Add Worker
          </button>
        ) : undefined
      }
    >
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-[#e5e7eb] rounded-xl mb-6 w-full sm:w-fit overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              tab === t.id
                ? 'theme-tab-active'
                : 'theme-tab-inactive'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Workers Tab */}
      {tab === 'workers' && (
        <div className="bg-white rounded-xl border border-[#e5e7eb] theme-card-accent overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#e5e7eb]">
            <p className="text-sm font-semibold theme-text-primary">{filteredWorkers.length} workers</p>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search worker..."
                  className="theme-focus-ring w-full sm:w-52 h-9 pl-9 pr-3 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] focus:bg-white outline-none transition-all"
                />
              </div>
              <button className="h-9 px-3 rounded-lg border border-[#e5e7eb] bg-white text-sm text-[#374151] flex items-center gap-1.5 hover:bg-[#f9fafb]">
                Status <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f5f6fa] border-b border-[#e5e7eb]">
                  <TH>Code</TH><TH>Name</TH><TH>Phone</TH>
                  <TH right>Total Earned</TH><TH right>Total Paid</TH><TH right>Balance</TH>
                  <TH>Status</TH>
                  {canEdit && <TH>Action</TH>}
                </tr>
              </thead>
              <tbody className="divide-y theme-divide">
                {filteredWorkers.map((w, idx) => (
                  <tr key={w.id} className={`hover:theme-bg-hover transition-colors ${idx % 2 === 1 ? 'theme-bg-muted' : 'bg-transparent'}`}>
                    <td className="px-5 py-4 text-sm font-semibold theme-text-primary">{w.code}</td>
                    <td className="px-5 py-3.5 text-sm font-medium theme-text-primary">{w.name}</td>
                    <td className="px-5 py-3.5 text-sm theme-text-secondary">{w.phone}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-right theme-text-primary">{formatCurrency(w.totalEarnings)}</td>
                    <td className="px-5 py-3.5 text-sm text-right theme-text-success">{formatCurrency(w.totalPaid)}</td>
                    <td className={`px-5 py-3.5 text-sm font-semibold text-right ${w.totalEarnings - w.totalPaid > 0 ? 'theme-text-warning' : 'theme-text-success'}`}>
                      {formatCurrency(w.totalEarnings - w.totalPaid)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        w.status === 'active' ? 'bg-[#e6f9f0] text-[#1a7a4a]' : 'bg-[#f3f4f6] text-[#6b7280]'
                      }`}>
                        {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-5 py-3.5">
                        <button className="p-1.5 rounded-lg hover:bg-[#fff0f0] text-[#9ca3af] hover:text-[#cc2200] transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-t border-[#e5e7eb] bg-[#fafafa]">
            <p className="text-xs text-[#6b7280]">Showing {filteredWorkers.length} of {mockWorkers.length} workers</p>
            <div className="flex gap-1">
              <button className="theme-accent-btn w-8 h-8 rounded-lg text-xs font-semibold">1</button>
            </div>
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5e7eb]">
            <p className="text-sm font-semibold theme-text-primary">{mockAssignments.length} active assignments</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f5f6fa] border-b border-[#e5e7eb]">
                  <TH>Assignment</TH><TH>Worker</TH><TH>Design</TH>
                  <TH right>Qty Assigned</TH><TH right>Qty Returned</TH>
                  <TH>Assigned Date</TH><TH>Status</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {mockAssignments.map((a, idx) => (
                  <tr key={a.id} className={`hover:bg-[#f0f4ff] transition-colors ${idx % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'}`}>
                    <td className="px-5 py-3.5 text-sm font-semibold theme-text-primary">{a.id}</td>
                    <td className="px-5 py-3.5 text-sm text-[#374151]">{mockWorkers.find(w => w.id === a.workerId)?.name || 'Unknown'}</td>
                    <td className="px-5 py-3.5 text-sm text-[#374151]">{a.designCode}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-right theme-text-primary">{a.issuedQty}</td>
                    <td className="px-5 py-3.5 text-sm text-right text-[#1a7a4a]">{a.returnedQty}</td>
                    <td className="px-5 py-3.5 text-sm text-[#6b7280]">{formatDate(a.issueDate)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        a.status === 'in_progress' ? 'bg-[#e6f9f0] text-[#1a7a4a]' : 'bg-[#f3f4f6] text-[#6b7280]'
                      }`}>
                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Finished Goods Tab */}
      {tab === 'finished-goods' && (
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5e7eb]">
            <p className="text-sm font-semibold theme-text-primary">{mockFinishedGoods.length} returns recorded</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f5f6fa] border-b border-[#e5e7eb]">
                  <TH>Return ID</TH><TH>Worker</TH><TH>Design</TH>
                  <TH right>Good Qty</TH><TH right>Rejected</TH><TH right>Earned</TH><TH>Date</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {mockFinishedGoods.map((g, idx) => (
                  <tr key={g.id} className={`hover:bg-[#f0f4ff] transition-colors ${idx % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'}`}>
                    <td className="px-5 py-3.5 text-sm font-semibold theme-text-primary">{g.id}</td>
                    <td className="px-5 py-3.5 text-sm text-[#374151]">{g.workerName}</td>
                    <td className="px-5 py-3.5 text-sm text-[#374151]">{g.designCode}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-right text-[#1a7a4a]">{g.quantity}</td>
                    <td className="px-5 py-3.5 text-sm text-right text-[#cc2200]">0</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-right theme-text-primary">{formatCurrency(0)}</td>
                    <td className="px-5 py-3.5 text-sm text-[#6b7280]">{formatDate(g.collectedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {tab === 'payments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {mockWorkerPayments.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-[#6b7280]">{p.id}</p>
                  <p className="font-bold text-[18px] theme-text-primary mt-0.5">{p.workerName}</p>
                </div>
                <span className="text-xl font-bold text-[#1a7a4a]">{formatCurrency(p.amount)}</span>
              </div>
              <div className="border-t border-[#f3f4f6] pt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">Method</p>
                  <p className="text-sm font-semibold text-[#374151] capitalize">Cash</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">Date</p>
                  <p className="text-sm text-[#374151]">{p.paymentDate ? formatDate(p.paymentDate) : '-'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
