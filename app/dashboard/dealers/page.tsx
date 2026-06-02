import { PartyManagementPage } from '@/components/parties/party-management-page';

export default function DealersPage() {
  return (
    <PartyManagementPage
      fixedTab="DEALER"
      title="Dealer Management"
      subtitle="Dealer accounts, balances and ledger history"
    />
  );
}
