import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { LoginForm } from '@/components/login-form';
import { getUser } from '@/lib/db/queries';

async function SignInContent() {
  const user = await getUser();
  if (user) {
    redirect('/teams');
  }

  return <LoginForm mode="signin" />;
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}
