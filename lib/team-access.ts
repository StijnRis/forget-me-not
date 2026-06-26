import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { invitations, teamMembers } from '@/lib/db/schema';
import { isCaregiver, TeamRole } from '@/lib/team-roles';

export async function getMembershipForTeam(userId: number, teamId: number) {
  return db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)),
    with: { team: true },
  });
}

export async function requireTeamMember(userId: number, teamId: number) {
  const membership = await getMembershipForTeam(userId, teamId);
  if (!membership) {
    return { error: 'You are not a member of this family group.' as const, membership: null };
  }
  return { error: null, membership };
}

export async function requireCaregiverOnTeam(userId: number, teamId: number) {
  const result = await requireTeamMember(userId, teamId);
  if (result.error || !result.membership) {
    return result;
  }
  if (!isCaregiver(result.membership.role)) {
    return { error: 'Only caregivers can perform this action.' as const, membership: null };
  }
  return result;
}

export async function canViewTeamStories(userId: number, teamId: number) {
  const membership = await getMembershipForTeam(userId, teamId);
  if (!membership) {
    return { allowed: false as const, membership: null };
  }
  return { allowed: true as const, membership };
}

export async function assertCanAccessCaregiverPage(userId: number, teamId: number) {
  return requireCaregiverOnTeam(userId, teamId);
}

export async function validatePersonWithDementiaSlot(teamId: number) {
  const existing = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.role, TeamRole.PERSON_WITH_DEMENTIA)
      )
    )
    .limit(1);

  return existing.length === 0;
}

export async function acceptInvitationForUser(
  invitationId: number,
  userId: number,
  userEmail: string
) {
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(
      and(eq(invitations.id, invitationId), eq(invitations.status, 'pending'))
    )
    .limit(1);

  if (!invitation) {
    return { error: 'Invitation not found or already accepted.' };
  }

  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    return { error: 'This invitation was sent to a different email address.' };
  }

  const existingMember = await db.query.teamMembers.findFirst({
    where: and(
      eq(teamMembers.userId, userId),
      eq(teamMembers.teamId, invitation.teamId)
    ),
  });

  if (existingMember) {
    await db
      .update(invitations)
      .set({ status: 'accepted' })
      .where(eq(invitations.id, invitation.id));
    return { success: 'You are already a member of this family group.', teamId: invitation.teamId };
  }

  if (invitation.role === TeamRole.PERSON_WITH_DEMENTIA) {
    const slotAvailable = await validatePersonWithDementiaSlot(invitation.teamId);
    if (!slotAvailable) {
      return { error: 'This family group already has a person with dementia profile.' };
    }
  }

  await db.insert(teamMembers).values({
    userId,
    teamId: invitation.teamId,
    role: invitation.role,
  });

  await db
    .update(invitations)
    .set({ status: 'accepted' })
    .where(eq(invitations.id, invitation.id));

  return { success: 'You joined the family group.', teamId: invitation.teamId };
}
