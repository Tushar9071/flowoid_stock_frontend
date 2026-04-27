'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Plus, Search, ChevronDown, MapPin, Phone, ArrowRight, Building2, Truck } from 'lucide-react';
import { mockDealers } from '@/lib/data';
import { formatCurrency, formatDate } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';

type Tab = 'dealers' | 'suppliers';

export default function PartyManagementPage() {
  const { role } = useAuth();
  const [tab, setTab] = useState<Tab>('dealers');
  const [search, setSearch] = useState('');

  const canEdit = role === 'owner';

  const filtered = mockDealers.filter(
    d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()),
  );

  const tabs = [
    { id: 'dealers' as Tab, label: 'Dealers', icon: <Building2 className="w-4 h-4" /> },
    { id: 'suppliers' as Tab, label: 'Suppliers', icon: <Truck className="w-4 h-4" /> },
  ];

  return (
    <DashboardLayout
      title="Party Management"
      subtitle="Manage dealers, suppliers and outstanding balances"
      action={
        canEdit ? (
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg theme-accent-btn text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            {tab === 'dealers' ? 'Add Dealer' : 'Add Supplier'}
          </button>
        ) : undefined
      }
    >
      {/* Tabs */}
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

      {tab === 'dealers' && (
        <>
          {/* Search + filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search dealers..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] focus:bg-white focus:ring-2 focus:ring-[#0F2A4A]/10 focus:border-[#0F2A4A] outline-none transition-all"
              />
            </div>
            <button className="h-9 px-3 rounded-lg border border-[#e5e7eb] bg-white text-sm text-[#374151] flex items-center gap-1.5 hover:bg-[#f9fafb] transition-colors w-fit">
              Status <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map(dealer => (
              <div
                key={dealer.id}
                className={`bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden flex ${
                  dealer.status === 'active' ? 'theme-card-accent' : 'border-l-4 border-l-[#d1d5db]'
                }`}
              >
                {/* Card content */}
                <div className="flex-1 p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-semibold text-[#6b7280] bg-[#f3f4f6] px-2 py-0.5 rounded">
                          {dealer.code}
                        </span>
                      </div>
                      <h3 className="text-[18px] font-bold theme-text-primary">{dealer.name}</h3>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        dealer.status === 'active'
                          ? 'theme-badge-soft'
                          : 'bg-[#f3f4f6] text-[#6b7280]'
                      }`}
                    >
                      {dealer.status.charAt(0).toUpperCase() + dealer.status.slice(1)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[#6b7280] mb-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> {dealer.city}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#6b7280] mb-4">
                    <Phone className="w-3.5 h-3.5 shrink-0" /> {dealer.phone}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#f3f4f6] mb-4" />

                  {/* 2-column details grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
                    {[
                      { label: 'Credit Limit', value: formatCurrency(dealer.creditLimit) },
                      { label: 'Credit Period', value: `${dealer.creditPeriod} days` },
                      { label: 'GST Number', value: dealer.gstNumber },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">{label}</p>
                        <p className="text-[15px] font-bold text-[#0F2A4A]">{value}</p>
                      </div>
                    ))}

                    {/* Outstanding – highlighted */}
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">Outstanding</p>
                      <div className={`inline-block px-2 py-0.5 rounded ${dealer.outstanding > 0 ? 'bg-[#fffbeb]' : 'bg-transparent'}`}>
                        <p className={`text-[15px] font-bold ${dealer.outstanding > 0 ? 'text-[#d97706]' : 'text-[#1a7a4a]'}`}>
                          {formatCurrency(dealer.outstanding)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Credit utilisation bar */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <p className="text-[11px] text-[#9ca3af]">Credit Utilisation</p>
                      <p className="text-[11px] font-semibold text-[#374151]">
                        {Math.round((dealer.outstanding / dealer.creditLimit) * 100)}%
                      </p>
                    </div>
                    <div className="h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${dealer.outstanding > 0 ? 'bg-[#f5a623]' : 'bg-[#1a7a4a]'}`}
                        style={{ width: `${Math.min((dealer.outstanding / dealer.creditLimit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action */}
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors">
                    View Transactions <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'suppliers' && (
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-[#f0f2f5] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Truck className="w-7 h-7 text-[#6b7280]" />
          </div>
          <p className="text-[#0F2A4A] font-semibold text-lg mb-1">Supplier Management</p>
          <p className="text-sm text-[#6b7280] mb-6">Manage your material suppliers here.</p>
          {canEdit && (
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg theme-accent-btn text-sm font-semibold">
              <Plus className="w-4 h-4" /> Add Supplier
            </button>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
