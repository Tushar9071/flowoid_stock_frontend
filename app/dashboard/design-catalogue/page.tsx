'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Plus, Search, ChevronDown, Grid2X2, List } from 'lucide-react';
import { mockDesigns } from '@/lib/data';
import { designCategories, formatCurrency } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';

export default function DesignCataloguePage() {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const canEdit = role === 'owner' || role === 'manager';

  const filteredDesigns = mockDesigns.filter(design => {
    const matchesSearch = design.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         design.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || design.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout
      title="Design Catalogue"
      subtitle="Manage your jewelry designs, pricing, and status"
      action={
        canEdit ? (
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F2A4A] text-white text-sm font-semibold hover:bg-[#0A1E38] transition-colors">
            <Plus className="w-4 h-4" />
            Add Design
          </button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 flex gap-2 w-full sm:w-auto">
             <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
              <input
                type="text"
                placeholder="Search designs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] focus:bg-white focus:ring-2 focus:ring-[#0F2A4A]/10 focus:border-[#0F2A4A] outline-none transition-all"
              />
            </div>
            <button className="h-9 px-3 rounded-lg border border-[#e5e7eb] bg-white text-sm text-[#374151] flex items-center gap-1.5 hover:bg-[#f9fafb] transition-colors">
              Filter <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="flex gap-2 shrink-0">
             <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors border border-[#e5e7eb] ${
                viewMode === 'grid'
                  ? 'bg-[#0F2A4A] text-white border-[#0F2A4A]'
                  : 'bg-white text-[#6b7280] hover:text-[#0F2A4A]'
              }`}
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors border border-[#e5e7eb] ${
                viewMode === 'list'
                  ? 'bg-[#0F2A4A] text-white border-[#0F2A4A]'
                  : 'bg-white text-[#6b7280] hover:text-[#0F2A4A]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors border ${
              !selectedCategory
                ? 'bg-[#0F2A4A] text-white border-[#0F2A4A]'
                : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#0F2A4A]/30'
            }`}
          >
            All Categories
          </button>
          {designCategories.map(cat => (
             <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors border ${
                selectedCategory === cat.value
                  ? 'bg-[#0F2A4A] text-white border-[#0F2A4A]'
                  : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#0F2A4A]/30'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Designs Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredDesigns.map(design => (
              <div key={design.id} className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all cursor-pointer">
                {/* Image Placeholder */}
                <div className="h-40 bg-[#f0f2f5] flex items-center justify-center border-b border-[#e5e7eb]">
                  <div className="text-center">
                    <div className="text-4xl font-serif text-[#9ca3af] mb-2">✦</div>
                    <p className="text-[11px] uppercase tracking-wider text-[#6b7280] font-semibold">{design.category}</p>
                  </div>
                </div>
                <div className="p-5">
                   <div className="flex items-start justify-between mb-4">
                     <div>
                       <span className="inline-block px-2 py-0.5 rounded bg-[#f3f4f6] text-[11px] font-semibold text-[#6b7280] mb-1.5">
                         {design.code}
                       </span>
                       <h3 className="text-[16px] font-bold text-[#0F2A4A] leading-tight">{design.name}</h3>
                     </div>
                     <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        design.status === 'active' ? 'bg-[#e6f9f0] text-[#1a7a4a]' : 'bg-[#f3f4f6] text-[#6b7280]'
                      }`}>
                        {design.status.charAt(0).toUpperCase() + design.status.slice(1)}
                      </span>
                   </div>
                   
                   <div className="border-t border-[#f3f4f6] pt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">Piece Rate</p>
                        <p className="text-[14px] font-bold text-[#0F2A4A]">{formatCurrency(design.pieceRate)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">Dozen Rate</p>
                        <p className="text-[14px] font-bold text-[#0F2A4A]">{formatCurrency(design.salePricePerDozen)}</p>
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead>
                    <tr className="bg-[#f5f6fa] border-b border-[#e5e7eb]">
                       <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-left">Code</th>
                       <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-left">Name</th>
                       <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-left">Category</th>
                       <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-right">Piece Rate</th>
                       <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-right">Dozen Rate</th>
                       <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280] text-left">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[#f3f4f6]">
                    {filteredDesigns.map((design, idx) => (
                      <tr key={design.id} className={`transition-colors hover:bg-[#f0f4ff] cursor-pointer ${idx % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'}`}>
                        <td className="px-5 py-3.5 text-sm font-semibold text-[#0F2A4A]">{design.code}</td>
                        <td className="px-5 py-3.5 text-sm text-[#374151] font-medium">{design.name}</td>
                        <td className="px-5 py-3.5 text-sm text-[#6b7280] capitalize">{design.category}</td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-right text-[#0F2A4A]">{formatCurrency(design.pieceRate)}</td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-right text-[#0F2A4A]">{formatCurrency(design.salePricePerDozen)}</td>
                        <td className="px-5 py-3.5">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            design.status === 'active' ? 'bg-[#e6f9f0] text-[#1a7a4a]' : 'bg-[#f3f4f6] text-[#6b7280]'
                          }`}>
                            {design.status.charAt(0).toUpperCase() + design.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {filteredDesigns.length === 0 && (
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-12 text-center">
             <div className="w-16 h-16 bg-[#f0f2f5] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-[#6b7280]" />
            </div>
            <p className="text-[#0F2A4A] font-semibold text-lg mb-1">No designs found</p>
            <p className="text-sm text-[#6b7280]">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Summary */}
        <div className="flex items-center justify-between px-2 py-3">
          <p className="text-xs text-[#6b7280]">Showing {filteredDesigns.length} of {mockDesigns.length} designs</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
