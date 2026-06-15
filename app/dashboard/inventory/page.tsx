'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { SkeletonTable } from '@/components/skeleton/Skeletons';
import { AdvancedDataTable } from '@/components/shared/DataTable';
import { SearchInput } from '@/components/shared/search-input';
import { useInventory, designCode, designName, prettyDate } from './inventory-context';

export default function InventoryPage() {
  const {
    loading, filteredStock, canCreate,
    search, setSearch,
    openAdjustmentForm, viewStockByDesign,
  } = useInventory();

  return (
    <div className="space-y-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          containerClassName="max-w-sm flex-1"
          inputClassName="h-9 rounded-lg border-[#e5e7eb] bg-[#f9fafb] focus:border-[#0F2A4A]"
          placeholder="Search design..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      {loading.stock && <SkeletonTable rows={8} cols={6} />}
      {!loading.stock && (
        <AdvancedDataTable
          data={filteredStock}
          searchable={false}
          loading={loading.stock}
          emptyIcon={<Package className="h-6 w-6 text-slate-400" />}
          emptyTitle="No finished stock found"
          columns={[
            {
              field: 'designCode', header: 'Design Code', sortable: true, filterable: true, filterType: 'text',
              getValue: (row) => designCode(row),
              render: (row) => (
                <div className="flex items-center gap-3">
                  <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg"><Package className="h-4 w-4" /></div>
                  {designCode(row)}
                </div>
              )
            },
            { field: 'designName', header: 'Design Name', sortable: true, filterable: true, filterType: 'text', getValue: (row) => designName(row), render: (row) => <div className="font-bold text-[#374151]">{designName(row)}</div> },
            { field: 'unpackagedPieces', header: 'Unpackaged', sortable: true, getValue: (row) => row.unpackagedPieces || row.availablePieces || 0, render: (row) => <div className="text-center font-bold text-[#1a7a4a]">{row.unpackagedPieces || row.availablePieces || 0}</div> },
            { field: 'packagedDozens', header: 'Packaged', sortable: true, getValue: (row) => row.packagedDozens || row.availableDozens || 0, render: (row) => <div className="text-center font-semibold theme-text-primary">{row.packagedDozens || row.availableDozens || 0}</div> },
            { field: 'threshold', header: 'Threshold', sortable: true, getValue: (row) => row.lowStockThreshold || row.threshold || '-', render: (row) => <div className="text-center text-[#6b7280]">{row.lowStockThreshold || row.threshold || '-'}</div> },
            { field: 'updatedAt', header: 'Last Updated', sortable: true, filterable: true, filterType: 'date', getValue: (row) => row.updatedAt || row.lastUpdated, render: (row) => <div className="text-[#6b7280]">{prettyDate(row.updatedAt || row.lastUpdated)}</div> },
            {
              field: 'actions', header: 'Actions',
              render: (row) => (
                <div className="flex justify-end gap-2">
                  <button onClick={() => viewStockByDesign(row)} className="theme-secondary-btn rounded-lg px-3 py-1.5 text-xs font-semibold">View</button>
                  {canCreate && <button onClick={() => openAdjustmentForm(row)} className="theme-secondary-btn rounded-lg px-3 py-1.5 text-xs font-semibold">Adjust</button>}
                </div>
              )
            }
          ]}
        />
      )}
    </div>
  );
}
