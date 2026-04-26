'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { role } = useAuth();

  if (role !== 'owner') {
    return (
      <DashboardLayout title="Settings">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Access denied. Owner only.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-8 max-w-2xl">
        {/* Company Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Basic details about your business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-text">Company Name</label>
              <Input defaultValue="Ayanshi Imitation" className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-text">Business Type</label>
              <Input defaultValue="Jewellery Manufacturing" className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-text">Email</label>
              <Input defaultValue="info@ayanshi.com" className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-text">Phone</label>
              <Input defaultValue="+91 9876543210" className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-text">Address</label>
              <Input defaultValue="Jaipur, Rajasthan" className="mt-2" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Configuration</CardTitle>
            <CardDescription>Currency and payment settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-text">Currency</label>
              <Input defaultValue="Indian Rupee (INR)" className="mt-2" disabled />
            </div>
            <div>
              <label className="text-sm font-medium text-text">Financial Year Start</label>
              <Input defaultValue="April 1" className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-text">Default Credit Period (days)</label>
              <Input defaultValue="30" type="number" className="mt-2" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Management</CardTitle>
            <CardDescription>Stock and material settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-text">Default Low Stock Threshold (%)</label>
              <Input defaultValue="25" type="number" className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-text">Auto-reorder Point</label>
              <Input defaultValue="Enabled" className="mt-2" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>Advanced settings for the ERP system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text">Enable Notifications</p>
                <p className="text-sm text-muted-foreground">Send alerts for low stock and overdue payments</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text">Auto-backup</p>
                <p className="text-sm text-muted-foreground">Daily backup of system data</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text">Debug Mode</p>
                <p className="text-sm text-muted-foreground">Enable detailed logging</p>
              </div>
              <input type="checkbox" className="w-4 h-4" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-danger/20 bg-danger/5">
          <CardHeader>
            <CardTitle className="text-danger">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-text mb-2">Reset All Data</p>
              <p className="text-sm text-muted-foreground mb-4">
                This will delete all data and reset the system to default state.
              </p>
              <Button variant="destructive">Reset System</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
