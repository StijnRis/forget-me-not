import { getUser } from '@/lib/db/queries';
import { signInRedirect } from '@/lib/auth/session';

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    await signInRedirect();
  }
  return user;
}
