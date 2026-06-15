'use client';

import React from 'react';
import { SkeletonTable } from '@/components/skeleton/Skeletons';
import { SearchInput } from '@/components/shared/search-input';
import { useRawMaterials } from '../raw-materials-context';
import { PurchasesTable } from '../raw-materials-components';

export default function StockInPage() {
  const {
    purchases, types, suppliers, loading, pagination, page, setPage,
    search, setSearch,
    purchaseFilter, setPurchaseFilter,
    purchaseDateFilter, setPurchaseDateFilter,
    canUpdate, canDelete, canApprove,
    openPurchaseModal, deletePurchase, finalisePurchase,
  } = useRawMaterials();

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex w-full sm:max-w-sm">
          <SearchInput
            containerClassName="w-full"
            inputClassName="border-slate-200 bg-slate-50/50"
            placeholder="Search purchases..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap gap-2 pb-1 hide-scrollbar">
          <select value={purchaseFilter} onChange={e => setPurchaseFilter(e.target.value as any)} className="h-10 rounded-lg text-sm font-semibold border-slate-200 bg-white">
            <option value="ALL">All Purchases</option>
            <option value="DRAFT">Draft</option>
            <option value="FINAL">Stock Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select value={purchaseDateFilter} onChange={e => setPurchaseDateFilter(e.target.value as any)} className="h-10 rounded-lg text-sm font-semibold border-slate-200 bg-white">
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
          </select>
        </div>
      </div>

      <div className="theme-surface-card overflow-hidden">
        {loading && purchases.length === 0 ? (
          <div className="p-4"><SkeletonTable rows={6} cols={6} /></div>
        ) : (
          <PurchasesTable
            purchases={purchases}
            types={types}
            suppliers={suppliers}
            canUpdate={canUpdate}
            canDelete={canDelete}
            canApprove={canApprove}
            onEdit={openPurchaseModal}
            onDelete={deletePurchase}
            onFinalise={finalisePurchase}
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
