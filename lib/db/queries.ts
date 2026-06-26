import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import {
  activityLogs,
  habits,
  invitations,
  stories,
  teamMembers,
  teams,
  users,
} from './schema';
import { cookies } from 'next/headers';
import { parseSessionToken } from '@/lib/auth/session';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie?.value) {
    return null;
  }

  const sessionData = await parseSessionToken(sessionCookie.value);
  if (!sessionData) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId,
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamsForUser(userId?: number) {
  const user = userId ? { id: userId } : await getUser();
  if (!user) {
    return [];
  }

  return db.query.teamMembers.findMany({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: true,
    },
    orderBy: desc(teamMembers.joinedAt),
  });
}

export async function getTeamWithMembers(teamId: number) {
  return db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: {
      teamMembers: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              profileImageUrl: true,
            },
          },
        },
      },
    },
  });
}

export async function getPendingInvitationsForUser(email: string) {
  return db.query.invitations.findMany({
    where: and(eq(invitations.email, email), eq(invitations.status, 'pending')),
    with: {
      team: true,
      invitedBy: {
        columns: { id: true, name: true, email: true },
      },
    },
    orderBy: desc(invitations.invitedAt),
  });
}

export async function getStoriesForTeam(teamId: number) {
  const rows = await db
    .select({
      id: stories.id,
      teamId: stories.teamId,
      authorId: stories.authorId,
      title: stories.title,
      content: stories.content,
      imageUrl: stories.imageUrl,
      createdAt: stories.createdAt,
      author: {
        id: users.id,
        name: users.name,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
        relationship: teamMembers.relationship,
      },
    })
    .from(stories)
    .innerJoin(users, eq(stories.authorId, users.id))
    .leftJoin(
      teamMembers,
      and(eq(teamMembers.userId, users.id), eq(teamMembers.teamId, teamId))
    )
    .where(eq(stories.teamId, teamId))
    .orderBy(desc(stories.createdAt));

  return rows;
}

export async function getHabitsForTeam(teamId: number) {
  return db.query.habits.findMany({
    where: eq(habits.teamId, teamId),
    orderBy: habits.scheduledTime,
  });
}
