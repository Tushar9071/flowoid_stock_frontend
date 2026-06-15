'use client';

import React from 'react';
import { Users, ClipboardList, Wallet, Edit3, Trash2, BookOpen } from 'lucide-react';
import { SkeletonTable } from '@/components/skeleton/Skeletons';
import { AdvancedDataTable } from '@/components/shared/DataTable';
import { formatCurrency } from '@/lib/constants';
import { useWorkerManagement, workerCode, workerEarned, workerPaid, workerOutstanding } from './worker-management-context';

function StatusPill({ active }: { active: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-[#e6f9f0] text-[#1a7a4a]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>{active ? 'Active' : 'Inactive'}</span>;
}

export default function WorkerListPage() {
  const {
    loading,
    filteredWorkers,
    assignments,
    goodsReturns,
    payments,
    canCreateAssignment,
    canCreatePayment,
    canUpdate,
    canDelete,
    viewLedger,
    openAssignmentForm,
    openPaymentForm,
    openWorkerForm,
    deleteWorker
  } = useWorkerManagement();

  if (loading) return <SkeletonTable rows={8} cols={7} />;

  return (
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
          render: (row: any) => (
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
          getValue: (row: any) => `${row.phone || ''} ${row.address || ''}`.trim() || '-',
          render: (row: any) => (
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
          getValue: (row: any) => assignments.filter((a: any) => a.workerId === row.id && a.status !== 'CLOSED' && a.status !== 'COMPLETED').length,
          render: (row: any) => {
            const activeCount = assignments.filter((a: any) => a.workerId === row.id && a.status !== 'CLOSED' && a.status !== 'COMPLETED').length;
            return <div className="text-center font-semibold theme-text-primary">{activeCount || '-'}</div>;
          }
        },
        {
          field: 'earned',
          header: 'Earned',
          sortable: true,
          getValue: (row: any) => workerEarned(row, assignments, goodsReturns),
          render: (row: any) => <div className="text-right font-semibold theme-text-primary">{formatCurrency(workerEarned(row, assignments, goodsReturns))}</div>
        },
        {
          field: 'financials',
          header: 'Paid / Outst.',
          sortable: true,
          getValue: (row: any) => workerPaid(row, payments) - workerOutstanding(row, assignments, goodsReturns, payments),
          render: (row: any) => {
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
          getValue: (row: any) => row.isActive !== false && row.status !== 'INACTIVE',
          render: (row: any) => <StatusPill active={row.isActive !== false && row.status !== 'INACTIVE'} />
        },
        {
          field: 'actions',
          header: 'Actions',
          render: (row: any) => (
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
  );
}
