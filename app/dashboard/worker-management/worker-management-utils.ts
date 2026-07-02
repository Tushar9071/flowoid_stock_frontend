import { BackendRecord } from '@/lib/services/business-modules.service';

export function prettyDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

export function workerCode(worker: BackendRecord) {
  return worker.code || worker.workerCode || worker.id?.slice(0, 8) || '-';
}

export function workerId(worker: BackendRecord) {
  return worker.id || worker.workerId;
}

export function computeAssignmentStatus(assignment: any): string {
  if (assignment.status === 'CLOSED') return 'CLOSED';
  
  const expected = Number(assignment.expectedPieces || 0);
  const returns = Array.isArray(assignment.returns) ? assignment.returns : [];
  
  let totalReturned = 0;
  returns.forEach((r: any) => {
    totalReturned += Number(r.piecesReturned || 0) + Number(r.piecesRejected || 0);
  });
  
  if (expected > 0 && totalReturned >= expected) {
    return 'COMPLETED';
  }
  
  if (assignment.status === 'IN_PROGRESS' || totalReturned > 0) {
    return 'IN_PROGRESS';
  }
  
  return assignment.status || 'ISSUED';
}

export function moneyNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

export function assignmentWorkerId(assignment: BackendRecord) {
  return assignment.workerId || assignment.worker?.id;
}

export function returnWorkerId(item: BackendRecord) {
  return item.workerId || item.worker?.id || item.assignment?.worker?.id || item.assignment?.workerId;
}

export function paymentWorkerId(payment: BackendRecord) {
  return payment.workerId || payment.worker?.id;
}

export function workerEarned(worker: BackendRecord, assignments: BackendRecord[]) {
  const direct = moneyNumber(worker.summary?.totalEarned || worker.totalEarned || worker.totalEarnings);
  if (direct) return direct;
  const id = workerId(worker);
  
  const fromAssignments = assignments
    .filter(assignment => assignmentWorkerId(assignment) === id)
    .reduce((sum, assignment) => {
      const meta = parseAssignmentMetadata(assignment.notes);
      const rate = meta.pieceRate;
      
      if (rate > 0) {
        const returns = Array.isArray(assignment.returns) ? assignment.returns : [];
        const totalGoodReturned = returns.reduce((acc: number, r: any) => acc + moneyNumber(r.piecesReturned || 0), 0);
        return moneyNumber(sum + (totalGoodReturned * rate));
      }
      
      // Legacy fallback
      return sum + meta.finalAmount;
    }, 0);
    
  return Math.round(fromAssignments * 100) / 100;
}

export function workerPaid(worker: BackendRecord, payments: BackendRecord[]) {
  const direct = moneyNumber(worker.summary?.totalPaid || worker.totalPaid);
  if (direct) return direct;
  const id = workerId(worker);
  // Total Paid should be EARNING payouts + ADVANCE_RECOVERY (since recovery settles earnings debt)
  const sum = payments
    .filter(payment => paymentWorkerId(payment) === id && (!payment.paymentType || payment.paymentType === 'EARNING' || payment.paymentType === 'ADVANCE_RECOVERY' || payment.paymentType === 'EARNING_SETTLEMENT'))
    .reduce((s, payment) => s + moneyNumber(payment.amount), 0);
  return Math.round(sum * 100) / 100;
}

export function workerAdvance(worker: BackendRecord, payments: BackendRecord[]) {
  // Advance Given = ADVANCE - ADVANCE_RECOVERY
  const id = workerId(worker);
  const sum = payments
    .filter(payment => paymentWorkerId(payment) === id)
    .reduce((s, payment) => {
      if (payment.paymentType === 'ADVANCE') return s + moneyNumber(payment.amount);
      if (payment.paymentType === 'ADVANCE_RECOVERY') return s - moneyNumber(payment.amount);
      return s;
    }, 0);
  return Math.round(sum * 100) / 100;
}

export function workerOutstanding(worker: BackendRecord, assignments: BackendRecord[], payments: BackendRecord[]) {
  const direct = moneyNumber(worker.summary?.outstandingBalance || worker.outstandingBalance || worker.balance || worker.currentBalance);
  if (direct) return direct;

  const opening = moneyNumber(worker.openingBalance);
  const signedOpening = worker.openingBalanceType === 'RECEIVABLE' ? -opening : opening;
  // Net Outstanding = (Opening + Earned) - Paid Earnings
  // (Note: we don't subtract advance here because Advance is a separate bucket of business asset, 
  // but wait, if outstanding is "What business owes worker", 
  // if business gives advance, does it reduce outstanding?
  // Let's compute NET outstanding: Earned - Paid - Advance
  const net = signedOpening + workerEarned(worker, assignments) - workerPaid(worker, payments) - workerAdvance(worker, payments);
  return Math.round(net * 100) / 100;
}

export function designLabel(record: BackendRecord) {
  return record.design?.designCode || record.design?.code || record.designCode || record.designId || '-';
}

export function ledgerEntries(ledger: BackendRecord | BackendRecord[] | null): BackendRecord[] {
  if (Array.isArray(ledger)) return ledger;
  if (!ledger) return [];
  const nested = ledger.entries || ledger.ledger || ledger.data || ledger.items;
  if (Array.isArray(nested)) return nested;
  return [];
}

export function ledgerTotals(ledger: BackendRecord | BackendRecord[] | null) {
  const entries = ledgerEntries(ledger);
  const earned = entries.reduce((sum, entry) => sum + moneyNumber(entry.credit || entry.creditAmount), 0);
  const paid = entries.reduce((sum, entry) => sum + moneyNumber(entry.debit || entry.debitAmount), 0);
  const balance = entries.length ? moneyNumber(entries[entries.length - 1].runningBalance || entries[entries.length - 1].balance) : 0;
  return {
    earned: moneyNumber(!Array.isArray(ledger) && (ledger?.summary?.totalEarned || ledger?.totalEarned)) || earned,
    paid: moneyNumber(!Array.isArray(ledger) && (ledger?.summary?.totalPaid || ledger?.totalPaid)) || paid,
    balance: moneyNumber(!Array.isArray(ledger) && (ledger?.summary?.outstandingBalance || ledger?.summary?.balance || ledger?.balance)) || balance,
  };
}

export function toIsoDate(value?: string) {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export function dateInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export function parseAssignmentMetadata(notes?: string | null) {
  if (!notes) return { text: '', estimatedAmount: 0, finalAmount: 0, dueDate: '', priority: 'Normal', pieceRate: 0 };
  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed === 'object' && ('estimatedAmount' in parsed || 'finalAmount' in parsed)) {
      return {
        text: parsed.text || '',
        estimatedAmount: Number(parsed.estimatedAmount || 0),
        finalAmount: Number(parsed.finalAmount || 0),
        dueDate: parsed.dueDate || '',
        priority: parsed.priority || 'Normal',
        pieceRate: Number(parsed.pieceRate || 0),
      };
    }
  } catch (e) {}
  return { text: notes, estimatedAmount: 0, finalAmount: 0, dueDate: '', priority: 'Normal', pieceRate: 0 };
}

export function assignmentFinancials(assignment: BackendRecord, payments: BackendRecord[]) {
  const meta = parseAssignmentMetadata(assignment.notes);
  const totalPaid = payments
    .filter(p => p.referenceNumber === assignment.id)
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    
  let calculatedFinal = meta.finalAmount;
  
  const rate = meta.pieceRate;
  if (rate > 0) {
    const returns = Array.isArray(assignment.returns) ? assignment.returns : [];
    const totalGoodReturned = returns.reduce((acc: number, r: any) => acc + Number(r.piecesReturned || 0), 0);
    calculatedFinal = totalGoodReturned * rate;
  }
    
  const remaining = calculatedFinal - totalPaid;
  let paymentStatus = 'Pending';
  if (totalPaid > 0 && remaining > 0) paymentStatus = 'Partially Paid';
  if (totalPaid >= calculatedFinal && calculatedFinal > 0) paymentStatus = 'Paid';
  return { estimated: meta.estimatedAmount, final: calculatedFinal, totalPaid, remaining, paymentStatus };
}
