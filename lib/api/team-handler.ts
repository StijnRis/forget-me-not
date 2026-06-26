import { getUser } from '@/lib/db/queries';
import { getMembershipForTeam } from '@/lib/team-access';

export async function requireTeamMemberFromRequest(
  teamIdStr: string
) {
  const user = await getUser();
  if (!user) {
    return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const teamId = parseInt(teamIdStr, 10);
  if (Number.isNaN(teamId)) {
    return { error: Response.json({ error: 'Invalid team' }, { status: 400 }) };
  }

  const membership = await getMembershipForTeam(user.id, teamId);
  if (!membership) {
    return { error: Response.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user, teamId, membership };
}
