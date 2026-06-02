import React from 'react';
import { formatCurrency } from '@/lib/constants';
import { TrendingUp, AlertCircle, Package, Users } from 'lucide-react';

interface KPICardsProps {
  totalSales: number;
  activeOrders: number;
  pendingPayments: number;
  lowStockItems: number;
}

export function KPICards({
  totalSales,
  activeOrders,
  pendingPayments,
  lowStockItems,
}: KPICardsProps) {
  const kpis = [
    {
      title: 'Total Sales (This Month)',
      value: formatCurrency(totalSales),
      icon: TrendingUp,
      color: 'bg-[#e0f2fe] text-[#0284c7]',
      trend: '+12.5%',
      accentBorder: true,
    },
    {
      title: 'Active Orders',
      value: activeOrders.toString(),
      icon: Package,
      color: 'bg-[#fffbeb] text-[#d97706]',
      trend: '+3 today',
      accentBorder: true,
    },
    {
      title: 'Pending Payments',
      value: formatCurrency(pendingPayments),
      icon: AlertCircle,
      color: 'bg-[#fff0f0] text-[#cc2200]',
      trend: '5 invoices',
      accentBorder: false,
    },
    {
      title: 'Low Stock Items',
      value: lowStockItems.toString(),
      icon: Package,
      color: 'bg-[#f3f4f6] text-[#6b7280]',
      trend: 'Needs restock',
      accentBorder: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6"
            style={
              kpi.accentBorder
                ? {
                    borderTop: '3px solid var(--color-accent)',
                  }
                : undefined
            }
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                {kpi.title}
              </p>
              <div className={`p-2 rounded-lg ${kpi.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black theme-text-primary leading-none mb-2">{kpi.value}</p>
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--color-accent)' }}
              >
                {kpi.trend}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
