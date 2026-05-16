/**
 * DataTable — reusable table shell matching the Party Management page style.
 *
 * Usage:
 *   <DataTable
 *     headers={['Name', 'Status', 'Actions']}
 *     rows={items}
 *     loading={loading}
 *     page={page}
 *     totalPages={totalPages}
 *     totalItems={totalItems}
 *     onPageChange={setPage}
 *     emptyIcon={<Users className="h-7 w-7" />}
 *     emptyTitle="No workers found"
 *     emptySubtitle="Add a worker or adjust your filters."
 *   >
 *     {items.map(item => (
 *       <tr key={item.id} className="theme-table-row">…</tr>
 *     ))}
 *   </DataTable>
 */
'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SkeletonTable } from '@/components/skeleton/Skeletons';

interface DataTableProps {
  /** Column header labels */
  headers: string[];
  /** Whether data is currently loading */
  loading?: boolean;
  /** Current page number (1-indexed) */
  page?: number;
  /** Total number of pages */
  totalPages?: number;
  /** Total number of records across all pages */
  totalItems?: number;
  /** Called when the user navigates to a different page */
  onPageChange?: (page: number) => void;
  /** Icon shown in the empty state */
  emptyIcon?: React.ReactNode;
  /** Primary text for the empty state */
  emptyTitle?: string;
  /** Secondary text for the empty state */
  emptySubtitle?: string;
  /** Number of skeleton rows to show while loading */
  skeletonRows?: number;
  /** The <tr> elements to render inside <tbody> */
  children?: React.ReactNode;
  /** Extra className for the outer card wrapper */
  className?: string;
}

export function DataTable({
  headers,
  loading = false,
  page = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
  emptyIcon,
  emptyTitle = 'No records found',
  emptySubtitle = 'Try adjusting your filters.',
  skeletonRows = 6,
  children,
  className = '',
}: DataTableProps) {
  const isEmpty = !loading && React.Children.count(children) === 0;

  return (
    <div className={`theme-surface-card overflow-hidden ${className}`}>
      {/* Table body */}
      {loading ? (
        <div className="p-4">
          <SkeletonTable rows={skeletonRows} cols={headers.length} />
        </div>
      ) : isEmpty ? (
        <div className="p-12 text-center">
          {emptyIcon && (
            <div className="theme-icon-chip mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
              {emptyIcon}
            </div>
          )}
          <p className="text-lg font-bold theme-text-primary">{emptyTitle}</p>
          <p className="mt-1 text-sm text-slate-500">{emptySubtitle}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="theme-table-header">
              <tr>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 font-bold ${i === headers.length - 1 ? 'text-right' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">{children}</tbody>
          </table>
        </div>
      )}

      {/* Pagination footer — always visible */}
      {onPageChange && (
        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {loading
              ? 'Loading…'
              : `Page ${page} of ${Math.max(totalPages, 1)} · ${totalItems} total`}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange(page + 1)}
              className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
