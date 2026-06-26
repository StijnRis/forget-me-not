'use client';

import { usePathname } from 'next/navigation';
import { AppNavbar } from '@/components/app-navbar';
import { isTeamStoryViewPath } from '@/lib/story-routes';

const PUBLIC_PATHS = new Set(['/', '/sign-in', '/sign-up', '/pricing']);

export function NavbarGate() {
  const pathname = usePathname();

  if (PUBLIC_PATHS.has(pathname) || isTeamStoryViewPath(pathname)) {
    return null;
  }

  return <AppNavbar />;
}
