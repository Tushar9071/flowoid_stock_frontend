'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatCurrency } from '@/lib/constants';
import { FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonCard } from '@/components/skeleton/Skeletons';

import {
  BackendRecord,
  PaymentService,
  responseItems,
} from '@/lib/services/business-modules.service';
import { BackendTenant } from '@/lib/types';
import { CurrentOwnerService } from '@/lib/services/current-owner.service';

function prettyDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

function formatCurrencyVal(val: number) {
  return formatCurrency(val);
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
      <p className="text-[14px] font-semibold capitalize text-[#374151]">{value}</p>
    </div>
  );
}

export default function CashFlowPage() {
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [cashflow, setCashflow] = useState<BackendRecord[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tenantRes = await CurrentOwnerService.getCurrentOwner();
      if (!tenantRes.success || !tenantRes.data) {
        toast.error(tenantRes.error?.message || 'No business tenant found');
        return;
      }
      setTenant(tenantRes.data);

      const paymentsRes = await PaymentService.list(tenantRes.data.id, { limit: 100 });

      if (paymentsRes.success) {
        const pItems = responseItems(paymentsRes.data);
        
        const daysMap: Record<string, { date: string, inflow: number, outflow: number }> = {};
        pItems.forEach(payment => {
          const status = String(payment.status || payment.paymentStatus || 'PENDING').toUpperCase();
          if (['CANCELLED', 'BOUNCED', 'REJECTED', 'FAILED'].includes(status)) return;
          
          const dateStr = String(payment.paymentDate || payment.paidAt || payment.createdAt).split('T')[0];
          if (!daysMap[dateStr]) daysMap[dateStr] = { date: dateStr, inflow: 0, outflow: 0 };
          
          const amt = Number(payment.amount || 0);
          const nature = String(payment.nature || payment.paymentNature || '').toUpperCase();
          
          if (nature === 'DEALER_RECEIPT' || nature === 'DEALER_ADVANCE') {
             daysMap[dateStr].inflow += amt;
          } else if (nature === 'SUPPLIER_PAYMENT' || nature === 'SUPPLIER_ADVANCE') {
             daysMap[dateStr].outflow += amt;
          } else {
             const pType = String(payment.party?.type || payment.party?.partyType || payment.partyType || 'DEALER').toUpperCase();
             if (pType === 'DEALER') daysMap[dateStr].inflow += amt;
             else daysMap[dateStr].outflow += amt;
          }
        });
        
        const cashItems = Object.values(daysMap)
          .map(d => ({ ...d, netCashFlow: d.inflow - d.outflow }))
          .sort((a, b) => b.date.localeCompare(a.date));
          
        setCashflow(cashItems);
      }
    } catch {
      toast.error('Failed to load cash flow module');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <DashboardLayout
      title="Cash Flow"
      subtitle="Daily cash inflow and outflow tracking based on cleared payments"
    >
      {loading ? (
        <SkeletonCard count={6} />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cashflow.map((row, index) => (
            <div key={row.date || index} className="rounded-xl border border-[#e5e7eb] bg-white p-5 theme-card-accent">
              <p className="text-sm font-semibold text-[#6b7280]">{prettyDate(row.date || row.day)}</p>
              <p className="mt-2 text-2xl font-bold theme-text-primary">{formatCurrencyVal(Number(row.netCashFlow || row.net || 0))}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#f3f4f6] pt-3">
                <Metric label="Inflow" value={formatCurrencyVal(Number(row.totalReceived || row.inflow || row.cashIn || 0))} />
                <Metric label="Outflow" value={formatCurrencyVal(Number(row.totalPaidOut || row.outflow || row.cashOut || 0))} />
              </div>
            </div>
          ))}
          {cashflow.length === 0 && (
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center text-sm font-medium text-[#6b7280] col-span-full">
              <FileText className="mx-auto mb-3 h-6 w-6 text-slate-400" />
              <p className="text-base font-bold text-slate-900 mb-1">No cash flow rows returned</p>
              <p className="text-xs text-slate-500">Wait for payments to be recorded and cleared.</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
