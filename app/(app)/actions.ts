'use server';

import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import {
  ActivityType,
  habits,
  stories,
  teamMembers,
  users,
} from '@/lib/db/schema';
import { validatedActionWithUser } from '@/lib/auth/actions';
import { getUserWithTeam } from '@/lib/db/queries';
import { requireCaregiverOnTeam } from '@/lib/team-access';
import { logActivity } from '@/lib/activity';

function teamPaths(teamId: number) {
  return [`/teams/${teamId}`, `/teams/${teamId}/view`, '/teams'];
}

const createStorySchema = z.object({
  teamId: z.coerce.number(),
  title: z.string().max(200).optional(),
  content: z.string().min(1, 'Story content is required').max(5000),
  imageUrl: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v))
    .pipe(z.string().url().optional()),
});

export const createStory = validatedActionWithUser(
  createStorySchema,
  async (data, _, user) => {
    const { error } = await requireCaregiverOnTeam(user.id, data.teamId);
    if (error) return { error };

    await db.insert(stories).values({
      teamId: data.teamId,
      authorId: user.id,
      title: data.title || null,
      content: data.content,
      imageUrl: data.imageUrl || null,
    });

    await logActivity(data.teamId, user.id, ActivityType.CREATE_STORY);
    teamPaths(data.teamId).forEach((p) => revalidatePath(p));
    return { success: 'Story added successfully.' };
  }
);

const deleteStorySchema = z.object({
  teamId: z.coerce.number(),
  storyId: z.coerce.number(),
});

export const deleteStory = validatedActionWithUser(
  deleteStorySchema,
  async (data, _, user) => {
    const { error } = await requireCaregiverOnTeam(user.id, data.teamId);
    if (error) return { error };

    await db
      .delete(stories)
      .where(
        and(eq(stories.id, data.storyId), eq(stories.teamId, data.teamId))
      );

    await logActivity(data.teamId, user.id, ActivityType.DELETE_STORY);
    teamPaths(data.teamId).forEach((p) => revalidatePath(p));
    return { success: 'Story removed.' };
  }
);

const createHabitSchema = z.object({
  teamId: z.coerce.number(),
  title: z.string().min(1, 'Title is required').max(100),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
});

export const createHabit = validatedActionWithUser(
  createHabitSchema,
  async (data, _, user) => {
    const { error } = await requireCaregiverOnTeam(user.id, data.teamId);
    if (error) return { error };

    await db.insert(habits).values({
      teamId: data.teamId,
      createdById: user.id,
      title: data.title,
      scheduledTime: data.scheduledTime,
    });

    await logActivity(data.teamId, user.id, ActivityType.CREATE_HABIT);
    teamPaths(data.teamId).forEach((p) => revalidatePath(p));
    return { success: 'Reminder scheduled.' };
  }
);

const deleteHabitSchema = z.object({
  teamId: z.coerce.number(),
  habitId: z.coerce.number(),
});

export const deleteHabit = validatedActionWithUser(
  deleteHabitSchema,
  async (data, _, user) => {
    const { error } = await requireCaregiverOnTeam(user.id, data.teamId);
    if (error) return { error };

    await db
      .delete(habits)
      .where(
        and(eq(habits.id, data.habitId), eq(habits.teamId, data.teamId))
      );

    await logActivity(data.teamId, user.id, ActivityType.DELETE_HABIT);
    teamPaths(data.teamId).forEach((p) => revalidatePath(p));
    return { success: 'Reminder removed.' };
  }
);

const updateProfileSchema = z.object({
  teamId: z.coerce.number(),
  name: z.string().min(1, 'Name is required').max(100),
  profileImageUrl: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v))
    .pipe(z.string().url().optional()),
  relationship: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v))
    .pipe(z.string().max(50).optional()),
});

export const updateProfile = validatedActionWithUser(
  updateProfileSchema,
  async (data, _, user) => {
    const { error } = await requireCaregiverOnTeam(user.id, data.teamId);
    if (error) return { error };

    const userWithTeam = await getUserWithTeam(user.id);

    await db
      .update(users)
      .set({
        name: data.name,
        profileImageUrl: data.profileImageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await db
      .update(teamMembers)
      .set({ relationship: data.relationship ?? null })
      .where(
        and(
          eq(teamMembers.userId, user.id),
          eq(teamMembers.teamId, data.teamId)
        )
      );

    if (userWithTeam?.teamId) {
      await logActivity(userWithTeam.teamId, user.id, ActivityType.UPDATE_PROFILE);
    }

    revalidatePath('/teams');
    revalidatePath('/dashboard');
    revalidatePath(`/teams/${data.teamId}`);
    revalidatePath(`/teams/${data.teamId}/view`);
    return { success: 'Profile updated.' };
  }
);
