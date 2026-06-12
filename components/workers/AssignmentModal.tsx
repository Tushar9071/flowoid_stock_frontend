'use client';

import React from 'react';
import { X, Package, User, Layers, ClipboardList, AlertTriangle } from 'lucide-react';
import { BackendRecord } from '@/lib/services/business-modules.service';
import { PremiumSelect } from '@/components/ui/PremiumSelect';

interface AssignmentModalProps {
  mode: 'create' | 'update';
  form: Record<string, any>;
  workers: BackendRecord[];
  designs: BackendRecord[];
  rawMaterials: BackendRecord[];
  selectedAssignment?: BackendRecord | null;
  saving: boolean;
  apiError?: any;
  onChange: (name: string, value: any) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AssignmentModal({
  mode,
  form,
  workers,
  designs,
  rawMaterials,
  selectedAssignment,
  saving,
  apiError,
  onChange,
  onClose,
  onSubmit,
}: AssignmentModalProps) {
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
  const selectedDesign = designs.find(d => d.id === form.designId);
  const selectedMaterial = rawMaterials.find(m => m.id === form.rawMaterialTypeId);

  // ── Client-side stock validation ────────────────────────────────────────────
  const availableStock = selectedMaterial
    ? Number(
        selectedMaterial.currentStock ??
        selectedMaterial.availableStock ??
        selectedMaterial.stock ??
        selectedMaterial.quantity ??
        null,
      )
    : null;

  const requestedQty = form.rawMaterialQty ? Number(form.rawMaterialQty) : 0;

  const stockInsufficient =
    mode === 'create' &&
    availableStock !== null &&
    !Number.isNaN(availableStock) &&
    requestedQty > 0 &&
    requestedQty > availableStock;

  return (
    <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center sm:p-6">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="theme-modal-panel w-full max-w-2xl overflow-hidden"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold theme-text-primary">
                {mode === 'create' ? 'Create Assignment' : 'Update Assignment'}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === 'create'
                  ? 'Issue raw material & pieces to a worker'
                  : `Assignment · ${selectedAssignment?.id?.slice(0, 8) || ''}`}
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

        <div className="overflow-y-auto flex-1">
          {mode === 'create' ? (
            <div className="p-6 space-y-6">
              {/* Context preview bar */}
              {(selectedWorker || selectedDesign || selectedMaterial) && (
                <div className="grid grid-cols-3 gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <ContextCard
                    icon={<User className="h-4 w-4 text-indigo-500" />}
                    label="Worker"
                    value={selectedWorker?.name || '—'}
                    sub={selectedWorker?.city || selectedWorker?.phone || ''}
                  />
                  <ContextCard
                    icon={<Layers className="h-4 w-4 text-violet-500" />}
                    label="Design"
                    value={selectedDesign?.designCode || selectedDesign?.code || '—'}
                    sub={selectedDesign?.name || ''}
                  />
                  <ContextCard
                    icon={<Package className="h-4 w-4 text-amber-500" />}
                    label="Raw Material"
                    value={selectedMaterial?.name || '—'}
                    sub={selectedMaterial?.unit ? `Unit: ${selectedMaterial.unit}` : ''}
                  />
                </div>
              )}

              {/* Worker + Design row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Worker" required>
                  <PremiumSelect
                    required
                    value={form.workerId || ''}
                    onChange={(e: any) => handleChange('workerId', e.target.value)}
                    className={`h-10 w-full rounded-lg border ${fieldErrors.workerId ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
                    data-invalid={!!fieldErrors.workerId}
                  >
                    <option value="">Select a Worker...</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </PremiumSelect>
                  {fieldErrors.workerId && <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.workerId}</p>}
                </Field>
                <Field label="Design" required>
                  <PremiumSelect
                    required
                    value={form.designId || ''}
                    onChange={(e: any) => handleChange('designId', e.target.value)}
                    className={`h-10 w-full rounded-lg border ${fieldErrors.designId ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
                    data-invalid={!!fieldErrors.designId}
                  >
                    <option value="">Select a Design...</option>
                    {designs.map(d => (
                      <option key={d.id} value={d.id}>{d.name || d.code || d.designCode}</option>
                    ))}
                  </PremiumSelect>
                  {fieldErrors.designId && <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.designId}</p>}
                </Field>
              </div>

              {/* Raw Material section */}
              <div className={`rounded-xl border p-4 ${stockInsufficient ? 'border-red-200 bg-red-50/50' : 'border-amber-100 bg-amber-50/50'}`}>
                <p className={`mb-3 text-xs font-bold uppercase tracking-wide ${stockInsufficient ? 'text-red-700' : 'text-amber-700'}`}>
                  Raw Material Issued to Worker
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Raw Material Type" required>
                    <PremiumSelect
                      value={form.rawMaterialTypeId || ''}
                      onChange={(e: any) => handleChange('rawMaterialTypeId', e.target.value)}
                      className={`h-10 w-full rounded-lg border ${fieldErrors.rawMaterialTypeId ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
                      data-invalid={!!fieldErrors.rawMaterialTypeId}
                    >
                      <option value="">None (No Material Issue)</option>
                      {rawMaterials.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name || m.materialName} ({m.currentStock ?? m.availableStock ?? 0} {m.unit || 'units'} avail)
                        </option>
                      ))}
                    </PremiumSelect>
                    {fieldErrors.rawMaterialTypeId && <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.rawMaterialTypeId}</p>}
                  </Field>
                  <div>
                    <Field label={`Qty Issued${selectedMaterial?.unit ? ` (${selectedMaterial.unit})` : ''}`} required>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        required={!!form.rawMaterialTypeId}
                        value={form.rawMaterialQty || ''}
                        onChange={e => handleChange('rawMaterialQty', e.target.value)}
                        className={`h-10 w-full rounded-lg border ${fieldErrors.rawMaterialQty ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
                        placeholder="e.g. 50"
                        data-invalid={!!fieldErrors.rawMaterialQty}
                      />
                      {fieldErrors.rawMaterialQty && <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.rawMaterialQty}</p>}
                    </Field>
                    {/* Available stock hint */}
                    {availableStock !== null && !Number.isNaN(availableStock) && (
                      <p className={`mt-1.5 text-xs font-medium ${stockInsufficient ? 'text-red-600' : 'text-slate-500'}`}>
                        {stockInsufficient ? (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            Insufficient stock — available: <strong>{availableStock.toLocaleString()} {selectedMaterial?.unit || 'pcs'}</strong>, required: <strong>{requestedQty.toLocaleString()}</strong>
                          </span>
                        ) : (
                          <>Available stock: <strong>{availableStock.toLocaleString()} {selectedMaterial?.unit || 'pcs'}</strong></>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Prominent stock error banner */}
                {stockInsufficient && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-100 px-3 py-2.5 text-sm text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <strong>Insufficient stock:</strong> Only <strong>{availableStock?.toLocaleString()} {selectedMaterial?.unit || 'pieces'}</strong> of <strong>{selectedMaterial?.name}</strong> are available, but you are requesting <strong>{requestedQty.toLocaleString()}</strong>. Please reduce the quantity or top up stock first.
                    </span>
                  </div>
                )}
              </div>

              {/* Dates + Notes */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Issued At" required>
                  <input
                    type="date"
                    required
                    value={form.issuedAt || ''}
                    onChange={e => onChange('issuedAt', e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                  />
                </Field>
                <Field label="Expected Return Date">
                  <input
                    type="date"
                    value={form.expectedReturnDate || ''}
                    onChange={e => onChange('expectedReturnDate', e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                  />
                </Field>
                <Field label="Notes">
                  <input
                    type="text"
                    value={form.notes || ''}
                    placeholder="Optional notes"
                    onChange={e => onChange('notes', e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                  />
                </Field>
              </div>
            </div>
          ) : (
            // Update mode — only editable fields
            <div className="p-6 space-y-4">
              {selectedAssignment && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                  <p className="font-semibold theme-text-primary">{selectedAssignment.worker?.name || '—'}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {selectedAssignment.design?.designCode || selectedAssignment.designId || '—'}
                    {' · '}Returned: {Array.isArray(selectedAssignment.returns) ? selectedAssignment.returns.reduce((acc: number, r: any) => acc + Number(r.piecesReturned || 0), 0) : 0} pcs
                  </p>
                  {/* Show current status for context */}
                  {selectedAssignment.status && (
                    <span className="mt-2 inline-block rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                      {selectedAssignment.status}
                    </span>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Expected Return Date">
                  <input
                    type="date"
                    value={form.expectedReturnDate || ''}
                    onChange={e => onChange('expectedReturnDate', e.target.value)}
                    className="h-10 w-full text-sm"
                  />
                </Field>
                <Field label="Notes">
                  <input
                    type="text"
                    value={form.notes || ''}
                    placeholder="Optional notes"
                    onChange={e => onChange('notes', e.target.value)}
                    className="h-10 w-full text-sm"
                  />
                </Field>
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
            disabled={saving || stockInsufficient}
            title={stockInsufficient ? 'Insufficient stock — reduce quantity or top up stock first' : undefined}
            className="theme-accent-btn rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : mode === 'create' ? 'Create Assignment' : 'Update Assignment'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function ContextCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold theme-text-primary">{value}</p>
        {sub && <p className="truncate text-[11px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}
