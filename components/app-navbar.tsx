'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Flower2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { signOut } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';

export type NavItem = {
  href: string;
  label: string;
  matchPrefix?: boolean;
};

const loggedOutNavItems: NavItem[] = [
  { href: '/pricing', label: 'Pricing', matchPrefix: false },
];

const loggedInNavItems: NavItem[] = [
  { href: '/teams', label: 'My teams', matchPrefix: false },
  { href: '/dashboard/general', label: 'Account', matchPrefix: true },
];

const dashboardNavItems: NavItem[] = [
  { href: '/teams', label: 'My teams', matchPrefix: false },
  { href: '/dashboard', label: 'Billing', matchPrefix: false },
  { href: '/dashboard/general', label: 'Account', matchPrefix: true },
  { href: '/dashboard/activity', label: 'Activity', matchPrefix: true },
  { href: '/dashboard/security', label: 'Security', matchPrefix: true },
];

function getNavItems(pathname: string, user: User | null | undefined): NavItem[] {
  if (!user) {
    return loggedOutNavItems;
  }
  if (pathname.startsWith('/dashboard')) {
    return dashboardNavItems;
  }
  return loggedInNavItems;
}

export function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useSWR<User | null>('/api/user', fetcher);

  const items = getNavItems(pathname, user);
  const homeHref = user ? '/teams' : '/';

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  function isActive(item: NavItem) {
    if (item.matchPrefix) {
      return pathname.startsWith(item.href);
    }
    return pathname === item.href;
  }

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link href={homeHref} className="flex items-center gap-2 shrink-0">
            <Flower2 className="h-5 w-5 text-sky-600" />
            <span className="font-semibold text-gray-900 hidden sm:inline">
              Forget Me Not
            </span>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors',
                  isActive(item)
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="shrink-0">
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            ) : (
              <Button asChild size="sm" className="rounded-full">
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
