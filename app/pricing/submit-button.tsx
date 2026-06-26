'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';

export function SubmitButton({ popular = false }: { popular?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      variant={popular ? 'default' : 'outline'}
      className={cn(
        'w-full rounded-full h-11 font-medium',
        popular
          ? 'bg-sky-600 text-white hover:bg-sky-500 border-0'
          : 'border-gray-300 text-gray-900 hover:bg-gray-50'
      )}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin mr-2 h-4 w-4" />
          Loading...
        </>
      ) : (
        <>
          {popular ? 'Start free trial' : 'Get started'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}
