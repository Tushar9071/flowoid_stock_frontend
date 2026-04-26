'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';

const salesData = [
  { month: 'Jan', sales: 65000, orders: 8 },
  { month: 'Feb', sales: 78000, orders: 10 },
  { month: 'Mar', sales: 85000, orders: 12 },
  { month: 'Apr', sales: 92000, orders: 14 },
  { month: 'May', sales: 88000, orders: 11 },
  { month: 'Jun', sales: 105000, orders: 16 },
];

const inventoryData = [
  { design: 'D001', current: 120, threshold: 50, status: 'good' },
  { design: 'D002', current: 30, threshold: 60, status: 'low' },
  { design: 'D003', current: 45, threshold: 40, status: 'good' },
];

const workerData = [
  { name: 'Suresh', assignments: 5, completion: 95, rejection: 2 },
  { name: 'Neha', assignments: 4, completion: 98, rejection: 1 },
  { name: 'Arjun', assignments: 3, completion: 90, rejection: 3 },
  { name: 'Meera', assignments: 5, completion: 96, rejection: 2 },
];

export default function ReportsPage() {
  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="space-y-8">
        {/* Quick Download Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Sales Report
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Inventory Report
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Worker Performance
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Payment Ageing
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Design Analysis
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Dealer Performance
          </Button>
        </div>

        {/* Sales Report */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Sales & Orders Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="sales" fill="var(--color-primary)" name="Sales (₹)" />
                <Bar yAxisId="right" dataKey="orders" fill="var(--color-secondary)" name="Orders (Count)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inventory & Worker Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventory Status */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Inventory Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryData.map(item => (
                  <div key={item.design} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-text">{item.design}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.current}/{item.threshold}
                      </p>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.status === 'good' ? 'bg-success' : 'bg-danger'}`}
                        style={{ width: `${Math.min((item.current / item.threshold) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Worker Performance */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Worker Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workerData.map(worker => (
                  <div key={worker.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-text">{worker.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {worker.completion}% | {worker.rejection}% reject
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-2 bg-green-500 rounded-full overflow-hidden" style={{ width: `${worker.completion}%` }} />
                      <div className="h-2 bg-red-500 rounded-full" style={{ width: `${worker.rejection}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Total Sales (YTD)</p>
              <p className="text-3xl font-bold text-primary">₹7,13,000</p>
              <p className="text-xs text-success mt-2">+15% vs last year</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Avg Order Value</p>
              <p className="text-3xl font-bold text-primary">₹22,281</p>
              <p className="text-xs text-warning mt-2">↓ 8% vs last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Payment Collection Rate</p>
              <p className="text-3xl font-bold text-primary">87%</p>
              <p className="text-xs text-success mt-2">Improving trend</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
