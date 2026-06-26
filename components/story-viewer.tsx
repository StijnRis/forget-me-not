'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import type { Habit, StoryWithAuthor } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function getDisplayName(author: StoryWithAuthor['author']) {
  return author.name || author.email.split('@')[0];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function playReminderSound() {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(523.25, context.currentTime);
  oscillator.frequency.setValueAtTime(659.25, context.currentTime + 0.15);
  oscillator.frequency.setValueAtTime(783.99, context.currentTime + 0.3);

  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.3, context.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.8);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.85);
}

type StoryViewerProps = {
  teamId: number;
  teamName: string;
  previewMode?: boolean;
};

export function StoryViewer({ teamId, teamName, previewMode = false }: StoryViewerProps) {
  const { data: stories = [] } = useSWR<StoryWithAuthor[]>(
    `/api/teams/${teamId}/stories`,
    fetcher
  );
  const { data: habits = [] } = useSWR<Habit[]>(
    `/api/teams/${teamId}/habits`,
    fetcher
  );
  const [index, setIndex] = useState(0);
  const [activeReminder, setActiveReminder] = useState<Habit | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  const story = stories[index] ?? null;
  const authorName = story ? getDisplayName(story.author) : '';

  const checkReminders = useCallback(() => {
    const now = new Date();
    const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (const habit of habits) {
      const key = `${habit.id}-${now.toDateString()}-${habit.scheduledTime}`;
      if (habit.scheduledTime === current && !notifiedRef.current.has(key)) {
        notifiedRef.current.add(key);
        setActiveReminder(habit);
        playReminderSound();
      }
    }
  }, [habits]);

  useEffect(() => {
    checkReminders();
    const interval = setInterval(checkReminders, 30_000);
    return () => clearInterval(interval);
  }, [checkReminders]);

  useEffect(() => {
    if (stories.length > 0 && index >= stories.length) {
      setIndex(0);
    }
  }, [stories.length, index]);

  const upcomingHabits = useMemo(
    () => [...habits].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)),
    [habits]
  );

  if (stories.length === 0) {
    return (
      <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-sky-50 px-6">
        {previewMode && (
          <div className="absolute top-16 left-0 right-0 bg-sky-100 border-b border-sky-200 px-4 py-2 text-center text-sm text-sky-800 flex items-center justify-center gap-2">
            <Eye className="h-4 w-4" />
            Preview mode — this is how {teamName} looks to your loved one
          </div>
        )}
        <div className="max-w-lg text-center">
          <h1 className="text-4xl font-bold text-gray-900">Good day</h1>
          <p className="mt-4 text-xl text-gray-600 leading-relaxed">
            {previewMode
              ? 'No stories yet. Add some from the caregiver page.'
              : 'Your family is preparing stories for you. Check back soon.'}
          </p>
          {upcomingHabits.length > 0 && (
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm text-left">
              <p className="text-sm font-medium text-sky-700 uppercase tracking-wide">
                Today&apos;s reminders
              </p>
              <ul className="mt-3 space-y-2">
                {upcomingHabits.map((habit) => (
                  <li key={habit.id} className="flex items-center gap-3 text-lg text-gray-800">
                    <Bell className="h-5 w-5 text-sky-600 shrink-0" />
                    <span>
                      {habit.title} at {habit.scheduledTime}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {previewMode && (
            <Button asChild className="mt-6 rounded-full" variant="outline">
              <Link href={`/teams/${teamId}`}>Back to caregiver page</Link>
            </Button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-[calc(100dvh-3.5rem)] flex flex-col">
      {previewMode && (
        <div className="relative z-20 bg-sky-100 border-b border-sky-200 px-4 py-2 text-center text-sm text-sky-800 flex items-center justify-center gap-2">
          <Eye className="h-4 w-4" />
          Preview mode
          <Link href={`/teams/${teamId}`} className="underline ml-2">
            Back to caregiver page
          </Link>
        </div>
      )}

      {story?.imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${story.imageUrl}")` }}
        />
      )}
      <div
        className={`absolute inset-0 ${
          story?.imageUrl
            ? 'bg-gradient-to-b from-black/50 via-black/40 to-black/70'
            : 'bg-gradient-to-b from-sky-100 to-sky-50'
        }`}
      />

      {activeReminder && (
        <div className="relative z-20 mx-4 mt-4 rounded-2xl bg-amber-400 px-6 py-5 shadow-lg animate-pulse">
          <div className="flex items-center gap-4">
            <Bell className="h-8 w-8 text-amber-900 shrink-0" />
            <div>
              <p className="text-lg font-bold text-amber-950">Reminder</p>
              <p className="text-2xl font-semibold text-amber-950">
                {activeReminder.title}
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              className="ml-auto rounded-full"
              onClick={() => setActiveReminder(null)}
            >
              OK
            </Button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-10 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-16 w-16 border-2 border-white shadow-md">
            <AvatarImage src={story?.author.profileImageUrl || ''} alt={authorName} />
            <AvatarFallback className="text-xl bg-sky-200 text-sky-900">
              {getInitials(authorName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p
              className={`text-sm font-medium uppercase tracking-wide ${
                story?.imageUrl ? 'text-white/80' : 'text-sky-700'
              }`}
            >
              Story from
            </p>
            <p
              className={`text-2xl font-bold ${
                story?.imageUrl ? 'text-white' : 'text-gray-900'
              }`}
            >
              {authorName}
            </p>
          </div>
        </div>

        {story?.title && (
          <h1
            className={`text-3xl sm:text-4xl font-bold mb-6 ${
              story.imageUrl ? 'text-white' : 'text-gray-900'
            }`}
          >
            {story.title}
          </h1>
        )}

        <p
          className={`text-2xl sm:text-3xl leading-relaxed ${
            story?.imageUrl ? 'text-white' : 'text-gray-800'
          }`}
        >
          {story?.content}
        </p>

        <div className="mt-10 flex items-center justify-between gap-4">
          <Button
            size="lg"
            variant="secondary"
            className="h-14 px-6 rounded-full text-lg"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className="h-6 w-6 mr-1" />
            Previous
          </Button>
          <span
            className={`text-lg font-medium ${
              story?.imageUrl ? 'text-white/90' : 'text-gray-600'
            }`}
          >
            {index + 1} of {stories.length}
          </span>
          <Button
            size="lg"
            variant="secondary"
            className="h-14 px-6 rounded-full text-lg"
            disabled={index >= stories.length - 1}
            onClick={() => setIndex((i) => Math.min(stories.length - 1, i + 1))}
          >
            Next
            <ChevronRight className="h-6 w-6 ml-1" />
          </Button>
        </div>
      </div>
    </main>
  );
}
