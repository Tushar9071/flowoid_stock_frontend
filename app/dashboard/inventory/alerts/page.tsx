'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { SkeletonTable } from '@/components/skeleton/Skeletons';
import { AdvancedDataTable } from '@/components/shared/DataTable';
import { SearchInput } from '@/components/shared/search-input';
import { useInventory } from '../inventory-context';

export default function AlertsPage() {
  const { loading, filteredAlerts, search, setSearch } = useInventory();

  return (
    <div className="space-y-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          containerClassName="max-w-sm flex-1"
          inputClassName="h-9 rounded-lg border-[#e5e7eb] bg-[#f9fafb] focus:border-[#0F2A4A]"
          placeholder="Search alerts..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      {(loading.alerts || loading.rawStock) && <SkeletonTable rows={6} cols={5} />}
      {!loading.alerts && !loading.rawStock && (
        <AdvancedDataTable
          data={filteredAlerts}
          searchable={false}
          loading={loading.alerts || loading.rawStock}
          emptyIcon={<AlertTriangle className="h-6 w-6 text-slate-400" />}
          emptyTitle="No low stock alerts"
          emptySubtitle="All your items are well stocked!"
          columns={[
            { field: 'name', header: 'Item', sortable: true, filterable: true, filterType: 'text', render: (row) => <div className="font-semibold theme-text-primary">{row.name}</div> },
            { field: 'module', header: 'Module', sortable: true, filterable: true, filterType: 'text', render: (row) => <div className="text-[#6b7280]">{row.module}</div> },
            { field: 'current', header: 'Current', sortable: true, render: (row) => <div className="font-semibold">{row.current}</div> },
            { field: 'threshold', header: 'Threshold', sortable: true, render: (row) => <div className="text-[#6b7280]">{row.threshold}</div> },
            {
              field: 'status', header: 'Status', sortable: true,
              render: () => (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0f0] px-2.5 py-1 text-xs font-semibold text-[#cc2200]">
                  <AlertTriangle className="h-3 w-3" /> Low
                </span>
              )
            }
          ]}
        />
      )}
    </div>
  );
}
