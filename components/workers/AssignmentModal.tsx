'use client';

import React from 'react';
import { X, Package, User, Layers, ClipboardList, AlertTriangle } from 'lucide-react';
import { BackendRecord, DesignService, responseItems } from '@/lib/services/business-modules.service';
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

    if (name === 'expectedPieces' && requirements.length > 0 && form.materials) {
      const pcs = Number(value || 0);
      const updatedMaterials = form.materials.map((mat: any) => {
        const req = requirements.find(r => r.rawMaterialId === mat.rawMaterialId);
        if (req) {
          const isDozen = String(req.unit).toUpperCase() === 'DOZEN';
          const multiplier = isDozen ? (pcs / 12) : pcs;
          return {
            ...mat,
            quantityIssued: pcs > 0 ? String(parseFloat((Number(req.quantityRequired || 0) * multiplier).toFixed(3))) : '',
          };
        }
        return mat;
      });
      onChange('materials', updatedMaterials);
    }
  };
  const selectedWorker = workers.find(w => w.id === form.workerId);
  const selectedDesign = designs.find(d => d.id === form.designId);
  const selectedMaterials = form.materials
    ? form.materials.map((m: any) => rawMaterials.find(rm => rm.id === m.rawMaterialId)).filter(Boolean)
    : [];
    
  const hasMaterials = selectedMaterials.length > 0;
  
  const materialLabel = selectedMaterials.length === 1 
    ? selectedMaterials[0].name 
    : selectedMaterials.length > 1 
      ? `${selectedMaterials.length} Materials` 
      : '—';
      
  const materialSubLabel = selectedMaterials.length === 1 && selectedMaterials[0].unit 
    ? `Unit: ${selectedMaterials[0].unit}` 
    : selectedMaterials.length > 1
      ? 'Multiple Items'
      : '';

  const requestedQty = form.rawMaterialQty ? Number(form.rawMaterialQty) : 0;

  const stockInsufficient = (form.materials || []).some((material: any) => {
    const selectedMat = rawMaterials.find(m => m.id === material.rawMaterialId);
    if (!selectedMat) return false;
    const avail = Number(selectedMat.currentStock ?? selectedMat.availableStock ?? selectedMat.stock ?? selectedMat.quantity ?? 0);
    const reqQty = material.quantityIssued ? Number(material.quantityIssued) : 0;
    return mode === 'create' && reqQty > avail;
  });

  const pieceRate = form.pieceRate !== undefined ? Number(form.pieceRate) : 0;
  const expectedPieces = Number(form.expectedPieces || 0);
  const payableAmount = expectedPieces * pieceRate;

  const [lastDesignId, setLastDesignId] = React.useState(form.designId);
  const [requirements, setRequirements] = React.useState<any[]>([]);

  // Fetch design supplementary materials when designId changes
  React.useEffect(() => {
    if (!form.designId || mode !== 'create') {
      setRequirements([]);
      return;
    }

    let active = true;
    const fetchRequirements = async () => {
      try {
        const response = await DesignService.listSupplementaryNeeds('owner', form.designId);
        if (response.success && active) {
          const needs = responseItems(response.data);
          setRequirements(needs);
          
          // Auto-populate materials list
          const pcs = Number(form.expectedPieces || 0);
          const initialMaterials = needs.map((need: any) => {
            const isDozen = String(need.unit).toUpperCase() === 'DOZEN';
            const multiplier = isDozen ? (pcs / 12) : pcs;
            return {
              rawMaterialId: need.rawMaterialId,
              quantityIssued: pcs > 0 ? String(parseFloat((Number(need.quantityRequired || 0) * multiplier).toFixed(3))) : '',
            };
          });
          onChange('materials', initialMaterials);
        }
      } catch (err) {
        console.error('Failed to load design materials', err);
      }
    };

    fetchRequirements();
    return () => { active = false; };
  }, [form.designId]);

  React.useEffect(() => {
    if (form.designId !== lastDesignId) {
      setLastDesignId(form.designId);
    }
  }, [form.designId, lastDesignId]);

  React.useEffect(() => {
    if (mode === 'create') {
      onChange('estimatedAmount', payableAmount);
      if (!form.finalAmount || form.finalAmount === form.estimatedAmount) {
        onChange('finalAmount', payableAmount);
      }
    }
  }, [payableAmount]);

  const handleAddMaterial = () => {
    const materials = form.materials ? [...form.materials] : [];
    materials.push({ rawMaterialId: '', quantityIssued: '' });
    handleChange('materials', materials);
  };

  const handleRemoveMaterial = (index: number) => {
    const materials = [...form.materials];
    materials.splice(index, 1);
    handleChange('materials', materials);
  };

  const handleMaterialChange = (index: number, field: string, value: any) => {
    const materials = [...form.materials];
    materials[index] = { ...materials[index], [field]: value };
    if (field === 'rawMaterialId' && value) {
      const req = requirements.find(r => r.rawMaterialId === value);
      if (req) {
        const pcs = Number(form.expectedPieces || 0);
        const isDozen = String(req.unit).toUpperCase() === 'DOZEN';
        const multiplier = isDozen ? (pcs / 12) : pcs;
        materials[index].quantityIssued = pcs > 0 ? String(parseFloat((Number(req.quantityRequired || 0) * multiplier).toFixed(3))) : '';
      }
    }
    handleChange('materials', materials);
  };

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
              {(selectedWorker || selectedDesign || hasMaterials) && (
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
                    value={materialLabel}
                    sub={materialSubLabel}
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

              {/* Expected Pieces & Amounts (only on create) */}
              {mode === 'create' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Expected Pieces" required>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={form.expectedPieces || ''}
                        onChange={e => handleChange('expectedPieces', e.target.value)}
                        className={`h-10 w-full rounded-lg border ${fieldErrors.expectedPieces ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
                        placeholder="e.g. 100"
                        data-invalid={!!fieldErrors.expectedPieces}
                      />
                      {fieldErrors.expectedPieces && <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.expectedPieces}</p>}
                    </Field>
                    <Field label="Piece Rate (₹)" required>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={form.pieceRate === undefined ? '' : form.pieceRate}
                        onChange={e => handleChange('pieceRate', e.target.value)}
                        className={`h-10 w-full rounded-lg border ${fieldErrors.pieceRate ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
                        placeholder="e.g. 18"
                      />
                    </Field>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
                    <Field label="Total Worker Amount (Auto Calculated)">
                      <div className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 flex items-center justify-between">
                        <span>₹ {payableAmount.toLocaleString()}</span>
                        <span className="text-[10px] uppercase text-slate-400 font-medium">({expectedPieces} pcs × ₹{pieceRate})</span>
                      </div>
                    </Field>
                  </div>
                </div>
              )}

              {/* Raw Material section */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                    Raw Materials Issued to Worker
                  </p>
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100/50 px-2 py-1 rounded-md transition-colors"
                  >
                    + Add Material
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(form.materials || []).map((material: any, index: number) => {
                    const selectedMat = rawMaterials.find(m => m.id === material.rawMaterialId);
                    const avail = selectedMat ? Number(selectedMat.currentStock ?? selectedMat.availableStock ?? selectedMat.stock ?? selectedMat.quantity ?? null) : null;
                    const req = requirements.find(r => r.rawMaterialId === material.rawMaterialId);
                    const reqQty = material.quantityIssued ? Number(material.quantityIssued) : 0;
                    const isInsufficient = mode === 'create' && avail !== null && !Number.isNaN(avail) && reqQty > 0 && reqQty > avail;

                    return (
                      <div key={index} className={`relative rounded-lg border p-3 ${isInsufficient ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-white'}`}>
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(index)}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 border border-slate-200 shadow-sm"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field label="Raw Material Type" required>
                            <PremiumSelect
                              value={material.rawMaterialId || ''}
                              onChange={(e: any) => handleMaterialChange(index, 'rawMaterialId', e.target.value)}
                              className={`h-10 w-full rounded-lg border ${fieldErrors[`materials.${index}.rawMaterialId`] ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
                            >
                              <option value="">Select Material...</option>
                              {rawMaterials.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name || m.materialName} ({m.currentStock ?? m.availableStock ?? 0} {m.unit || 'units'} avail)
                                </option>
                              ))}
                            </PremiumSelect>
                          </Field>
                          <div>
                            <Field label={`Qty Issued${selectedMat?.unit ? ` (${selectedMat.unit})` : ''}`} required>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                required={!!material.rawMaterialId}
                                value={material.quantityIssued || ''}
                                onChange={e => handleMaterialChange(index, 'quantityIssued', e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === '.') e.preventDefault();
                                }}
                                className={`h-10 w-full rounded-lg border ${fieldErrors[`materials.${index}.quantityIssued`] ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500`}
                                placeholder="e.g. 50 (no decimals)"
                              />
                            </Field>
                          </div>
                        </div>

                        {/* Redesigned Formula Preview, Stock, & Expected Production */}
                        {selectedMat && (
                          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                            <div className="space-y-1.5">
                              <p className="theme-text-secondary">
                                <span className="font-bold text-slate-400 block uppercase text-[10px] tracking-wide">Formula</span>
                                <span className="font-semibold text-slate-800">
                                  {req ? (
                                    <>
                                      {req.quantityRequired} {selectedMat.unit} per {req.unit === 'DOZEN' ? 'Dozen' : 'Piece'}
                                    </>
                                  ) : (
                                    'Manual allocation (no formula)'
                                  )}
                                </span>
                              </p>
                              <p className="theme-text-secondary">
                                <span className="font-bold text-slate-400 block uppercase text-[10px] tracking-wide">Expected Production</span>
                                <span className="font-semibold text-slate-800">
                                  {expectedPieces} {expectedPieces === 1 ? 'Piece' : 'Pieces'}
                                </span>
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              <p className="theme-text-secondary">
                                <span className="font-bold text-slate-400 block uppercase text-[10px] tracking-wide font-semibold">Required</span>
                                <span className="font-semibold text-slate-800">
                                  {reqQty} {selectedMat.unit}
                                </span>
                              </p>
                              <p className="theme-text-secondary">
                                <span className="font-bold text-slate-400 block uppercase text-[10px] tracking-wide font-semibold">Available</span>
                                <span className={`font-bold ${isInsufficient ? 'text-red-600' : 'text-slate-800'}`}>
                                  {avail ?? 0} {selectedMat.unit}
                                </span>
                              </p>
                            </div>

                            {/* Warning block if insufficient */}
                            {isInsufficient && (
                              <div className="sm:col-span-2 mt-2 flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 p-2 font-bold text-red-600">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                                <span>Insufficient Stock — Please top up stock or decrease expected pieces</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {(!form.materials || form.materials.length === 0) && (
                    <div className="text-center py-4 rounded-lg border border-dashed border-amber-200 bg-amber-50/30">
                      <p className="text-xs text-amber-700">No raw materials issued. Click "Add Material" to issue items from stock.</p>
                    </div>
                  )}
                </div>
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
                <Field label="Due Date">
                  <input
                    type="date"
                    value={form.dueDate || ''}
                    onChange={e => onChange('dueDate', e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                  />
                </Field>
                <Field label="Priority">
                  <PremiumSelect
                    value={form.priority || 'Normal'}
                    onChange={(e: any) => onChange('priority', e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </PremiumSelect>
                </Field>
                <div className="sm:col-span-2">
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

          {/* Assignment Summary (Create Mode) */}
          {mode === 'create' && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-sm mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-3 border-b border-indigo-100 pb-2">Assignment Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4 text-sm">
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-indigo-400">Worker</span>
                  <span className="font-semibold text-slate-800">{selectedWorker?.name || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-indigo-400">Design</span>
                  <span className="font-semibold text-slate-800">{selectedDesign?.designCode || selectedDesign?.code || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-indigo-400">Quantity</span>
                  <span className="font-semibold text-slate-800">{form.expectedPieces || '0'} pcs</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-indigo-400">Total Amount</span>
                  <span className="font-bold text-indigo-700">₹ {Number(form.estimatedAmount || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-indigo-400">Due Date</span>
                  <span className="font-semibold text-slate-800">{form.dueDate ? new Date(form.dueDate).toLocaleDateString('en-IN') : '—'}</span>
                </div>
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
