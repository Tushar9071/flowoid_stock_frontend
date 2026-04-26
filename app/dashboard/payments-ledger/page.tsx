'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  mockInvoices,
  mockPaymentRecords,
  mockDealerLedgers,
} from '@/lib/data';
import { formatCurrency, formatDate } from '@/lib/constants';
import { Plus, Download } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function PaymentsLedgerPage() {
  const { role } = useAuth();

  return (
    <DashboardLayout title="Payments & Ledger">
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments Received</TabsTrigger>
          <TabsTrigger value="ledger">Dealer Ledger</TabsTrigger>
          <TabsTrigger value="ageing">Ageing Report</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-end gap-2">
            {role === 'owner' && (
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Invoice
              </Button>
            )}
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-muted-foreground">Invoice</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Dealer</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Amount</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Paid</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Due</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {mockInvoices.map(invoice => (
                  <tr key={invoice.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium text-primary">{invoice.invoiceNumber}</td>
                    <td className="p-3">{invoice.dealerName}</td>
                    <td className="p-3 text-right font-semibold">{formatCurrency(invoice.amount)}</td>
                    <td className="p-3 text-right text-green-600">{formatCurrency(invoice.paidAmount)}</td>
                    <td className="p-3 text-right font-semibold text-danger">
                      {formatCurrency(invoice.amount - invoice.paidAmount)}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{formatDate(invoice.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Payments Received Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-end">
            {role === 'owner' && (
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Record Payment
              </Button>
            )}
          </div>

          {mockPaymentRecords.map(payment => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice</p>
                    <p className="font-semibold text-primary">{payment.invoiceId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dealer</p>
                    <p className="font-semibold text-text">{payment.dealerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Method</p>
                    <p className="font-semibold text-text capitalize">{payment.paymentMethod.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm text-muted">{formatDate(payment.paymentDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Dealer Ledger Tab */}
        <TabsContent value="ledger" className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-muted-foreground">Dealer</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Total Invoiced</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Total Paid</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Outstanding</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Last Txn</th>
                </tr>
              </thead>
              <tbody>
                {mockDealerLedgers.map(ledger => (
                  <tr key={ledger.dealerId} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{ledger.dealerName}</td>
                    <td className="p-3 text-right font-semibold">{formatCurrency(ledger.totalInvoiced)}</td>
                    <td className="p-3 text-right text-green-600">{formatCurrency(ledger.totalPaid)}</td>
                    <td className="p-3 text-right font-bold text-danger">
                      {formatCurrency(ledger.outstanding)}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={ledger.status} />
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{formatDate(ledger.lastTransaction)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Ageing Report Tab */}
        <TabsContent value="ageing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4">Pending invoices by age</p>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>0-30 Days</span>
                    <span className="font-semibold text-text">₹45,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>31-60 Days</span>
                    <span className="font-semibold text-warning">₹78,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>60+ Days</span>
                    <span className="font-semibold text-danger">₹125,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4">Total Outstanding: ₹248,000</p>
                <div className="space-y-2">
                  <div className="text-right">
                    <p className="text-sm text-success">Paid on time: 75%</p>
                    <div className="w-full h-2 bg-muted rounded mt-1 overflow-hidden">
                      <div className="w-3/4 h-full bg-success" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
