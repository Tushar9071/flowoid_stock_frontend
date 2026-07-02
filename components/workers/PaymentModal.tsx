'use client';

import React from 'react';
import { X, Wallet, TrendingUp } from 'lucide-react';
import { BackendRecord } from '@/lib/services/business-modules.service';
import { formatCurrency } from '@/lib/constants';
import { PremiumSelect } from '@/components/ui/PremiumSelect';

interface PaymentModalProps {
  form: Record<string, any>;
  workers: BackendRecord[];
  saving: boolean;
  apiError?: any;
  onChange: (name: string, value: any) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const PAYMENT_TYPES = [
  { value: 'EARNING', label: 'Earning Settlement', desc: 'Pay out earned balance to worker', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'ADVANCE', label: 'Advance', desc: 'Give advance payment to worker', color: 'border-blue-300 bg-blue-50 text-blue-700' },
  { value: 'ADVANCE_RECOVERY', label: 'Advance Recovery', desc: 'Recover advance from worker earnings', color: 'border-amber-300 bg-amber-50 text-amber-700' },
];

const PAYMENT_MODES = ['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'];

function moneyNumber(v: unknown) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

export function PaymentModal({
  form,
  workers,
  saving,
  apiError,
  onChange,
  onClose,
  onSubmit,
}: PaymentModalProps) {
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (apiError) {
      import('@/lib/utils').then(({ parseValidationErrors }) => {
        const parsed = parseValidationErrors(apiError);
        setFieldErrors(parsed.fields);
        setGlobalError(parsed.global);
        setTimeout(() => {
          if (formRef.current) {
            const firstInvalid = formRef.current.querySelector('[data-invalid="true"]') as HTMLElement;
            if (firstInvalid) {
              firstInvalid.focus();
              firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 50);
      });
    } else {
      setFieldErrors({});
      setGlobalError(null);
    }
  }, [apiError]);

  const handleChange = (name: string, value: any) => {
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      if (Object.keys(fieldErrors).length <= 1 && globalError === 'Please correct the highlighted fields and try again.') {
        setGlobalError(null);
      }
    }
    onChange(name, value);
  };

  const selectedWorker = workers.find(w => w.id === form.workerId);
  const summary = selectedWorker?.summary;
  const outstanding = moneyNumber(summary?.outstandingBalance);
  const advance = moneyNumber(summary?.advanceGiven);
  const earned = moneyNumber(summary?.earned);
  const paid = moneyNumber(summary?.paid);
  const amount = moneyNumber(form.amount);

  const selectedType = PAYMENT_TYPES.find(t => t.value === form.paymentType);

  return (
    <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center sm:p-6">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="theme-modal-panel w-full max-w-lg overflow-hidden"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold theme-text-primary">Record Payment</h2>
              <p className="text-xs text-slate-500">Worker payment settlement</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        {globalError && (
          <div className="mx-6 mt-4 whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {globalError}
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Worker selector */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Worker <span className="text-red-500">*</span>
            </span>
            <PremiumSelect
              value={form.workerId || ''}
              required
              onChange={(e: any) => {
                const newWorkerId = e.target.value;
                handleChange('workerId', newWorkerId);
                const w = workers.find(x => x.id === newWorkerId);
                if (w) {
                  const outst = moneyNumber(w.summary?.outstandingBalance);
                  const adv = moneyNumber(w.summary?.advanceGiven);
                  
                  let nextType = form.paymentType;
                  if (nextType === 'EARNING' && outst <= 0) nextType = 'ADVANCE';
                  if (nextType === 'ADVANCE_RECOVERY' && adv <= 0) nextType = outst > 0 ? 'EARNING' : 'ADVANCE';
                  
                  if (nextType !== form.paymentType) handleChange('paymentType', nextType);
                  
                  if (nextType === 'EARNING' && outst > 0) handleChange('amount', outst);
                  if (nextType === 'ADVANCE_RECOVERY' && adv > 0) handleChange('amount', adv);
                }
              }}
              className={`h-10 w-full rounded-lg border ${fieldErrors.workerId ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
              data-invalid={!!fieldErrors.workerId}
            >
              <option value="">Select worker</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.name}{w.city ? ` · ${w.city}` : ''}</option>
              ))}
            </PremiumSelect>
            {fieldErrors.workerId && <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.workerId}</p>}
          </label>

          {/* Worker balance context */}
          {selectedWorker && summary && (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              {form.paymentType === 'EARNING' && (
                <>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total Earned</p>
                    <p className="text-lg font-bold text-slate-700">{formatCurrency(earned)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total Paid</p>
                    <p className="text-lg font-bold text-slate-700">{formatCurrency(paid)}</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Outstanding</p>
                <div className="flex items-center gap-2">
                  <p className={`text-lg font-bold ${outstanding > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {formatCurrency(outstanding)}
                  </p>
                  {outstanding > 0 && form.paymentType === 'EARNING' && (
                    <button type="button" onClick={() => handleChange('amount', outstanding)} className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold hover:bg-emerald-200">PAY FULL</button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Advance Given</p>
                <p className={`text-lg font-bold ${advance > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {formatCurrency(advance)}
                </p>
              </div>
            </div>
          )}

          {/* Payment type segmented control */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Payment Type <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-1 gap-2">
              {PAYMENT_TYPES.map(type => {
                let isDisabled = false;
                let disabledReason = '';
                if (type.value === 'EARNING' && outstanding <= 0) {
                  isDisabled = true;
                  disabledReason = '(No outstanding balance)';
                } else if (type.value === 'ADVANCE_RECOVERY' && advance <= 0) {
                  isDisabled = true;
                  disabledReason = '(No advance to recover)';
                }

                return (
                  <button
                    key={type.value}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleChange('paymentType', type.value)}
                    className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                      form.paymentType === type.value
                        ? type.color + ' border-opacity-100'
                        : isDisabled
                          ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <TrendingUp className={`mt-0.5 h-4 w-4 shrink-0 ${form.paymentType === type.value ? '' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-sm font-bold">
                        {type.label} {isDisabled && <span className="text-[10px] font-normal text-slate-400 ml-1">{disabledReason}</span>}
                      </p>
                      <p className={`text-xs ${form.paymentType === type.value ? 'opacity-80' : 'text-slate-400'}`}>{type.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount + mode */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Amount (₹) <span className="text-red-500">*</span>
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount || ''}
                required
                placeholder="0.00"
                onChange={e => handleChange('amount', e.target.value)}
                className={`h-10 w-full rounded-lg border ${fieldErrors.amount ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
                data-invalid={!!fieldErrors.amount}
              />
              {fieldErrors.amount && <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.amount}</p>}
              {/* Show warning if over outstanding */}
              {form.paymentType === 'EARNING' && amount > outstanding && outstanding > 0 && (
                <p className="mt-1 text-[11px] text-amber-600">⚠ Exceeds outstanding balance</p>
              )}
              {form.paymentType === 'ADVANCE_RECOVERY' && amount > advance && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">⚠ Cannot recover more than advance given ({formatCurrency(advance)})</p>
              )}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Payment Mode</span>
              <PremiumSelect
                value={form.paymentMethod || 'CASH'}
                onChange={(e: any) => handleChange('paymentMethod', e.target.value)}
                className={`h-10 w-full rounded-lg border ${fieldErrors.paymentMethod ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
                data-invalid={!!fieldErrors.paymentMethod}
              >
                {PAYMENT_MODES.map(m => (
                  <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                ))}
              </PremiumSelect>
              {fieldErrors.paymentMethod && <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.paymentMethod}</p>}
            </label>
          </div>

          {/* Date + Notes */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Paid At</span>
              <input
                type="date"
                value={form.paidAt ? new Date(form.paidAt).toISOString().slice(0, 10) : ''}
                onChange={e => handleChange('paidAt', e.target.value)}
                className={`h-10 w-full rounded-lg border ${fieldErrors.paidAt ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
                data-invalid={!!fieldErrors.paidAt}
              />
              {fieldErrors.paidAt && <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.paidAt}</p>}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes</span>
              <input
                type="text"
                value={form.notes || ''}
                placeholder="Optional"
                onChange={e => handleChange('notes', e.target.value)}
                className={`h-10 w-full rounded-lg border ${fieldErrors.notes ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
                data-invalid={!!fieldErrors.notes}
              />
              {fieldErrors.notes && <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.notes}</p>}
            </label>
          </div>

          {/* Amount confirmation chip */}
          {amount > 0 && selectedType && (
            <div className={`flex items-center gap-2 rounded-xl border p-3 ${selectedType.color}`}>
              <Wallet className="h-4 w-4 shrink-0" />
              <p className="text-sm font-semibold">
                {selectedType.label}: <span className="text-lg">{formatCurrency(amount)}</span>
                {form.paymentMethod ? ` via ${form.paymentMethod.replace(/_/g, ' ')}` : ''}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg px-4 py-2 text-sm font-semibold">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || (form.paymentType === 'ADVANCE_RECOVERY' && amount > advance)}
            className="theme-accent-btn rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Record Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}
