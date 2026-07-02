'use client';

import React from 'react';
import { SkeletonTable } from '@/components/skeleton/Skeletons';
import { SearchInput } from '@/components/shared/search-input';
import { useRawMaterials } from '../raw-materials-context';
import { TypesTable } from '../raw-materials-components';

export default function MaterialListPage() {
  const {
    types, loading, pagination, page, setPage,
    search, setSearch,
    materialFilter, setMaterialFilter,
    canUpdate, canDelete,
    openTypeModal, deleteType, updateTypeStatus
  } = useRawMaterials();

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex w-full sm:max-w-sm">
          <SearchInput
            containerClassName="w-full"
            inputClassName="border-slate-200 bg-slate-50/50"
            placeholder="Search raw materials..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap gap-2 pb-1 hide-scrollbar">
          <select value={materialFilter} onChange={e => setMaterialFilter(e.target.value as any)} className="h-10 rounded-lg text-sm font-semibold border-slate-200 bg-white">
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className="theme-surface-card overflow-hidden">
        {loading && types.length === 0 ? (
          <div className="p-4"><SkeletonTable rows={6} cols={6} /></div>
        ) : (
          <TypesTable
            types={types}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={openTypeModal}
            onDelete={deleteType}
            onStatusChange={updateTypeStatus}
            loading={loading}
            page={page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
