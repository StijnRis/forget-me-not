import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PublicHeaderProps = {
  variant?: 'dark' | 'light';
  sticky?: boolean;
};

export function PublicHeader({ variant = 'dark', sticky = false }: PublicHeaderProps) {
  const isDark = variant === 'dark';

  return (
    <header
      className={cn(
        'relative z-10 flex items-center justify-between px-4 sm:px-6 lg:px-12 h-14',
        sticky && 'sticky top-0 z-50 border-b backdrop-blur-sm',
        sticky && isDark && 'border-white/10 bg-black/90',
        sticky && !isDark && 'border-gray-200/80 bg-white/95'
      )}
    >
      <Link
        href="/"
        className={cn(
          'text-sm font-medium transition-colors',
          isDark ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'
        )}
      >
        Home
      </Link>
      <Link
        href="/"
        className={cn(
          'absolute left-1/2 -translate-x-1/2 flex items-center gap-2 font-semibold tracking-tight',
          isDark ? 'text-white' : 'text-gray-900'
        )}
      >
        <Heart className={cn('h-5 w-5', isDark ? 'text-sky-400' : 'text-sky-600')} />
        <span className="hidden sm:inline">Forget Me Not</span>
      </Link>
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          asChild
          size="sm"
          variant="outline"
          className={cn(
            'rounded-full',
            isDark &&
              'border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white'
          )}
        >
          <Link href="/sign-in">Login</Link>
        </Button>
        <Button
          asChild
          size="sm"
          className={cn('rounded-full', isDark && 'bg-sky-500 hover:bg-sky-400 text-white')}
        >
          <Link href="/sign-up">Sign up</Link>
        </Button>
      </div>
    </header>
  );
}
