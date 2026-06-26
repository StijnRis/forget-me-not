'use client';

import { useActionState, useEffect } from 'react';
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
  Clock,
  Eye,
  Loader2,
  Trash2,
  UserCircle,
  UserPlus,
  Users,
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

  const teamName = teamData?.team.name ?? 'Family group';
  const members = teamData?.team.teamMembers ?? [];
  const currentMembership =
    members.find((member) => member.user.id === user?.id) ??
    (teamData?.membership
      ? {
          relationship: teamData.membership.relationship,
        }
      : undefined);

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
    if (profileState?.success) {
      void mutateUser();
      void mutateTeam();
    }
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-sky-600" />
            Your profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={profileAction} className="space-y-4">
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
                  defaultValue={currentMembership?.relationship ?? ''}
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
                  <p className="break-all text-xs bg-white p-2 rounded border">
                    {inviteState.inviteLink}
                  </p>
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
