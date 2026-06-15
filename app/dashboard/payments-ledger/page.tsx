'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatCurrency } from '@/lib/constants';
import { Plus, Download, Wallet, Edit3, LayoutGrid, List, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { SkeletonCard } from '@/components/skeleton/Skeletons';
import { SimpleRecordModal, SimpleField } from '@/components/shared/simple-record-modal';
import { useAuth } from '@/lib/auth-context';

import {
  BackendRecord,
  DocumentService,
  PaymentService,
  responseItems,
} from '@/lib/services/business-modules.service';
import { PartyService } from '@/lib/services/party.service';
import { BackendTenant } from '@/lib/types';
import { CurrentOwnerService } from '@/lib/services/current-owner.service';
import { SearchInput } from '@/components/shared/search-input';

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

export default function PaymentsPage() {
  const { hasPermission } = useAuth();
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<BackendRecord[]>([]);
  const [parties, setParties] = useState<BackendRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [paymentForm, setPaymentForm] = useState<Record<string, any>>({});
  const [statusForm, setStatusForm] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<BackendRecord | null>(null);
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

      const [paymentsRes, partiesRes] = await Promise.all([
        PaymentService.list(tenantRes.data.id, queryParams),
        PartyService.list(tenantRes.data.id, { isActive: true, limit: 100 }),
      ]);

      if (paymentsRes.success) {
        setPayments(responseItems(paymentsRes.data));
      } else {
        toast.error(paymentsRes.error?.message || 'Failed to load payments');
      }
      
      if (partiesRes.success) {
        setParties(partiesRes.data.items || []);
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

  const filteredPayments = useMemo(() => {
    const term = search.toLowerCase();
    return payments.filter(payment =>
      String(payment.paymentNo || payment.id || '').toLowerCase().includes(term) ||
      partyName(payment).toLowerCase().includes(term)
    );
  }, [payments, search]);

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

  const openReceipt = (payment: BackendRecord) => {
    const id = paymentId(payment);
    if (!tenant?.id || !id) return toast.error('Tenant or payment not found');
    if (!canDownloadReceipt(payment)) {
      toast.error('Receipt is available only for valid payment records.');
      return;
    }
    window.open(DocumentService.paymentReceiptUrl(tenant.id, id), '_blank', 'noopener,noreferrer');
  };

  return (
    <DashboardLayout
      title="Payments"
      subtitle="Backend connected dealer receipts and supplier payments"
      action={
        <div className="flex flex-wrap gap-2">
          {canCreate && (
            <button onClick={openPaymentForm} className="inline-flex items-center gap-2 rounded-lg theme-accent-btn px-5 py-2.5 text-sm font-semibold transition-colors">
              <Plus className="h-4 w-4" />
              Record Payment
            </button>
          )}
        </div>
      }
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          containerClassName="max-w-sm flex-1"
          inputClassName="h-9 rounded-lg border-[#e5e7eb] bg-[#f9fafb] focus:border-[#0F2A4A]"
          placeholder="Search payments..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        <button onClick={() => setShowFilters(!showFilters)} className={`theme-secondary-btn inline-flex h-9 w-fit items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors ${showFilters ? 'bg-[#0F2A4A] text-white hover:bg-[#1a3a6a] border-transparent' : ''}`}>
          <Filter className="h-4 w-4" />
          Filter
          {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
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
      </div>

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

      {loading ? (
        <SkeletonCard count={6} />
      ) : (
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
                    title={canDownloadReceipt(payment) ? 'Download receipt' : 'Receipt not available'}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Receipt
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredPayments.length === 0 && (
            <div className="col-span-full rounded-xl border border-[#e5e7eb] bg-white p-12 text-center text-sm font-medium text-[#6b7280]">
              <Wallet className="mx-auto mb-3 h-6 w-6 text-slate-400" />
              <p className="text-base font-bold text-slate-900 mb-1">No payments found</p>
              <p className="text-xs text-slate-500">Try adjusting search or filters.</p>
            </div>
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
