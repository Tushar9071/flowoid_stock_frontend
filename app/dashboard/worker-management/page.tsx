'use client';

import React, { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { parseValidationErrors } from '@/lib/utils';
import { Plus, Users, ClipboardList, Package, Wallet, Edit3, Trash2, PlayCircle, XCircle, BookOpen, RotateCcw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonCard, SkeletonTable } from '@/components/skeleton/Skeletons';
import { AdvancedDataTable } from '@/components/shared/DataTable';
import { SimpleRecordModal, SimpleField } from '@/components/shared/simple-record-modal';
import { PremiumSelect } from '@/components/ui/PremiumSelect';
import { AssignmentModal } from '@/components/workers/AssignmentModal';
import { GoodsReturnModal } from '@/components/workers/GoodsReturnModal';
import { PaymentModal } from '@/components/workers/PaymentModal';
import { SearchInput } from '@/components/shared/search-input';
import { formatApiError } from '@/lib/utils';
import { formatCurrency } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';

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

type Tab = 'workers' | 'assignments' | 'finished-goods' | 'payments';
type ModalMode = 'worker' | 'assignment' | 'assignment-update' | 'assignment-close' | 'return' | 'payment' | 'ledger' | null;

function prettyDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}



function workerCode(worker: BackendRecord) {
  return worker.code || worker.workerCode || worker.id?.slice(0, 8) || '-';
}

function workerId(worker: BackendRecord) {
  return worker.id || worker.workerId;
}

function moneyNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function assignmentWorkerId(assignment: BackendRecord) {
  return assignment.workerId || assignment.worker?.id;
}

function returnWorkerId(item: BackendRecord) {
  return item.workerId || item.worker?.id || item.assignment?.worker?.id || item.assignment?.workerId;
}

function paymentWorkerId(payment: BackendRecord) {
  return payment.workerId || payment.worker?.id;
}

function workerEarned(worker: BackendRecord, assignments: BackendRecord[], goodsReturns: BackendRecord[]) {
  const direct = moneyNumber(worker.summary?.totalEarned || worker.totalEarned || worker.totalEarnings);
  if (direct) return direct;
  const id = workerId(worker);
  const fromAssignments = assignments
    .filter(assignment => assignmentWorkerId(assignment) === id)
    .reduce((sum, assignment) => sum + moneyNumber(assignment.totalEarned), 0);
  if (fromAssignments) return fromAssignments;
  return goodsReturns
    .filter(item => returnWorkerId(item) === id)
    .reduce((sum, item) => sum + moneyNumber(item.earningAmount || item.workerEarning || item.amount), 0);
}

function workerPaid(worker: BackendRecord, payments: BackendRecord[]) {
  const direct = moneyNumber(worker.summary?.totalPaid || worker.totalPaid);
  if (direct) return direct;
  const id = workerId(worker);
  return payments
    .filter(payment => paymentWorkerId(payment) === id)
    .reduce((sum, payment) => sum + moneyNumber(payment.amount), 0);
}

function workerOutstanding(worker: BackendRecord, assignments: BackendRecord[], goodsReturns: BackendRecord[], payments: BackendRecord[]) {
  const direct = moneyNumber(worker.summary?.outstandingBalance || worker.outstandingBalance || worker.balance || worker.currentBalance);
  if (direct) return direct;

  const opening = moneyNumber(worker.openingBalance);
  const signedOpening = worker.openingBalanceType === 'RECEIVABLE' ? -opening : opening;
  return signedOpening + workerEarned(worker, assignments, goodsReturns) - workerPaid(worker, payments);
}

function designLabel(record: BackendRecord) {
  return record.design?.designCode || record.design?.code || record.designCode || record.designId || '-';
}

function ledgerEntries(ledger: BackendRecord | BackendRecord[] | null): BackendRecord[] {
  // API returns data as a direct array: { success: true, data: [...] }
  if (Array.isArray(ledger)) return ledger;
  if (!ledger) return [];
  // Fallback: some shapes wrap in entries/ledger/data
  const nested = ledger.entries || ledger.ledger || ledger.data || ledger.items;
  if (Array.isArray(nested)) return nested;
  return [];
}

function ledgerTotals(ledger: BackendRecord | BackendRecord[] | null) {
  const entries = ledgerEntries(ledger);
  // API ledger fields: credit / debit / runningBalance (per API doc)
  const earned = entries.reduce((sum, entry) => sum + moneyNumber(entry.credit || entry.creditAmount), 0);
  const paid = entries.reduce((sum, entry) => sum + moneyNumber(entry.debit || entry.debitAmount), 0);
  const balance = entries.length ? moneyNumber(entries[entries.length - 1].runningBalance || entries[entries.length - 1].balance) : 0;
  return {
    earned: moneyNumber(!Array.isArray(ledger) && (ledger?.summary?.totalEarned || ledger?.totalEarned)) || earned,
    paid: moneyNumber(!Array.isArray(ledger) && (ledger?.summary?.totalPaid || ledger?.totalPaid)) || paid,
    balance: moneyNumber(!Array.isArray(ledger) && (ledger?.summary?.outstandingBalance || ledger?.summary?.balance || ledger?.balance)) || balance,
  };
}

function toIsoDate(value?: string) {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function dateInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export default function WorkerManagementPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkerManagementContent />
    </Suspense>
  );
}

function WorkerManagementContent() {
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
        );
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
    { name: 'paymentMode', label: 'Payment Mode' },
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
    setAssignmentForm(assignment ? {
      expectedReturnDate: dateInput(assignment.expectedReturnDate),
      notes: assignment.notes || '',
    } : {
      workerId: prefilledWorkerId || workers[0]?.id || '',
      designId: designs[0]?.id || '',
      rawMaterialTypeId: rawMaterials[0]?.id || '',
      rawMaterialQty: '',
      issuedAt: new Date().toISOString().slice(0, 10),
      expectedReturnDate: '',
      notes: '',
    });
  };

  const openReturnForm = (assignment: BackendRecord) => {
    setSelectedAssignment(assignment);
    setFormError(null);
    setModalMode('return');
    setReturnForm({
      piecesReturned: '',
      rejectedPieces: 0,
      returnedAt: new Date().toISOString().slice(0, 10),
      rejectionNotes: '',
      notes: '',
    });
  };

  const openPaymentForm = (worker?: BackendRecord) => {
    setSelectedWorker(worker || null);
    setFormError(null);
    setModalMode('payment');
    setPaymentForm({
      workerId: worker?.id || workers[0]?.id || '',
      amount: '',
      paymentType: 'EARNING_SETTLEMENT',
      paymentMode: 'CASH',
      paidAt: new Date().toISOString().slice(0, 10),
      notes: '',
    });
  };

  const openCloseForm = (assignment: BackendRecord) => {
    setSelectedAssignment(assignment);
    setFormError(null);
    setModalMode('assignment-close');
    setCloseForm({ notes: '' });
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
      const response = selectedAssignment?.id
        ? await AssignmentService.update(currentTenant.id, selectedAssignment.id, {
            expectedReturnDate: toIsoDate(assignmentForm.expectedReturnDate) || undefined,
            notes: assignmentForm.notes || undefined,
          })
        : await AssignmentService.create(currentTenant.id, {
            workerId: assignmentForm.workerId,
            designId: assignmentForm.designId,
            assignmentDate: toIsoDate(assignmentForm.issuedAt) || new Date().toISOString(),
            notes: assignmentForm.notes || undefined,
            items: assignmentForm.rawMaterialTypeId && assignmentForm.rawMaterialQty ? [{
               rawMaterialId: assignmentForm.rawMaterialTypeId,
               quantityIssued: Number(assignmentForm.rawMaterialQty)
            }] : []
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

  const saveReturn = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentTenant = tenant;
    if (!currentTenant?.id || !selectedAssignment?.id) return toast.error('Tenant or assignment not found');

    setSaving(true);
    try {
      const response = await AssignmentService.recordReturn(currentTenant.id, selectedAssignment.id, {
        piecesReturned: Number(returnForm.goodPieces || returnForm.piecesReturned || 0),
        piecesRejected: Number(returnForm.rejectedPieces || 0),
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
        paymentMode: paymentForm.paymentMode,
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
    if (!window.confirm(`Delete ${worker.name || workerCode(worker)}?`)) return;

    const response = await WorkerService.delete(currentTenant.id, worker.id);
    if (response.success) {
      toast.success('Worker deleted');
      await loadData();
    } else {
      toast.error(response.error?.message || 'Failed to delete worker');
    }
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
    if (!term) return assignments;
    return assignments.filter(a => 
      String(a.worker?.name || '').toLowerCase().includes(term) ||
      String(designLabel(a)).toLowerCase().includes(term) ||
      String(a.status || '').toLowerCase().includes(term)
    );
  }, [assignments, search]);
  const paginatedAssignments = useMemo(() => filteredAssignments.slice((page - 1) * itemsPerPage, page * itemsPerPage), [filteredAssignments, page]);

  const filteredReturns = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return goodsReturns;
    return goodsReturns.filter(r => 
      String(r.returnNo || '').toLowerCase().includes(term) ||
      String(r.worker?.name || r.assignment?.worker?.name || '').toLowerCase().includes(term) ||
      String(designLabel(r.assignment || r)).toLowerCase().includes(term)
    );
  }, [goodsReturns, search]);
  const paginatedReturns = useMemo(() => filteredReturns.slice((page - 1) * itemsPerPage, page * itemsPerPage), [filteredReturns, page]);

  const filteredPayments = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return payments;
    return payments.filter(p => 
      String(p.paymentNo || '').toLowerCase().includes(term) ||
      String(p.worker?.name || '').toLowerCase().includes(term)
    );
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

  return (
    <DashboardLayout
      title="Worker Management"
      subtitle="Backend connected workers, assignments, goods returns, payments, and ledger views"
      action={pageAction}
    >
      <div className="mb-6 flex w-full gap-1 overflow-x-auto rounded-xl bg-[#e5e7eb] p-1 sm:w-fit">
        {tabs.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all ${tab === item.id ? 'theme-tab-active' : 'theme-tab-inactive'}`}>
            {item.icon} {item.label}
            <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-bold">{item.count}</span>
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          containerClassName="max-w-sm flex-1"
          placeholder="Search workers..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        {/* Refresh button removed — auto-refresh on route change */}
      </div>

      {loading && (tab === 'payments' ? <SkeletonCard count={6} /> : <SkeletonTable rows={8} cols={7} />)}

      {!loading && tab === 'workers' && (
        <AdvancedDataTable
          data={filteredWorkers}
          searchable={false}
          loading={loading}
          emptyIcon={<Users className="h-6 w-6 text-slate-400" />}
          emptyTitle="No workers found"
          emptySubtitle="Add a worker or adjust your search."
          columns={[
            {
              field: 'name',
              header: 'Name',
              sortable: true,
              filterable: true,
              filterType: 'text',
              render: (row) => (
                <div className="flex items-center gap-3">
                  <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold theme-text-primary">{row.name || '-'}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{workerCode(row)}</p>
                  </div>
                </div>
              )
            },
            {
              field: 'contact',
              header: 'Contact Info',
              sortable: true,
              filterable: true,
              filterType: 'text',
              getValue: (row) => `${row.phone || ''} ${row.address || ''}`.trim() || '-',
              render: (row) => (
                <div>
                  <p className="font-semibold theme-text-primary">{row.phone || '-'}</p>
                  <p className="text-xs text-slate-500">{row.address || '-'}</p>
                </div>
              )
            },
            {
              field: 'activeAssignments',
              header: 'Active Assigns',
              sortable: true,
              getValue: (row) => assignments.filter(a => a.workerId === row.id && a.status !== 'CLOSED' && a.status !== 'COMPLETED').length,
              render: (row) => {
                const activeCount = assignments.filter(a => a.workerId === row.id && a.status !== 'CLOSED' && a.status !== 'COMPLETED').length;
                return <div className="text-center font-semibold theme-text-primary">{activeCount || '-'}</div>;
              }
            },
            {
              field: 'earned',
              header: 'Earned',
              sortable: true,
              getValue: (row) => workerEarned(row, assignments, goodsReturns),
              render: (row) => <div className="text-right font-semibold theme-text-primary">{formatCurrency(workerEarned(row, assignments, goodsReturns))}</div>
            },
            {
              field: 'financials',
              header: 'Paid / Outst.',
              sortable: true,
              getValue: (row) => workerPaid(row, payments) - workerOutstanding(row, assignments, goodsReturns, payments),
              render: (row) => {
                const paid = workerPaid(row, payments);
                const outst = workerOutstanding(row, assignments, goodsReturns, payments);
                if (paid === 0 && outst === 0) {
                  return (
                    <div className="text-right">
                      <p className="font-semibold theme-text-primary">{formatCurrency(0)}</p>
                    </div>
                  );
                }
                return (
                  <div className="text-right">
                    {paid > 0 && <p className="font-semibold text-[#1d4ed8]">{formatCurrency(paid)}</p>}
                    {outst !== 0 && <p className="text-xs text-[#cc2200] font-bold">{formatCurrency(Math.abs(outst))}</p>}
                  </div>
                );
              }
            },
            {
              field: 'status',
              header: 'Status',
              sortable: true,
              filterable: true,
              filterType: 'boolean',
              getValue: (row) => row.isActive !== false && row.status !== 'INACTIVE',
              render: (row) => <StatusPill active={row.isActive !== false && row.status !== 'INACTIVE'} />
            },
            {
              field: 'actions',
              header: 'Actions',
              render: (row) => (
                <div className="flex justify-end gap-2">
                  <button onClick={() => viewLedger(row)} className="theme-secondary-btn rounded-lg p-2" title="Worker ledger"><BookOpen className="h-4 w-4" /></button>
                  {canCreateAssignment && <button onClick={() => openAssignmentForm(undefined, row.id)} className="theme-secondary-btn rounded-lg p-2" title="Create assignment"><ClipboardList className="h-4 w-4" /></button>}
                  {canCreatePayment && <button onClick={() => openPaymentForm(row)} className="theme-secondary-btn rounded-lg p-2" title="Record payment"><Wallet className="h-4 w-4" /></button>}
                  {canUpdate && <button onClick={() => openWorkerForm(row)} className="theme-secondary-btn rounded-lg p-2" title="Edit worker"><Edit3 className="h-4 w-4" /></button>}
                  {canDelete && <button onClick={() => deleteWorker(row)} className="theme-danger-btn rounded-lg p-2" title="Delete worker"><Trash2 className="h-4 w-4" /></button>}
                </div>
              )
            }
          ]}
        />
      )}

      {!loading && tab === 'assignments' && (
        canReadAssignment ? (
          <AdvancedDataTable
            data={filteredAssignments}
            searchable={false}
            loading={loading}
            emptyIcon={<ClipboardList className="h-6 w-6 text-slate-400" />}
            emptyTitle="No assignments found"
            columns={[
              {
                field: 'worker',
                header: 'Worker',
                sortable: true,
                filterable: true,
                filterType: 'text',
                getValue: (row) => {
                  const workerObj = workers.find(w => w.id === row.workerId) || row.worker;
                  return workerObj?.name || row.workerName || row.workerId || '-';
                },
                render: (row) => {
                  const workerObj = workers.find(w => w.id === row.workerId) || row.worker;
                  const wName = workerObj?.name || row.workerName || '-';
                  const wCode = workerCode(workerObj || { id: row.workerId });
                  return (
                    <div className="flex items-center gap-3">
                      <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold theme-text-primary">{wName}</p>
                        <p className="text-[11px] text-slate-500 uppercase">{wCode}</p>
                      </div>
                    </div>
                  );
                }
              },
              {
                field: 'designMaterial',
                header: 'Design & Material',
                sortable: true,
                filterable: true,
                filterType: 'text',
                getValue: (row) => {
                  const designObj = designs.find(d => d.id === row.designId) || row.design;
                  return designObj?.name || designObj?.designCode || designObj?.code || row.designId || '-';
                },
                render: (row) => {
                  const matId = row.items?.[0]?.rawMaterialId;
                  const material = rawMaterials.find(m => m.id === matId);
                  const designObj = designs.find(d => d.id === row.designId) || row.design;
                  const dName = designObj?.name || designObj?.designCode || designObj?.code || row.designId || '-';
                  const dCode = designObj?.designCode || designObj?.code || row.designId?.slice(0,8);
                  return (
                    <div>
                      <p className="font-bold theme-text-primary">{dName}</p>
                      <p className="text-[11px] text-slate-500 uppercase">{dCode}</p>
                      {material && (
                        <p className="text-xs text-[#6b7280]">
                          {material.name} {material.unit ? `(${material.unit})` : ''}
                        </p>
                      )}
                    </div>
                  );
                }
              },
              {
                field: 'rawMaterialQty',
                header: 'Qty Issued',
                sortable: true,
                render: (row) => <div className="text-right font-semibold">{row.items?.[0]?.quantityIssued || '-'}</div>
              },
              {
                field: 'returnedPieces',
                header: 'Returned Pcs',
                sortable: true,
                getValue: (row) => row.returns?.reduce((acc: number, r: any) => acc + (r.piecesReturned || 0), 0) || 0,
                render: (row) => {
                  const returned = row.returns?.reduce((acc: number, r: any) => acc + (r.piecesReturned || 0), 0) || 0;
                  return <div className="text-right text-[#1a7a4a]">{returned}</div>;
                }
              },
              {
                field: 'issuedAt',
                header: 'Issued At',
                sortable: true,
                filterable: true,
                filterType: 'date',
                getValue: (row) => row.assignmentDate || row.createdAt,
                render: (row) => <span className="text-[#6b7280]">{prettyDate(row.assignmentDate || row.createdAt)}</span>
              },
              {
                field: 'status',
                header: 'Status',
                sortable: true,
                filterable: true,
                filterType: 'text',
                getValue: (row) => row.status || 'ISSUED',
                render: (row) => <TextPill text={row.status || 'ISSUED'} />
              },
              {
                field: 'actions',
                header: 'Actions',
                render: (row) => (
                  <div className="flex justify-end gap-2">
                    {canUpdateAssignment && (() => {
                      const isIssued = (row.status || 'ISSUED').toUpperCase() === 'ISSUED';
                      return (
                        <button
                          onClick={() => markInProgress(row)}
                          disabled={!isIssued}
                          title={isIssued ? 'Mark in progress' : `Cannot start: assignment is ${row.status} (must be ISSUED)`}
                          className={`rounded-lg p-2 ${isIssued ? 'theme-secondary-btn' : 'cursor-not-allowed bg-gray-100 text-gray-300'}`}
                        >
                          <PlayCircle className="h-4 w-4" />
                        </button>
                      );
                    })()}
                    {canUpdateAssignment && <button onClick={() => openAssignmentForm(row)} className="theme-secondary-btn rounded-lg p-2" title="Edit assignment"><Edit3 className="h-4 w-4" /></button>}
                    {canUpdateAssignment && <button onClick={() => openReturnForm(row)} className="theme-secondary-btn rounded-lg p-2" title="Record goods return"><RotateCcw className="h-4 w-4" /></button>}
                    {canUpdateAssignment && <button onClick={() => openCloseForm(row)} className="theme-danger-btn rounded-lg p-2" title="Close assignment"><XCircle className="h-4 w-4" /></button>}
                  </div>
                )
              }
            ]}
          />
        ) : (
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center">
            <p className="text-sm font-semibold text-[#6b7280]">You do not have permission to view assignments.</p>
            <p className="mt-1 text-xs text-[#9ca3af]">Ask your admin to grant the <code className="font-mono bg-gray-100 px-1 rounded">assignments.read</code> permission.</p>
          </div>
        )
      )}


      {!loading && tab === 'finished-goods' && (
        canReadAssignment ? (
          <AdvancedDataTable
            data={filteredReturns}
            searchable={false}
            loading={loading}
            emptyIcon={<Package className="h-6 w-6 text-slate-400" />}
            emptyTitle="No goods returns found"
            columns={[
              {
                field: 'returnNo',
                header: 'Return',
                sortable: true,
                filterable: true,
                filterType: 'text',
                getValue: (row) => row.returnNo || row.id?.slice(0, 8),
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg">
                      <Package className="h-4 w-4" />
                    </div>
                    {row.returnNo || row.id?.slice(0, 8)}
                  </div>
                )
              },
              {
                field: 'worker',
                header: 'Worker',
                sortable: true,
                filterable: true,
                filterType: 'text',
                getValue: (row) => {
                  const wId = returnWorkerId(row);
                  const wObj = workers.find(w => w.id === wId) || row.worker || row.assignment?.worker;
                  return wObj?.name || row.workerName || wId || '-';
                },
                render: (row) => {
                  const wId = returnWorkerId(row);
                  const wObj = workers.find(w => w.id === wId) || row.worker || row.assignment?.worker;
                  const wName = wObj?.name || row.workerName || '-';
                  const wCode = workerCode(wObj || { id: wId });
                  return (
                    <div>
                      <p className="font-bold theme-text-primary">{wName}</p>
                      <p className="text-[11px] text-slate-500 uppercase">{wCode}</p>
                    </div>
                  );
                }
              },
              {
                field: 'design',
                header: 'Design',
                sortable: true,
                filterable: true,
                filterType: 'text',
                getValue: (row) => {
                  const dId = row.assignment?.designId || row.designId;
                  const designObj = designs.find(d => d.id === dId) || row.assignment?.design || row.design;
                  return designObj?.name || designObj?.designCode || designObj?.code || dId || '-';
                },
                render: (row) => {
                  const dId = row.assignment?.designId || row.designId;
                  const designObj = designs.find(d => d.id === dId) || row.assignment?.design || row.design;
                  const dName = designObj?.name || designObj?.designCode || designObj?.code || dId || '-';
                  const dCode = designObj?.designCode || designObj?.code || dId?.slice(0,8);
                  return (
                    <div>
                      <p className="font-bold theme-text-primary">{dName}</p>
                      <p className="text-[11px] text-slate-500 uppercase">{dCode}</p>
                    </div>
                  );
                }
              },
              {
                field: 'goodPieces',
                header: 'Good Qty',
                sortable: true,
                getValue: (row) => row.piecesReturned || 0,
                render: (row) => <div className="text-right font-semibold text-[#1a7a4a]">{row.piecesReturned || 0}</div>
              },
              {
                field: 'rejectedPieces',
                header: 'Rejected',
                sortable: true,
                getValue: (row) => row.piecesRejected || 0,
                render: (row) => <div className="text-right text-[#cc2200]">{row.piecesRejected || 0}</div>
              },
              {
                field: 'earned',
                header: 'Earned',
                sortable: true,
                getValue: (row) => (row.piecesReturned || 0) * (row.assignment?.design?.workerRate || 0),
                render: (row) => {
                  const earned = (row.piecesReturned || 0) * (row.assignment?.design?.workerRate || 0);
                  return <div className="text-right font-semibold theme-text-primary">{formatCurrency(earned)}</div>;
                }
              },
              {
                field: 'returnedAt',
                header: 'Date',
                sortable: true,
                filterable: true,
                filterType: 'date',
                getValue: (row) => row.returnDate || row.createdAt,
                render: (row) => <div className="text-right text-[#6b7280]">{prettyDate(row.returnDate || row.createdAt)}</div>
              }
            ]}
          />
        ) : (
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center">
            <p className="text-sm font-semibold text-[#6b7280]">You do not have permission to view goods returns.</p>
          </div>
        )
      )}

      {!loading && tab === 'payments' && (
        <AdvancedDataTable
          data={filteredPayments}
          searchable={false}
          loading={loading}
          emptyIcon={<Wallet className="h-6 w-6 text-slate-400" />}
          emptyTitle="No worker payments found"
          columns={[
            {
              field: 'paymentNo',
              header: 'Payment No',
              sortable: true,
              filterable: true,
              filterType: 'text',
              getValue: (row) => row.paymentNo || row.id?.slice(0, 8),
              render: (row) => (
                <div className="flex items-center gap-3">
                  <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg">
                    <Wallet className="h-4 w-4" />
                  </div>
                  {row.paymentNo || row.id?.slice(0, 8)}
                </div>
              )
            },
            {
              field: 'worker',
              header: 'Worker',
              sortable: true,
              filterable: true,
              filterType: 'text',
              getValue: (row) => {
                const wId = paymentWorkerId(row);
                const wObj = workers.find(w => w.id === wId) || row.worker;
                return wObj?.name || row.workerName || wId || '-';
              },
              render: (row) => {
                const wId = paymentWorkerId(row);
                const wObj = workers.find(w => w.id === wId) || row.worker;
                const wName = wObj?.name || row.workerName || '-';
                const wCode = workerCode(wObj || { id: wId });
                return (
                  <div>
                    <p className="font-bold theme-text-primary">{wName}</p>
                    <p className="text-[11px] text-slate-500 uppercase">{wCode}</p>
                  </div>
                );
              }
            },
            {
              field: 'amount',
              header: 'Amount',
              sortable: true,
              getValue: (row) => Number(row.amount || 0),
              render: (row) => <div className="font-bold text-[#1a7a4a]">{formatCurrency(Number(row.amount || 0))}</div>
            },
            {
              field: 'paymentType',
              header: 'Type',
              sortable: true,
              filterable: true,
              filterType: 'text',
              getValue: (row) => String(row.paymentType || '-').replace(/_/g, ' ').toLowerCase(),
              render: (row) => <div className="text-[#6b7280] capitalize">{String(row.paymentType || '-').replace(/_/g, ' ').toLowerCase()}</div>
            },
            {
              field: 'paymentMode',
              header: 'Method',
              sortable: true,
              filterable: true,
              filterType: 'text',
              getValue: (row) => String(row.paymentMode || row.method || row.paymentMethod || '-').replace(/_/g, ' ').toLowerCase(),
              render: (row) => <div className="text-[#6b7280] capitalize">{String(row.paymentMode || row.method || row.paymentMethod || '-').replace(/_/g, ' ').toLowerCase()}</div>
            },
            {
              field: 'paidAt',
              header: 'Date',
              sortable: true,
              filterable: true,
              filterType: 'date',
              getValue: (row) => row.paidAt || row.paymentDate || row.createdAt,
              render: (row) => <div className="text-right text-[#6b7280]">{prettyDate(row.paidAt || row.paymentDate || row.createdAt)}</div>
            }
          ]}
        />
      )}
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
          workers={workers}
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
          workers={workers}
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
          workers={workers}
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
    </DashboardLayout>
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
  ledger,
  onClose,
}: {
  worker: BackendRecord | null;
  ledger: BackendRecord | BackendRecord[] | null;
  onClose: () => void;
}) {
  const entries = ledgerEntries(ledger);
  const totals = ledgerTotals(ledger);
  // Worker detail summary from GET /workers/:id — preferred over computed totals
  const summary = worker?.summary;
  const isLoading = ledger === null;

  return (
    <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
      <div className="theme-modal-panel w-full max-w-3xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="text-xl font-bold theme-text-primary">Worker Ledger</h2>
            <p className="text-sm text-slate-500">{worker?.name || 'Worker'} — {worker?.city || worker?.phone || 'balance & ledger entries'}</p>
          </div>
          <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg px-3 py-2 text-sm font-semibold">
            Close
          </button>
        </div>
        {/* Summary cards: prefer GET /workers/:id summary, fall back to computed ledger totals */}
        <div className="grid gap-4 p-4 md:grid-cols-5">
          <Metric label="Opening Balance" value={formatCurrency(Math.abs(moneyNumber(worker?.openingBalance)))} />
          <Metric label="Total Earned" value={formatCurrency(moneyNumber(summary?.totalEarned) || Math.abs(totals.earned))} />
          <Metric label="Total Paid" value={formatCurrency(Math.abs(moneyNumber(summary?.totalPaid) || totals.paid))} valueClass="text-blue-600" />
          <Metric label="Advance Given" value={formatCurrency(Math.abs(moneyNumber(summary?.advanceGiven)))} />
          <Metric label="Outstanding" value={formatCurrency(Math.abs(moneyNumber(summary?.outstandingBalance) || totals.balance))} valueClass="text-red-600" />
        </div>
        <div className="max-h-[55vh] overflow-auto border-t border-slate-200">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading ledger entries…</div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No ledger entries found for this worker.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="theme-table-header">
                <tr>
                  {['Date', 'Type', 'Debit', 'Credit', 'Balance', 'Notes'].map(header => (
                    <th key={header} className="px-4 py-3 text-left">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry: BackendRecord, index: number) => (
                  <tr key={entry.id || index}>
                    {/* API ledger date field: date */}
                    <td className="px-4 py-3">{prettyDate(entry.date || entry.entryDate || entry.createdAt)}</td>
                    {/* API ledger type field: type */}
                    <td className="px-4 py-3 font-semibold">{entry.type || entry.entryType || '-'}</td>
                    {/* API ledger debit field: debit */}
                    <td className="px-4 py-3 text-red-600">{formatCurrency(Number(entry.debit || entry.debitAmount || 0))}</td>
                    {/* API ledger credit field: credit */}
                    <td className="px-4 py-3 text-green-700">{formatCurrency(Number(entry.credit || entry.creditAmount || 0))}</td>
                    {/* API ledger balance field: runningBalance */}
                    <td className="px-4 py-3 font-semibold">{formatCurrency(Number(entry.runningBalance || entry.balance || 0))}</td>
                    {/* API ledger description field: description */}
                    <td className="px-4 py-3 text-slate-500">{entry.description || entry.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
