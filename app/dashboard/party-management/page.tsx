'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/status-badge';
import { mockDealers } from '@/lib/data';
import { formatCurrency, formatDate } from '@/lib/constants';
import { Plus, MapPin, Phone } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function PartyManagementPage() {
  const { role } = useAuth();

  return (
    <DashboardLayout title="Party Management">
      <Tabs defaultValue="dealers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="dealers">Dealers</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        {/* Dealers Tab */}
        <TabsContent value="dealers" className="space-y-4">
          <div className="flex justify-end">
            {role === 'owner' && (
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Dealer
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockDealers.map(dealer => (
              <Card key={dealer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs text-muted-foreground">{dealer.code}</p>
                          <h3 className="font-semibold text-text text-lg">{dealer.name}</h3>
                        </div>
                        <StatusBadge status={dealer.status} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {dealer.city}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Phone className="w-4 h-4" />
                        {dealer.phone}
                      </div>
                    </div>

                    {/* Credit Info */}
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Credit Limit</span>
                        <span className="font-semibold text-text">{formatCurrency(dealer.creditLimit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Credit Period</span>
                        <span className="font-semibold text-text">{dealer.creditPeriod} days</span>
                      </div>
                    </div>

                    {/* Outstanding */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Outstanding Amount</p>
                      <p className={`text-lg font-bold ${dealer.outstanding > 0 ? 'text-danger' : 'text-success'}`}>
                        {formatCurrency(dealer.outstanding)}
                      </p>
                      <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                        <div
                          className={dealer.outstanding > 0 ? 'bg-danger' : 'bg-success'}
                          style={{ width: `${Math.min((dealer.outstanding / dealer.creditLimit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* GST */}
                    <div className="border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground">GST Number</p>
                      <p className="font-mono text-sm text-text">{dealer.gstNumber}</p>
                    </div>

                    <Button variant="outline" className="w-full" size="sm">
                      View Transactions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex justify-end">
            {role === 'owner' && (
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Supplier
              </Button>
            )}
          </div>
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>Supplier management coming soon.</p>
              <p className="text-sm mt-2">Manage your material suppliers here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
