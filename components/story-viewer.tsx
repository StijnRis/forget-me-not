'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import type { Habit, StoryWithAuthor } from '@/lib/db/schema';
import { formatCaregiverRelationship } from '@/lib/caregiver-relationships';
import { SpeakingStoryText } from '@/components/speaking-story-text';
import { teamStoryViewPath } from '@/lib/story-routes';
import { useStoryFullscreen } from '@/hooks/use-story-fullscreen';
import { cn } from '@/lib/utils';
import { fetcher } from '@/lib/fetcher';
import { getDisplayName, getInitials } from '@/lib/user-display';

const INACTIVITY_MS = 15 * 60 * 1000;

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
  storyId: number;
  teamName: string;
  previewMode?: boolean;
  initialStories?: StoryWithAuthor[];
  initialHabits?: Habit[];
};

type StoryTransition = 'initial' | 'older' | 'newer';

export function StoryViewer({
  teamId,
  storyId,
  teamName,
  previewMode = false,
  initialStories,
  initialHabits,
}: StoryViewerProps) {
  const router = useRouter();
  const [transition, setTransition] = useState<StoryTransition>('initial');
  const { data: stories = initialStories ?? [] } = useSWR<StoryWithAuthor[]>(
    `/api/teams/${teamId}/stories`,
    fetcher,
    {
      fallbackData: initialStories,
      revalidateOnMount: !initialStories,
      revalidateOnFocus: false,
    }
  );
  const { data: habits = initialHabits ?? [] } = useSWR<Habit[]>(
    `/api/teams/${teamId}/habits`,
    fetcher,
    {
      fallbackData: initialHabits,
      revalidateOnMount: !initialHabits,
      revalidateOnFocus: false,
    }
  );
  const [activeReminder, setActiveReminder] = useState<Habit | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const notifiedRef = useRef<Set<string>>(new Set());
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { needsGesture, enterFullscreen } = useStoryFullscreen();

  // Stories are oldest-first (index 0 = story 1, the oldest)
  const index = useMemo(() => {
    if (stories.length === 0) return -1;
    return stories.findIndex((s) => s.id === storyId);
  }, [stories, storyId]);

  const story = index >= 0 ? stories[index] : null;
  const authorName = story ? getDisplayName(story.author) : '';
  const storyNumber = index >= 0 ? index + 1 : 0;

  const navigateToIndex = useCallback(
    (targetIndex: number) => {
      if (stories.length === 0) return;
      const wrapped =
        ((targetIndex % stories.length) + stories.length) % stories.length;
      const target = stories[wrapped];
      setTransition(targetIndex < index ? 'older' : 'newer');
      router.push(teamStoryViewPath(teamId, target.id));
    },
    [stories, index, router, teamId]
  );

  const goToPrevious = useCallback(() => {
    navigateToIndex(index - 1);
  }, [index, navigateToIndex]);

  const goToNext = useCallback(() => {
    navigateToIndex(index + 1);
  }, [index, navigateToIndex]);

  useEffect(() => {
    setStoryProgress(0);
  }, [story?.id]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (stories.length <= 1) return;

    inactivityTimerRef.current = setTimeout(() => {
      goToNext();
    }, INACTIVITY_MS);
  }, [goToNext, stories.length]);

  useEffect(() => {
    if (!story) return;

    const events = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll'] as const;
    const onActivity = () => resetInactivityTimer();

    resetInactivityTimer();
    for (const event of events) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      for (const event of events) {
        window.removeEventListener(event, onActivity);
      }
    };
  }, [story?.id, resetInactivityTimer]);

  useEffect(() => {
    if (stories.length === 0 || index !== -1) return;
    const randomStory = stories[Math.floor(Math.random() * stories.length)];
    router.replace(teamStoryViewPath(teamId, randomStory.id));
  }, [stories, index, router, teamId]);

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

  const upcomingHabits = useMemo(
    () => [...habits].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)),
    [habits]
  );

  if (stories.length === 0 || !story) {
    return (
      <>
        {needsGesture && (
          <button
            type="button"
            onClick={() => void enterFullscreen()}
            className="fixed inset-0 z-50 flex items-center justify-center bg-sky-900/90 px-6 text-center text-2xl font-semibold text-white"
          >
            Tap anywhere to enter fullscreen
          </button>
        )}
        <main className="relative flex min-h-[100dvh] items-center justify-center bg-sky-50 px-6">
          {previewMode && (
            <div className="absolute top-0 left-0 right-0 bg-sky-100 border-b border-sky-200 px-4 py-2 text-center text-sm text-sky-800 flex items-center justify-center gap-2">
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
      </>
    );
  }

  const progressBarClass = story.imageUrl ? 'bg-white' : 'bg-sky-500';

  return (
    <>
      {needsGesture && (
        <button
          type="button"
          onClick={() => void enterFullscreen()}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 text-center text-2xl font-semibold text-white"
        >
          Tap anywhere to enter fullscreen
        </button>
      )}
      <main className="relative min-h-[100dvh] h-[100dvh] flex flex-col overflow-hidden pb-2">
      {previewMode && (
        <div className="relative z-20 bg-sky-100 border-b border-sky-200 px-4 py-2 text-center text-sm text-sky-800 flex items-center justify-center gap-2">
          <Eye className="h-4 w-4" />
          Preview mode
          <Link href={`/teams/${teamId}`} className="underline ml-2">
            Back to caregiver page
          </Link>
        </div>
      )}

      {story.imageUrl && (
        <div
          key={story.imageUrl}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
          style={{ backgroundImage: `url("${story.imageUrl}")` }}
        />
      )}
      <div
        className={`absolute inset-0 ${
          story.imageUrl
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

      <div
        key={story.id}
        className={cn(
          'relative z-10 flex flex-1 flex-col justify-center px-6 py-10 max-w-3xl mx-auto w-full min-w-0',
          'animate-in fade-in duration-500 fill-mode-both',
          transition === 'older' && 'slide-in-from-left-8',
          transition === 'newer' && 'slide-in-from-right-8'
        )}
      >
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-16 w-16 border-2 border-white shadow-md">
            <AvatarImage src={story.author.profileImageUrl || ''} alt={authorName} />
            <AvatarFallback className="text-xl bg-sky-200 text-sky-900">
              {getInitials(authorName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p
              className={`text-sm font-medium uppercase tracking-wide ${
                story.imageUrl ? 'text-white/80' : 'text-sky-700'
              }`}
            >
              Story from
            </p>
            <p
              className={`text-2xl font-bold ${
                story.imageUrl ? 'text-white' : 'text-gray-900'
              }`}
            >
              {authorName}
            </p>
            {story.author.relationship && (
              <p
                className={`text-lg ${
                  story.imageUrl ? 'text-white/90' : 'text-sky-800'
                }`}
              >
                {formatCaregiverRelationship(story.author.relationship)}
              </p>
            )}
          </div>
        </div>

        {story.title && (
          <h1
            className={cn(
              'text-3xl sm:text-4xl font-bold mb-6 break-words [overflow-wrap:anywhere]',
              story.imageUrl ? 'text-white' : 'text-gray-900'
            )}
          >
            {story.title}
          </h1>
        )}

        <SpeakingStoryText
          storyId={story.id}
          text={story.content}
          onLightBackground={!story.imageUrl}
          onProgress={setStoryProgress}
          onComplete={goToNext}
        />

        <div className="mt-10 flex items-center justify-between gap-4">
          <Button
            size="lg"
            variant="secondary"
            className="h-14 px-6 rounded-full text-lg"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-6 w-6 mr-1" />
            Previous
          </Button>
          <span
            className={`text-lg font-medium ${
              story.imageUrl ? 'text-white/90' : 'text-gray-600'
            }`}
          >
            Story {storyNumber} of {stories.length}
          </span>
          <Button
            size="lg"
            variant="secondary"
            className="h-14 px-6 rounded-full text-lg"
            onClick={goToNext}
          >
            Next
            <ChevronRight className="h-6 w-6 ml-1" />
          </Button>
        </div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-30 h-2 bg-black/20"
        role="progressbar"
        aria-valuenow={Math.round(storyProgress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Story reading progress"
      >
        <div
          className={cn('h-full transition-[width] duration-150 ease-linear', progressBarClass)}
          style={{ width: `${storyProgress * 100}%` }}
        />
      </div>
    </main>
    </>
  );
}
