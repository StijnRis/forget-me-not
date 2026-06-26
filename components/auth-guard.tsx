import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';

async function AuthCheck({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  return children;
}

export function AuthGuard({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        fallback ?? (
          <div className="min-h-[100dvh] flex flex-col bg-gray-50" />
        )
      }
    >
      <AuthCheck>{children}</AuthCheck>
    </Suspense>
  );
}
