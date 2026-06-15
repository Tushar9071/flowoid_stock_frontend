'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { SkeletonCard } from '@/components/skeleton/Skeletons';
import { AdvancedDataTable } from '@/components/shared/DataTable';
import { SearchInput } from '@/components/shared/search-input';
import { useInventory, designName, prettyDate } from '../inventory-context';

export default function PackagingPage() {
  const { loading, filteredBatches, search, setSearch } = useInventory();

  return (
    <div className="space-y-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          containerClassName="max-w-sm flex-1"
          inputClassName="h-9 rounded-lg border-[#e5e7eb] bg-[#f9fafb] focus:border-[#0F2A4A]"
          placeholder="Search batches..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      {loading.packagingBatches && <SkeletonCard count={6} />}
      {!loading.packagingBatches && (
        <AdvancedDataTable
          data={filteredBatches}
          searchable={false}
          loading={loading.packagingBatches}
          emptyIcon={<Layers className="h-6 w-6 text-slate-400" />}
          emptyTitle="No packaging batches found"
          columns={[
            {
              field: 'batchNo', header: 'Batch No', sortable: true, filterable: true, filterType: 'text',
              getValue: (row) => row.batchNo || row.id?.slice(0, 8),
              render: (row) => (
                <div className="flex items-center gap-3">
                  <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg"><Layers className="h-4 w-4" /></div>
                  {row.batchNo || row.id?.slice(0, 8)}
                </div>
              )
            },
            { field: 'design', header: 'Design', sortable: true, filterable: true, filterType: 'text', getValue: (row) => designName(row), render: (row) => <div className="font-bold theme-text-primary">{designName(row)}</div> },
            {
              field: 'unpackagedConsumed', header: 'Pieces Consumed', sortable: true,
              getValue: (row) => (row.quantity || 0) * (row.piecesPerUnit || 12),
              render: (row) => { const consumed = (row.quantity || 0) * (row.piecesPerUnit || 12); return <div className="text-center font-bold text-amber-600">{consumed}</div>; }
            },
            { field: 'dozensPackaged', header: 'Packaged (Dozens)', sortable: true, getValue: (row) => row.quantity || row.dozensPackaged || row.packagedDozens || row.dozenCount || 0, render: (row) => <div className="text-center font-bold text-[#1a7a4a]">{row.quantity || row.dozensPackaged || row.packagedDozens || row.dozenCount || 0} doz</div> },
            { field: 'createdAt', header: 'Date', sortable: true, filterable: true, filterType: 'date', getValue: (row) => row.createdAt || row.packagedAt, render: (row) => <div className="text-center text-[#6b7280]">{prettyDate(row.createdAt || row.packagedAt)}</div> }
          ]}
        />
      )}
    </div>
  );
}
