'use client';

import React from 'react';
import { ClipboardList, PlayCircle, Edit3, RotateCcw, XCircle, Trash2, Wallet } from 'lucide-react';
import { SkeletonTable } from '@/components/skeleton/Skeletons';

import { AdvancedDataTable } from '@/components/shared/DataTable';
import { useWorkerManagement } from '../worker-management-context';
import { workerCode, designLabel, prettyDate, assignmentFinancials, moneyNumber, parseAssignmentMetadata, computeAssignmentStatus } from '../worker-management-utils';

function TextPill({ text }: { text: string }) {
  return <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-xs font-semibold uppercase text-[#6b7280]">{text}</span>;
}

export default function AssignmentsPage() {
  const {
    loading,
    filteredAssignments,
    canReadAssignment,
    canUpdateAssignment,
    workers,
    designs,
    rawMaterials,
    payments,
    markInProgress,
    openAssignmentForm,
    openReturnForm,
    openCloseForm,
    openDropForm,
    openPaymentForm,
  } = useWorkerManagement();

  if (loading) return <SkeletonTable rows={8} cols={7} />;

  if (!canReadAssignment) {
    return (
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center">
        <p className="text-sm font-semibold text-[#6b7280]">You do not have permission to view assignments.</p>
        <p className="mt-1 text-xs text-[#9ca3af]">Ask your admin to grant the <code className="font-mono bg-gray-100 px-1 rounded">assignments.read</code> permission.</p>
      </div>
    );
  }

  return (
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
          getValue: (row: any) => {
            const workerObj = workers.find((w: any) => w.id === row.workerId) || row.worker;
            return workerObj?.name || row.workerName || row.workerId || '-';
          },
          render: (row: any) => {
            const workerObj = workers.find((w: any) => w.id === row.workerId) || row.worker;
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
          getValue: (row: any) => {
            const designObj = designs.find((d: any) => d.id === row.designId) || row.design;
            return designObj?.name || designObj?.designCode || designObj?.code || row.designId || '-';
          },
          render: (row: any) => {
            const materials = row.items?.map((item: any) => rawMaterials.find((m: any) => m.id === item.rawMaterialId)).filter(Boolean) || [];
            const designObj = designs.find((d: any) => d.id === row.designId) || row.design;
            const dName = designObj?.name || designObj?.designCode || designObj?.code || row.designId || '-';
            const dCode = designObj?.designCode || designObj?.code || row.designId?.slice(0,8);
            return (
              <div>
                <p className="font-bold theme-text-primary">{dName}</p>
                <p className="text-[11px] text-slate-500 uppercase">{dCode}</p>
                {materials.length > 0 && (
                  <p className="text-xs text-[#6b7280]">
                    {materials.length === 1 
                      ? `${materials[0].name} ${materials[0].unit ? `(${materials[0].unit})` : ''}`
                      : `${materials.length} Materials`}
                  </p>
                )}
              </div>
            );
          }
        },

        {
          field: 'returnedPieces',
          header: 'Acc / Ret / Exp',
          sortable: true,
          getValue: (row: any) => row.returns?.reduce((acc: number, r: any) => acc + (r.piecesReturned || 0), 0) || 0,
          render: (row: any) => {
            const accepted = row.returns?.reduce((acc: number, r: any) => acc + (r.piecesReturned || 0), 0) || 0;
            const rejected = row.returns?.reduce((acc: number, r: any) => acc + (r.piecesRejected || 0), 0) || 0;
            const totalReturned = accepted + rejected;
            const expected = row.expectedPieces || '-';
            return (
              <div className="text-right whitespace-nowrap">
                <span className="text-green-600 font-bold" title="Accepted Pieces">{accepted}</span>
                <span className="text-slate-400 text-xs mx-1">/</span>
                <span className="text-blue-600 font-bold" title="Total Returned (Accepted + Rejected)">{totalReturned}</span>
                <span className="text-slate-400 text-xs mx-1">/</span>
                <span className="text-slate-500 font-semibold" title="Expected Pieces">{expected}</span>
              </div>
            );
          }
        },
        {
          field: 'issuedAt',
          header: 'Issued At',
          sortable: true,
          filterable: true,
          filterType: 'date',
          getValue: (row: any) => row.assignmentDate || row.createdAt,
          render: (row: any) => <span className="text-[#6b7280]">{prettyDate(row.assignmentDate || row.createdAt)}</span>
        },
        {
          field: 'pieceRate',
          header: 'Piece Rate',
          sortable: true,
          getValue: (row: any) => parseAssignmentMetadata(row.notes).pieceRate,
          render: (row: any) => {
            const rate = parseAssignmentMetadata(row.notes).pieceRate;
            if (!rate) return <div className="text-right text-slate-400">-</div>;
            return <div className="text-right font-bold theme-text-primary">₹{rate.toLocaleString()}</div>;
          }
        },
        {
          field: 'status',
          header: 'Status',
          sortable: true,
          filterable: true,
          filterType: 'text',
          getValue: (row: any) => computeAssignmentStatus(row),
          render: (row: any) => <TextPill text={computeAssignmentStatus(row)} />
        },
        {
          field: 'actions',
          header: 'Actions',
          render: (row: any) => {
            const computedStatus = computeAssignmentStatus(row);
            const isIssued = computedStatus === 'ISSUED';
            const isInProgress = computedStatus === 'IN_PROGRESS';
            const isCompleted = computedStatus === 'COMPLETED';
            const isClosed = computedStatus === 'CLOSED';
            
            return (
              <div className="flex justify-end gap-2">
                {canUpdateAssignment && isIssued && (
                  <button
                    onClick={() => markInProgress(row)}
                    title="Mark in progress"
                    className="rounded-lg p-2 theme-secondary-btn"
                  >
                    <PlayCircle className="h-4 w-4" />
                  </button>
                )}
                {canUpdateAssignment && <button onClick={() => openAssignmentForm(row)} className="theme-secondary-btn rounded-lg p-2" title="Edit assignment"><Edit3 className="h-4 w-4" /></button>}
                {canUpdateAssignment && <button onClick={() => openPaymentForm(undefined, row)} className="theme-secondary-btn rounded-lg p-2" title="Record payment"><Wallet className="h-4 w-4" /></button>}
                {canUpdateAssignment && isInProgress && (
                  <button onClick={() => openReturnForm(row)} className="theme-secondary-btn rounded-lg p-2" title="Record goods return">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
                {canUpdateAssignment && !isClosed && (
                  <button onClick={() => openCloseForm(row)} className="theme-danger-btn rounded-lg p-2" title="Close assignment">
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
                {canUpdateAssignment && !isClosed && (
                  <button onClick={() => openDropForm(row)} className="theme-danger-btn rounded-lg p-2" title="Drop assignment (cancel & return material)">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          }
        }
      ]}
    />
  );
}
