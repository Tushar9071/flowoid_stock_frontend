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
    search, setSearch, stockStatusFilter, setStockStatusFilter,
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
        <select
          value={stockStatusFilter}
          onChange={e => setStockStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm text-[#374151] focus:border-[#0F2A4A] focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]"
        >
          <option value="All">All Statuses</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {loading.stock && <SkeletonTable rows={8} cols={7} />}
      {!loading.stock && (
        <AdvancedDataTable
          data={filteredStock}
          searchable={false}
          loading={loading.stock}
          emptyIcon={<Package className="h-6 w-6 text-slate-400" />}
          emptyTitle="No finished stock found"
          columns={[
            {
              field: 'designCode', header: 'Design', sortable: true, filterable: true, filterType: 'text',
              getValue: (row) => designCode(row),
              render: (row) => (
                <div className="flex items-center gap-3">
                  <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg"><Package className="h-4 w-4" /></div>
                  <div>
                    <div className="font-bold text-[#374151]">{designCode(row)}</div>
                    <div className="text-xs text-[#6b7280]">{designName(row)}</div>
                  </div>
                </div>
              )
            },
            { field: 'unpackagedPieces', header: 'Unpackaged (Dozens)', sortable: true, getValue: (row) => Math.floor((row.unpackagedPieces || row.availablePieces || 0) / 12), render: (row) => <div className="text-center font-bold text-[#1a7a4a]">{Math.floor((row.unpackagedPieces || row.availablePieces || 0) / 12)}</div> },
            { field: 'packagedDozens', header: 'Packaged', sortable: true, getValue: (row) => row.packagedDozens || 0, render: (row) => <div className="text-center font-semibold theme-text-primary">{row.packagedDozens || 0}</div> },
            { field: 'availableDozens', header: 'Available Stock', sortable: true, getValue: (row) => row.availableDozens || 0, render: (row) => <div className="text-center font-semibold theme-text-primary">{row.availableDozens || 0}</div> },
            { field: 'threshold', header: 'Threshold', sortable: true, getValue: (row) => row.lowStockThreshold || row.threshold || 10, render: (row) => <div className="text-center text-[#6b7280]">{row.lowStockThreshold || row.threshold || 10}</div> },
            {
              field: 'status', header: 'Status', sortable: true,
              getValue: (row) => {
                const available = row.availableDozens || 0;
                const threshold = row.lowStockThreshold || row.threshold || 10;
                if (available <= 0) return 'Out of Stock';
                if (available <= threshold) return 'Low Stock';
                return 'In Stock';
              },
              render: (row) => {
                const available = row.availableDozens || 0;
                const threshold = row.lowStockThreshold || row.threshold || 10;
                let status = '🟢 In Stock';
                let colorClass = 'text-green-600';
                if (available <= 0) {
                  status = '🔴 Out of Stock';
                  colorClass = 'text-red-600';
                } else if (available <= threshold) {
                  status = '🟡 Low Stock';
                  colorClass = 'text-yellow-600';
                }
                return <div className={`font-semibold ${colorClass}`}>{status}</div>;
              }
            }
          ]}
        />
      )}
    </div>
  );
}
