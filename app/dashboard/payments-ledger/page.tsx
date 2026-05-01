'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  mockInvoices,
  mockPaymentRecords,
  mockDealerLedgers,
} from '@/lib/data';
import { formatCurrency, formatDate } from '@/lib/constants';
import { Plus, Download, FileText, Wallet, BookOpen, Clock, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { normalizeRole } from '@/lib/roles';

type Tab = 'invoices' | 'payments' | 'ledger' | 'ageing';

export default function PaymentsLedgerPage() {
  const { role } = useAuth();
  const [tab, setTab] = useState<Tab>('invoices');
  const [search, setSearch] = useState('');

  const roleKey = normalizeRole(role);
  const canEdit = roleKey === 'owner' || roleKey === 'manager';

  const tabs = [
    { id: 'invoices' as Tab, label: 'Invoices', icon: <FileText className="w-4 h-4" /> },
    { id: 'payments' as Tab, label: 'Payments', icon: <Wallet className="w-4 h-4" /> },
    { id: 'ledger' as Tab, label: 'Dealer Ledger', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'ageing' as Tab, label: 'Ageing', icon: <Clock className="w-4 h-4" /> },
  ];

  const TH = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
    <th className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );

  return (
    <DashboardLayout
      title="Payments & Ledger"
      subtitle="Manage invoices, record payments, and monitor dealer ledgers"
      action={
        canEdit ? (
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#e5e7eb] bg-white text-sm font-semibold text-[#374151] hover:bg-[#f9fafb] transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg theme-accent-btn text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" />
              {tab === 'invoices' ? 'Create Invoice' : 'Record Payment'}
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="flex gap-1 p-1 bg-[#e5e7eb] rounded-xl mb-6 w-fit max-w-full overflow-x-auto scrollbar-none">
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

      {(tab === 'invoices' || tab === 'payments' || tab === 'ledger') && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
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
      )}

      {/* Invoices Tab */}
      {tab === 'invoices' && (
        <div className="bg-white rounded-xl border border-[#e5e7eb] theme-card-accent overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f5f6fa] border-b border-[#e5e7eb]">
                  <TH>Invoice</TH><TH>Dealer</TH>
                  <TH right>Amount</TH><TH right>Paid</TH><TH right>Due</TH>
                  <TH>Status</TH><TH>Due Date</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {mockInvoices
                  .filter(i => i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || i.dealerName.toLowerCase().includes(search.toLowerCase()))
                  .map((invoice, idx) => {
                    const due = invoice.amount - invoice.paidAmount;
                    return (
                      <tr key={invoice.id} className={`transition-colors hover:bg-[#f0f4ff] ${idx % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'}`}>
                        <td className="px-5 py-4 text-sm font-semibold theme-text-primary">{invoice.invoiceNumber}</td>
                        <td className="px-5 py-4 text-sm font-medium text-[#374151]">{invoice.dealerName}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-right theme-text-primary">{formatCurrency(invoice.amount)}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-right text-[#1a7a4a]">{formatCurrency(invoice.paidAmount)}</td>
                        <td className="px-5 py-4 text-sm font-bold text-right text-[#cc2200]">
                          {due > 0 ? formatCurrency(due) : '-'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                            invoice.status === 'paid' ? 'bg-[#e6f9f0] text-[#1a7a4a]' :
                            invoice.status === 'sent' ? 'bg-[#fffbeb] text-[#d97706]' :
                            invoice.status === 'overdue' ? 'bg-[#fff0f0] text-[#cc2200]' :
                            'bg-[#f3f4f6] text-[#6b7280]'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#6b7280]">{formatDate(invoice.dueDate)}</td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {tab === 'payments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mockPaymentRecords
            .filter(p => p.dealerName.toLowerCase().includes(search.toLowerCase()) || p.invoiceId.toLowerCase().includes(search.toLowerCase()))
            .map(payment => (
            <div key={payment.id} className="bg-white rounded-2xl border border-[#e5e7eb] theme-card-accent p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded bg-[#f3f4f6] text-[11px] font-semibold text-[#6b7280] mb-1.5">
                    {payment.invoiceId}
                  </span>
                  <h3 className="text-[16px] font-bold theme-text-primary">{payment.dealerName}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[18px] font-bold text-[#1a7a4a]">{formatCurrency(payment.amount)}</p>
                </div>
              </div>
              <div className="border-t border-[#f3f4f6] pt-4 grid grid-cols-2 gap-4">
                <div>
                   <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">Method</p>
                   <p className="text-[14px] font-semibold text-[#374151] capitalize">{payment.paymentMethod.replace(/_/g, ' ')}</p>
                </div>
                <div>
                   <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">Date</p>
                   <p className="text-[14px] text-[#6b7280]">{formatDate(payment.paymentDate)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ledger Tab */}
      {tab === 'ledger' && (
        <div className="bg-white rounded-xl border border-[#e5e7eb] theme-card-accent overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f5f6fa] border-b border-[#e5e7eb]">
                  <TH>Dealer</TH>
                  <TH right>Total Invoiced</TH>
                  <TH right>Total Paid</TH>
                  <TH right>Outstanding</TH>
                  <TH>Status</TH>
                  <TH>Last Txn</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {mockDealerLedgers
                  .filter(l => l.dealerName.toLowerCase().includes(search.toLowerCase()))
                  .map((ledger, idx) => (
                  <tr key={ledger.dealerId} className={`transition-colors hover:bg-[#f0f4ff] ${idx % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'}`}>
                    <td className="px-5 py-4 text-sm font-bold theme-text-primary">{ledger.dealerName}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-right text-[#374151]">{formatCurrency(ledger.totalInvoiced)}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-right text-[#1a7a4a]">{formatCurrency(ledger.totalPaid)}</td>
                    <td className="px-5 py-4 text-sm font-bold text-right text-[#cc2200]">
                      <span className={`inline-block px-2 py-0.5 rounded ${ledger.outstanding > 0 ? 'bg-[#fff0f0]' : ''}`}>
                        {formatCurrency(ledger.outstanding)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                       <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                        ledger.status === 'good' ? 'bg-[#e6f9f0] text-[#1a7a4a]' :
                        ledger.status === 'warning' ? 'bg-[#fffbeb] text-[#d97706]' :
                        'bg-[#fff0f0] text-[#cc2200]'
                      }`}>
                        {ledger.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#6b7280]">{formatDate(ledger.lastTransaction)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ageing Tab */}
      {tab === 'ageing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] theme-card-accent p-6">
            <h3 className="text-[18px] font-bold theme-text-primary mb-1">Ageing Summary</h3>
            <p className="text-sm text-[#6b7280] mb-6">Pending invoices categorized by age</p>
            
            <div className="space-y-4">
              {[
                { label: '0 - 30 Days (Current)', value: 45000, color: 'text-[#0F2A4A]', bar: 'bg-[#0F2A4A]' },
                { label: '31 - 60 Days (Overdue)', value: 78000, color: 'text-[#d97706]', bar: 'bg-[#d97706]' },
                { label: '60+ Days (Critical)', value: 125000, color: 'text-[#cc2200]', bar: 'bg-[#cc2200]' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-[#374151]">{item.label}</span>
                    <span className={`text-[15px] font-bold ${item.color}`}>₹{item.value.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-[#f3f4f6] rounded-full overflow-hidden">
                    <div className={`h-full ${item.bar}`} style={{ width: `${(item.value / 248000) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-4 border-t border-[#f3f4f6] flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-wide text-[#9ca3af]">Total Outstanding</span>
              <span className="text-2xl font-bold theme-text-primary">₹2,48,000</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e5e7eb] theme-card-accent p-6">
             <h3 className="text-[18px] font-bold theme-text-primary mb-1">Collection Performance</h3>
             <p className="text-sm text-[#6b7280] mb-6">Metrics on payment collection speed</p>

             <div className="flex items-center justify-center p-8 bg-[#f9fafb] rounded-xl border border-[#e5e7eb] mb-6">
                <div className="text-center">
                   <p className="text-[48px] font-black text-[#1a7a4a] leading-none mb-2">75%</p>
                   <p className="text-sm font-semibold theme-text-primary">Paid On Time</p>
                   <p className="text-xs text-[#6b7280] mt-1">across all active dealers</p>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6b7280]">Average Days to Pay</span>
                   <span className="text-[15px] font-bold theme-text-primary">42 Days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6b7280]">Dealers with Overdue</span>
                  <span className="text-[15px] font-bold theme-status-critical">8</span>
                </div>
             </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
