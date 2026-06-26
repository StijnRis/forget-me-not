import Link from 'next/link';
import { getPendingInvitationsForUser, getTeamsForUser, getUser } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TEAM_ROLE_LABELS, TeamRole, isCaregiver } from '@/lib/team-roles';
import { AcceptInviteButton } from './accept-invite-button';
import { CreateTeamForm } from './create-team-form';
import { Users, Mail, Plus } from 'lucide-react';

export default async function TeamsOverviewPage() {
  const user = await getUser();
  const [memberships, invitations] = await Promise.all([
    getTeamsForUser(user!.id),
    getPendingInvitationsForUser(user!.email),
  ]);

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          My family groups
        </h1>
        <p className="mt-1 text-gray-600">
          All teams you belong to and pending invitations
        </p>
      </div>

      {invitations.length > 0 && (
        <Card className="border-sky-200 bg-sky-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sky-900">
              <Mail className="h-5 w-5" />
              Pending invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitations.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-white border border-sky-100 p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{invite.team.name}</p>
                  <p className="text-sm text-gray-500">
                    Invited as{' '}
                    {TEAM_ROLE_LABELS[invite.role as TeamRole] ??
                      invite.role.replace(/_/g, ' ')}
                  </p>
                </div>
                <AcceptInviteButton invitationId={invite.id} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-sky-600" />
            Create a family group
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTeamForm />
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Your teams ({memberships.length})
        </h2>

        {memberships.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              You are not in any family groups yet. Accept an invitation above or
              create a new group.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {memberships.map((membership) => {
              const roleLabel =
                TEAM_ROLE_LABELS[membership.role as TeamRole] ??
                membership.role.replace(/_/g, ' ');
              const caregiver = isCaregiver(membership.role);

              return (
                <li key={membership.id}>
                  <Card>
                    <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5">
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">
                          {membership.team.name}
                        </p>
                        <p className="text-sm text-gray-500">{roleLabel}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {caregiver ? (
                          <Button asChild>
                            <Link href={`/teams/${membership.teamId}`}>
                              Manage
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild>
                            <Link href={`/teams/${membership.teamId}/view`}>
                              Open stories
                            </Link>
                          </Button>
                        )}
                        {caregiver && (
                          <Button asChild variant="outline">
                            <Link href={`/teams/${membership.teamId}/view`}>
                              Preview view
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
