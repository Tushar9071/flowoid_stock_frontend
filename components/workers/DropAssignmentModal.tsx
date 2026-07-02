'use client';

import React from 'react';
import { X, Trash2, Package } from 'lucide-react';
import { BackendRecord } from '@/lib/services/business-modules.service';

interface DropAssignmentModalProps {
  assignment: BackendRecord;
  form: Record<string, any>;
  saving: boolean;
  apiError?: any;
  rawMaterials: BackendRecord[];
  onChange: (name: string, value: any) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function DropAssignmentModal({
  assignment,
  form,
  saving,
  apiError,
  rawMaterials,
  onChange,
  onClose,
  onSubmit,
}: DropAssignmentModalProps) {
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

  const handleMaterialChange = (rawMaterialId: string, value: string) => {
    const updatedMaterials = form.materials.map((m: any) => 
      m.rawMaterialId === rawMaterialId ? { ...m, quantityReturned: value } : m
    );
    handleChange('materials', updatedMaterials);
  };

  const expected = Number(assignment.expectedPieces ?? 0);
  const alreadyReturned = Array.isArray(assignment.returns) ? assignment.returns.reduce((acc: number, r: any) => acc + Number(r.piecesReturned || 0), 0) : Number(assignment.returnedPieces ?? 0);
  const alreadyRejected = Array.isArray(assignment.returns) ? assignment.returns.reduce((acc: number, r: any) => acc + Number(r.piecesRejected || 0), 0) : Number(assignment.rejectedPieces ?? 0);
  const remaining = Math.max(0, expected - alreadyReturned - alreadyRejected);

  return (
    <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center sm:p-6">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="theme-modal-panel w-full max-w-xl overflow-hidden"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold theme-text-primary">Drop Assignment</h2>
              <p className="text-xs text-slate-500">
                Cancel assignment & return leftover materials to stock
              </p>
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
          {/* Summary Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">Expected Pieces:</span>
              <span className="text-sm font-bold">{expected}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">Already Accounted For:</span>
              <span className="text-sm font-bold text-green-600">{alreadyReturned + alreadyRejected}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Remaining to Account:</span>
              <span className="text-sm font-bold text-amber-600">{remaining}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Final Delivered</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.piecesReturned || ''}
                onChange={e => handleChange('piecesReturned', e.target.value)}
                className={`h-10 w-full rounded-lg border ${fieldErrors.piecesReturned ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
                placeholder="0"
              />
              {fieldErrors.piecesReturned && <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.piecesReturned}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Final Rejected</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.piecesRejected || ''}
                onChange={e => handleChange('piecesRejected', e.target.value)}
                className={`h-10 w-full rounded-lg border ${fieldErrors.piecesRejected ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
                placeholder="0"
              />
              {fieldErrors.piecesRejected && <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.piecesRejected}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Drop Reason</label>
            <input
              type="text"
              value={form.cancelReason || ''}
              onChange={e => handleChange('cancelReason', e.target.value)}
              className={`h-10 w-full rounded-lg border ${fieldErrors.cancelReason ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
              placeholder="Why is this assignment being dropped?"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Return Date</label>
            <input
              type="date"
              required
              value={form.returnDate || ''}
              onChange={e => handleChange('returnDate', e.target.value)}
              className={`h-10 w-full rounded-lg border ${fieldErrors.returnDate ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
            />
          </div>

          {/* Leftover Raw Materials */}
          {form.materials && form.materials.length > 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4">
               <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-amber-700 flex items-center gap-2">
                 <Package className="h-4 w-4" /> Leftover Raw Materials
               </h3>
               <p className="text-xs text-amber-700 mb-4">
                 Specify the exact amount of raw materials being returned to stock. Unreturned materials are written off (already consumed).
               </p>
               <div className="space-y-3">
                 {form.materials.map((m: any, index: number) => {
                   const rawMaterialObj = rawMaterials.find(rm => rm.id === m.rawMaterialId);
                   const name = rawMaterialObj?.name || 'Unknown Material';
                   const unit = rawMaterialObj?.unit || 'units';
                   
                   return (
                     <div key={m.rawMaterialId} className="flex items-center justify-between gap-4 bg-white p-3 rounded-lg border border-slate-200">
                       <span className="text-sm font-medium theme-text-primary flex-1">{name}</span>
                       <div className="flex items-center gap-2">
                         <input
                           type="number"
                           min="0"
                           step="0.01"
                           value={m.quantityReturned || ''}
                           onChange={e => handleMaterialChange(m.rawMaterialId, e.target.value)}
                           className={`h-9 w-24 rounded-lg border ${fieldErrors[`materials.${index}.quantityReturned`] ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-2 text-sm font-semibold outline-none focus:border-indigo-500 text-right`}
                           placeholder="0"
                         />
                         <span className="text-xs text-slate-500 w-8">{unit}</span>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="theme-danger-btn inline-flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold shadow-sm transition-all focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Drop Assignment
          </button>
        </div>
      </form>
    </div>
  );
}
