'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatCurrency } from '@/lib/constants';
import { BookOpen, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonTable } from '@/components/skeleton/Skeletons';
import { AdvancedDataTable } from '@/components/shared/DataTable';
import { SearchInput } from '@/components/shared/search-input';
import { useAuth } from '@/lib/auth-context';

import {
  BackendRecord,
  PaymentService,
  ReportService,
  responseItems,
} from '@/lib/services/business-modules.service';
import { PartyService } from '@/lib/services/party.service';
import { BackendTenant } from '@/lib/types';
import { CurrentOwnerService } from '@/lib/services/current-owner.service';

function formatCurrencyVal(val: number) {
  return formatCurrency(val);
}

export default function PartyLedgerPage() {
  const { hasPermission } = useAuth();
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [parties, setParties] = useState<BackendRecord[]>([]);
  const [payments, setPayments] = useState<BackendRecord[]>([]);
  const [outstanding, setOutstanding] = useState<BackendRecord | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tenantRes = await CurrentOwnerService.getCurrentOwner();
      if (!tenantRes.success || !tenantRes.data) {
        toast.error(tenantRes.error?.message || 'No business tenant found');
        return;
      }
      setTenant(tenantRes.data);

      const [partiesRes, paymentsRes] = await Promise.all([
        PartyService.list(tenantRes.data.id, { isActive: true, limit: 100 }),
        PaymentService.list(tenantRes.data.id, { limit: 1000 }),
      ]);

      if (partiesRes.success) setParties(partiesRes.data.items || []);
      if (paymentsRes.success) setPayments(responseItems(paymentsRes.data));
    } catch {
      toast.error('Failed to load ledger module');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const ledgerRows = useMemo<BackendRecord[]>(() => {
    return parties.map(party => ({
      ...party,
      paymentCount: payments.filter(payment => payment.partyId === party.id || payment.dealerId === party.id || payment.supplierId === party.id).length,
    }));
  }, [parties, payments]);

  const filteredLedgerRows = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return ledgerRows;
    return ledgerRows.filter(row => String(row.name || '').toLowerCase().includes(term));
  }, [ledgerRows, search]);

  const checkOutstanding = async (party: BackendRecord) => {
    const currentTenant = tenant;
    if (!currentTenant?.id || !party.id) return toast.error('Tenant or party not found');

    const response = await PaymentService.partyOutstanding(currentTenant.id, party.id);
    if (!response.success) return toast.error(response.error?.message || 'Failed to load outstanding');
    
    const agingRes = await ReportService.ledgerAging(currentTenant.id, {
        fromDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        partyType: party.partyType || party.type || 'DEALER',
    });

    let partyAging: any = { bucket0to30: 0, bucket31to60: 0, bucket61to90: 0, bucket90plus: 0 };
    if (agingRes.success) {
        const items = Array.isArray(agingRes.data) ? agingRes.data : (agingRes.data?.report || [agingRes.data].filter(Boolean));
        const found = items.find((i: any) => i.partyId === party.id);
        if (found) partyAging = found;
    }
    
    const overdue = Number(partyAging.bucket31to60 || partyAging.buckets?.days31To60 || 0) + 
                    Number(partyAging.bucket61to90 || partyAging.buckets?.days61To90 || 0) + 
                    Number(partyAging.bucket90plus || partyAging.buckets?.days90Plus || 0);

    setOutstanding({ 
      partyName: party.name, 
      partyType: party.partyType || party.type || 'DEALER',
      creditLimit: party.creditLimit || 0,
      outstanding: Number(response.data?.balance ?? response.data ?? 0),
      overdue: overdue,
      aging: partyAging
    });
  };

  return (
    <DashboardLayout
      title="Party Ledger"
      subtitle="Backend connected dealer and supplier outstanding balances"
    >
      <div className="mb-5">
        <SearchInput
          containerClassName="max-w-sm"
          inputClassName="h-9 rounded-lg border-[#e5e7eb] bg-[#f9fafb] focus:border-[#0F2A4A]"
          placeholder="Search party ledger..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      {loading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : (
        <AdvancedDataTable
          data={filteredLedgerRows}
          searchable={false}
          loading={loading}
          emptyIcon={<BookOpen className="h-6 w-6 text-slate-400" />}
          emptyTitle="No ledger rows found"
          columns={[
            {
              field: 'name',
              header: 'Party',
              sortable: true,
              filterable: true,
              filterType: 'text',
              getValue: (row) => row.name || '-',
              render: (row) => (
                <div className="flex items-center gap-3">
                  <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold theme-text-primary">{row.name || '-'}</p>
                    <p className="text-[11px] text-slate-500 uppercase">{row.code || row.partyCode || row.id?.slice(0, 8)}</p>
                  </div>
                </div>
              )
            },
            {
              field: 'type',
              header: 'Type',
              sortable: true,
              filterable: true,
              filterType: 'text',
              getValue: (row) => row.type || '-',
              render: (row) => <div className="text-[#6b7280]">{row.type || '-'}</div>
            },
            {
              field: 'paymentCount',
              header: 'Payments',
              sortable: true,
              getValue: (row) => Number(row.paymentCount || 0),
              render: (row) => <div className="font-semibold">{row.paymentCount}</div>
            },
            {
              field: 'creditLimit',
              header: 'Credit Limit',
              sortable: true,
              align: 'right',
              getValue: (row) => Number(row.creditLimit || 0),
              render: (row) => <div className="text-right font-semibold">{formatCurrencyVal(Number(row.creditLimit || 0))}</div>
            },
            {
              field: 'outstanding',
              header: 'Outstanding',
              sortable: true,
              align: 'right',
              getValue: (row) => Number(row.currentBalance ?? row.outstanding ?? row.openingBalance ?? 0),
              render: (row) => <div className="text-right font-bold text-[#cc2200]">{formatCurrencyVal(Number(row.currentBalance ?? row.outstanding ?? row.openingBalance ?? 0))}</div>
            },
            {
              field: 'status',
              header: 'Status',
              sortable: true,
              filterable: true,
              filterType: 'boolean',
              getValue: (row) => row.isActive !== false,
              render: (row) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.isActive !== false ? 'bg-[#e6f9f0] text-[#1a7a4a]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>{row.isActive !== false ? 'Active' : 'Inactive'}</span>
            },
            {
              field: 'actions',
              header: 'Action',
              align: 'right',
              render: (row) => (
                <div className="flex justify-end gap-2">
                  <button onClick={() => checkOutstanding(row)} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold">
                    <Info className="h-3.5 w-3.5" />
                    Outstanding
                  </button>
                </div>
              )
            }
          ]}
        />
      )}

      {outstanding && (
        <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
          <div className="theme-modal-panel w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <h2 className="text-xl font-bold theme-text-primary">Party Outstanding</h2>
                <p className="text-sm text-slate-500">{outstanding.partyName || outstanding.party?.name || 'Ledger balance'}</p>
              </div>
              <button type="button" onClick={() => setOutstanding(null)} className="theme-secondary-btn rounded-lg px-3 py-2 text-sm font-semibold">
                Close
              </button>
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-2">
              <div>
                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">Party Type</p>
                <p className="text-[14px] font-semibold capitalize text-[#374151]">{String(outstanding.partyType || outstanding.type || '-')}</p>
              </div>
              <div>
                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">Outstanding</p>
                <p className="text-[14px] font-semibold capitalize text-[#374151]">{formatCurrencyVal(Number(outstanding.outstanding || outstanding.totalOutstanding || outstanding.balance || 0))}</p>
              </div>
              <div>
                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">Credit Limit</p>
                <p className="text-[14px] font-semibold capitalize text-[#374151]">{formatCurrencyVal(Number(outstanding.creditLimit || 0))}</p>
              </div>
              <div>
                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">Total Overdue</p>
                <p className="text-[14px] font-semibold capitalize text-[#374151]">{formatCurrencyVal(Number(outstanding.overdue || outstanding.overdueAmount || 0))}</p>
              </div>
            </div>
            {outstanding.aging && (
              <div className="border-t border-slate-200 p-4 bg-slate-50">
                <h3 className="mb-3 text-sm font-bold theme-text-primary">Aging Breakdown</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="rounded-lg bg-white p-3 border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">0-30 Days</p>
                    <p className="text-sm font-bold text-slate-700 mt-1">{formatCurrencyVal(Number(outstanding.aging.bucket0to30 || outstanding.aging.buckets?.days0To30 || 0))}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">31-60 Days</p>
                    <p className="text-sm font-bold text-amber-600 mt-1">{formatCurrencyVal(Number(outstanding.aging.bucket31to60 || outstanding.aging.buckets?.days31To60 || 0))}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">61-90 Days</p>
                    <p className="text-sm font-bold text-orange-600 mt-1">{formatCurrencyVal(Number(outstanding.aging.bucket61to90 || outstanding.aging.buckets?.days61To90 || 0))}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">90+ Days</p>
                    <p className="text-sm font-bold text-red-600 mt-1">{formatCurrencyVal(Number(outstanding.aging.bucket90plus || outstanding.aging.buckets?.days90Plus || 0))}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
