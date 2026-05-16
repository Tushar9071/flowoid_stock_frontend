'use client';

import React from 'react';
import { X, Package, User, Layers, ClipboardList, AlertTriangle } from 'lucide-react';
import { BackendRecord } from '@/lib/services/business-modules.service';

interface AssignmentModalProps {
  mode: 'create' | 'update';
  form: Record<string, any>;
  workers: BackendRecord[];
  designs: BackendRecord[];
  rawMaterials: BackendRecord[];
  selectedAssignment?: BackendRecord | null;
  saving: boolean;
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
  onChange,
  onClose,
  onSubmit,
}: AssignmentModalProps) {
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
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center sm:p-6">
      <form
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
                  <select
                    value={form.workerId || ''}
                    required
                    onChange={e => onChange('workerId', e.target.value)}
                    className="h-10 w-full text-sm"
                  >
                    <option value="">Select worker</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name}{w.city ? ` · ${w.city}` : ''}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Design" required>
                  <select
                    value={form.designId || ''}
                    required
                    onChange={e => onChange('designId', e.target.value)}
                    className="h-10 w-full text-sm"
                  >
                    <option value="">Select design</option>
                    {designs.map(d => (
                      <option key={d.id} value={d.id}>
                        {[d.designCode || d.code, d.name].filter(Boolean).join(' – ')}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Raw Material section */}
              <div className={`rounded-xl border p-4 ${stockInsufficient ? 'border-red-200 bg-red-50/50' : 'border-amber-100 bg-amber-50/50'}`}>
                <p className={`mb-3 text-xs font-bold uppercase tracking-wide ${stockInsufficient ? 'text-red-700' : 'text-amber-700'}`}>
                  Raw Material Issued to Worker
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Raw Material Type" required>
                    <select
                      value={form.rawMaterialTypeId || ''}
                      required
                      onChange={e => onChange('rawMaterialTypeId', e.target.value)}
                      className="h-10 w-full text-sm"
                    >
                      <option value="">Select material</option>
                      {rawMaterials.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}{m.unit ? ` (${m.unit})` : ''}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div>
                    <Field label={`Qty Issued${selectedMaterial?.unit ? ` (${selectedMaterial.unit})` : ''}`} required>
                      <input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={form.rawMaterialQty || ''}
                        required
                        placeholder="e.g. 2.5"
                        onChange={e => onChange('rawMaterialQty', e.target.value)}
                        className={`h-10 w-full text-sm ${stockInsufficient ? 'border-red-400 focus:ring-red-300' : ''}`}
                      />
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

              {/* Pieces section */}
              <div className="rounded-xl border border-green-100 bg-green-50/50 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-green-700">
                  Piece Count
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Expected Pieces" required>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.expectedPieces || ''}
                      required
                      placeholder="e.g. 100"
                      onChange={e => onChange('expectedPieces', e.target.value)}
                      className="h-10 w-full text-sm"
                    />
                  </Field>
                  <Field label="Issued At">
                    <input
                      type="date"
                      value={form.issuedAt || ''}
                      onChange={e => onChange('issuedAt', e.target.value)}
                      className="h-10 w-full text-sm"
                    />
                  </Field>
                </div>
              </div>

              {/* Dates + Notes */}
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
          ) : (
            // Update mode — only editable fields
            <div className="p-6 space-y-4">
              {selectedAssignment && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                  <p className="font-semibold theme-text-primary">{selectedAssignment.worker?.name || '—'}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {selectedAssignment.design?.designCode || selectedAssignment.designId || '—'}
                    {' · '}Expected: {selectedAssignment.expectedPieces ?? '?'} pcs
                    {' · '}Returned: {selectedAssignment.returnedPieces ?? 0} pcs
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
