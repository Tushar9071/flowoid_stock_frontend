'use client';

import React from 'react';
import { Wallet } from 'lucide-react';
import { SkeletonTable } from '@/components/skeleton/Skeletons';
import { AdvancedDataTable } from '@/components/shared/DataTable';
import { formatCurrency } from '@/lib/constants';
import { useWorkerManagement, workerCode, prettyDate, paymentWorkerId } from '../worker-management-context';

export default function PaymentsPage() {
  const {
    loading,
    filteredPayments,
    workers,
  } = useWorkerManagement();

  if (loading) return <SkeletonTable rows={8} cols={7} />;

  return (
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
          getValue: (row: any) => row.paymentNo || row.id?.slice(0, 8),
          render: (row: any) => (
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
          getValue: (row: any) => {
            const wId = paymentWorkerId(row);
            const wObj = workers.find((w: any) => w.id === wId) || row.worker;
            return wObj?.name || row.workerName || wId || '-';
          },
          render: (row: any) => {
            const wId = paymentWorkerId(row);
            const wObj = workers.find((w: any) => w.id === wId) || row.worker;
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
          getValue: (row: any) => Number(row.amount || 0),
          render: (row: any) => <div className="font-bold text-[#1a7a4a]">{formatCurrency(Number(row.amount || 0))}</div>
        },
        {
          field: 'paymentType',
          header: 'Type',
          sortable: true,
          filterable: true,
          filterType: 'text',
          getValue: (row: any) => String(row.paymentType || '-').replace(/_/g, ' ').toLowerCase(),
          render: (row: any) => <div className="text-[#6b7280] capitalize">{String(row.paymentType || '-').replace(/_/g, ' ').toLowerCase()}</div>
        },
        {
          field: 'paymentMode',
          header: 'Method',
          sortable: true,
          filterable: true,
          filterType: 'text',
          getValue: (row: any) => String(row.paymentMode || row.method || row.paymentMethod || '-').replace(/_/g, ' ').toLowerCase(),
          render: (row: any) => <div className="text-[#6b7280] capitalize">{String(row.paymentMode || row.method || row.paymentMethod || '-').replace(/_/g, ' ').toLowerCase()}</div>
        },
        {
          field: 'paidAt',
          header: 'Date',
          sortable: true,
          filterable: true,
          filterType: 'date',
          getValue: (row: any) => row.paidAt || row.paymentDate || row.createdAt,
          render: (row: any) => <div className="text-right text-[#6b7280]">{prettyDate(row.paidAt || row.paymentDate || row.createdAt)}</div>
        }
      ]}
    />
  );
}
