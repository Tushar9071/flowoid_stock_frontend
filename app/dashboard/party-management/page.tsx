import { redirect } from 'next/navigation';

export default function PartyManagementRedirectPage() {
  redirect('/dashboard/dealers');
}
