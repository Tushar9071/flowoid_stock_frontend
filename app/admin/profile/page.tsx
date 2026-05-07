import { AccountDetailsPage } from '@/components/account/account-details-page';

export default function AdminProfilePage() {
  return (
    <div className="p-4 sm:p-6">
      <AccountDetailsPage mode="profile" shell="admin" />
    </div>
  );
}
