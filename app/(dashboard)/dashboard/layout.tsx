import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { AppNavbar } from '@/components/app-navbar';

const settingsNavItems = [
  { href: '/teams', label: 'My teams', matchPrefix: false },
  { href: '/dashboard', label: 'Billing', matchPrefix: false },
  { href: '/dashboard/general', label: 'Account', matchPrefix: true },
  { href: '/dashboard/activity', label: 'Activity', matchPrefix: true },
  { href: '/dashboard/security', label: 'Security', matchPrefix: true },
];

export default async function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <AppNavbar items={settingsNavItems} />
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8">{children}</div>
    </div>
  );
}
