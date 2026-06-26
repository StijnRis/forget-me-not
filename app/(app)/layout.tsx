import { Suspense } from 'react';
import { requireUser } from '@/lib/auth/require-user';

async function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AuthenticatedApp>{children}</AuthenticatedApp>
    </Suspense>
  );
}
