'use client';

import { useActionState, useEffect } from 'react';
import { acceptInvitation } from '@/app/(login)/actions';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ActionState } from '@/lib/auth/middleware';

export function AcceptInviteButton({ invitationId }: { invitationId: number }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(
    acceptInvitation,
    {}
  );

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state?.success, router]);

  return (
    <form action={action}>
      <input type="hidden" name="invitationId" value={invitationId} />
      {state?.error && (
        <p className="text-red-500 text-sm mb-2">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-green-600 text-sm mb-2">{state.success}</p>
      )}
      <Button type="submit" disabled={pending} className="rounded-full">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Joining...
          </>
        ) : (
          'Accept invitation'
        )}
      </Button>
    </form>
  );
}
