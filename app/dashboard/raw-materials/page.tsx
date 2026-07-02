'use client';

import React from 'react';
import { SkeletonCard } from '@/components/skeleton/Skeletons';
import { SearchInput } from '@/components/shared/search-input';
import { useRawMaterials } from './raw-materials-context';
import { StockGrid } from './raw-materials-components';

export default function RawMaterialsStockPage() {
  const {
    loading, filteredStock, stock,
    search, setSearch,
    stockFilter, setStockFilter,
  } = useRawMaterials();

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex w-full sm:max-w-sm">
          <SearchInput
            containerClassName="w-full"
            inputClassName="border-slate-200 bg-slate-50/50"
            placeholder="Search stock by material name or code..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap gap-2 pb-1 hide-scrollbar items-center">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginRight: '8px', borderRight: '1px solid #E5E7EB', paddingRight: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Status</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '18px', height: '12px', background: '#059669', transform: 'rotate(-3deg)', clipPath: 'polygon(4px 0%, 100% 0%, 100% 100%, 4px 100%, 0% 50%)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E3A8A' }}>Adequate</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '18px', height: '12px', background: '#D97706', transform: 'rotate(-3deg)', clipPath: 'polygon(4px 0%, 100% 0%, 100% 100%, 4px 100%, 0% 50%)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E3A8A' }}>Low Stock</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '18px', height: '12px', background: '#DC2626', transform: 'rotate(-3deg)', clipPath: 'polygon(4px 0%, 100% 0%, 100% 100%, 4px 100%, 0% 50%)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E3A8A' }}>Out of Stock</span>
            </div>
          </div>
          <select value={stockFilter} onChange={e => setStockFilter(e.target.value as any)} className="h-10 rounded-lg text-sm font-semibold border-slate-200 bg-white">
            <option value="ALL">All Materials</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="ADEQUATE">Adequate Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="theme-surface-card overflow-hidden">
        {loading && stock.length === 0 ? (
          <div className="p-4"><SkeletonCard count={4} /></div>
        ) : (
          <StockGrid stock={filteredStock} />
        )}
      </div>
    </div>
  );
}
