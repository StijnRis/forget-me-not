import { getPendingInvitationsForUser, getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const invitations = await getPendingInvitationsForUser(user.email);
  return Response.json(invitations);
}
