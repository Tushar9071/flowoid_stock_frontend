'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { mockOrders, mockDispatches } from '@/lib/data';
import { formatCurrency, formatDate } from '@/lib/constants';
import { Plus, Truck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function OrdersDispatchPage() {
  const { role } = useAuth();

  return (
    <DashboardLayout title="Orders & Dispatch">
      <div className="space-y-8">
        {/* Orders Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-serif font-bold text-text">All Orders</h2>
            {role === 'owner' && (
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Order
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {mockOrders.map(order => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{order.orderId}</p>
                        <h3 className="font-semibold text-text text-lg">{order.dealerName}</h3>
                        <p className="text-sm text-muted mt-1">{formatDate(order.date)}</p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={order.orderStatus} />
                        <p className="text-sm font-bold text-primary mt-2">{formatCurrency(order.totalValue)}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-text">{item.designCode}</p>
                            <p className="text-xs text-muted">{item.quantity} units @ {formatCurrency(item.unitPrice)}</p>
                          </div>
                          <p className="font-semibold text-text">{formatCurrency(item.total)}</p>
                        </div>
                      ))}
                    </div>

                    {/* Payment Status */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Payment Status</p>
                        <StatusBadge status={order.paymentStatus} />
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Dispatches Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-serif font-bold text-text">
            <Truck className="w-6 h-6" />
            Dispatch Status
          </div>

          <div className="space-y-3">
            {mockDispatches.map(dispatch => (
              <Card key={dispatch.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Order ID</p>
                      <p className="font-semibold text-primary">{dispatch.orderId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Dealer</p>
                      <p className="font-semibold text-text">{dispatch.dealerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tracker Number</p>
                      <p className="font-mono text-sm text-text">{dispatch.trackerNumber || '-'}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <StatusBadge status={dispatch.status} />
                      </div>
                      <Button variant="outline" size="sm">
                        Track
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
