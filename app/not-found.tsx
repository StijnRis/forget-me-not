import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DotGridTransition, GridPattern } from '@/components/marketing/grid-pattern';
import { NotFoundIllustration } from '@/components/marketing/not-found-illustration';
import { PublicHeader } from '@/components/marketing/public-header';

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] flex flex-col bg-black text-white">
      <section className="relative flex flex-1 flex-col overflow-hidden">
        <GridPattern />
        <PublicHeader variant="dark" />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-8 pt-4 text-center">
          <NotFoundIllustration />
          <h1 className="mt-10 font-serif text-4xl tracking-tight text-sky-400 sm:text-5xl md:text-6xl">
            Page not found
          </h1>
          <p className="mt-4 max-w-md text-base text-gray-400 sm:text-lg">
            It looks like the page you&apos;re looking for wandered off. Let&apos;s
            get you back to somewhere familiar.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-10 rounded-full bg-sky-500 px-8 text-white hover:bg-sky-400"
          >
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </section>

      <DotGridTransition />

      <footer className="bg-white px-4 py-10 text-gray-900 sm:px-6 lg:px-12">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
            <Heart className="h-5 w-5 text-sky-600" />
            Forget Me Not
          </Link>
          <div className="flex flex-wrap gap-6 text-sm text-gray-500">
            <Link href="/pricing" className="hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/sign-in" className="hover:text-gray-900">
              Login
            </Link>
            <Link href="/sign-up" className="hover:text-gray-900">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
