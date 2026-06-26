'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { ActionState } from '@/lib/auth/middleware';
import { createTeam } from '@/app/(login)/actions';

export function CreateTeamForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createTeam,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <Label htmlFor="team-name" className="sr-only">
          Family group name
        </Label>
        <Input
          id="team-name"
          name="name"
          placeholder="e.g. The Johnson Family"
          required
        />
      </div>
      <Button type="submit" disabled={pending} className="shrink-0">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          'Create group'
        )}
      </Button>
      {state?.error && (
        <p className="text-red-500 text-sm w-full">{state.error}</p>
      )}
    </form>
  );
}
