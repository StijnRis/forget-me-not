'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';
import useSWR from 'swr';
import { Suspense } from 'react';
import type { Team } from '@/lib/db/schema';
import { fetcher } from '@/lib/fetcher';

type TeamListItem = {
  id: number;
  role: string;
  team: Team;
};

function SubscriptionCard({ team }: { team: Team }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{team.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Plan: {team.planName || 'Free'} —{' '}
          {team.subscriptionStatus === 'active'
            ? 'Billed monthly'
            : team.subscriptionStatus === 'trialing'
              ? 'Trial period'
              : 'No active subscription'}
        </p>
        <form action={customerPortalAction}>
          <input type="hidden" name="teamId" value={team.id} />
          <Button type="submit" variant="outline">
            Manage subscription
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function BillingSection() {
  const { data: teams = [] } = useSWR<TeamListItem[]>('/api/teams', fetcher);

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>You are not in any family groups yet.</p>
          <Button asChild className="mt-4">
            <Link href="/teams">Go to my teams</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {teams.map((membership) => (
        <SubscriptionCard key={membership.team.id} team={membership.team} />
      ))}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <section className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-2">Billing</h1>
      <p className="text-muted-foreground mb-6">
        Manage subscriptions for your family groups. To manage members, stories,
        and reminders, open a team from{' '}
        <Link href="/teams" className="text-sky-600 hover:underline">
          My teams
        </Link>
        .
      </p>
      <Suspense fallback={<div className="h-32 animate-pulse bg-gray-100 rounded-lg" />}>
        <BillingSection />
      </Suspense>
    </section>
  );
}
