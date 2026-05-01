'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { mockRawMaterials } from '@/lib/data';
import { formatCurrency, formatDate } from '@/lib/constants';
import { Plus, AlertTriangle, TrendingDown, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { normalizeRole } from '@/lib/roles';

export default function RawMaterialsPage() {
  const { role } = useAuth();
  const roleKey = normalizeRole(role);
  const canEdit = roleKey === 'owner' || roleKey === 'manager';

  return (
    <DashboardLayout
      title="Raw Materials"
      subtitle="Track material stock, suppliers, and reordering"
      action={
        canEdit ? (
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg theme-accent-btn text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            Add Material
          </button>
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {mockRawMaterials.map(material => {
          const isLow = material.currentStock < material.threshold;
          const stockPercentage = (material.currentStock / material.threshold) * 100;

          return (
            <div key={material.id} className={`bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden flex ${isLow ? 'border-l-4 border-l-theme-status-critical' : 'theme-card-accent'}`}>
              <div className="flex-1 p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded bg-[#f3f4f6] text-[11px] font-semibold text-[#6b7280] mb-1.5">
                      {material.code}
                    </span>
                    <h3 className="text-[18px] font-bold theme-text-primary leading-tight">{material.type}</h3>
                    <p className="text-sm text-[#6b7280] mt-1">Supplier: {material.supplier}</p>
                  </div>
                  {isLow ? (
                     <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fff0f0] text-[#cc2200]">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs theme-badge-soft">
                        ✓ Adequate
                      </span>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-[#f3f4f6] mb-4" />

                {/* Stock Info */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">Current Stock</p>
                    <p className="text-[15px] font-bold theme-text-primary">
                      {material.currentStock} <span className="text-sm font-medium text-[#6b7280]">{material.unitType}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">Threshold</p>
                    <p className="text-[15px] font-bold theme-text-primary">
                      {material.threshold} <span className="text-sm font-medium text-[#6b7280]">{material.unitType}</span>
                    </p>
                  </div>
                </div>

                {/* Stock Bar */}
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <p className="text-[11px] text-[#9ca3af]">Stock Level</p>
                    <p className="text-[11px] font-semibold text-[#374151]">
                      {Math.round(stockPercentage)}%
                    </p>
                  </div>
                  <div className="h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isLow ? 'bg-[#cc2200]' : 'bg-[#1a7a4a]'}`}
                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Cost and Last Restock */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[#f3f4f6] pt-4 mb-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">Cost / Unit</p>
                    <p className="text-[14px] font-semibold theme-text-primary">{formatCurrency(material.costPerUnit)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">Last Restock</p>
                    <p className="text-[14px] text-[#6b7280]">{formatDate(material.lastRestockDate)}</p>
                  </div>
                </div>

                {/* Action */}
                <button className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  isLow ? 'border-[#cc2200]/20 text-[#cc2200] bg-[#fff0f0] hover:bg-[#ffe5e5]' : 'border-[#e5e7eb] text-[#374151] bg-white hover:bg-[#f9fafb]'
                }`}>
                  {isLow ? <AlertTriangle className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {isLow ? 'Reorder Urgently' : 'Update Stock'}
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
