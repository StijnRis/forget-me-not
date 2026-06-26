import {
  ActivityType,
  type NewActivityLog,
} from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';
import { activityLogs } from '@/lib/db/schema';

type LogActivityOptions = {
  ipAddress?: string;
  storyId?: number;
  reminderTitle?: string;
  habitId?: number;
};

export async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType,
  ipAddressOrOptions?: string | LogActivityOptions
) {
  if (teamId === null || teamId === undefined) {
    return;
  }

  let ipAddress = '';
  let storyId: number | undefined;
  let reminderTitle: string | undefined;
  let habitId: number | undefined;

  if (typeof ipAddressOrOptions === 'string') {
    ipAddress = ipAddressOrOptions;
  } else if (ipAddressOrOptions) {
    ipAddress = ipAddressOrOptions.ipAddress || '';
    storyId = ipAddressOrOptions.storyId;
    reminderTitle = ipAddressOrOptions.reminderTitle;
    habitId = ipAddressOrOptions.habitId;
  }

  let action: string = type;
  if (storyId != null) {
    action = `${type}:${storyId}`;
  } else if (habitId != null && reminderTitle != null) {
    action = `${type}:${habitId}|${encodeURIComponent(reminderTitle)}`;
  }

  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action,
    ipAddress,
  };
  await db.insert(activityLogs).values(newActivity);
}

export function parseMissedNotification(
  action: string
): { habitId: number; title: string } | null {
  if (!action.startsWith(`${ActivityType.MISSED_NOTIFICATION}:`)) {
    return null;
  }
  const payload = action.slice(`${ActivityType.MISSED_NOTIFICATION}:`.length);
  const pipeIndex = payload.indexOf('|');
  if (pipeIndex === -1) return null;
  const habitId = parseInt(payload.slice(0, pipeIndex), 10);
  const title = decodeURIComponent(payload.slice(pipeIndex + 1));
  if (Number.isNaN(habitId) || !title) return null;
  return { habitId, title };
}

export function parseViewStoryId(action: string): number | null {
  if (!action.startsWith(`${ActivityType.VIEW_STORY}:`)) {
    return null;
  }
  const id = parseInt(action.split(':')[1] ?? '', 10);
  return Number.isNaN(id) ? null : id;
}
