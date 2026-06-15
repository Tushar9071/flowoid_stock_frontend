'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatCurrency } from '@/lib/constants';
import toast from 'react-hot-toast';
import { SkeletonCard } from '@/components/skeleton/Skeletons';
import { useAuth } from '@/lib/auth-context';

import {
  BackendRecord,
  ReportService,
} from '@/lib/services/business-modules.service';
import { BackendTenant } from '@/lib/types';
import { CurrentOwnerService } from '@/lib/services/current-owner.service';

function formatCurrencyVal(val: number) {
  return formatCurrency(val);
}

function AgeRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium capitalize text-[#374151]">{label}</span>
        <span className="text-[15px] font-bold theme-text-primary">{formatCurrencyVal(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#f3f4f6]">
        <div className="h-full rounded-full bg-[#0F2A4A]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AgeingPage() {
  const { hasPermission } = useAuth();
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [agingDealer, setAgingDealer] = useState<BackendRecord | null>(null);
  const [agingSupplier, setAgingSupplier] = useState<BackendRecord | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tenantRes = await CurrentOwnerService.getCurrentOwner();
      if (!tenantRes.success || !tenantRes.data) {
        toast.error(tenantRes.error?.message || 'No business tenant found');
        return;
      }
      setTenant(tenantRes.data);

      const dealerRes = await ReportService.ledgerAging(tenantRes.data.id, { 
        fromDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0], 
        toDate: new Date().toISOString().split('T')[0], 
        partyType: 'DEALER' 
      });

      const supplierRes = await ReportService.ledgerAging(tenantRes.data.id, { 
        fromDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0], 
        toDate: new Date().toISOString().split('T')[0], 
        partyType: 'SUPPLIER' 
      });

      const processAging = (res: any) => {
        if (!res.success) return null;
        const items = Array.isArray(res.data) ? res.data : (res.data?.report || [res.data].filter(Boolean));
        let totalOutstanding = 0, current = 0, days0to30 = 0, days31to60 = 0, days61to90 = 0, days90plus = 0;
        items.forEach((item: any) => {
          const bal = Number(item.currentBalance || item.totalOutstanding || 0);
          const b0 = Number(item.bucket0to30 || item.buckets?.days0To30 || 0);
          const b31 = Number(item.bucket31to60 || item.buckets?.days31To60 || 0);
          const b61 = Number(item.bucket61to90 || item.buckets?.days61To90 || 0);
          const b90 = Number(item.bucket90plus || item.buckets?.days90Plus || 0);
          totalOutstanding += bal;
          days0to30 += b0;
          days31to60 += b31;
          days61to90 += b61;
          days90plus += b90;
          current += (bal - (b0 + b31 + b61 + b90));
        });
        return { totalOutstanding, current, days0to30, days31to60, days61to90, days90plus };
      };

      setAgingDealer(processAging(dealerRes));
      setAgingSupplier(processAging(supplierRes));
    } catch {
      toast.error('Failed to load ageing module');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <DashboardLayout
      title="Ageing Summary"
      subtitle="Dealer receivables from backend ledger allocations"
    >
      {loading ? (
        <SkeletonCard count={2} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Dealer Ageing */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 theme-card-accent">
            <h3 className="mb-1 text-[18px] font-bold theme-text-primary">Dealer Ageing Summary</h3>
            <p className="mb-6 text-sm text-[#6b7280]">Dealer receivables from backend ledger allocations</p>
            {['current', 'days0to30', 'days31to60', 'days61to90', 'days90plus'].map(key => (
              <AgeRow key={key} label={key.replace(/days/g, '').replace(/to/g, ' - ')} value={Number(agingDealer?.[key] || 0)} total={Number(agingDealer?.totalOutstanding || 1)} />
            ))}
            <div className="mt-8 flex items-center justify-between border-t border-[#f3f4f6] pt-4">
              <span className="text-sm font-bold uppercase tracking-wide text-[#9ca3af]">Total Receivables</span>
              <span className="text-2xl font-bold theme-text-primary">{formatCurrencyVal(Number(agingDealer?.totalOutstanding || 0))}</span>
            </div>
          </div>
          
          {/* Supplier Ageing */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 theme-card-accent" style={{ borderLeftColor: 'var(--color-danger)' }}>
            <h3 className="mb-1 text-[18px] font-bold theme-text-primary">Supplier Ageing Summary</h3>
            <p className="mb-6 text-sm text-[#6b7280]">Supplier payables from backend ledger allocations</p>
            {['current', 'days0to30', 'days31to60', 'days61to90', 'days90plus'].map(key => (
              <AgeRow key={key} label={key.replace(/days/g, '').replace(/to/g, ' - ')} value={Number(agingSupplier?.[key] || 0)} total={Number(agingSupplier?.totalOutstanding || 1)} />
            ))}
            <div className="mt-8 flex items-center justify-between border-t border-[#f3f4f6] pt-4">
              <span className="text-sm font-bold uppercase tracking-wide text-[#9ca3af]">Total Payables</span>
              <span className="text-2xl font-bold text-red-600">{formatCurrencyVal(Number(agingSupplier?.totalOutstanding || 0))}</span>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
