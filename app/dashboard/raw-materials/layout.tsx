'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RawMaterialsProvider, useRawMaterials } from './raw-materials-context';
import { TypeModal, PurchaseModal } from './raw-materials-components';

function RawMaterialsModals() {
  const {
    typeModalMode, purchaseModalMode,
    typeForm, purchaseForm, typeFormErrors, purchaseFormErrors,
    setTypeForm, setPurchaseForm,
    saving, suppliers, types,
    saveType, savePurchase,
    setTypeModalMode, setPurchaseModalMode,
  } = useRawMaterials();

  return (
    <>
      {typeModalMode && (
        <TypeModal
          mode={typeModalMode}
          form={typeForm}
          errors={typeFormErrors}
          setForm={setTypeForm}
          suppliers={suppliers}
          saving={saving}
          onClose={() => setTypeModalMode(null)}
          onSubmit={saveType}
        />
      )}
      {purchaseModalMode && (
        <PurchaseModal
          mode={purchaseModalMode}
          form={purchaseForm}
          errors={purchaseFormErrors}
          setForm={setPurchaseForm}
          materialTypes={types}
          suppliers={suppliers}
          saving={saving}
          editing={Boolean(purchaseForm.status)}
          onClose={() => setPurchaseModalMode(null)}
          onSubmit={savePurchase}
        />
      )}
    </>
  );
}

function RawMaterialsLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { canCreate, openTypeModal, openPurchaseModal } = useRawMaterials();

  let title = 'Raw Materials';
  let subtitle = 'Tenant-scoped raw materials, supplier purchases, stock and material usage';
  let action: React.ReactNode = undefined;

  if (pathname === '/dashboard/raw-materials') {
    title = 'Stock Overview';
    subtitle = 'Current stock levels and availability for all raw materials';
  } else if (pathname.startsWith('/dashboard/raw-materials/material-list')) {
    title = 'Raw Materials';
    subtitle = 'Manage raw material types, units and catalogue';
    if (canCreate) action = (
      <button onClick={() => openTypeModal()} className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold">
        <Plus className="h-4 w-4" /> Add Raw Material
      </button>
    );
  } else if (pathname.startsWith('/dashboard/raw-materials/stock-in')) {
    title = 'Material Purchases';
    subtitle = 'Supplier intake and purchase records';
    if (canCreate) action = (
      <button onClick={() => openPurchaseModal()} className="theme-accent-btn inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold">
        <Plus className="h-4 w-4" /> Add Material Purchase
      </button>
    );
  } else if (pathname.startsWith('/dashboard/raw-materials/stock-out')) {
    title = 'Material Usage';
    subtitle = 'Material issuance and usage records';
  }

  return (
    <DashboardLayout title={title} subtitle={subtitle} action={action}>
      {children}
      <RawMaterialsModals />
    </DashboardLayout>
  );
}

function getActiveTab(pathname: string): 'stock' | 'types' | 'purchases' | 'issuances' {
  if (pathname.startsWith('/dashboard/raw-materials/material-list')) return 'types';
  if (pathname.startsWith('/dashboard/raw-materials/stock-in')) return 'purchases';
  if (pathname.startsWith('/dashboard/raw-materials/stock-out')) return 'issuances';
  return 'stock';
}

export default function RawMaterialsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  return (
    <RawMaterialsProvider activeTab={activeTab}>
      <RawMaterialsLayoutInner>
        {children}
      </RawMaterialsLayoutInner>
    </RawMaterialsProvider>
  );
}
