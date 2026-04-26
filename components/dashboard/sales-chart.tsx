'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { month: 'Jan', sales: 65000 },
  { month: 'Feb', sales: 78000 },
  { month: 'Mar', sales: 85000 },
  { month: 'Apr', sales: 92000 },
  { month: 'May', sales: 88000 },
  { month: 'Jun', sales: 105000 },
  { month: 'Jul', sales: 125000 },
  { month: 'Aug', sales: 118000 },
  { month: 'Sep', sales: 132000 },
  { month: 'Oct', sales: 145000 },
  { month: 'Nov', sales: 155000 },
  { month: 'Dec', sales: 175000 },
];

export function SalesChart() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Sales Trend</CardTitle>
        <p className="text-sm text-muted-foreground">Monthly revenue overview</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="var(--color-muted-foreground)"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
              }}
              formatter={(value: any) => `₹${(value / 1000).toFixed(0)}K`}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSales)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
