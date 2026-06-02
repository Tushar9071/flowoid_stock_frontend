import { AccountDetailsPage } from '@/components/account/account-details-page';

export default function AdminSettingsPage() {
  return (
    <div className="p-4 sm:p-6">
      <AccountDetailsPage mode="settings" shell="admin" />
    </div>
  );
}
