'use client';

import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface SalesDataPoint {
  month: string;
  sales: number;
}

/** Read the computed value of a CSS variable from the document body. */
function getCSSVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.body).getPropertyValue(name).trim();
  return value || fallback;
}

export function SalesChart({ data = [] }: { data?: SalesDataPoint[] }) {
  // Chart stroke color tracked so it reacts when theme changes
  const [chartColor, setChartColor] = useState('#0F2A4A');

  useEffect(() => {
    const sync = () => {
      setChartColor(getCSSVar('--color-chart-fill', '#0F2A4A'));
    };

    // Initial read
    sync();

    // Re-read on theme class mutation on <body>
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-[18px] font-bold text-[#0F2A4A]">Sales Trend</h3>
        <p className="text-sm text-[#6b7280] mt-1">Monthly revenue overview for the current year</p>
      </div>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#9ca3af"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value: any) => [`₹${(value / 1000).toFixed(0)}K`, 'Sales']}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke={chartColor}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSales)"
              isAnimationActive={true}
              animationDuration={2000}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
