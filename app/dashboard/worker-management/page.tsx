'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  mockWorkers,
  mockAssignments,
  mockFinishedGoods,
  mockWorkerPayments,
} from '@/lib/data';
import { formatCurrency, formatDate } from '@/lib/constants';
import { Search, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function WorkerManagementPage() {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const canDelete = role === 'owner';

  const filteredWorkers = mockWorkers.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Worker Management">
      <Tabs defaultValue="workers" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="workers">Worker List</TabsTrigger>
          <TabsTrigger value="assignments">Active Assignments</TabsTrigger>
          <TabsTrigger value="finished-goods">Finished Goods</TabsTrigger>
          <TabsTrigger value="payments">Payment Settlement</TabsTrigger>
        </TabsList>

        {/* Worker List Tab */}
        <TabsContent value="workers" className="space-y-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search workers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {role === 'owner' && (
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Worker
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-semibold text-muted-foreground">Code</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Phone</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Total Earnings</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Total Paid</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Balance</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Status</th>
                  {canDelete && <th className="text-left p-3 font-semibold text-muted-foreground">Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map(worker => (
                  <tr key={worker.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-medium text-primary">{worker.code}</td>
                    <td className="p-3">{worker.name}</td>
                    <td className="p-3 text-muted-foreground">{worker.phone}</td>
                    <td className="p-3 font-semibold text-text">{formatCurrency(worker.totalEarnings)}</td>
                    <td className="p-3 text-green-600">{formatCurrency(worker.totalPaid)}</td>
                    <td className="p-3 font-semibold text-orange-600">
                      {formatCurrency(worker.totalEarnings - worker.totalPaid)}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={worker.status} />
                    </td>
                    {canDelete && (
                      <td className="p-3">
                        <button className="p-1 hover:bg-red-100 rounded text-danger transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Active Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          {mockAssignments.map(assignment => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Worker</p>
                    <p className="font-semibold text-text">
                      {mockWorkers.find(w => w.id === assignment.workerId)?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Design</p>
                    <p className="font-semibold text-primary">{assignment.designCode}</p>
                    <p className="text-xs text-muted">{assignment.designName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Qty Issued / Returned</p>
                    <p className="font-semibold text-text">
                      {assignment.issuedQty} / {assignment.returnedQty}
                    </p>
                    <p className="text-xs text-danger">Rejected: {assignment.rejectedQty}</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <StatusBadge status={assignment.status} />
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Finished Goods Tab */}
        <TabsContent value="finished-goods" className="space-y-4">
          {mockFinishedGoods.map(entry => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Worker</p>
                    <p className="font-semibold text-text">{entry.workerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Design</p>
                    <p className="font-semibold text-primary">{entry.designCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                    <p className="font-semibold text-text">{entry.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Date</p>
                    <p className="font-semibold text-text">{formatDate(entry.collectedDate)}</p>
                  </div>
                  <div className="flex items-end">
                    <StatusBadge status={entry.quality} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Payment Settlement Tab */}
        <TabsContent value="payments" className="space-y-4">
          {mockWorkerPayments.map(payment => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Worker</p>
                    <p className="font-semibold text-text">{payment.workerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Work Date</p>
                    <p className="font-semibold text-text">{formatDate(payment.workDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Amount</p>
                    <p className="font-semibold text-primary">{formatCurrency(payment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Paid Date</p>
                    <p className="font-semibold text-text">
                      {payment.paymentDate ? formatDate(payment.paymentDate) : '-'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={payment.status} />
                    {payment.status === 'pending' && (
                      <Button size="sm" className="gap-2">
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
