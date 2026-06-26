'use server';

import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import {
  User,
  users,
  teams,
  teamMembers,
  type NewUser,
  type NewTeam,
  type NewTeamMember,
  ActivityType,
  invitations,
} from '@/lib/db/schema';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser,
} from '@/lib/auth/actions';
import { logActivity } from '@/lib/activity';
import { isCaregiver, TeamRole } from '@/lib/team-roles';
import {
  acceptInvitationForUser,
  getMembershipForTeam,
  requireCaregiverOnTeam,
  validatePersonWithDementiaSlot,
} from '@/lib/team-access';

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  const [foundUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!foundUser) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password,
    };
  }

  const isPasswordValid = await comparePasswords(
    password,
    foundUser.passwordHash
  );

  if (!isPasswordValid) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password,
    };
  }

  const [firstMembership] = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, foundUser.id))
    .limit(1);

  await Promise.all([
    setSession(foundUser),
    logActivity(firstMembership?.teamId, foundUser.id, ActivityType.SIGN_IN),
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    const [team] = firstMembership
      ? await db
          .select()
          .from(teams)
          .where(eq(teams.id, firstMembership.teamId))
          .limit(1)
      : [null];
    return createCheckoutSession({ team, priceId });
  }

  redirect('/teams');
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteId: z.string().optional(),
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, inviteId } = data;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      error:
        'An account with this email already exists. Sign in to accept your invitation.',
      email,
      password,
    };
  }

  const passwordHash = await hashPassword(password);

  const newUser: NewUser = {
    email,
    passwordHash,
    role: 'member',
  };

  const [createdUser] = await db.insert(users).values(newUser).returning();

  if (!createdUser) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password,
    };
  }

  let createdTeam: typeof teams.$inferSelect | null = null;

  if (inviteId) {
    const result = await acceptInvitationForUser(
      parseInt(inviteId),
      createdUser.id,
      email
    );

    if (result.error) {
      return { error: result.error, email, password };
    }

    if (result.teamId) {
      await logActivity(result.teamId, createdUser.id, ActivityType.ACCEPT_INVITATION);
      [createdTeam] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, result.teamId))
        .limit(1);
    }
  }

  await Promise.all([
    logActivity(createdTeam?.id, createdUser.id, ActivityType.SIGN_UP),
    setSession(createdUser),
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ team: createdTeam, priceId });
  }

  redirect('/teams');
});

export async function signOut() {
  const user = (await getUser()) as User;
  const userWithTeam = await getUserWithTeam(user.id);
  await logActivity(userWithTeam?.teamId, user.id, ActivityType.SIGN_OUT);
  (await cookies()).delete('session');
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'Current password is incorrect.',
      };
    }

    if (currentPassword === newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password must be different from the current password.',
      };
    }

    if (confirmPassword !== newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password and confirmation password do not match.',
      };
    }

    const newPasswordHash = await hashPassword(newPassword);
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id)),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_PASSWORD),
    ]);

    return {
      success: 'Password updated successfully.',
    };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        password,
        error: 'Incorrect password. Account deletion failed.',
      };
    }

    const userWithTeam = await getUserWithTeam(user.id);

    await logActivity(
      userWithTeam?.teamId,
      user.id,
      ActivityType.DELETE_ACCOUNT
    );

    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')`,
      })
      .where(eq(users.id, user.id));

    await db.delete(teamMembers).where(eq(teamMembers.userId, user.id));

    (await cookies()).delete('session');
    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      db.update(users).set({ name, email }).where(eq(users.id, user.id)),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_ACCOUNT),
    ]);

    return { name, success: 'Account updated successfully.' };
  }
);

const createTeamSchema = z.object({
  name: z.string().min(1, 'Family group name is required').max(100),
});

export const createTeam = validatedActionWithUser(
  createTeamSchema,
  async (data, _, user) => {
    const newTeam: NewTeam = { name: data.name };
    const [createdTeam] = await db.insert(teams).values(newTeam).returning();

    if (!createdTeam) {
      return { error: 'Failed to create family group.' };
    }

    const newTeamMember: NewTeamMember = {
      userId: user.id,
      teamId: createdTeam.id,
      role: TeamRole.CAREGIVER,
    };

    await db.insert(teamMembers).values(newTeamMember);
    await logActivity(createdTeam.id, user.id, ActivityType.CREATE_TEAM);

    revalidatePath('/teams');
    redirect(`/teams/${createdTeam.id}`);
  }
);

const acceptInvitationSchema = z.object({
  invitationId: z.coerce.number(),
});

export const acceptInvitation = validatedActionWithUser(
  acceptInvitationSchema,
  async (data, _, user) => {
    const result = await acceptInvitationForUser(
      data.invitationId,
      user.id,
      user.email
    );

    if (result.error) {
      return { error: result.error };
    }

    if (result.teamId) {
      await logActivity(result.teamId, user.id, ActivityType.ACCEPT_INVITATION);
    }

    revalidatePath('/teams');
    return { success: result.success };
  }
);

const removeTeamMemberSchema = z.object({
  teamId: z.coerce.number(),
  memberId: z.coerce.number(),
});

export const removeTeamMember = validatedActionWithUser(
  removeTeamMemberSchema,
  async (data, _, user) => {
    const { teamId, memberId } = data;
    const { error } = await requireCaregiverOnTeam(user.id, teamId);
    if (error) return { error };

    await db
      .delete(teamMembers)
      .where(
        and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, teamId))
      );

    await logActivity(teamId, user.id, ActivityType.REMOVE_TEAM_MEMBER);
    revalidatePath(`/teams/${teamId}`);
    revalidatePath('/teams');
    return { success: 'Team member removed successfully' };
  }
);

const inviteTeamMemberSchema = z.object({
  teamId: z.coerce.number(),
  email: z.string().email('Invalid email address'),
  role: z.enum([TeamRole.CAREGIVER, TeamRole.PERSON_WITH_DEMENTIA]),
});

export const inviteTeamMember = validatedActionWithUser(
  inviteTeamMemberSchema,
  async (data, _, user) => {
    const { teamId, email, role } = data;
    const { error } = await requireCaregiverOnTeam(user.id, teamId);
    if (error) return { error };

    if (role === TeamRole.PERSON_WITH_DEMENTIA) {
      const slotAvailable = await validatePersonWithDementiaSlot(teamId);
      if (!slotAvailable) {
        return {
          error: 'This family group already has a person with dementia profile.',
        };
      }
    }

    const existingMember = await db
      .select()
      .from(users)
      .innerJoin(teamMembers, eq(users.id, teamMembers.userId))
      .where(and(eq(users.email, email), eq(teamMembers.teamId, teamId)))
      .limit(1);

    if (existingMember.length > 0) {
      return { error: 'This person is already a member of this family group.' };
    }

    const existingInvitation = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email),
          eq(invitations.teamId, teamId),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return { error: 'An invitation has already been sent to this email.' };
    }

    const [invitation] = await db
      .insert(invitations)
      .values({
        teamId,
        email,
        role,
        invitedBy: user.id,
        status: 'pending',
      })
      .returning();

    await logActivity(teamId, user.id, ActivityType.INVITE_TEAM_MEMBER);
    revalidatePath('/teams');
    revalidatePath(`/teams/${teamId}`);

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/sign-up?inviteId=${invitation.id}`;

    return {
      success: `Invitation sent. New members can sign up with: ${inviteLink}. Existing users will see it on their teams page.`,
      inviteLink,
    };
  }
);
