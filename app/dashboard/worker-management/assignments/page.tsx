'use client';

import React from 'react';
import { ClipboardList, PlayCircle, Edit3, RotateCcw, XCircle } from 'lucide-react';
import { SkeletonTable } from '@/components/skeleton/Skeletons';
import { AdvancedDataTable } from '@/components/shared/DataTable';
import { useWorkerManagement, workerCode, designLabel, prettyDate } from '../worker-management-context';

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
    markInProgress,
    openAssignmentForm,
    openReturnForm,
    openCloseForm,
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
            const matId = row.items?.[0]?.rawMaterialId;
            const material = rawMaterials.find((m: any) => m.id === matId);
            const designObj = designs.find((d: any) => d.id === row.designId) || row.design;
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
          render: (row: any) => <div className="text-right font-semibold">{row.items?.[0]?.quantityIssued || '-'}</div>
        },
        {
          field: 'returnedPieces',
          header: 'Returned Pcs',
          sortable: true,
          getValue: (row: any) => row.returns?.reduce((acc: number, r: any) => acc + (r.piecesReturned || 0), 0) || 0,
          render: (row: any) => {
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
          getValue: (row: any) => row.assignmentDate || row.createdAt,
          render: (row: any) => <span className="text-[#6b7280]">{prettyDate(row.assignmentDate || row.createdAt)}</span>
        },
        {
          field: 'status',
          header: 'Status',
          sortable: true,
          filterable: true,
          filterType: 'text',
          getValue: (row: any) => row.status || 'ISSUED',
          render: (row: any) => <TextPill text={row.status || 'ISSUED'} />
        },
        {
          field: 'actions',
          header: 'Actions',
          render: (row: any) => (
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
  );
}
