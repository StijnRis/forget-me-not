import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { LoginForm } from '@/components/login-form';
import { getUser } from '@/lib/db/queries';

async function SignUpContent() {
  const user = await getUser();
  if (user) {
    redirect('/teams');
  }

  return <LoginForm mode="signup" />;
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpContent />
    </Suspense>
  );
}
