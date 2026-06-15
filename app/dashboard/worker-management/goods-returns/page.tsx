'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { SkeletonTable } from '@/components/skeleton/Skeletons';
import { AdvancedDataTable } from '@/components/shared/DataTable';
import { formatCurrency } from '@/lib/constants';
import { useWorkerManagement, workerCode, designLabel, prettyDate, returnWorkerId } from '../worker-management-context';

export default function GoodsReturnsPage() {
  const {
    loading,
    filteredReturns,
    canReadAssignment,
    workers,
    designs,
  } = useWorkerManagement();

  if (loading) return <SkeletonTable rows={8} cols={7} />;

  if (!canReadAssignment) {
    return (
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center">
        <p className="text-sm font-semibold text-[#6b7280]">You do not have permission to view goods returns.</p>
      </div>
    );
  }

  return (
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
          getValue: (row: any) => row.returnNo || row.id?.slice(0, 8),
          render: (row: any) => (
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
          getValue: (row: any) => {
            const wId = returnWorkerId(row);
            const wObj = workers.find((w: any) => w.id === wId) || row.worker || row.assignment?.worker;
            return wObj?.name || row.workerName || wId || '-';
          },
          render: (row: any) => {
            const wId = returnWorkerId(row);
            const wObj = workers.find((w: any) => w.id === wId) || row.worker || row.assignment?.worker;
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
          getValue: (row: any) => {
            const dId = row.assignment?.designId || row.designId;
            const designObj = designs.find((d: any) => d.id === dId) || row.assignment?.design || row.design;
            return designObj?.name || designObj?.designCode || designObj?.code || dId || '-';
          },
          render: (row: any) => {
            const dId = row.assignment?.designId || row.designId;
            const designObj = designs.find((d: any) => d.id === dId) || row.assignment?.design || row.design;
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
          getValue: (row: any) => row.piecesReturned || 0,
          render: (row: any) => <div className="text-right font-semibold text-[#1a7a4a]">{row.piecesReturned || 0}</div>
        },
        {
          field: 'rejectedPieces',
          header: 'Rejected',
          sortable: true,
          getValue: (row: any) => row.piecesRejected || 0,
          render: (row: any) => <div className="text-right text-[#cc2200]">{row.piecesRejected || 0}</div>
        },
        {
          field: 'earned',
          header: 'Earned',
          sortable: true,
          getValue: (row: any) => (row.piecesReturned || 0) * (row.assignment?.design?.workerRate || 0),
          render: (row: any) => {
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
          getValue: (row: any) => row.returnDate || row.createdAt,
          render: (row: any) => <div className="text-right text-[#6b7280]">{prettyDate(row.returnDate || row.createdAt)}</div>
        }
      ]}
    />
  );
}
