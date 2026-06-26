import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/require-user';
import { requireCaregiverOnTeam } from '@/lib/team-access';
import { TeamCaregiverDashboard } from './team-caregiver-dashboard';

export default async function TeamCaregiverPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const user = await requireUser();
  const { teamId: teamIdStr } = await params;
  const teamId = parseInt(teamIdStr, 10);
  if (Number.isNaN(teamId)) {
    notFound();
  }

  const { error } = await requireCaregiverOnTeam(user.id, teamId);
  if (error) {
    redirect(`/teams/${teamId}/view`);
  }

  return <TeamCaregiverDashboard teamId={teamId} />;
}
