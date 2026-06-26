import { redirect } from 'next/navigation';
import { getStoriesForTeam } from '@/lib/db/queries';
import { teamStoryViewPath } from '@/lib/story-routes';

export default async function TeamStoryViewIndexPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId: teamIdStr } = await params;
  const teamId = parseInt(teamIdStr, 10);
  if (Number.isNaN(teamId)) {
    redirect('/teams');
  }

  const stories = await getStoriesForTeam(teamId);
  if (stories.length > 0) {
    redirect(teamStoryViewPath(teamId, stories[0].id));
  }

  return null;
}
