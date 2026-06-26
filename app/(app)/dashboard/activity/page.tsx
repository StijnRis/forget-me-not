import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  BookOpen,
  Trash2,
  Bell,
  UserCircle,
  Eye,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries';
import { parseMissedNotification } from '@/lib/activity';
import { cn } from '@/lib/utils';

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
  [ActivityType.CREATE_STORY]: BookOpen,
  [ActivityType.DELETE_STORY]: Trash2,
  [ActivityType.CREATE_HABIT]: Bell,
  [ActivityType.DELETE_HABIT]: Trash2,
  [ActivityType.UPDATE_PROFILE]: UserCircle,
  [ActivityType.VIEW_STORY]: Eye,
  [ActivityType.MISSED_NOTIFICATION]: TriangleAlert,
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function formatAction(action: ActivityType): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return 'You signed up';
    case ActivityType.SIGN_IN:
      return 'You signed in';
    case ActivityType.SIGN_OUT:
      return 'You signed out';
    case ActivityType.UPDATE_PASSWORD:
      return 'You changed your password';
    case ActivityType.DELETE_ACCOUNT:
      return 'You deleted your account';
    case ActivityType.UPDATE_ACCOUNT:
      return 'You updated your account';
    case ActivityType.CREATE_TEAM:
      return 'You created a new team';
    case ActivityType.REMOVE_TEAM_MEMBER:
      return 'You removed a team member';
    case ActivityType.INVITE_TEAM_MEMBER:
      return 'You invited a team member';
    case ActivityType.ACCEPT_INVITATION:
      return 'You accepted an invitation';
    case ActivityType.CREATE_STORY:
      return 'You added a story';
    case ActivityType.DELETE_STORY:
      return 'You removed a story';
    case ActivityType.CREATE_HABIT:
      return 'You scheduled a reminder';
    case ActivityType.DELETE_HABIT:
      return 'You removed a reminder';
    case ActivityType.UPDATE_PROFILE:
      return 'You updated your profile';
    case ActivityType.VIEW_STORY:
      return 'You finished watching a story';
    case ActivityType.MISSED_NOTIFICATION:
      return 'Missed notification';
    default:
      return 'Unknown action occurred';
  }
}

function formatActionLabel(action: string): string {
  const baseAction = action.split(':')[0] as ActivityType;
  if (baseAction === ActivityType.MISSED_NOTIFICATION) {
    const parsed = parseMissedNotification(action);
    if (parsed) {
      return `Missed notification: "${parsed.title}"`;
    }
    return 'Missed notification';
  }
  return formatAction(baseAction);
}

export default async function ActivityPage() {
  const logs = await getActivityLogs();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Activity Log
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <ul className="space-y-4">
              {logs.map((log) => {
                const baseAction = log.action.split(':')[0] as ActivityType;
                const isMissed = baseAction === ActivityType.MISSED_NOTIFICATION;
                const Icon = iconMap[baseAction] || Settings;
                const formattedAction = formatActionLabel(log.action);

                return (
                  <li
                    key={log.id}
                    className={cn(
                      'flex items-center space-x-4 rounded-lg p-3',
                      isMissed && 'border border-amber-300 bg-amber-50'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-full p-2',
                        isMissed ? 'bg-amber-200' : 'bg-orange-100'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-5 h-5',
                          isMissed ? 'text-amber-800' : 'text-orange-600'
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          isMissed ? 'text-amber-950' : 'text-gray-900'
                        )}
                      >
                        {formattedAction}
                        {log.ipAddress && ` from IP ${log.ipAddress}`}
                      </p>
                      <p
                        className={cn(
                          'text-xs',
                          isMissed ? 'text-amber-700' : 'text-gray-500'
                        )}
                      >
                        {getRelativeTime(new Date(log.timestamp))}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No activity yet
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                When you perform actions like signing in or updating your
                account, they'll appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
