'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { WorkerManagementProvider, useWorkerManagement } from './worker-management-context';
import { Plus, Users, ClipboardList, Package, Wallet } from 'lucide-react';

function WorkerManagementLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { 
    canCreate, 
    canCreateAssignment, 
    canReadAssignment,
    canCreatePayment, 
    openWorkerForm, 
    openAssignmentForm, 
    openPaymentForm, 
    workers, 
    assignments, 
    goodsReturns, 
    payments 
  } = useWorkerManagement();

  let title = "Worker Management";
  let subtitle = "Backend connected workers, assignments, goods returns, payments, and ledger views";
  let action = null;

  if (pathname === '/dashboard/worker-management') {
    title = 'Worker List';
    subtitle = 'Manage your karigars, track balances, and handle details.';
    if (canCreate) action = (
        <button onClick={() => openWorkerForm()} className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors">
          <Plus className="h-4 w-4" /> Add Worker
        </button>
     );
  } else if (pathname.startsWith('/dashboard/worker-management/assignments')) {
     title = "Assignments";
     if (canCreateAssignment) action = (
        <button onClick={() => openAssignmentForm()} className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors">
          <Plus className="h-4 w-4" /> Create Assignment
        </button>
     );
  } else if (pathname.includes('/goods-returns')) {
     title = "Goods Returns";
  } else if (pathname.includes('/payments')) {
     title = "Payment Settlement";
     if (canCreatePayment) action = (
        <button onClick={() => openPaymentForm()} className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors">
          <Plus className="h-4 w-4" /> Record Payment
        </button>
     );
  }

  const tabs = [
    { id: 'workers', href: '/dashboard/worker-management', label: 'Worker List', icon: <Users className="h-4 w-4" />, count: workers?.length || 0 },
    ...(canReadAssignment ? [
      { id: 'assignments', href: '/dashboard/worker-management/assignments', label: 'Assignments', icon: <ClipboardList className="h-4 w-4" />, count: assignments?.length || 0 },
      { id: 'finished-goods', href: '/dashboard/worker-management/goods-returns', label: 'Goods Returns', icon: <Package className="h-4 w-4" />, count: goodsReturns?.length || 0 }
    ] : []),
    { id: 'payments', href: '/dashboard/worker-management/payments', label: 'Payment Settlement', icon: <Wallet className="h-4 w-4" />, count: payments?.length || 0 },
  ];

  return (
    <DashboardLayout title={title} subtitle={subtitle} action={action}>
      <main className="w-full">
        {children}
      </main>
    </DashboardLayout>
  );
}

export default function WorkerManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkerManagementProvider>
      <WorkerManagementLayoutInner>
        {children}
      </WorkerManagementLayoutInner>
    </WorkerManagementProvider>
  );
}
