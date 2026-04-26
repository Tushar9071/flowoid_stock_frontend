'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  mockInventoryItems,
} from '@/lib/data';
import { formatDate } from '@/lib/constants';
import { Plus, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function InventoryPage() {
  const { role } = useAuth();

  return (
    <DashboardLayout title="Inventory Management">
      <Tabs defaultValue="unpackaged" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="unpackaged">Unpackaged Stock</TabsTrigger>
          <TabsTrigger value="packaged">Packaged Stock</TabsTrigger>
          <TabsTrigger value="packaging-form">Packaging Form</TabsTrigger>
        </TabsList>

        {/* Unpackaged Stock */}
        <TabsContent value="unpackaged" className="space-y-4">
          <div className="flex justify-end gap-2 mb-4">
            {role === 'owner' && (
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Stock
              </Button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-muted-foreground">Design Code</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Design Name</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Pieces</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Threshold</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {mockInventoryItems.map(item => {
                  const isLow = item.unpackagedPieces < item.lowStockThreshold;
                  return (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium text-primary">{item.designCode}</td>
                      <td className="p-3">{item.designName}</td>
                      <td className="p-3 text-right font-semibold">{item.unpackagedPieces}</td>
                      <td className="p-3 text-right text-muted-foreground">{item.lowStockThreshold}</td>
                      <td className="p-3">
                        {isLow ? (
                          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            ✓ In Stock
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{formatDate(item.lastUpdated)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Packaged Stock */}
        <TabsContent value="packaged" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockInventoryItems.map(item => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{item.designCode}</p>
                  <p className="font-semibold text-text mt-1">{item.designName}</p>
                  <div className="flex justify-between mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Packaged</p>
                      <p className="text-xl font-bold text-primary">{item.packagedDozens}</p>
                      <p className="text-xs text-muted">dozen</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">= {item.packagedDozens * 12} pieces</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Packaging Form */}
        <TabsContent value="packaging-form" className="space-y-4">
          <div className="flex justify-end gap-2 mb-4">
            {role === 'owner' && (
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Packaging
              </Button>
            )}
          </div>
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>No packaging forms created yet.</p>
              <p className="text-sm mt-2">Create a form to record packaging activity.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
