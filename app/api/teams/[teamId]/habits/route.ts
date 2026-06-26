import { getHabitsForTeam } from '@/lib/db/queries';
import { requireTeamMemberFromRequest } from '@/lib/api/team-handler';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId: teamIdStr } = await params;
  const access = await requireTeamMemberFromRequest(teamIdStr);
  if ('error' in access) {
    return access.error;
  }

  const habits = await getHabitsForTeam(access.teamId);
  return Response.json(habits);
}
