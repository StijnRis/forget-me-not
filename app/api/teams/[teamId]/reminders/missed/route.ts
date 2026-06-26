import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getMembershipForTeam } from '@/lib/team-access';
import { logActivity } from '@/lib/activity';
import { ActivityType } from '@/lib/db/schema';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { teamId: teamIdStr } = await params;
  const teamId = parseInt(teamIdStr, 10);
  if (Number.isNaN(teamId)) {
    return NextResponse.json({ error: 'Invalid team' }, { status: 400 });
  }

  const membership = await getMembershipForTeam(user.id, teamId);
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const habitId = typeof body.habitId === 'number' ? body.habitId : parseInt(String(body.habitId ?? ''), 10);
  const title = typeof body.title === 'string' ? body.title.trim() : '';

  if (Number.isNaN(habitId) || !title) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  await logActivity(teamId, user.id, ActivityType.MISSED_NOTIFICATION, {
    habitId,
    reminderTitle: title,
  });

  return NextResponse.json({ ok: true });
}
