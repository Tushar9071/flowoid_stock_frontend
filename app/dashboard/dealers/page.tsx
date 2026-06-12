import { Suspense } from 'react';
import { PartyManagementPage } from '@/components/parties/party-management-page';

export default function DealersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PartyManagementPage
        fixedTab="DEALER"
        title="Dealer Management"
        subtitle="Dealer accounts, balances and ledger history"
      />
    </Suspense>
  );
}
