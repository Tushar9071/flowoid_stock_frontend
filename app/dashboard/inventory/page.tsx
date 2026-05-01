'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AlertTriangle, Plus, Search, ChevronDown, Package, Layers } from 'lucide-react';
import { mockInventoryItems } from '@/lib/data';
import { formatDate } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import { isOwnerRole } from '@/lib/roles';
import { SkeletonCard, SkeletonForm, SkeletonTable } from '@/components/skeleton/Skeletons';

type Tab = 'unpackaged' | 'packaged' | 'packaging-form';

export default function InventoryPage() {
  const { role } = useAuth();
  const [tab, setTab] = useState<Tab>('unpackaged');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<typeof mockInventoryItems>([]);

  useEffect(() => {
    let isMounted = true;

    const loadInventory = async () => {
      setIsLoading(true);
      // Placeholder async flow until API integration.
      await new Promise(resolve => setTimeout(resolve, 700));
      if (!isMounted) return;
      setInventoryItems(mockInventoryItems);
      setIsLoading(false);
    };

    loadInventory();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = inventoryItems.filter(
    i =>
      i.designCode.toLowerCase().includes(search.toLowerCase()) ||
      i.designName.toLowerCase().includes(search.toLowerCase()),
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'unpackaged', label: 'Unpackaged Stock', icon: <Package className="w-4 h-4" /> },
    { id: 'packaged', label: 'Packaged Stock', icon: <Layers className="w-4 h-4" /> },
    { id: 'packaging-form', label: 'Packaging Form', icon: <Plus className="w-4 h-4" /> },
  ];

  const canEdit = isOwnerRole(role);

  return (
    <DashboardLayout
      title="Inventory Management"
      subtitle="Track unpackaged stock, packaged dozens, and packaging activity"
      action={
        canEdit ? (
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg theme-accent-btn text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            Add Stock
          </button>
        ) : undefined
      }
    >
      {/* Custom Tab Bar */}
      <div className="flex gap-1 p-1 bg-[#e5e7eb] rounded-xl mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              tab === t.id
                ? 'theme-tab-active'
                : 'theme-tab-inactive'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && tab === 'unpackaged' && <SkeletonTable rows={8} cols={6} />}
      {isLoading && tab === 'packaged' && <SkeletonCard count={6} />}
      {isLoading && tab === 'packaging-form' && <SkeletonForm fields={4} />}

      {/* Unpackaged Stock */}
      {!isLoading && tab === 'unpackaged' && (
        <div className="bg-white rounded-xl border border-[#e5e7eb] theme-card-accent overflow-hidden">
          {/* Table toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#e5e7eb]">
            <p className="text-sm font-semibold theme-text-primary">{filtered.length} items</p>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search design..."
                  className="w-full sm:w-56 h-9 pl-9 pr-3 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] focus:bg-white focus:ring-2 focus:ring-[#0F2A4A]/10 focus:border-[#0F2A4A] outline-none transition-all"
                />
              </div>
              <button className="h-9 px-3 rounded-lg border border-[#e5e7eb] bg-white text-sm text-[#374151] flex items-center gap-1.5 hover:bg-[#f9fafb] transition-colors">
                Filter <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f5f6fa] border-b border-[#e5e7eb]">
                  {['Design Code', 'Design Name', 'Pieces', 'Threshold', 'Status', 'Last Updated'].map(h => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] whitespace-nowrap ${
                        h === 'Pieces' || h === 'Threshold' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {filtered.map((item, idx) => {
                  const isLow = item.unpackagedPieces < item.lowStockThreshold;
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-[#f0f4ff] ${idx % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'}`}
                    >
                      <td className="px-5 py-3.5 text-sm font-semibold theme-text-primary">{item.designCode}</td>
                      <td className="px-5 py-3.5 text-sm text-[#374151]">{item.designName}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-right theme-text-primary">{item.unpackagedPieces}</td>
                      <td className="px-5 py-3.5 text-sm text-right text-[#6b7280]">{item.lowStockThreshold}</td>
                      <td className="px-5 py-3.5">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fff0f0] text-[#cc2200]">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs theme-badge-soft">
                            ✓ In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#6b7280]">{formatDate(item.lastUpdated)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination placeholder */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-[#e5e7eb] bg-[#fafafa]">
            <p className="text-xs text-[#6b7280]">Showing {filtered.length} of {inventoryItems.length} records</p>
            <div className="flex gap-1">
              {[1].map(p => (
                <button key={p} className="w-8 h-8 rounded-lg bg-[#0F2A4A] text-white text-xs font-semibold">{p}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Packaged Stock */}
      {!isLoading && tab === 'packaged' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {inventoryItems.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-[#e5e7eb] theme-card-accent p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-[#6b7280] uppercase tracking-wide">{item.designCode}</p>
                  <p className="font-semibold theme-text-primary mt-0.5">{item.designName}</p>
                </div>
                <div className="p-2 rounded-lg bg-[#f0f2f5]">
                  <Layers className="w-4 h-4 theme-text-primary" />
                </div>
              </div>
              <div className="flex items-end justify-between border-t border-[#f3f4f6] pt-3 mt-3">
                <div>
                  <p className="text-[11px] text-[#6b7280] uppercase tracking-wide mb-0.5">Packaged</p>
                  <p className="text-3xl font-bold theme-text-primary">{item.packagedDozens}<span className="text-base font-medium text-[#6b7280] ml-1">doz</span></p>
                </div>
                <p className="text-sm text-[#6b7280]">= {item.packagedDozens * 12} pcs</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Packaging Form */}
      {!isLoading && tab === 'packaging-form' && (
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-[#f0f2f5] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-7 h-7 text-[#6b7280]" />
          </div>
          <p className="text-[#0F2A4A] font-semibold text-lg mb-1">No Packaging Forms</p>
          <p className="text-sm text-[#6b7280] mb-6">Create a form to record packaging activity.</p>
          {canEdit && (
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg theme-accent-btn text-sm font-semibold">
              <Plus className="w-4 h-4" /> Create Packaging
            </button>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
