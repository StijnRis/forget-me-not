import { notFound, redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { getMembershipForTeam } from '@/lib/team-access';
import { isCaregiver } from '@/lib/team-roles';
import { StoryViewer } from '@/components/story-viewer';

export default async function TeamStoryViewPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const { teamId: teamIdStr } = await params;
  const teamId = parseInt(teamIdStr, 10);
  if (Number.isNaN(teamId)) {
    notFound();
  }

  const membership = await getMembershipForTeam(user.id, teamId);
  if (!membership) {
    redirect('/teams');
  }

  return (
    <StoryViewer
      teamId={teamId}
      teamName={membership.team.name}
      previewMode={isCaregiver(membership.role)}
    />
  );
}
