import { z } from 'zod';
import { TeamDataWithMembers, User } from '@/lib/db/schema';
import { getTeamWithMembers, getTeamsForUser, getUser } from '@/lib/db/queries';
import { getMembershipForTeam } from '@/lib/team-access';
import { redirect } from 'next/navigation';

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any;
};

type ValidatedActionFunction<S extends z.ZodType, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.issues[0].message };
    }

    return action(result.data, formData);
  };
}

type ValidatedActionWithUserFunction<S extends z.ZodType, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: User
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodType, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const user = await getUser();
    if (!user) {
      throw new Error('User is not authenticated');
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.issues[0].message };
    }

    return action(result.data, formData, user);
  };
}

type ActionWithTeamFunction<T> = (
  formData: FormData,
  team: TeamDataWithMembers
) => Promise<T>;

export function withTeam<T>(action: ActionWithTeamFunction<T>) {
  return async (formData: FormData): Promise<T> => {
    const user = await getUser();
    if (!user) {
      redirect('/sign-in');
    }

    const teamIdRaw = formData.get('teamId');
    let team: TeamDataWithMembers | null | undefined;

    if (teamIdRaw) {
      const teamId = parseInt(String(teamIdRaw), 10);
      const membership = await getMembershipForTeam(user.id, teamId);
      if (!membership) {
        throw new Error('Team not found');
      }
      team = await getTeamWithMembers(teamId);
    } else {
      const memberships = await getTeamsForUser(user.id);
      if (memberships.length === 0) {
        throw new Error('Team not found');
      }
      team = await getTeamWithMembers(memberships[0].teamId);
    }

    if (!team) {
      throw new Error('Team not found');
    }

    return action(formData, team);
  };
}
