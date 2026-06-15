'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { SkeletonForm } from '@/components/skeleton/Skeletons';
import { AdvancedDataTable } from '@/components/shared/DataTable';
import { SearchInput } from '@/components/shared/search-input';
import { useInventory, prettyDate } from '../inventory-context';

function StatusPill({ active }: { active: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-[#e6f9f0] text-[#1a7a4a]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>{active ? 'Active' : 'Inactive'}</span>;
}

export default function SupplementaryPage() {
  const { loading, filteredSupplementary, search, setSearch } = useInventory();

  return (
    <div className="space-y-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          containerClassName="max-w-sm flex-1"
          inputClassName="h-9 rounded-lg border-[#e5e7eb] bg-[#f9fafb] focus:border-[#0F2A4A]"
          placeholder="Search supplementary stock..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      {loading.supplementary && <SkeletonForm fields={4} />}
      {!loading.supplementary && (
        <AdvancedDataTable
          data={filteredSupplementary}
          searchable={false}
          loading={loading.supplementary}
          emptyIcon={<Plus className="h-6 w-6 text-slate-400" />}
          emptyTitle="No supplementary stock found"
          columns={[
            {
              field: 'name', header: 'Item', sortable: true, filterable: true, filterType: 'text',
              getValue: (row) => row.name || '-',
              render: (row) => (
                <div className="flex items-center gap-3">
                  <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg"><Plus className="h-4 w-4" /></div>
                  {row.name || '-'}
                </div>
              )
            },
            { field: 'unit', header: 'Unit', sortable: true, filterable: true, filterType: 'text', getValue: (row) => row.unit || '-', render: (row) => <div className="text-[#6b7280]">{row.unit || '-'}</div> },
            {
              field: 'quantity', header: 'Current Stock', sortable: true,
              getValue: (row) => row.quantity ?? row.currentStock ?? (typeof row.stock === 'object' ? row.stock?.quantityAvailable ?? row.stock?.quantity ?? 0 : row.stock) ?? row.availablePieces ?? 0,
              render: (row) => {
                const qty = row.quantity ?? row.currentStock ?? (typeof row.stock === 'object' ? row.stock?.quantityAvailable ?? row.stock?.quantity ?? 0 : row.stock) ?? row.availablePieces ?? 0;
                return <div className="text-center font-bold text-[#1a7a4a]">{qty}</div>;
              }
            },
            { field: 'status', header: 'Status', sortable: true, filterable: true, filterType: 'boolean', getValue: (row) => row.isActive !== false, render: (row) => <StatusPill active={row.isActive !== false} /> },
            { field: 'updatedAt', header: 'Updated', sortable: true, filterable: true, filterType: 'date', getValue: (row) => row.updatedAt || row.createdAt, render: (row) => <div className="text-center text-[#6b7280]">{prettyDate(row.updatedAt || row.createdAt)}</div> }
          ]}
        />
      )}
    </div>
  );
}
