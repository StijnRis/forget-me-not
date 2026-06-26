'use client';

import { useActionState, useEffect, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  createHabit,
  createStory,
  deleteHabit,
  deleteStory,
  updateProfile,
} from '@/app/(app)/actions';
import { inviteTeamMember, removeTeamMember } from '@/lib/actions/auth';
import type { Habit, StoryWithAuthor, Team, TeamMember, User } from '@/lib/db/schema';
import { TEAM_ROLE_LABELS, TeamRole, isCaregiver } from '@/lib/team-roles';
import { formatCaregiverRelationship } from '@/lib/caregiver-relationships';
import {
  Bell,
  BookOpen,
  Check,
  Clock,
  Eye,
  Loader2,
  Trash2,
  TriangleAlert,
  UserCircle,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { fetcher } from '@/lib/fetcher';
import { getDisplayName, getInitials } from '@/lib/user-display';

type ActionState = { error?: string; success?: string; inviteLink?: string };

type TeamResponse = {
  team: Team & {
    teamMembers: (TeamMember & {
      user: Pick<User, 'id' | 'name' | 'email' | 'profileImageUrl'>;
    })[];
  };
  membership: { role: string; relationship: string | null };
};

type EngagementResponse = {
  viewers: Array<{
    userId: number;
    name: string;
    lastActiveAt: string | null;
    watchedStoryIds: number[];
  }>;
  stories: Array<{
    id: number;
    title: string | null;
    content: string;
  }>;
  missedNotifications: Array<{
    userId: number;
    userName: string;
    habitId: number;
    title: string;
    timestamp: string;
  }>;
};

function formatLastActive(dateStr: string | null) {
  if (!dateStr) return 'Not watched yet';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function storyLabel(story: { title: string | null; content: string }, index: number) {
  if (story.title?.trim()) return story.title;
  const preview = story.content.trim().slice(0, 24);
  return preview.length < story.content.trim().length ? `${preview}…` : preview || `Story ${index + 1}`;
}

function formatRole(role: string) {
  return TEAM_ROLE_LABELS[role as TeamRole] ?? role.replace(/_/g, ' ');
}

export function TeamCaregiverDashboard({ teamId }: { teamId: number }) {
  const apiBase = `/api/teams/${teamId}`;
  const { data: stories = [], mutate: mutateStories } = useSWR<StoryWithAuthor[]>(
    `${apiBase}/stories`,
    fetcher
  );
  const { data: habits = [], mutate: mutateHabits } = useSWR<Habit[]>(
    `${apiBase}/habits`,
    fetcher
  );
  const { data: teamData, mutate: mutateTeam } = useSWR<TeamResponse>(
    `/api/teams/${teamId}`,
    fetcher
  );
  const { data: user, mutate: mutateUser } = useSWR<User>('/api/user', fetcher);
  const { data: engagement } = useSWR<EngagementResponse>(
    `${apiBase}/engagement`,
    fetcher,
    { refreshInterval: 30_000 }
  );

  const teamName = teamData?.team.name ?? 'Family group';
  const members = teamData?.team.teamMembers ?? [];
  const membershipRelationship =
    teamData?.membership.relationship ??
    members.find((member) => member.user.id === user?.id)?.relationship ??
    '';

  const [storyState, storyAction, storyPending] = useActionState<ActionState, FormData>(
    createStory,
    {}
  );
  const [habitState, habitAction, habitPending] = useActionState<ActionState, FormData>(
    createHabit,
    {}
  );
  const [profileState, profileAction, profilePending] = useActionState<ActionState, FormData>(
    updateProfile,
    {}
  );
  const [inviteState, inviteAction, invitePending] = useActionState<ActionState, FormData>(
    inviteTeamMember,
    {}
  );
  const [removeState, removeAction, removePending] = useActionState<ActionState, FormData>(
    removeTeamMember,
    {}
  );
  const [deleteStoryState, deleteStoryAction] = useActionState<ActionState, FormData>(deleteStory, {});
  const [deleteHabitState, deleteHabitAction] = useActionState<ActionState, FormData>(deleteHabit, {});
  const [profileFormKey, setProfileFormKey] = useState(0);

  useEffect(() => {
    if (storyState?.success) void mutateStories();
  }, [storyState?.success, mutateStories]);

  useEffect(() => {
    if (habitState?.success) void mutateHabits();
  }, [habitState?.success, mutateHabits]);

  useEffect(() => {
    if (deleteStoryState?.success) void mutateStories();
  }, [deleteStoryState?.success, mutateStories]);

  useEffect(() => {
    if (deleteHabitState?.success) void mutateHabits();
  }, [deleteHabitState?.success, mutateHabits]);

  useEffect(() => {
    if (!profileState?.success) return;

    void (async () => {
      await Promise.all([mutateUser(), mutateTeam()]);
      // Remount form so fields reflect saved values (React resets forms after actions).
      setProfileFormKey((key) => key + 1);
    })();
  }, [profileState?.success, mutateUser, mutateTeam]);

  useEffect(() => {
    if (inviteState?.success || removeState?.success) void mutateTeam();
  }, [inviteState?.success, removeState?.success, mutateTeam]);

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-sky-600 font-medium">
            <Link href="/teams" className="hover:underline">
              My teams
            </Link>
            {' / '}
            {teamName}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
            Caregiver page
          </h1>
          <p className="mt-1 text-gray-600">
            Stories, reminders, and family members for this group
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/teams/${teamId}/view`}>
            <Eye className="h-4 w-4 mr-2" />
            Preview story view
          </Link>
        </Button>
      </div>

      {engagement && engagement.missedNotifications.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 shadow-md ring-1 ring-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <TriangleAlert className="h-5 w-5" />
              Missed reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-amber-800">
              These reminders were shown but not dismissed within an hour.
            </p>
            <ul className="space-y-2">
              {engagement.missedNotifications.map((event) => (
                <li
                  key={`${event.userId}-${event.habitId}-${event.timestamp}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-amber-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-amber-950">{event.title}</p>
                    <p className="text-sm text-amber-800">
                      {event.userName} did not dismiss this reminder
                    </p>
                  </div>
                  <p className="text-sm text-amber-700 flex items-center gap-1 shrink-0">
                    <Clock className="h-4 w-4" />
                    {formatLastActive(event.timestamp)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-sky-600" />
            Story watching activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-600">
            See whether the person with dementia has finished listening to each story.
            A check appears after they hear a story all the way through.
          </p>

          {!engagement ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
          ) : engagement.viewers.length === 0 ? (
            <p className="text-sm text-gray-500 rounded-lg border border-dashed p-4">
              No person with dementia profile in this group yet. Invite someone with
              that role to track story watching here.
            </p>
          ) : engagement.stories.length === 0 ? (
            <p className="text-sm text-gray-500 rounded-lg border border-dashed p-4">
              Add stories first — watching activity will appear here once they listen.
            </p>
          ) : (
            engagement.viewers.map((viewer) => {
              const watchedSet = new Set(viewer.watchedStoryIds);
              const watchedCount = engagement.stories.filter((s) =>
                watchedSet.has(s.id)
              ).length;

              return (
                <div key={viewer.userId} className="rounded-xl border bg-gray-50 p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">{viewer.name}</p>
                      <p className="text-sm text-gray-500">
                        Person with dementia · {watchedCount} of {engagement.stories.length}{' '}
                        stories watched
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Last active: {formatLastActive(viewer.lastActiveAt)}
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="pb-2 pr-4 font-medium">Story</th>
                          <th className="pb-2 font-medium text-center w-24">Watched</th>
                        </tr>
                      </thead>
                      <tbody>
                        {engagement.stories.map((story, index) => {
                          const watched = watchedSet.has(story.id);
                          return (
                            <tr key={story.id} className="border-b border-gray-100 last:border-0">
                              <td className="py-2.5 pr-4 text-gray-800">
                                <span className="text-gray-400 mr-2">{index + 1}.</span>
                                {storyLabel(story, index)}
                              </td>
                              <td className="py-2.5 text-center">
                                {watched ? (
                                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-700">
                                    <Check className="h-4 w-4" />
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 text-gray-500">
                                    <X className="h-4 w-4" />
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-sky-600" />
            Your profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form key={profileFormKey} action={profileAction} className="space-y-4">
            <input type="hidden" name="teamId" value={teamId} />
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={user?.profileImageUrl || ''}
                  alt={getDisplayName(user ?? { name: null, email: '' })}
                />
                <AvatarFallback>
                  {getInitials(getDisplayName(user ?? { name: null, email: 'U' }))}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-gray-500">
                Your photo appears next to every story you share.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={user?.name || ''}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="profileImageUrl">Profile photo URL</Label>
                <Input
                  id="profileImageUrl"
                  name="profileImageUrl"
                  type="url"
                  defaultValue={user?.profileImageUrl || ''}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="relationship">Relationship</Label>
                <Input
                  id="relationship"
                  name="relationship"
                  defaultValue={membershipRelationship}
                  placeholder="e.g. Daughter, son, friend, neighbour"
                  maxLength={50}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  How you are related to the person with dementia in this group.
                </p>
              </div>
            </div>
            {profileState?.error && (
              <p className="text-red-500 text-sm">{profileState.error}</p>
            )}
            {profileState?.success && (
              <p className="text-green-600 text-sm">{profileState.success}</p>
            )}
            <Button type="submit" disabled={profilePending}>
              {profilePending ? 'Saving...' : 'Save profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-600" />
            Family members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-3">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={member.user.profileImageUrl || ''}
                      alt={getDisplayName(member.user)}
                    />
                    <AvatarFallback>
                      {getInitials(getDisplayName(member.user))}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{getDisplayName(member.user)}</p>
                    <p className="text-sm text-gray-500">
                      {formatRole(member.role)}
                      {isCaregiver(member.role) &&
                        member.relationship &&
                        ` · ${formatCaregiverRelationship(member.relationship)}`}
                    </p>
                  </div>
                </div>
                {member.user.id !== user?.id && (
                  <form action={removeAction}>
                    <input type="hidden" name="teamId" value={teamId} />
                    <input type="hidden" name="memberId" value={member.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      disabled={removePending}
                    >
                      Remove
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          {removeState?.error && (
            <p className="text-red-500 text-sm">{removeState.error}</p>
          )}

          <form action={inviteAction} className="space-y-4 rounded-xl border bg-gray-50 p-4">
            <p className="font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invite someone
            </p>
            <input type="hidden" name="teamId" value={teamId} />
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="family@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Role</Label>
              <RadioGroup
                defaultValue={TeamRole.CAREGIVER}
                name="role"
                className="flex flex-col sm:flex-row gap-4 mt-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={TeamRole.CAREGIVER} id="invite-caregiver" />
                  <Label htmlFor="invite-caregiver">Caregiver</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value={TeamRole.PERSON_WITH_DEMENTIA}
                    id="invite-dementia"
                  />
                  <Label htmlFor="invite-dementia">Person with dementia</Label>
                </div>
              </RadioGroup>
            </div>
            {inviteState?.error && (
              <p className="text-red-500 text-sm">{inviteState.error}</p>
            )}
            {inviteState?.success && (
              <div className="text-green-700 text-sm space-y-1">
                <p>{inviteState.success}</p>
                {inviteState.inviteLink && (
                  <a
                    href={inviteState.inviteLink}
                    className="block break-all text-xs bg-white p-2 rounded border text-sky-700 hover:underline"
                  >
                    {inviteState.inviteLink}
                  </a>
                )}
              </div>
            )}
            <Button type="submit" disabled={invitePending}>
              {invitePending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send invitation'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-sky-600" />
            Personal stories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={storyAction} className="space-y-4 rounded-xl border bg-gray-50 p-4">
            <input type="hidden" name="teamId" value={teamId} />
            <div>
              <Label htmlFor="title">Title (optional)</Label>
              <Input id="title" name="title" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="content">Story</Label>
              <textarea
                id="content"
                name="content"
                required
                rows={4}
                className="mt-1 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="imageUrl">Photo URL (optional)</Label>
              <Input id="imageUrl" name="imageUrl" type="url" className="mt-1" />
            </div>
            {storyState?.error && (
              <p className="text-red-500 text-sm">{storyState.error}</p>
            )}
            {storyState?.success && (
              <p className="text-green-600 text-sm">{storyState.success}</p>
            )}
            <Button type="submit" disabled={storyPending}>
              Add story
            </Button>
          </form>

          <ul className="space-y-4">
            {stories.map((story) => (
              <li key={story.id} className="rounded-xl border p-4 flex gap-4">
                {story.imageUrl && (
                  <div
                    className="w-24 h-24 rounded-lg bg-cover bg-center shrink-0"
                    style={{ backgroundImage: `url("${story.imageUrl}")` }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  {story.title && (
                    <p className="font-semibold">{story.title}</p>
                  )}
                  <p className="text-gray-700 mt-1 line-clamp-3">{story.content}</p>
                </div>
                <form action={deleteStoryAction}>
                  <input type="hidden" name="teamId" value={teamId} />
                  <input type="hidden" name="storyId" value={story.id} />
                  <Button type="submit" variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-gray-400" />
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-sky-600" />
            Habits & reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={habitAction} className="space-y-4 rounded-xl border bg-gray-50 p-4">
            <input type="hidden" name="teamId" value={teamId} />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="habit-title">Reminder</Label>
                <Input id="habit-title" name="title" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="scheduledTime">Time</Label>
                <Input
                  id="scheduledTime"
                  name="scheduledTime"
                  type="time"
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              e.g. breakfast 08:00, lunch 12:30, medicine 20:00
            </p>
            {habitState?.error && (
              <p className="text-red-500 text-sm">{habitState.error}</p>
            )}
            {habitState?.success && (
              <p className="text-green-600 text-sm">{habitState.success}</p>
            )}
            <Button type="submit" disabled={habitPending}>
              Add reminder
            </Button>
          </form>

          <ul className="space-y-2">
            {habits.map((habit) => (
              <li
                key={habit.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-sky-600" />
                  <span className="font-medium">{habit.title}</span>
                  <span className="text-gray-500">{habit.scheduledTime}</span>
                </div>
                <form action={deleteHabitAction}>
                  <input type="hidden" name="teamId" value={teamId} />
                  <input type="hidden" name="habitId" value={habit.id} />
                  <Button type="submit" variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-gray-400" />
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
