import { Suspense } from 'react';
import { PartyManagementPage } from '@/components/parties/party-management-page';

export default function SuppliersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PartyManagementPage
        fixedTab="SUPPLIER"
        title="Supplier Management"
        subtitle="Supplier accounts, balances and ledger history"
      />
    </Suspense>
  );
}
