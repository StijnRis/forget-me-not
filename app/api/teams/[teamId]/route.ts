import { getTeamWithMembers } from '@/lib/db/queries';
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

  const team = await getTeamWithMembers(access.teamId);
  return Response.json({
    team,
    membership: {
      role: access.membership.role,
      relationship: access.membership.relationship,
    },
  });
}
