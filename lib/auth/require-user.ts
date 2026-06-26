import { getUser } from '@/lib/db/queries';
import { signInRedirect } from '@/lib/auth/session';
import type { User } from '@/lib/db/schema';

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    return signInRedirect();
  }
  return user;
}
