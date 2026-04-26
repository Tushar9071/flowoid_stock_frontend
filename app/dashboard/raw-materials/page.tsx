'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockRawMaterials } from '@/lib/data';
import { formatCurrency, formatDate } from '@/lib/constants';
import { Plus, AlertTriangle, TrendingDown } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function RawMaterialsPage() {
  const { role } = useAuth();

  return (
    <DashboardLayout title="Raw Materials">
      <div className="space-y-6">
        <div className="flex justify-end">
          {role === 'owner' && (
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Material
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockRawMaterials.map(material => {
            const isLow = material.currentStock < material.threshold;
            const stockPercentage = (material.currentStock / material.threshold) * 100;

            return (
              <Card key={material.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{material.code}</p>
                        <h3 className="font-semibold text-text mt-1">{material.type}</h3>
                        <p className="text-sm text-muted">{material.supplier}</p>
                      </div>
                      {isLow && (
                        <AlertTriangle className="w-5 h-5 text-danger" />
                      )}
                    </div>

                    {/* Stock Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Current Stock</p>
                        <p className="font-bold text-lg text-primary mt-1">
                          {material.currentStock}
                        </p>
                        <p className="text-xs text-muted">{material.unitType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Threshold</p>
                        <p className="font-bold text-lg text-muted mt-1">
                          {material.threshold}
                        </p>
                        <p className="text-xs text-muted">{material.unitType}</p>
                      </div>
                    </div>

                    {/* Stock Bar */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-muted-foreground">Stock Level</p>
                        <span className={`text-xs font-semibold ${isLow ? 'text-danger' : 'text-success'}`}>
                          {Math.round(stockPercentage)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${isLow ? 'bg-danger' : 'bg-success'}`}
                          style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Cost and Last Restock */}
                    <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Cost/Unit</p>
                        <p className="font-semibold text-text">{formatCurrency(material.costPerUnit)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Last Restock</p>
                        <p className="text-sm text-muted-foreground">{formatDate(material.lastRestockDate)}</p>
                      </div>
                    </div>

                    {/* Action */}
                    <Button variant="outline" className="w-full" size="sm">
                      <TrendingDown className="w-3 h-3 mr-2" />
                      {isLow ? 'Reorder Now' : 'Update Stock'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
