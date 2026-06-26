import { redirect } from 'next/navigation';
import { getHabitsForTeam, getStoriesForTeam } from '@/lib/db/queries';
import { requireUser } from '@/lib/auth/require-user';
import { getMembershipForTeam } from '@/lib/team-access';
import { isCaregiver } from '@/lib/team-roles';
import { StoryViewer } from '@/components/story-viewer';
import { teamStoryViewPath } from '@/lib/story-routes';

export default async function TeamStoryViewIndexPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const user = await requireUser();
  const { teamId: teamIdStr } = await params;
  const teamId = parseInt(teamIdStr, 10);
  if (Number.isNaN(teamId)) {
    redirect('/teams');
  }

  const membership = await getMembershipForTeam(user.id, teamId);
  if (!membership) {
    redirect('/teams');
  }

  const [stories, habits] = await Promise.all([
    getStoriesForTeam(teamId),
    getHabitsForTeam(teamId),
  ]);

  if (stories.length > 0) {
    const randomStory = stories[Math.floor(Math.random() * stories.length)];
    redirect(teamStoryViewPath(teamId, randomStory.id));
  }

  return (
    <StoryViewer
      teamId={teamId}
      storyId={0}
      teamName={membership.team.name}
      previewMode={isCaregiver(membership.role)}
      initialStories={[]}
      initialHabits={habits}
      betweenStoriesAudioUrl={membership.team.betweenStoriesAudioUrl}
    />
  );
}
