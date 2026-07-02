'use client';
import { prettyDate, workerCode, workerId, moneyNumber, assignmentWorkerId, returnWorkerId, paymentWorkerId, workerEarned, workerPaid, workerAdvance, workerOutstanding, designLabel, ledgerEntries, ledgerTotals, toIsoDate, dateInput, parseAssignmentMetadata, assignmentFinancials, computeAssignmentStatus } from './worker-management-utils';

import React, { useCallback, useEffect, useMemo, useState, Suspense, createContext, useContext } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { parseValidationErrors } from '@/lib/utils';
import { Plus, Users, ClipboardList, Package, Wallet, Edit3, Trash2, PlayCircle, XCircle, BookOpen, RotateCcw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { SimpleRecordModal, SimpleField } from '@/components/shared/simple-record-modal';
import { PremiumSelect } from '@/components/ui/PremiumSelect';
import { AssignmentModal } from '@/components/workers/AssignmentModal';
import { GoodsReturnModal } from '@/components/workers/GoodsReturnModal';
import { PaymentModal } from '@/components/workers/PaymentModal';
import { DropAssignmentModal } from '@/components/workers/DropAssignmentModal';
import { useAuth } from '@/lib/auth-context';
import { confirmAction } from '@/components/shared/confirm-action';

import {
  AssignmentService,
  BackendRecord,
  DesignService,
  responseItems,
  WorkerService,
} from '@/lib/services/business-modules.service';
import { RawMaterialService } from '@/lib/services/raw-material.service';
import { BackendTenant } from '@/lib/types';
import { CurrentOwnerService } from '@/lib/services/current-owner.service';
import { formatCurrency } from '@/lib/constants';

type Tab = 'workers' | 'assignments' | 'finished-goods' | 'payments';
type ModalMode = 'worker' | 'assignment' | 'assignment-update' | 'assignment-close' | 'assignment-drop' | 'return' | 'payment' | 'ledger' | null;


const WorkerManagementContext = createContext<any>(null);

export const useWorkerManagement = () => useContext(WorkerManagementContext);

export function WorkerManagementProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkerManagementProviderInner>{children}</WorkerManagementProviderInner>
    </Suspense>
  );
}

function WorkerManagementProviderInner({ children }: { children: React.ReactNode }) {
  const { hasPermission } = useAuth();
  const searchParams = useSearchParams();
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [tab, setTab] = useState<Tab>('workers');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<BackendRecord[]>([]);
  const [assignments, setAssignments] = useState<BackendRecord[]>([]);
  const [goodsReturns, setGoodsReturns] = useState<BackendRecord[]>([]);
  const [payments, setPayments] = useState<BackendRecord[]>([]);
  const [designs, setDesigns] = useState<BackendRecord[]>([]);
  const [rawMaterials, setRawMaterials] = useState<BackendRecord[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingWorker, setEditingWorker] = useState<BackendRecord | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<BackendRecord | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<BackendRecord | null>(null);
  const [workerLedger, setWorkerLedger] = useState<BackendRecord | BackendRecord[] | null>(null);
  const [workerForm, setWorkerForm] = useState<Record<string, any>>({});
  const [assignmentForm, setAssignmentForm] = useState<Record<string, any>>({});
  const [returnForm, setReturnForm] = useState<Record<string, any>>({});
  const [paymentForm, setPaymentForm] = useState<Record<string, any>>({});
  const [closeForm, setCloseForm] = useState<Record<string, any>>({});
  const [dropForm, setDropForm] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState<any>(null);

  const canCreate = hasPermission('workers.create');
  const canUpdate = hasPermission('workers.update');
  const canDelete = hasPermission('workers.delete');
  const canReadAssignment = hasPermission('workers.read');
  const canCreateAssignment = hasPermission('workers.create');
  const canUpdateAssignment = hasPermission('workers.update');
  const canCreatePayment = hasPermission('workers.create'); // Or worker_payments.create, backend uses WORKERS.CREATE

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tenantRes = await CurrentOwnerService.getCurrentOwner();
      if (!tenantRes.success || !tenantRes.data) {
        toast.error(tenantRes.error?.message || 'No business tenant found');
        return;
      }

      setTenant(tenantRes.data);
      const [workersRes, assignmentsRes, returnsRes, paymentsRes, designsRes, rawMaterialsRes] = await Promise.all([
        WorkerService.list(tenantRes.data.id, { page: 1, limit: 100 }),
        // Global assignments list endpoint — may not be implemented; failures handled gracefully
        AssignmentService.list(tenantRes.data.id, { page: 1, limit: 100 }),
        // Global goods-returns list endpoint — may not be implemented; failures handled gracefully
        AssignmentService.listGoodsReturns(tenantRes.data.id, { page: 1, limit: 100 }),
        // Worker payments list: GET /workers/payments (documented in API spec)
        WorkerService.listPayments(tenantRes.data.id, { page: 1, limit: 100 }),
        DesignService.list(tenantRes.data.id, { page: 1, limit: 100 }),
        RawMaterialService.listTypes(tenantRes.data.id, { page: 1, limit: 100, isActive: true }),
      ]);

      if (workersRes.success) setWorkers(responseItems(workersRes.data));
      else toast.error(workersRes.error?.message || 'Failed to load workers');
      // Assignments: use items if available, silently skip on API error
      if (assignmentsRes.success) {
        const loadedAssignments = responseItems(assignmentsRes.data);
        setAssignments(loadedAssignments);
        const extractedReturns = loadedAssignments.flatMap((a: any) => 
          (a.returns || []).map((r: any) => ({ ...r, assignment: a }))
        ).sort((a: any, b: any) => new Date(b.returnDate || b.createdAt).getTime() - new Date(a.returnDate || a.createdAt).getTime());
        setGoodsReturns(extractedReturns);
      }
      if (paymentsRes.success) setPayments(responseItems(paymentsRes.data));
      if (designsRes.success) setDesigns(responseItems(designsRes.data));
      // Use responseItems for consistent extraction from paginated response
      if (rawMaterialsRes.success) setRawMaterials(responseItems(rawMaterialsRes.data));
    } catch {
      toast.error('Failed to load worker module');
    } finally {
      setLoading(false);
    }
  }, []);

  const pathname = usePathname();

  useEffect(() => {
    loadData();
  }, [loadData, pathname]);

  useEffect(() => {
    setPage(1);
  }, [tab, search]);



  const workerFields: SimpleField[] = [
    { name: 'name', label: 'Name', required: true },
    { name: 'phone', label: 'Phone' },
    { name: 'alternatePhone', label: 'Alternate Phone' },
    { name: 'city', label: 'City' },
    { name: 'idProofType', label: 'ID Proof Type' },
    { name: 'idProofNumber', label: 'ID Proof Number' },
    { name: 'address', label: 'Address', type: 'textarea' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const assignmentFields: SimpleField[] = [
    { name: 'workerId', label: 'Worker', type: 'select', required: true, options: workers.map(worker => ({ label: worker.name || workerCode(worker), value: worker.id })) },
    { name: 'designId', label: 'Design', type: 'select', required: true, options: designs.map(design => ({ label: `${design.designCode || design.code || ''} ${design.name || ''}`.trim() || design.id, value: design.id })) },
    // Raw material is issued to worker with the assignment (raw material thrown to worker)
    { name: 'rawMaterialTypeId', label: 'Raw Material Type', type: 'select', required: true, options: rawMaterials.map(material => ({ label: `${material.name || material.id} (${material.unit || 'unit'})`, value: material.id })) },
    { name: 'rawMaterialQty', label: 'Raw Material Qty Issued', type: 'number', required: true },
    { name: 'issuedAt', label: 'Issued At', type: 'date' },
    { name: 'expectedReturnDate', label: 'Expected Return Date', type: 'date' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const assignmentUpdateFields: SimpleField[] = [
    { name: 'expectedReturnDate', label: 'Expected Return Date', type: 'date' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const returnFields: SimpleField[] = [
    { name: 'piecesReturned', label: 'Pieces Returned', type: 'number', required: true },
    { name: 'rejectedPieces', label: 'Rejected Pieces', type: 'number' },
    { name: 'returnedAt', label: 'Returned At', type: 'date' },
    { name: 'rejectionNotes', label: 'Rejection Notes', type: 'textarea' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const paymentFields: SimpleField[] = [
    { name: 'workerId', label: 'Worker', type: 'select', required: true, options: workers.map(worker => ({ label: worker.name || workerCode(worker), value: worker.id })) },
    { name: 'amount', label: 'Amount', type: 'number', required: true },
    { name: 'paymentType', label: 'Payment Type', type: 'select', required: true, options: ['EARNING_SETTLEMENT', 'ADVANCE', 'ADVANCE_RECOVERY'].map(type => ({ label: type.replace(/_/g, ' '), value: type })) },
    { name: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE'].map(method => ({ label: method.replace(/_/g, ' '), value: method })) },
    { name: 'referenceNumber', label: 'Reference No. (Assignment ID to link payment)', type: 'text' },
    { name: 'paidAt', label: 'Paid At', type: 'date' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const closeFields: SimpleField[] = [
    { name: 'notes', label: 'Close Notes', type: 'textarea', required: true },
  ];

  const openWorkerForm = (worker?: BackendRecord) => {
    setEditingWorker(worker || null);
    setFormError(null);
    setModalMode('worker');
    setWorkerForm(worker ? {
      name: worker.name || '',
      phone: worker.phone || '',
      alternatePhone: worker.alternatePhone || '',
      city: worker.city || '',
      idProofType: worker.idProofType || '',
      idProofNumber: worker.idProofNumber || '',
      address: worker.address || '',
      notes: worker.notes || '',
    } : {
      name: '',
      phone: '',
      alternatePhone: '',
      city: '',
      idProofType: '',
      idProofNumber: '',
      address: '',
      notes: '',
    });
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingWorker(null);
    setSelectedWorker(null);
    setSelectedAssignment(null);
    setWorkerLedger(null);
    setWorkerForm({});
    setAssignmentForm({});
    setReturnForm({});
    setPaymentForm({});
    setCloseForm({});
    setFormError(null);
  };

  const openAssignmentForm = (assignment?: BackendRecord, prefilledWorkerId?: string) => {
    setSelectedAssignment(assignment || null);
    setFormError(null);
    setModalMode(assignment ? 'assignment-update' : 'assignment');
    
    if (assignment) {
      const meta = parseAssignmentMetadata(assignment.notes);
      setAssignmentForm({
        expectedReturnDate: dateInput(assignment.expectedReturnDate),
        notes: meta.text,
        dueDate: meta.dueDate,
        priority: meta.priority,
        estimatedAmount: meta.estimatedAmount,
        finalAmount: meta.finalAmount,
        pieceRate: meta.pieceRate,
      });
    } else {
      setAssignmentForm({
        workerId: prefilledWorkerId || workersWithSummary[0]?.id || '',
        designId: designs[0]?.id || '',
        expectedPieces: '',
        materials: [],
        issuedAt: new Date().toISOString().slice(0, 10),
        expectedReturnDate: '',
        notes: '',
        dueDate: '',
        priority: 'Normal',
        estimatedAmount: 0,
        finalAmount: 0,
        pieceRate: 0,
      });
    }
  };

  const openReturnForm = (assignment: BackendRecord) => {
    setSelectedAssignment(assignment);
    setFormError(null);
    setModalMode('return');
    
    // Multiple returns are now allowed per assignment, so we no longer block based on returnedAlready.

    setReturnForm({
      piecesReturned: '',
      rejectedPieces: 0,
      returnedAt: new Date().toISOString().slice(0, 10),
      rejectionNotes: '',
      notes: '',
    });
  };

  const openPaymentForm = (worker?: BackendRecord, assignment?: BackendRecord) => {
    const initialWorker = worker || workersWithSummary[0];
    const targetWorker = workersWithSummary.find(w => w.id === initialWorker?.id) || initialWorker;
    const initialOutstanding = targetWorker ? moneyNumber(targetWorker.summary?.outstandingBalance) : 0;
    
    let defaultType = 'EARNING';
    if (initialOutstanding <= 0) {
      defaultType = 'ADVANCE';
    }

    setSelectedWorker(targetWorker || null);
    setSelectedAssignment(assignment || null);
    setFormError(null);
    setModalMode('payment');
    setPaymentForm({
      workerId: targetWorker?.id || '',
      amount: initialOutstanding > 0 ? initialOutstanding : '',
      paymentType: defaultType,
      paymentMethod: 'CASH',
      paidAt: new Date().toISOString().slice(0, 10),
      referenceNumber: assignment?.id || '',
      notes: assignment ? `Payment for assignment ${assignment.id.slice(0,8)}` : '',
    });
  };

  const openCloseForm = (assignment: BackendRecord) => {
    setSelectedAssignment(assignment);
    setFormError(null);
    setModalMode('assignment-close');
    setCloseForm({ notes: '' });
  };

  const openDropForm = (assignment: BackendRecord) => {
    setSelectedAssignment(assignment);
    setFormError(null);
    setModalMode('assignment-drop');
    setDropForm({
      piecesReturned: '',
      piecesRejected: 0,
      returnDate: new Date().toISOString().slice(0, 10),
      cancelReason: '',
      materials: assignment.items?.map((item: any) => ({
        rawMaterialId: item.rawMaterialId,
        quantityReturned: ''
      })) || [],
    });
  };

  const saveWorker = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentTenant = tenant;
    if (!currentTenant?.id) return toast.error('Tenant not found');

    setSaving(true);
    try {
      const response = editingWorker?.id
        ? await WorkerService.update(currentTenant.id, editingWorker.id, workerForm)
        : await WorkerService.create(currentTenant.id, workerForm);
      if (!response.success) {
        setFormError(response.error);
        return;
      }
      toast.success(editingWorker ? 'Worker updated' : 'Worker created');
      closeModal();
      await loadData();
    } catch (error: any) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const saveAssignment = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentTenant = tenant;
    if (!currentTenant?.id) return toast.error('Tenant not found');

    setSaving(true);
    try {
      const payloadNotes = JSON.stringify({
        estimatedAmount: assignmentForm.estimatedAmount,
        finalAmount: assignmentForm.finalAmount,
        pieceRate: assignmentForm.pieceRate,
        dueDate: assignmentForm.dueDate,
        priority: assignmentForm.priority,
        text: assignmentForm.notes
      });

      const response = selectedAssignment?.id
        ? await AssignmentService.update(currentTenant.id, selectedAssignment.id, {
            expectedReturnDate: toIsoDate(assignmentForm.expectedReturnDate) || undefined,
            notes: payloadNotes,
          })
        : await AssignmentService.create(currentTenant.id, {
            workerId: assignmentForm.workerId,
            designId: assignmentForm.designId,
            expectedPieces: Number(assignmentForm.expectedPieces),
            assignmentDate: toIsoDate(assignmentForm.issuedAt) || new Date().toISOString(),
            notes: payloadNotes,
            items: assignmentForm.materials?.filter((m: any) => m.rawMaterialId && Number(m.quantityIssued) > 0).map((m: any) => ({
               rawMaterialId: m.rawMaterialId,
               quantityIssued: Number(m.quantityIssued)
            })) || []
          });
      if (!response.success) {
        setFormError(response.error);
        return;
      }
      toast.success(selectedAssignment ? 'Assignment updated' : 'Assignment created');
      closeModal();
      await loadData();
    } catch (error: any) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const markInProgress = async (assignment: BackendRecord) => {
    const currentTenant = tenant;
    if (!currentTenant?.id || !assignment.id) return toast.error('Tenant or assignment not found');

    // Client-side guard — backend requires ISSUED status
    const currentStatus = (assignment.status || '').toUpperCase();
    if (currentStatus && currentStatus !== 'ISSUED') {
      toast.error(
        `Cannot mark as in progress: assignment is currently "${assignment.status}". Only ISSUED assignments can be started.`,
        { duration: 5000 },
      );
      return;
    }

    const response = await AssignmentService.updateStatus(currentTenant.id, assignment.id, { status: 'IN_PROGRESS' });
    if (response.success) {
      toast.success('Assignment marked in progress');
      await loadData();
    } else {
      toast.error(response.error?.message || 'Failed to update assignment status', { duration: 6000 });
    }
  };

  const closeAssignment = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentTenant = tenant;
    if (!currentTenant?.id || !selectedAssignment?.id) return toast.error('Tenant or assignment not found');

    setSaving(true);
    try {
      const response = await AssignmentService.close(currentTenant.id, selectedAssignment.id, closeForm);
      if (!response.success) {
        setFormError(response.error);
        return;
      }
      toast.success('Assignment closed');
      closeModal();
      await loadData();
    } catch (error: any) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const dropAssignment = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentTenant = tenant;
    if (!currentTenant?.id || !selectedAssignment?.id) return toast.error('Tenant or assignment not found');

    setSaving(true);
    try {
      const payload = {
        piecesReturned: Number(dropForm.piecesReturned || 0),
        piecesRejected: Number(dropForm.piecesRejected || 0),
        returnDate: toIsoDate(dropForm.returnDate) || new Date().toISOString(),
        cancelReason: dropForm.cancelReason || undefined,
        materials: dropForm.materials
          .filter((m: any) => Number(m.quantityReturned) > 0)
          .map((m: any) => ({
            rawMaterialId: m.rawMaterialId,
            quantityReturned: Number(m.quantityReturned)
          }))
      };
      
      const response = await AssignmentService.dropAssignment(currentTenant.id, selectedAssignment.id, payload);
      if (!response.success) {
        setFormError(response.error);
        return;
      }
      toast.success('Assignment dropped and materials returned to stock');
      closeModal();
      await loadData();
    } catch (error: any) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const saveReturn = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentTenant = tenant;
    if (!currentTenant?.id || !selectedAssignment?.id) return toast.error('Tenant or assignment not found');

    setSaving(true);
    try {
      const piecesNow = Number(returnForm.piecesReturned || 0);
      const rejectedNow = Number(returnForm.rejectedPieces || 0);
      const acceptedNow = Math.max(0, piecesNow - rejectedNow);

      const response = await AssignmentService.recordReturn(currentTenant.id, selectedAssignment.id, {
        piecesReturned: acceptedNow,
        piecesRejected: rejectedNow,
        returnDate: toIsoDate(returnForm.returnedAt) || new Date().toISOString(),
        notes: returnForm.notes || returnForm.rejectionNotes || undefined,
      });
      if (!response.success) {
        setFormError(response.error);
        return;
      }
      toast.success('Goods return recorded');
      closeModal();
      await loadData();
    } catch (error: any) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const savePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentTenant = tenant;
    if (!currentTenant?.id) return toast.error('Tenant not found');

    setSaving(true);
    try {
      const response = await WorkerService.createPayment(currentTenant.id, {
        workerId: paymentForm.workerId,
        amount: Number(paymentForm.amount || 0),
        paymentType: paymentForm.paymentType,
        paymentMethod: paymentForm.paymentMethod || undefined,
        paymentDate: toIsoDate(paymentForm.paidAt) || new Date().toISOString(),
        referenceNumber: paymentForm.referenceNumber || undefined,
        notes: paymentForm.notes || undefined,
      });
      if (!response.success) {
        setFormError(response.error);
        return;
      }
      // API returns { payment: {...}, summary: {...} } — update worker summary if available
      const responsePayment = response.data?.payment || response.data;
      const responseSummary = response.data?.summary;
      if (responseSummary && paymentForm.workerId) {
        // Patch the worker in state with fresh summary
        setWorkers(prev => prev.map(w =>
          w.id === paymentForm.workerId ? { ...w, summary: responseSummary } : w
        ));
      }
      toast.success(`Payment of ₹${Number(responsePayment?.amount || paymentForm.amount || 0).toFixed(2)} recorded`);
      closeModal();
      await loadData();
    } catch (error: any) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const viewLedger = async (worker: BackendRecord) => {
    const currentTenant = tenant;
    if (!currentTenant?.id || !worker.id) return toast.error('Tenant or worker not found');

    setSelectedWorker(worker);
    setWorkerLedger(null); // clear while loading
    setModalMode('ledger');
    // Fetch fresh worker detail (includes summary) alongside ledger
    const [ledgerRes, workerRes] = await Promise.all([
      WorkerService.ledger(currentTenant.id, worker.id),
      WorkerService.getById(currentTenant.id, worker.id),
    ]);
    // API returns data as array directly: { success:true, data: [...] }
    if (ledgerRes.success) setWorkerLedger(ledgerRes.data);
    else toast.error(ledgerRes.error?.message || 'Failed to load worker ledger');
    // Update worker in state with fresh summary from GET /workers/:id
    if (workerRes.success && workerRes.data) {
      setSelectedWorker(workerRes.data);
      setWorkers(prev => prev.map(w => w.id === worker.id ? { ...w, ...workerRes.data } : w));
    }
  };

  const deleteWorker = async (worker: BackendRecord) => {
    const currentTenant = tenant;
    if (!currentTenant?.id || !worker.id) return toast.error('Tenant or worker not found');
    if (!(await confirmAction(`Are you sure you want to delete "${worker.name || workerCode(worker)}"?`))) return;

    const response = await WorkerService.delete(currentTenant.id, worker.id);
    if (response.success) {
      toast.success('Worker deleted');
      await loadData();
    } else {
      toast.error(response.error?.message || 'Failed to delete worker');
    }
  };

  const updateWorkerStatus = async (id: string, newStatus: string) => {
    const currentTenant = tenant;
    if (!currentTenant?.id) throw new Error('Tenant not found');

    const response = await WorkerService.updateStatus(currentTenant.id, id, { status: newStatus });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update worker status');
    }
    await loadData();
  };

  const filteredWorkers = useMemo(() => {
    const term = search.toLowerCase();
    return workers.filter(worker =>
      String(worker.name || '').toLowerCase().includes(term) ||
      String(workerCode(worker)).toLowerCase().includes(term) ||
      String(worker.phone || '').toLowerCase().includes(term)
    );
  }, [workers, search]);

  const paginatedWorkers = useMemo(() => filteredWorkers.slice((page - 1) * itemsPerPage, page * itemsPerPage), [filteredWorkers, page]);

  const filteredAssignments = useMemo(() => {
    const term = search.toLowerCase();
    const sorted = [...assignments].sort((a, b) => new Date(b.assignmentDate || b.createdAt).getTime() - new Date(a.assignmentDate || a.createdAt).getTime());
    if (!term) return sorted;
    return sorted.filter(a => 
      String(a.assignmentNo || '').toLowerCase().includes(term) ||
      String(a.worker?.name || '').toLowerCase().includes(term) ||
      String(designLabel(a)).toLowerCase().includes(term) ||
      String(a.status || '').toLowerCase().includes(term)
    ).sort((a, b) => new Date(b.assignmentDate || b.createdAt).getTime() - new Date(a.assignmentDate || a.createdAt).getTime());
  }, [assignments, search]);
  const paginatedAssignments = useMemo(() => filteredAssignments.slice((page - 1) * itemsPerPage, page * itemsPerPage), [filteredAssignments, page]);

  const workersWithSummary = useMemo(() => {
    return workers.map(w => {
      const earned = workerEarned(w, assignments);
      const paid = workerPaid(w, payments);
      const outstanding = workerOutstanding(w, assignments, payments);
      const advanceGiven = workerAdvance(w, payments);
      return {
        ...w,
        summary: {
          ...w.summary,
          earned,
          paid,
          outstandingBalance: outstanding,
          advanceGiven
        }
      } as BackendRecord;
    });
  }, [workers, assignments, goodsReturns, payments]);

  const filteredReturns = useMemo(() => {
    const term = search.toLowerCase();
    const sorted = [...goodsReturns].sort((a, b) => new Date(b.returnDate || b.createdAt).getTime() - new Date(a.returnDate || a.createdAt).getTime());
    if (!term) return sorted;
    return sorted.filter(r => 
      String(r.returnNo || '').toLowerCase().includes(term) ||
      String(r.worker?.name || r.assignment?.worker?.name || '').toLowerCase().includes(term) ||
      String(designLabel(r.assignment || r)).toLowerCase().includes(term)
    ).sort((a, b) => new Date(b.returnDate || b.createdAt).getTime() - new Date(a.returnDate || a.createdAt).getTime());
  }, [goodsReturns, search]);
  const paginatedReturns = useMemo(() => filteredReturns.slice((page - 1) * itemsPerPage, page * itemsPerPage), [filteredReturns, page]);

  const filteredPayments = useMemo(() => {
    const term = search.toLowerCase();
    const sorted = [...payments].sort((a, b) => new Date(b.paymentDate || b.createdAt).getTime() - new Date(a.paymentDate || a.createdAt).getTime());
    if (!term) return sorted;
    return sorted.filter(p => 
      String(p.paymentNo || '').toLowerCase().includes(term) ||
      String(p.worker?.name || '').toLowerCase().includes(term) ||
      String(p.paymentType || '').toLowerCase().includes(term) ||
      String(p.paymentMethod || p.paymentMode || '').toLowerCase().includes(term)
    ).sort((a, b) => new Date(b.paymentDate || b.createdAt).getTime() - new Date(a.paymentDate || a.createdAt).getTime());
  }, [payments, search]);
  const paginatedPayments = useMemo(() => filteredPayments.slice((page - 1) * itemsPerPage, page * itemsPerPage), [filteredPayments, page]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'workers', label: 'Worker List', icon: <Users className="h-4 w-4" />, count: workers.length },
    // Assignments tab only visible to users who can read assignments
    ...(canReadAssignment ? [{ id: 'assignments' as Tab, label: 'Assignments', icon: <ClipboardList className="h-4 w-4" />, count: assignments.length }] : []),
    ...(canReadAssignment ? [{ id: 'finished-goods' as Tab, label: 'Goods Returns', icon: <Package className="h-4 w-4" />, count: goodsReturns.length }] : []),
    { id: 'payments', label: 'Payment Settlement', icon: <Wallet className="h-4 w-4" />, count: payments.length },
  ];

  const pageAction = (
    <div className="flex flex-wrap gap-2">
      {tab === 'workers' && canCreate && (
        <button onClick={() => openWorkerForm()} className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors">
          <Plus className="h-4 w-4" />
          Add Worker
        </button>
      )}
      {tab === 'assignments' && canCreateAssignment && (
        <button onClick={() => openAssignmentForm()} className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors">
          <Plus className="h-4 w-4" />
          Create Assignment
        </button>
      )}
      {tab === 'payments' && canCreatePayment && (
        <button onClick={() => openPaymentForm()} className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors">
          <Plus className="h-4 w-4" />
          Record Payment
        </button>
      )}
    </div>
  );

  const contextValue = {
    tenant, tab, setTab, search, setSearch, page, setPage, itemsPerPage, setItemsPerPage,
    loading, workers, assignments, goodsReturns, payments, designs, rawMaterials,
    canCreate, canUpdate, canDelete, canReadAssignment, canCreateAssignment, canUpdateAssignment, canCreatePayment,
    filteredWorkers, paginatedWorkers, filteredAssignments, paginatedAssignments, filteredReturns, paginatedReturns, filteredPayments, paginatedPayments,
    openWorkerForm, openAssignmentForm, openReturnForm, openPaymentForm, openCloseForm, openDropForm, markInProgress, viewLedger, deleteWorker, updateWorkerStatus
  };

  return (
    <WorkerManagementContext.Provider value={contextValue}>
      {children}
      {modalMode === 'worker' && Object.keys(workerForm).length > 0 && (
        <WorkerFormModal
          title={editingWorker ? 'Edit Worker' : 'Add Worker'}
          subtitle="Fields follow the Swagger worker request contract"
          fields={workerFields}
          values={workerForm}
          saving={saving}
          submitLabel={editingWorker ? 'Update Worker' : 'Create Worker'}
          error={formError}
          onChange={(name, value) => setWorkerForm(form => ({ ...form, [name]: value }))}
          onClose={closeModal}
          onSubmit={saveWorker}
        />
      )}
      {modalMode === 'assignment' && Object.keys(assignmentForm).length > 0 && (
        <AssignmentModal
          mode="create"
          form={assignmentForm}
          workers={workersWithSummary}
          designs={designs}
          rawMaterials={rawMaterials}
          saving={saving}
          apiError={formError}
          onChange={(name, value) => setAssignmentForm(form => ({ ...form, [name]: value }))}
          onClose={closeModal}
          onSubmit={saveAssignment}
        />
      )}
      {modalMode === 'assignment-update' && Object.keys(assignmentForm).length > 0 && (
        <AssignmentModal
          mode="update"
          form={assignmentForm}
          workers={workersWithSummary}
          designs={designs}
          rawMaterials={rawMaterials}
          selectedAssignment={selectedAssignment}
          saving={saving}
          apiError={formError}
          onChange={(name, value) => setAssignmentForm(form => ({ ...form, [name]: value }))}
          onClose={closeModal}
          onSubmit={saveAssignment}
        />
      )}
      {modalMode === 'assignment-close' && Object.keys(closeForm).length > 0 && (
        <SimpleRecordModal
          title="Close Assignment"
          subtitle="Swagger requires close notes"
          fields={closeFields}
          values={closeForm}
          saving={saving}
          apiError={formError}
          submitLabel="Close Assignment"
          onChange={(name, value) => setCloseForm(form => ({ ...form, [name]: value }))}
          onClose={closeModal}
          onSubmit={closeAssignment}
        />
      )}
      {modalMode === 'return' && selectedAssignment && Object.keys(returnForm).length > 0 && (
        <GoodsReturnModal
          assignment={selectedAssignment}
          form={returnForm}
          saving={saving}
          apiError={formError}
          onChange={(name, value) => setReturnForm(form => ({ ...form, [name]: value }))}
          onClose={closeModal}
          onSubmit={saveReturn}
        />
      )}
      {modalMode === 'payment' && Object.keys(paymentForm).length > 0 && (
        <PaymentModal
          form={paymentForm}
          workers={workersWithSummary}
          saving={saving}
          apiError={formError}
          onChange={(name, value) => setPaymentForm(form => ({ ...form, [name]: value }))}
          onClose={closeModal}
          onSubmit={savePayment}
        />
      )}
      {modalMode === 'ledger' && (
        <LedgerModal worker={selectedWorker} ledger={workerLedger} onClose={closeModal} />
      )}
      {modalMode === 'assignment-drop' && selectedAssignment && Object.keys(dropForm).length > 0 && (
        <DropAssignmentModal
          assignment={selectedAssignment}
          form={dropForm}
          saving={saving}
          apiError={formError}
          rawMaterials={rawMaterials}
          onChange={(name, value) => setDropForm(form => ({ ...form, [name]: value }))}
          onClose={closeModal}
          onSubmit={dropAssignment}
        />
      )}
    </WorkerManagementContext.Provider>
  );
}



function StatusPill({ active }: { active: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-[#e6f9f0] text-[#1a7a4a]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>{active ? 'Active' : 'Inactive'}</span>;
}

function TextPill({ text }: { text: string }) {
  return <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-xs font-semibold uppercase text-[#6b7280]">{text}</span>;
}

function WorkerFormModal({
  title,
  subtitle,
  fields,
  values,
  saving,
  submitLabel = 'Save',
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  title: string;
  subtitle?: string;
  fields: SimpleField[];
  values: Record<string, any>;
  saving?: boolean;
  submitLabel?: string;
  error?: any;
  onChange: (name: string, value: any) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (error) {
      const parsed = parseValidationErrors(error);
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
    } else {
      setFieldErrors({});
      setGlobalError(null);
    }
  }, [error]);

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
  return (
    <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center sm:p-6">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="theme-modal-panel w-full max-w-2xl overflow-hidden"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold theme-text-primary">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close worker form"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {globalError && (
          <div className="mx-6 mt-4 whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {globalError}
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map(field => (
              <label key={field.name} className={`block ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </span>
                {field.type === 'select' ? (
                  <PremiumSelect
                    value={values[field.name] ?? ''}
                    required={field.required}
                    onChange={(event: any) => handleChange(field.name, event.target.value)}
                    className={`h-10 w-full text-sm font-semibold rounded-lg border ${fieldErrors[field.name] ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 outline-none focus:border-[var(--color-accent)]`}
                    data-invalid={!!fieldErrors[field.name]}
                  >
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {(field.options || []).map((option: any) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </PremiumSelect>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={values[field.name] ?? ''}
                    required={field.required}
                    placeholder={field.placeholder}
                    onChange={event => handleChange(field.name, event.target.value)}
                    rows={3}
                    className={`w-full rounded-lg border ${fieldErrors[field.name] ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white p-3 text-sm outline-none focus:border-[var(--color-accent)]`}
                    data-invalid={!!fieldErrors[field.name]}
                  />
                ) : field.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={Boolean(values[field.name])}
                    onChange={event => handleChange(field.name, event.target.checked)}
                    className={`h-5 w-5 rounded ${fieldErrors[field.name] ? 'border-red-500 bg-red-50/30' : 'border-slate-300'}`}
                    data-invalid={!!fieldErrors[field.name]}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={values[field.name] ?? ''}
                    required={field.required}
                    placeholder={field.placeholder}
                    min={field.min}
                    max={field.max}
                    onChange={event => handleChange(field.name, event.target.value)}
                    className={`h-10 w-full rounded-lg border ${fieldErrors[field.name] ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm outline-none focus:border-[var(--color-accent)]`}
                    data-invalid={!!fieldErrors[field.name]}
                  />
                )}
                {fieldErrors[field.name] && (
                  <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors[field.name]}</p>
                )}
                {field.hint && (
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">{field.hint}</p>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg px-4 py-2 text-sm font-semibold">
            Cancel
          </button>
          <button disabled={saving} className="theme-accent-btn rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-60">
            {saving ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
      <p className={`text-sm font-semibold capitalize ${valueClass || 'text-[#374151]'}`}>{value}</p>
    </div>
  );
}

function EmptyState({ text, tenant }: { text: string; tenant?: BackendTenant | null }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center text-sm font-medium text-[#6b7280]">
      {tenant === null ? 'A tenant is required before this module can load.' : text}
    </div>
  );
}

function LedgerModal({
  worker,
  ledger, // keep for compatibility if needed, but we rely on context now
  onClose,
}: {
  worker: BackendRecord | null;
  ledger: BackendRecord | BackendRecord[] | null;
  onClose: () => void;
}) {
  const { assignments, payments } = useWorkerManagement();
  const [activeTab, setActiveTab] = useState<'ledger' | 'assignments' | 'payments'>('ledger');

  const workerAssignments = useMemo(() => {
    if (!worker) return [];
    return assignments
      .filter((a: any) => assignmentWorkerId(a) === worker.id)
      .sort((a: any, b: any) => new Date(b.assignmentDate || b.createdAt).getTime() - new Date(a.assignmentDate || a.createdAt).getTime());
  }, [assignments, worker]);

  const workerPaymentsList = useMemo(() => {
    if (!worker) return [];
    return payments
      .filter((p: any) => paymentWorkerId(p) === worker.id)
      .sort((a: any, b: any) => new Date(b.paymentDate || b.createdAt).getTime() - new Date(a.paymentDate || a.createdAt).getTime());
  }, [payments, worker]);

  // Aggregate Metrics
  const totalAssignments = workerAssignments.length;
  const metrics = useMemo(() => {
    let est = 0, fin = 0;
    workerAssignments.forEach((a: any) => {
      const f = assignmentFinancials(a, payments);
      est += f.estimated;
      fin += f.final;
    });
    const paid = worker ? workerPaid(worker, payments) : 0;
    const pending = worker ? workerOutstanding(worker, workerAssignments, payments) : 0;
    return { estimated: est, final: fin, paid, pending };
  }, [workerAssignments, payments, worker]);

  const unifiedLedger = useMemo(() => {
    let runningBalance = worker?.openingBalanceType === 'RECEIVABLE' ? -moneyNumber(worker?.openingBalance) : moneyNumber(worker?.openingBalance);
    
    const assignmentItems = workerAssignments.map((a: any) => {
      const f = assignmentFinancials(a, payments);
      return {
        id: a.id,
        date: new Date(a.assignmentDate).getTime(),
        type: 'EARNING',
        method: '-',
        description: `Assignment: ${designLabel(a)}`,
        credit: f.final,
        debit: 0,
      };
    });

    const paymentItems = workerPaymentsList.map((p: any) => {
      const amount = Number(p.amount || 0);
      let desc = p.paymentType || 'Payment';
      if (p.notes) desc += ` (${p.notes})`;
      if (p.referenceNumber) desc += ` [Ref: ${p.referenceNumber.slice(0,8)}]`;
      
      return {
        id: p.id,
        date: new Date(p.paymentDate).getTime(),
        type: p.paymentType || 'PAYMENT',
        method: p.paymentMethod || p.paymentMode || '-',
        description: desc,
        credit: 0,
        debit: amount,
      };
    });

    const combined = [...assignmentItems, ...paymentItems].sort((a, b) => a.date - b.date);
    
    return combined.map(item => {
      runningBalance += item.credit - item.debit;
      return { ...item, runningBalance };
    }).reverse();
  }, [workerAssignments, workerPaymentsList, worker, payments]);

  return (
    <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
      <div className="theme-modal-panel w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold theme-text-primary">Worker History</h2>
            <p className="text-sm text-slate-500">{worker?.name || 'Worker'} — {worker?.city || worker?.phone || 'assignments & payments'}</p>
          </div>
          <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg px-3 py-2 text-sm font-semibold">
            Close
          </button>
        </div>
        
        {/* Summary metrics */}
        <div className="grid gap-4 p-4 md:grid-cols-5 shrink-0 bg-slate-50/50 border-b border-slate-200">
          <Metric label="Total Assignments" value={totalAssignments.toString()} />
          <Metric label="Total Estimated" value={formatCurrency(metrics.estimated)} />
          <Metric label="Total Earnings" value={formatCurrency(metrics.final)} valueClass="text-indigo-600" />
          <Metric label="Total Paid" value={formatCurrency(metrics.paid)} valueClass="text-emerald-600" />
          <Metric label="Total Pending" value={formatCurrency(metrics.pending)} valueClass="text-red-600" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 shrink-0 px-4">
          <button
            className={`px-4 py-3 text-sm font-bold border-b-2 ${activeTab === 'ledger' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('ledger')}
          >
            Unified Ledger
          </button>
          <button
            className={`px-4 py-3 text-sm font-bold border-b-2 ${activeTab === 'assignments' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('assignments')}
          >
            Assignment History
          </button>
          <button
            className={`px-4 py-3 text-sm font-bold border-b-2 ${activeTab === 'payments' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('payments')}
          >
            Recent Payments
          </button>
        </div>

        <div className="overflow-auto flex-1">
          {activeTab === 'ledger' && (
            unifiedLedger.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No ledger entries found for this worker.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="theme-table-header sticky top-0 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left">Method</th>
                    <th className="px-4 py-3 text-right">Earned (Cr)</th>
                    <th className="px-4 py-3 text-right">Paid (Dr)</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unifiedLedger.map((entry: any) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{prettyDate(new Date(entry.date).toISOString())}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{entry.description}</td>
                      <td className="px-4 py-3 text-slate-500">{entry.method}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-500">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                      <td className={`px-4 py-3 text-right font-bold ${entry.runningBalance > 0 ? 'text-indigo-600' : entry.runningBalance < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                        {formatCurrency(entry.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {activeTab === 'assignments' && (
            workerAssignments.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No assignments found for this worker.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="theme-table-header sticky top-0 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Design</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Estimated</th>
                    <th className="px-4 py-3 text-right">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workerAssignments.map((a: any) => {
                    const f = assignmentFinancials(a, payments);
                    return (
                      <tr key={a.id}>
                        <td className="px-4 py-3 whitespace-nowrap">{prettyDate(a.assignmentDate)}</td>
                        <td className="px-4 py-3 font-semibold">{designLabel(a)}</td>
                        <td className="px-4 py-3"><TextPill text={computeAssignmentStatus(a)} /></td>
                        <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(f.estimated)}</td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-600">{formatCurrency(f.final)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}

          {activeTab === 'payments' && (
            workerPaymentsList.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No recent payments found for this worker.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="theme-table-header sticky top-0 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Method</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workerPaymentsList.sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map((entry: any) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{prettyDate(entry.paymentDate)}</td>
                      <td className="px-4 py-3 font-semibold">{entry.paymentType || '-'}</td>
                      <td className="px-4 py-3">{entry.paymentMethod || entry.paymentMode || '-'}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(Number(entry.amount || 0))}</td>
                      <td className="px-4 py-3 text-slate-500">{entry.notes || (entry.referenceNumber ? `Ref: ${entry.referenceNumber.slice(0,8)}` : '-')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}
