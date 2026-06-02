'use client';

import React from 'react';
import { X, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { BackendRecord } from '@/lib/services/business-modules.service';
import { formatCurrency } from '@/lib/constants';

interface GoodsReturnModalProps {
  assignment: BackendRecord;
  form: Record<string, any>;
  saving: boolean;
  onChange: (name: string, value: any) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

function moneyNumber(v: unknown) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

export function GoodsReturnModal({
  assignment,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}: GoodsReturnModalProps) {
  const expected = Number(assignment.expectedPieces ?? 0);
  const alreadyReturned = Number(assignment.returnedPieces ?? 0);
  const alreadyRejected = Number(assignment.rejectedPieces ?? 0);
  const remaining = Math.max(0, expected - alreadyReturned - alreadyRejected);
  const piecesNow = Number(form.piecesReturned || 0);
  const rejectedNow = Number(form.rejectedPieces || 0);
  const acceptedNow = Math.max(0, piecesNow - rejectedNow);
  const pieceRate = moneyNumber(assignment.pieceRateAtAssignment);
  const earnedNow = acceptedNow * pieceRate;

  // progress
  const returnedAfter = alreadyReturned + piecesNow;
  const pct = expected > 0 ? Math.min(100, Math.round((returnedAfter / expected) * 100)) : 0;

  const statusColor =
    assignment.status === 'COMPLETED' || assignment.status === 'CLOSED'
      ? 'text-green-600'
      : assignment.status === 'IN_PROGRESS'
      ? 'text-blue-600'
      : 'text-amber-600';

  // ── Client-side validation ──────────────────────────────────────────────────
  // Only hard-block on values that are always invalid (pieces must be >= 1).
  // Rejected-vs-returned is a soft warning only — during typing the user may
  // have only partially entered `piecesReturned` (e.g. '9' of '90'), which
  // would cause a false-positive block if we treat it as a hard error.
  const validationErrors: string[] = [];

  if (piecesNow <= 0 && form.piecesReturned !== '') {
    validationErrors.push('Pieces returned must be greater than 0.');
  }
  if (rejectedNow < 0) {
    validationErrors.push('Rejected pieces cannot be negative.');
  }
  // Rejection notes required when pieces are rejected
  const rejectionNotesRequired = rejectedNow > 0;
  const rejectionNotesMissing = rejectionNotesRequired && !String(form.rejectionNotes || '').trim();  
  if (rejectionNotesMissing) {
    validationErrors.push('Rejection notes are required when pieces are rejected.');
  }

  // Soft warnings (shown but do NOT disable submit)
  const rejectedExceedsReturned = piecesNow > 0 && rejectedNow > 0 && rejectedNow >= piecesNow;
  // Warn if returning more than remaining
  const overReturn = piecesNow > 0 && remaining > 0 && piecesNow > remaining;

  const hasErrors = validationErrors.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center sm:p-6">
      <form
        onSubmit={onSubmit}
        className="theme-modal-panel w-full max-w-xl overflow-hidden"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <RotateCcw className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold theme-text-primary">Record Goods Return</h2>
              <p className="text-xs text-slate-500">
                {assignment.worker?.name || 'Worker'} ·{' '}
                {assignment.design?.designCode || assignment.design?.code || '—'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Assignment summary card */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Assignment Overview</p>
              <span className={`text-xs font-bold uppercase ${statusColor}`}>{assignment.status || 'ISSUED'}</span>
            </div>

            {/* Piece count stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Expected" value={expected} color="text-slate-700" />
              <StatBox label="Returned" value={alreadyReturned} color="text-green-600" />
              <StatBox label="Remaining" value={remaining} color="text-amber-600" />
            </div>

            {/* Progress bar */}
            {expected > 0 && (
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                  <span>Return progress</span>
                  <span className="font-bold text-slate-600">{pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Raw material info */}
            {assignment.rawMaterialType?.name && (
              <p className="text-xs text-slate-500">
                Raw material issued:{' '}
                <span className="font-semibold text-slate-700">
                  {assignment.rawMaterialQty} {assignment.rawMaterialType.unit || ''} of {assignment.rawMaterialType.name}
                </span>
              </p>
            )}
          </div>

          {/* Return form inputs */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Pieces Returned <span className="text-red-500">*</span>
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.piecesReturned || ''}
                required
                placeholder={`Max ~${remaining}`}
                onChange={e => onChange('piecesReturned', e.target.value)}
                className={`h-10 w-full text-sm ${overReturn ? 'border-amber-400' : ''}`}
              />
              {overReturn && (
                <p className="mt-1 text-[11px] text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  Exceeds remaining ({remaining} pcs) — backend may reject this.
                </p>
              )}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Rejected Pieces
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.rejectedPieces || ''}
                placeholder="0"
                onChange={e => onChange('rejectedPieces', e.target.value)}
                className={`h-10 w-full text-sm ${rejectedExceedsReturned ? 'border-amber-400' : ''}`}
              />
              {rejectedExceedsReturned && (
                <p className="mt-1 text-[11px] text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  Rejected ({rejectedNow}) ≥ returned ({piecesNow}) — 0 pieces will be accepted.
                </p>
              )}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Return Date
              </span>
              <input
                type="date"
                value={form.returnedAt || ''}
                onChange={e => onChange('returnedAt', e.target.value)}
                className="h-10 w-full text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Rejection Notes
                {rejectionNotesRequired && <span className="ml-1 text-red-500">*</span>}
              </span>
              <input
                type="text"
                value={form.rejectionNotes || ''}
                placeholder={rejectionNotesRequired ? 'Required — explain why pieces were rejected' : 'Optional'}
                onChange={e => onChange('rejectionNotes', e.target.value)}
                className={`h-10 w-full text-sm ${
                  rejectionNotesMissing ? 'border-red-400 focus:ring-red-300' : ''
                }`}
              />
              {rejectionNotesMissing && (
                <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  Required when pieces are rejected.
                </p>
              )}
            </label>
            <label className="block col-span-2">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes</span>
              <textarea
                value={form.notes || ''}
                placeholder="Optional notes"
                rows={2}
                onChange={e => onChange('notes', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
          </div>

          {/* Inline validation errors */}
          {hasErrors && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 space-y-1">
              {validationErrors.map((err, i) => (
                <p key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {err}
                </p>
              ))}
            </div>
          )}

          {/* Live earning preview */}
          {piecesNow > 0 && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-700">Return Preview</p>
              <div className="grid grid-cols-3 gap-3">
                <PreviewStat
                  icon={<CheckCircle className="h-4 w-4 text-emerald-600" />}
                  label="Accepted"
                  value={`${acceptedNow} pcs`}
                  valueClass="text-emerald-700"
                />
                <PreviewStat
                  icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                  label="Rejected"
                  value={`${rejectedNow} pcs`}
                  valueClass="text-red-600"
                />
                {pieceRate > 0 && (
                  <PreviewStat
                    icon={<span className="text-sm">₹</span>}
                    label="Will Earn"
                    value={formatCurrency(earnedNow)}
                    valueClass="text-indigo-700 font-bold"
                  />
                )}
              </div>
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
            disabled={saving || hasErrors}
            title={hasErrors ? validationErrors[0] : undefined}
            className="theme-accent-btn rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Record Return'}
          </button>
        </div>
      </form>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg bg-white p-3 text-center shadow-sm">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function PreviewStat({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">{label}</p>
        <p className={`text-sm font-bold ${valueClass || ''}`}>{value}</p>
      </div>
    </div>
  );
}
