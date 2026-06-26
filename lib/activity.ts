import {
  ActivityType,
  type NewActivityLog,
} from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';
import { activityLogs } from '@/lib/db/schema';

type LogActivityOptions = {
  ipAddress?: string;
  storyId?: number;
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

  if (typeof ipAddressOrOptions === 'string') {
    ipAddress = ipAddressOrOptions;
  } else if (ipAddressOrOptions) {
    ipAddress = ipAddressOrOptions.ipAddress || '';
    storyId = ipAddressOrOptions.storyId;
  }

  const action =
    storyId != null ? `${type}:${storyId}` : type;

  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action,
    ipAddress,
  };
  await db.insert(activityLogs).values(newActivity);
}

export function parseViewStoryId(action: string): number | null {
  if (!action.startsWith(`${ActivityType.VIEW_STORY}:`)) {
    return null;
  }
  const id = parseInt(action.split(':')[1] ?? '', 10);
  return Number.isNaN(id) ? null : id;
}
