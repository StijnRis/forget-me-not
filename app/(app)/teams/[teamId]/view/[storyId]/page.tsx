import { notFound, redirect } from 'next/navigation';
import { getHabitsForTeam, getStoriesForTeam } from '@/lib/db/queries';
import { requireUser } from '@/lib/auth/require-user';
import { getMembershipForTeam } from '@/lib/team-access';
import { isCaregiver } from '@/lib/team-roles';
import { StoryViewer } from '@/components/story-viewer';

export default async function TeamStoryViewPage({
  params,
}: {
  params: Promise<{ teamId: string; storyId: string }>;
}) {
  const user = await requireUser();
  const { teamId: teamIdStr, storyId: storyIdStr } = await params;
  const teamId = parseInt(teamIdStr, 10);
  const storyId = parseInt(storyIdStr, 10);
  if (Number.isNaN(teamId) || Number.isNaN(storyId)) {
    notFound();
  }

  const membership = await getMembershipForTeam(user.id, teamId);
  if (!membership) {
    redirect('/teams');
  }

  const [stories, habits] = await Promise.all([
    getStoriesForTeam(teamId),
    getHabitsForTeam(teamId),
  ]);

  if (!stories.some((story) => story.id === storyId)) {
    notFound();
  }

  return (
    <StoryViewer
      teamId={teamId}
      storyId={storyId}
      teamName={membership.team.name}
      previewMode={isCaregiver(membership.role)}
      initialStories={stories}
      initialHabits={habits}
      betweenStoriesAudioUrl={membership.team.betweenStoriesAudioUrl}
    />
  );
}
