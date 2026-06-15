'use client';

import React from 'react';
import { SkeletonTable } from '@/components/skeleton/Skeletons';
import { SearchInput } from '@/components/shared/search-input';
import { useRawMaterials } from '../raw-materials-context';
import { IssuancesTable } from '../raw-materials-components';

export default function StockOutPage() {
  const {
    issuances, types, loading, pagination, page, setPage,
    search, setSearch,
    usageFilter, setUsageFilter,
    usageDateFilter, setUsageDateFilter,
  } = useRawMaterials();

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex w-full sm:max-w-sm">
          <SearchInput
            containerClassName="w-full"
            inputClassName="border-slate-200 bg-slate-50/50"
            placeholder="Search material usage..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap gap-2 pb-1 hide-scrollbar">
          <select value={usageFilter} onChange={e => setUsageFilter(e.target.value as any)} className="h-10 rounded-lg text-sm font-semibold border-slate-200 bg-white">
            <option value="ALL">All Usage</option>
            <option value="PENDING">Pending</option>
            <option value="ISSUED">Issued</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select value={usageDateFilter} onChange={e => setUsageDateFilter(e.target.value as any)} className="h-10 rounded-lg text-sm font-semibold border-slate-200 bg-white">
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
          </select>
        </div>
      </div>

      <div className="theme-surface-card overflow-hidden">
        {loading && issuances.length === 0 ? (
          <div className="p-4"><SkeletonTable rows={6} cols={6} /></div>
        ) : (
          <IssuancesTable
            issuances={issuances}
            types={types}
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
