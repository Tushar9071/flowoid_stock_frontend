'use client';

import React from 'react';
import { X, Wallet, TrendingUp } from 'lucide-react';
import { BackendRecord } from '@/lib/services/business-modules.service';
import { formatCurrency } from '@/lib/constants';

interface PaymentModalProps {
  form: Record<string, any>;
  workers: BackendRecord[];
  saving: boolean;
  onChange: (name: string, value: any) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const PAYMENT_TYPES = [
  { value: 'EARNING_SETTLEMENT', label: 'Earning Settlement', desc: 'Pay out earned balance to worker', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
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
  onChange,
  onClose,
  onSubmit,
}: PaymentModalProps) {
  const selectedWorker = workers.find(w => w.id === form.workerId);
  const summary = selectedWorker?.summary;
  const outstanding = moneyNumber(summary?.outstandingBalance);
  const advance = moneyNumber(summary?.advanceGiven);
  const amount = moneyNumber(form.amount);

  const selectedType = PAYMENT_TYPES.find(t => t.value === form.paymentType);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center sm:p-6">
      <form
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

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Worker selector */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Worker <span className="text-red-500">*</span>
            </span>
            <select
              value={form.workerId || ''}
              required
              onChange={e => onChange('workerId', e.target.value)}
              className="h-10 w-full text-sm"
            >
              <option value="">Select worker</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.name}{w.city ? ` · ${w.city}` : ''}</option>
              ))}
            </select>
          </label>

          {/* Worker balance context */}
          {selectedWorker && summary && (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Outstanding</p>
                <p className={`text-lg font-bold ${outstanding > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {formatCurrency(outstanding)}
                </p>
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
              {PAYMENT_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => onChange('paymentType', type.value)}
                  className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                    form.paymentType === type.value
                      ? type.color + ' border-opacity-100'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <TrendingUp className={`mt-0.5 h-4 w-4 shrink-0 ${form.paymentType === type.value ? '' : 'text-slate-400'}`} />
                  <div>
                    <p className="text-sm font-bold">{type.label}</p>
                    <p className={`text-xs ${form.paymentType === type.value ? 'opacity-80' : 'text-slate-400'}`}>{type.desc}</p>
                  </div>
                </button>
              ))}
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
                onChange={e => onChange('amount', e.target.value)}
                className="h-10 w-full text-sm"
              />
              {/* Show warning if over outstanding */}
              {form.paymentType === 'EARNING_SETTLEMENT' && amount > outstanding && outstanding > 0 && (
                <p className="mt-1 text-[11px] text-amber-600">⚠ Exceeds outstanding balance</p>
              )}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Payment Mode</span>
              <select
                value={form.paymentMode || 'CASH'}
                onChange={e => onChange('paymentMode', e.target.value)}
                className="h-10 w-full text-sm"
              >
                {PAYMENT_MODES.map(m => (
                  <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Date + Notes */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Paid At</span>
              <input
                type="date"
                value={form.paidAt || ''}
                onChange={e => onChange('paidAt', e.target.value)}
                className="h-10 w-full text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes</span>
              <input
                type="text"
                value={form.notes || ''}
                placeholder="Optional"
                onChange={e => onChange('notes', e.target.value)}
                className="h-10 w-full text-sm"
              />
            </label>
          </div>

          {/* Amount confirmation chip */}
          {amount > 0 && selectedType && (
            <div className={`flex items-center gap-2 rounded-xl border p-3 ${selectedType.color}`}>
              <Wallet className="h-4 w-4 shrink-0" />
              <p className="text-sm font-semibold">
                {selectedType.label}: <span className="text-lg">{formatCurrency(amount)}</span>
                {form.paymentMode ? ` via ${form.paymentMode.replace(/_/g, ' ')}` : ''}
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
            disabled={saving}
            className="theme-accent-btn rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Record Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}
