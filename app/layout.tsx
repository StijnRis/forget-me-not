import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { NavbarGate } from '@/components/navbar-gate';

export const metadata: Metadata = {
  title: 'Forget Me Not — Stay connected through dementia',
  description:
    'Help families stay close to loved ones with dementia. Share personal stories, schedule gentle reminders, and give your loved one a simple, calming page designed for ease of use.',
};

export const viewport: Viewport = {
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="bg-white dark:bg-gray-950 text-black dark:text-white"
    >
      <body className="min-h-[100dvh] bg-gray-50">
        <Suspense fallback={null}>
          <NavbarGate />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
