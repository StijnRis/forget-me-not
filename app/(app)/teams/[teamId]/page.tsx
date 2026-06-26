import { notFound, redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { assertCanAccessCaregiverPage } from '@/lib/team-access';
import { TeamCaregiverDashboard } from './team-caregiver-dashboard';

export default async function TeamCaregiverPage({
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

  const { error } = await assertCanAccessCaregiverPage(user.id, teamId);
  if (error) {
    redirect(`/teams/${teamId}/view`);
  }

  return <TeamCaregiverDashboard teamId={teamId} />;
}
