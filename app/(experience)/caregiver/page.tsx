import { redirect } from 'next/navigation';

export default function LegacyCaregiverRedirect() {
  redirect('/teams');
}
