import { PartyManagementPage } from '@/components/parties/party-management-page';

export default function SuppliersPage() {
  return (
    <PartyManagementPage
      fixedTab="SUPPLIER"
      title="Supplier Management"
      subtitle="Supplier accounts, balances and ledger history"
    />
  );
}
