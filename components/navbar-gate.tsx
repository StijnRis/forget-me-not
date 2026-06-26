'use client';

import { usePathname } from 'next/navigation';
import { AppNavbar } from '@/components/app-navbar';
import { isTeamStoryViewPath } from '@/lib/story-routes';

export function NavbarGate() {
  const pathname = usePathname();

  if (isTeamStoryViewPath(pathname)) {
    return null;
  }

  return <AppNavbar />;
}
