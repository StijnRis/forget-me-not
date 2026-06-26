import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getMembershipForTeam } from '@/lib/team-access';
import { logActivity } from '@/lib/activity';
import { ActivityType } from '@/lib/db/schema';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ teamId: string; storyId: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { teamId: teamIdStr, storyId: storyIdStr } = await params;
  const teamId = parseInt(teamIdStr, 10);
  const storyId = parseInt(storyIdStr, 10);
  if (Number.isNaN(teamId) || Number.isNaN(storyId)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const membership = await getMembershipForTeam(user.id, teamId);
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await logActivity(teamId, user.id, ActivityType.VIEW_STORY, { storyId });

  return NextResponse.json({ ok: true });
}
