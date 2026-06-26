import { getStoriesForTeam, getUser } from '@/lib/db/queries';
import { getMembershipForTeam } from '@/lib/team-access';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { teamId: teamIdStr } = await params;
  const teamId = parseInt(teamIdStr, 10);
  if (Number.isNaN(teamId)) {
    return Response.json({ error: 'Invalid team' }, { status: 400 });
  }

  const membership = await getMembershipForTeam(user.id, teamId);
  if (!membership) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const stories = await getStoriesForTeam(teamId);
  return Response.json(stories);
}
