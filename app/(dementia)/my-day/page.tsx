import { redirect } from 'next/navigation';

export default function LegacyMyDayRedirect() {
  redirect('/teams');
}
