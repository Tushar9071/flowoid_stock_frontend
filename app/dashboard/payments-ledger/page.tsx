'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatCurrency } from '@/lib/constants';
import { Plus, Download, FileText, Wallet, BookOpen, Clock, Edit3, Info, LayoutGrid, List, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { SkeletonCard, SkeletonTable } from '@/components/skeleton/Skeletons';
import { AdvancedDataTable } from '@/components/shared/DataTable';
import { SimpleRecordModal, SimpleField } from '@/components/shared/simple-record-modal';
import { useAuth } from '@/lib/auth-context';
import { formatApiError } from '@/lib/utils';

import {
  BackendRecord,
  DocumentService,
  PaymentService,
  ReportService,
  responseItems,
} from '@/lib/services/business-modules.service';
import { PartyService } from '@/lib/services/party.service';
import { BackendTenant } from '@/lib/types';
import { CurrentOwnerService } from '@/lib/services/current-owner.service';
import { SearchInput } from '@/components/shared/search-input';

type Tab = 'payments' | 'ledger' | 'ageing' | 'cashflow';

function prettyDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

function partyName(payment: BackendRecord) {
  return payment.party?.name || payment.dealer?.name || payment.supplier?.name || payment.partyName || '-';
}

function partyCode(payment: BackendRecord) {
  return payment.party?.code || payment.party?.partyCode || payment.dealer?.code || payment.supplier?.code || payment.partyCode || payment.partyId?.slice(0, 8) || '-';
}

function paymentId(payment: BackendRecord) {
  return payment.id || payment.paymentId;
}

function paymentStatus(payment: BackendRecord) {
  return String(payment.paymentStatus || payment.status || 'PENDING').toUpperCase();
}

function canDownloadReceipt(payment: BackendRecord) {
  return Boolean(paymentId(payment)) && Number(payment.amount || 0) > 0 && !['BOUNCED', 'CANCELLED'].includes(paymentStatus(payment));
}

export default function PaymentsLedgerPage() {
  const { hasPermission } = useAuth();
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [tab, setTab] = useState<Tab>('payments');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<BackendRecord[]>([]);
  const [parties, setParties] = useState<BackendRecord[]>([]);
  const [aging, setAging] = useState<BackendRecord | null>(null);
  const [cashflow, setCashflow] = useState<BackendRecord[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentForm, setPaymentForm] = useState<Record<string, any>>({});
  const [statusForm, setStatusForm] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<BackendRecord | null>(null);
  const [outstanding, setOutstanding] = useState<BackendRecord | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [filterParty, setFilterParty] = useState('');
  const [filterNature, setFilterNature] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const canCreate = hasPermission('payments.create');
  const canUpdate = hasPermission('payments.update');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tenantRes = await CurrentOwnerService.getCurrentOwner();
      if (!tenantRes.success || !tenantRes.data) {
        toast.error(tenantRes.error?.message || 'No business tenant found');
        return;
      }

      setTenant(tenantRes.data);
      const queryParams: any = { page: 1, limit: 100 };
      if (filterParty) queryParams.partyId = filterParty;
      if (filterNature) queryParams.nature = filterNature;
      if (filterMethod) queryParams.method = filterMethod;
      if (filterStatus) queryParams.status = filterStatus;
      if (dateFrom) queryParams.dateFrom = dateFrom;
      if (dateTo) queryParams.dateTo = dateTo;

      const [paymentsRes, partiesRes, agingRes] = await Promise.all([
        PaymentService.list(tenantRes.data.id, queryParams),
        PartyService.list(tenantRes.data.id, { isActive: true, limit: 100 }),
        ReportService.ledgerAging(tenantRes.data.id, { 
          fromDate: dateFrom || new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0], 
          toDate: dateTo || new Date().toISOString().split('T')[0], 
          partyType: 'DEALER' 
        }),
      ]);

      if (paymentsRes.success) {
        const pItems = responseItems(paymentsRes.data);
        setPayments(pItems);
        
        const daysMap: Record<string, { date: string, inflow: number, outflow: number }> = {};
        pItems.forEach(payment => {
          const status = String(payment.status || payment.paymentStatus || '').toUpperCase();
          if (!['CLEARED', 'COMPLETED', 'PAID', 'SUCCESS'].includes(status)) return;
          
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
      } else toast.error(paymentsRes.error?.message || 'Failed to load payments');
      
      if (partiesRes.success) setParties(partiesRes.data.items || []);
      
      if (agingRes.success) {
        const items = Array.isArray(agingRes.data) ? agingRes.data : (agingRes.data?.report || [agingRes.data].filter(Boolean));
        let totalOutstanding = 0;
        let current = 0;
        let days0to30 = 0;
        let days31to60 = 0;
        let days61to90 = 0;
        let days90plus = 0;

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

        setAging({
          totalOutstanding,
          current,
          days0to30,
          days31to60,
          days61to90,
          days90plus
        });
      }
    } catch {
      toast.error('Failed to load payment module');
    } finally {
      setLoading(false);
    }
  }, [filterParty, filterNature, filterMethod, filterStatus, dateFrom, dateTo]);

  const pathname = usePathname();

  useEffect(() => {
    loadData();
  }, [loadData, pathname]);

  useEffect(() => {
    setPage(1);
  }, [tab, search]);



  const filteredPayments = useMemo(() => {
    const term = search.toLowerCase();
    return payments.filter(payment =>
      String(payment.paymentNo || payment.id || '').toLowerCase().includes(term) ||
      partyName(payment).toLowerCase().includes(term)
    );
  }, [payments, search]);

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
  
  const paginatedLedgerRows = useMemo(() => filteredLedgerRows.slice((page - 1) * itemsPerPage, page * itemsPerPage), [filteredLedgerRows, page]);

  const tabs = [
    { id: 'payments' as Tab, label: 'Payments', icon: <Wallet className="h-4 w-4" />, count: payments.length },
    { id: 'ledger' as Tab, label: 'Party Ledger', icon: <BookOpen className="h-4 w-4" />, count: parties.length },
    { id: 'ageing' as Tab, label: 'Ageing', icon: <Clock className="h-4 w-4" />, count: aging ? 1 : 0 },
    { id: 'cashflow' as Tab, label: 'Cash Flow', icon: <FileText className="h-4 w-4" />, count: cashflow.length },
  ];

  const paymentFields: SimpleField[] = [
    { name: 'partyType', label: 'Party Type', type: 'select', required: true, options: [{ label: 'Dealer Receipt', value: 'DEALER' }, { label: 'Supplier Payment', value: 'SUPPLIER' }] },
    { name: 'partyId', label: 'Party', type: 'select', required: true, options: parties.filter(party => !paymentForm.partyType || party.type === paymentForm.partyType).map(party => ({ label: party.name || party.code || 'Party', value: party.id })) },
    { name: 'amount', label: 'Amount', type: 'number', required: true },
    { name: 'paymentMethod', label: 'Payment Method', type: 'select', required: true, options: ['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'].map(method => ({ label: method.replace(/_/g, ' '), value: method })) },
    { name: 'referenceNumber', label: 'Reference Number' },
    { name: 'bankName', label: 'Bank Name' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const statusFields: SimpleField[] = [
    { name: 'paymentStatus', label: 'Payment Status', type: 'select', required: true, options: ['PENDING', 'CLEARED', 'BOUNCED', 'CANCELLED'].map(status => ({ label: status, value: status })) },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const openPaymentForm = () => {
    setPaymentForm({
      partyType: 'DEALER',
      partyId: parties.find(party => party.type === 'DEALER')?.id || parties[0]?.id || '',
      amount: '',
      paymentMethod: 'CASH',
      referenceNumber: '',
      bankName: '',
      notes: '',
    });
    setFormError(null);
  };

  const openStatusForm = (payment: BackendRecord) => {
    if (!paymentId(payment)) {
      toast.error('Payment ID not found for this record');
      return;
    }
    setSelectedPayment(payment);
    setStatusForm({
      paymentStatus: paymentStatus(payment),
      notes: '',
    });
    setFormError(null);
  };

  const savePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentTenant = tenant;
    if (!currentTenant?.id) return toast.error('Tenant not found');

    setSaving(true);
    try {
      const payload = {
        partyId: paymentForm.partyId,
        amount: Number(paymentForm.amount || 0),
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: new Date().toISOString(),
        referenceNumber: paymentForm.referenceNumber || undefined,
        bankName: paymentForm.bankName || undefined,
        notes: paymentForm.notes || undefined,
      };
      const response = paymentForm.partyType === 'SUPPLIER'
        ? await PaymentService.createSupplierPayment(currentTenant.id, payload)
        : await PaymentService.createDealerPayment(currentTenant.id, payload);
      if (!response.success) {
        setFormError(response.error);
        return;
      }
      toast.success('Payment recorded');
      setPaymentForm({});
      await loadData();
    } catch (error: any) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const savePaymentStatus = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentTenant = tenant;
    const id = selectedPayment ? paymentId(selectedPayment) : '';
    if (!currentTenant?.id || !id) return toast.error('Tenant or payment not found');

    setSaving(true);
    try {
      const response = await PaymentService.updateStatus(currentTenant.id, id, {
        paymentStatus: String(statusForm.paymentStatus || '').toUpperCase(),
        notes: statusForm.notes || undefined,
      });
      if (!response.success) {
        setFormError(response.error);
        return;
      }
      toast.success('Payment status updated');
      setStatusForm({});
      setSelectedPayment(null);
      await loadData();
    } catch (error: any) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const checkOutstanding = async (party: BackendRecord) => {
    const currentTenant = tenant;
    if (!currentTenant?.id || !party.id) return toast.error('Tenant or party not found');

    const response = await PaymentService.partyOutstanding(currentTenant.id, party.id);
    if (!response.success) return toast.error(response.error?.message || 'Failed to load outstanding');
    
    // Fetch aging for this party to get the overdue details
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

  const openReceipt = (payment: BackendRecord) => {
    const id = paymentId(payment);
    if (!tenant?.id || !id) return toast.error('Tenant or payment not found');
    if (!canDownloadReceipt(payment)) {
      toast.error('Receipt is available only for valid payment records. Bounced or cancelled payments do not generate receipts.');
      return;
    }
    window.open(DocumentService.paymentReceiptUrl(tenant.id, id), '_blank', 'noopener,noreferrer');
  };

  return (
    <DashboardLayout
      title="Payments & Ledger"
      subtitle="Backend connected dealer receipts, supplier payments, outstanding, ageing, and receipts"
      action={
        <div className="flex flex-wrap gap-2">
          {canCreate && tab === 'payments' && (
            <button onClick={openPaymentForm} className="inline-flex items-center gap-2 rounded-lg theme-accent-btn px-5 py-2.5 text-sm font-semibold transition-colors">
              <Plus className="h-4 w-4" />
              Record Payment
            </button>
          )}
        </div>
      }
    >
      <div className="mb-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-[#e5e7eb] p-1 scrollbar-none">
        {tabs.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all ${tab === item.id ? 'theme-tab-active' : 'theme-tab-inactive'}`}>
            {item.icon} {item.label}
            <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-bold">{item.count}</span>
          </button>
        ))}
      </div>

      {(tab === 'payments' || tab === 'ledger') && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <SearchInput
            containerClassName="max-w-sm flex-1"
            inputClassName="h-9 rounded-lg border-[#e5e7eb] bg-[#f9fafb] focus:border-[#0F2A4A]"
            placeholder={`Search ${tab}...`}
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          <button onClick={() => setShowFilters(!showFilters)} className={`theme-secondary-btn inline-flex h-9 w-fit items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors ${showFilters ? 'bg-[#0F2A4A] text-white hover:bg-[#1a3a6a] border-transparent' : ''}`}>
            <Filter className="h-4 w-4" />
            Filter
            {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {/* Refresh button removed — auto-refresh on route change */}
          {tab === 'payments' && (
            <div className="flex h-9 w-fit gap-1 rounded-xl bg-white p-1 ring-1 ring-[#e5e7eb]">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-2 ${viewMode === 'grid' ? 'bg-[#ffe66d] text-[#0F2A4A]' : 'text-[#6b7280]'}`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-2 ${viewMode === 'list' ? 'bg-[#ffe66d] text-[#0F2A4A]' : 'text-[#6b7280]'}`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {showFilters && (
        <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
              <Filter className="h-4 w-4 text-indigo-600" /> Advanced API Filters
            </h3>
            <button onClick={() => {
              setFilterParty(''); setFilterNature(''); setFilterMethod(''); setFilterStatus(''); setDateFrom(''); setDateTo('');
            }} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Party</label>
              <select value={filterParty} onChange={e => setFilterParty(e.target.value)} className="w-full rounded-md border border-slate-200 p-2 text-sm outline-none focus:border-indigo-500">
                <option value="">All Parties</option>
                {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Nature</label>
              <select value={filterNature} onChange={e => setFilterNature(e.target.value)} className="w-full rounded-md border border-slate-200 p-2 text-sm outline-none focus:border-indigo-500">
                <option value="">All Types</option>
                <option value="INFLOW">Inflow (Receipts)</option>
                <option value="OUTFLOW">Outflow (Payments)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Method</label>
              <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className="w-full rounded-md border border-slate-200 p-2 text-sm outline-none focus:border-indigo-500">
                <option value="">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full rounded-md border border-slate-200 p-2 text-sm outline-none focus:border-indigo-500">
                <option value="">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="BOUNCED">Bounced</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Date From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full rounded-md border border-slate-200 p-2 text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Date To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full rounded-md border border-slate-200 p-2 text-sm outline-none focus:border-indigo-500" />
            </div>
          </div>
        </div>
      )}

      {loading && (tab === 'payments' || tab === 'cashflow' ? <SkeletonCard count={6} /> : <SkeletonTable rows={8} cols={6} />)}

      {!loading && tab === 'payments' && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3' : 'grid grid-cols-1 gap-3'}>
          {filteredPayments.map(payment => (
            <div key={paymentId(payment)} className={`rounded-2xl border border-[#e5e7eb] bg-white p-5 theme-card-accent ${viewMode === 'list' ? 'grid gap-4 md:grid-cols-[1fr_auto_auto]' : ''}`}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <span className="mb-1.5 inline-block rounded bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-semibold text-[#6b7280]">{payment.paymentNo || paymentId(payment)?.slice(0, 8)}</span>
                  <h3 className="text-[16px] font-bold theme-text-primary">{partyName(payment)}</h3>
                  <p className="text-[11px] text-slate-500 uppercase">{partyCode(payment)}</p>
                </div>
                <p className="text-[18px] font-bold text-[#1a7a4a]">{formatCurrency(Number(payment.amount || 0))}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-[#f3f4f6] pt-4">
                <Metric label="Method" value={String(payment.method || payment.paymentMethod || '-').replace(/_/g, ' ')} />
                <Metric label="Date" value={prettyDate(payment.paymentDate || payment.paidAt || payment.createdAt)} />
                <Metric label="Status" value={paymentStatus(payment).replace(/_/g, ' ')} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {canUpdate && paymentId(payment) && (
                  <button onClick={() => openStatusForm(payment)} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold">
                    <Edit3 className="h-3.5 w-3.5" />
                    Status
                  </button>
                )}
                {tenant && paymentId(payment) && (
                  <button
                    onClick={() => openReceipt(payment)}
                    className={`theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${!canDownloadReceipt(payment) ? 'opacity-60' : ''}`}
                    title={canDownloadReceipt(payment) ? 'Download receipt' : 'Receipt not available for bounced/cancelled/invalid payment'}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Receipt
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredPayments.length === 0 && (
            <EmptyState 
              title="No payments found" 
              subtitle="Try adjusting search or filters."
              icon={<Wallet className="h-6 w-6" />} 
              tenant={tenant} 
            />
          )}
        </div>
      )}

      {!loading && tab === 'ledger' && (
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
              render: (row) => <div className="text-right font-semibold">{formatCurrency(Number(row.creditLimit || 0))}</div>
            },
            {
              field: 'outstanding',
              header: 'Outstanding',
              sortable: true,
              align: 'right',
              getValue: (row) => Number(row.currentBalance ?? row.outstanding ?? row.openingBalance ?? 0),
              render: (row) => <div className="text-right font-bold text-[#cc2200]">{formatCurrency(Number(row.currentBalance ?? row.outstanding ?? row.openingBalance ?? 0))}</div>
            },
            {
              field: 'status',
              header: 'Status',
              sortable: true,
              filterable: true,
              filterType: 'boolean',
              getValue: (row) => row.isActive !== false,
              render: (row) => <StatusPill active={row.isActive !== false} />
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

      {!loading && tab === 'ageing' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 theme-card-accent">
            <h3 className="mb-1 text-[18px] font-bold theme-text-primary">Ageing Summary</h3>
            <p className="mb-6 text-sm text-[#6b7280]">Dealer receivables from backend ledger allocations</p>
            {['current', 'days0to30', 'days31to60', 'days61to90', 'days90plus'].map(key => (
              <AgeRow key={key} label={key.replace(/days/g, '').replace(/to/g, ' - ')} value={Number(aging?.[key] || aging?.summary?.[key] || 0)} total={Number(aging?.totalOutstanding || aging?.summary?.totalOutstanding || 1)} />
            ))}
            <div className="mt-8 flex items-center justify-between border-t border-[#f3f4f6] pt-4">
              <span className="text-sm font-bold uppercase tracking-wide text-[#9ca3af]">Total Outstanding</span>
              <span className="text-2xl font-bold theme-text-primary">{formatCurrency(Number(aging?.totalOutstanding || aging?.summary?.totalOutstanding || 0))}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 theme-card-accent">
            <h3 className="mb-1 text-[18px] font-bold theme-text-primary">Payment Coverage</h3>
            <p className="mb-6 text-sm text-[#6b7280]">Live payment records loaded from API</p>
            <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-8 text-center">
              <p className="mb-2 text-[48px] font-black leading-none text-[#1a7a4a]">{payments.length}</p>
              <p className="text-sm font-semibold theme-text-primary">Payments recorded</p>
            </div>
          </div>
        </div>
      )}

      {!loading && tab === 'cashflow' && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cashflow.map((row, index) => (
            <div key={row.date || index} className="rounded-xl border border-[#e5e7eb] bg-white p-5 theme-card-accent">
              <p className="text-sm font-semibold text-[#6b7280]">{prettyDate(row.date || row.day)}</p>
              <p className="mt-2 text-2xl font-bold theme-text-primary">{formatCurrency(Number(row.netCashFlow || row.net || 0))}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#f3f4f6] pt-3">
                <Metric label="Inflow" value={formatCurrency(Number(row.totalReceived || row.inflow || row.cashIn || 0))} />
                <Metric label="Outflow" value={formatCurrency(Number(row.totalPaidOut || row.outflow || row.cashOut || 0))} />
              </div>
            </div>
          ))}
          {cashflow.length === 0 && (
            <EmptyState 
              title="No cash flow rows returned" 
              subtitle="Try adjusting search or filters."
              icon={<FileText className="h-6 w-6" />} 
              tenant={tenant} 
            />
          )}
        </div>
      )}
      {Object.keys(paymentForm).length > 0 && (
        <SimpleRecordModal
          title="Record Payment"
          subtitle="Creates dealer receipt or supplier payment using Swagger payment requests"
          fields={paymentFields}
          values={paymentForm}
          saving={saving}
          apiError={formError}
          submitLabel="Record Payment"
          onChange={(name, value) => {
            setPaymentForm(form => ({
              ...form,
              [name]: value,
              ...(name === 'partyType' ? { partyId: parties.find(party => party.type === value)?.id || '' } : {}),
            }));
          }}
          onClose={() => {
            setPaymentForm({});
            setFormError(null);
          }}
          onSubmit={savePayment}
        />
      )}
      {Object.keys(statusForm).length > 0 && (
        <SimpleRecordModal
          title="Update Payment Status"
          subtitle="Updates payment status through the Swagger status endpoint"
          fields={statusFields}
          values={statusForm}
          saving={saving}
          apiError={formError}
          submitLabel="Update Status"
          onChange={(name, value) => setStatusForm(form => ({ ...form, [name]: value }))}
          onClose={() => {
            setStatusForm({});
            setSelectedPayment(null);
            setFormError(null);
          }}
          onSubmit={savePaymentStatus}
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
              <Metric label="Party Type" value={String(outstanding.partyType || outstanding.type || '-')} />
              <Metric label="Outstanding" value={formatCurrency(Number(outstanding.outstanding || outstanding.totalOutstanding || outstanding.balance || 0))} />
              <Metric label="Credit Limit" value={formatCurrency(Number(outstanding.creditLimit || 0))} />
              <Metric label="Total Overdue" value={formatCurrency(Number(outstanding.overdue || outstanding.overdueAmount || 0))} />
            </div>
            {outstanding.aging && (
              <div className="border-t border-slate-200 p-4 bg-slate-50">
                <h3 className="mb-3 text-sm font-bold theme-text-primary">Aging Breakdown</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="rounded-lg bg-white p-3 border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">0-30 Days</p>
                    <p className="text-sm font-bold text-slate-700 mt-1">{formatCurrency(Number(outstanding.aging.bucket0to30 || outstanding.aging.buckets?.days0To30 || 0))}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">31-60 Days</p>
                    <p className="text-sm font-bold text-amber-600 mt-1">{formatCurrency(Number(outstanding.aging.bucket31to60 || outstanding.aging.buckets?.days31To60 || 0))}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">61-90 Days</p>
                    <p className="text-sm font-bold text-orange-600 mt-1">{formatCurrency(Number(outstanding.aging.bucket61to90 || outstanding.aging.buckets?.days61To90 || 0))}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">90+ Days</p>
                    <p className="text-sm font-bold text-red-600 mt-1">{formatCurrency(Number(outstanding.aging.bucket90plus || outstanding.aging.buckets?.days90Plus || 0))}</p>
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



function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
      <p className="text-[14px] font-semibold capitalize text-[#374151]">{value}</p>
    </div>
  );
}

function AgeRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium capitalize text-[#374151]">{label}</span>
        <span className="text-[15px] font-bold theme-text-primary">{formatCurrency(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#f3f4f6]">
        <div className="h-full rounded-full bg-[#0F2A4A]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-[#e6f9f0] text-[#1a7a4a]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>{active ? 'Active' : 'Inactive'}</span>;
}

function EmptyState({ text, tenant, icon, title, subtitle }: { text?: string; tenant?: BackendTenant | null; icon?: React.ReactNode; title?: string; subtitle?: string }) {
  if (tenant === null) {
    return (
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center text-sm font-medium text-[#6b7280]">
        A tenant is required before records can be loaded.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center">
      <div className="theme-icon-chip mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
        {icon || <Wallet className="h-6 w-6" />}
      </div>
      <p className="text-lg font-bold theme-text-primary">{title || text || "No records found"}</p>
      {subtitle && <p className="mt-1 text-sm text-[#6b7280]">{subtitle}</p>}
    </div>
  );
}
