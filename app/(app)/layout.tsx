import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { AppNavbar } from '@/components/app-navbar';

export default async function AppLayout({
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
      <AppNavbar />
      {children}
    </div>
  );
}
