import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      color: 'bg-blue-100 text-blue-600',
      trend: '+12.5%',
    },
    {
      title: 'Active Orders',
      value: activeOrders.toString(),
      icon: Package,
      color: 'bg-amber-100 text-amber-600',
      trend: '+3 today',
    },
    {
      title: 'Pending Payments',
      value: formatCurrency(pendingPayments),
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600',
      trend: '5 invoices',
    },
    {
      title: 'Low Stock Items',
      value: lowStockItems.toString(),
      icon: Package,
      color: 'bg-orange-100 text-orange-600',
      trend: 'Needs restock',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${kpi.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-2">{kpi.trend}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
