import { notFound } from 'next/navigation';
import { getStoriesForTeam } from '@/lib/db/queries';

export default async function TeamStoryViewPage({
  params,
}: {
  params: Promise<{ teamId: string; storyId: string }>;
}) {
  const { teamId: teamIdStr, storyId: storyIdStr } = await params;
  const teamId = parseInt(teamIdStr, 10);
  const storyId = parseInt(storyIdStr, 10);
  if (Number.isNaN(teamId) || Number.isNaN(storyId)) {
    notFound();
  }

  const stories = await getStoriesForTeam(teamId);
  const storyExists = stories.some((s) => s.id === storyId);
  if (!storyExists) {
    notFound();
  }

  return null;
}
