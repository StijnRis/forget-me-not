import { getTeamsForUser, getUser } from '@/lib/db/queries';
import { TEAM_ROLE_LABELS, TeamRole } from '@/lib/team-roles';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const memberships = await getTeamsForUser(user.id);
  return Response.json(
    memberships.map((m) => ({
      id: m.id,
      role: m.role,
      roleLabel: TEAM_ROLE_LABELS[m.role as TeamRole] ?? m.role,
      joinedAt: m.joinedAt,
      team: m.team,
    }))
  );
}
