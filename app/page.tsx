import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BatteryCharging,
  Bell,
  BookOpen,
  Calendar,
  Camera,
  Heart,
  ImageIcon,
  MapPin,
  Monitor,
  Sparkles,
  Users,
  Volume2,
  Wifi,
} from 'lucide-react';

export default function HomePage() {
  return (
    <main className="relative">
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-start gap-3">
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link href="/sign-in">Login</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-sky-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left lg:mx-0">
              <p className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-1.5 text-sm font-medium text-sky-800">
                <Heart className="h-4 w-4" />
                Supporting families through dementia
              </p>
              <h1 className="mt-6 text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Stay connected,
                <span className="block text-sky-600">one story at a time</span>
              </h1>
              <p className="mt-5 text-lg text-gray-600 sm:text-xl lg:text-lg xl:text-xl leading-relaxed">
                Forget Me Not helps families stay close to loved ones with
                dementia. Caregivers share personal stories and schedule gentle
                reminders — all through a simple, calming page designed for
                ease of use.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4 sm:justify-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full text-lg"
                >
                  <Link href="/pricing">View pricing</Link>
                </Button>
              </div>
            </div>

            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <StoryPreview />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Families create a shared group with two roles — caregivers who
              manage content, and a dedicated page for the person with dementia.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <StepCard
              step={1}
              icon={<Users className="h-6 w-6" />}
              title="Create your family group"
              description="Invite family members and caregivers. Each person gets their own profile with a photo, so your loved one always knows who is speaking."
            />
            <StepCard
              step={2}
              icon={<BookOpen className="h-6 w-6" />}
              title="Share stories & reminders"
              description="Record personal memories, attach photos, and schedule habits like meals, exercise, or medication — all from an easy caregiver dashboard."
            />
            <StepCard
              step={3}
              icon={<Sparkles className="h-6 w-6" />}
              title="One simple page for them"
              description="Your loved one opens a single, distraction-free page. They read stories, see familiar faces, and receive gentle reminders — nothing more."
            />
          </div>
        </div>
      </section>

      {/* For Person with Dementia */}
      <section className="py-16 bg-sky-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
              For your loved one
            </p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              A page designed for clarity and comfort
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              No menus, no clutter — just the stories and reminders that matter,
              presented in a way that feels familiar and reassuring.
            </p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Simple & intuitive"
              description="One page, no unnecessary buttons or complex navigation. Open it and start reading."
            />
            <FeatureCard
              icon={<Bell className="h-6 w-6" />}
              title="Habit reminders"
              description="Gentle notifications for daily routines — breakfast, lunch, exercise, or medication — with a distinctive alert sound."
            />
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Family stories"
              description="Read personal stories recorded by family members, with the storyteller's photo always visible."
            />
            <FeatureCard
              icon={<ImageIcon className="h-6 w-6" />}
              title="Photos alongside stories"
              description="When a caregiver adds a photo to a story, it appears as the background while the text is read aloud."
            />
          </div>
        </div>
      </section>

      {/* For Caregivers */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
              For family members & caregivers
            </p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything you need to stay connected
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Write down the memories that matter, attach photos that spark
              recognition, and keep daily routines on track — all from one
              place.
            </p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Personal stories"
              description="Write and share stories that preserve family history, inside jokes, and the moments that define your relationship."
            />
            <FeatureCard
              icon={<Camera className="h-6 w-6" />}
              title="Photo attachments"
              description="Add photos to each story so memories come alive visually while your loved one reads along."
            />
            <FeatureCard
              icon={<Calendar className="h-6 w-6" />}
              title="Habit scheduling"
              description="Use a calendar to set reminders at specific times — meals, sports, medication, and anything else in the daily routine."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Individual profiles"
              description="Each family member or caregiver has their own profile with a photo, displayed alongside their stories."
            />
            <FeatureCard
              icon={<Volume2 className="h-6 w-6" />}
              title="Recognizable voices & faces"
              description="Profile pictures help your loved one instantly recognize who recorded each story, building trust and warmth."
            />
            <FeatureCard
              icon={<Heart className="h-6 w-6" />}
              title="Shared family group"
              description="Collaborate with siblings, spouses, and professional caregivers in one secure family group."
            />
          </div>
        </div>
      </section>

      {/* Caregiver tips */}
      <section className="py-16 bg-sky-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
              Practical tips
            </p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Set up the device for success
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A few simple habits help your loved one find and use their page
              every day — without needing to remember how.
            </p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <TipCard
              icon={<Monitor className="h-6 w-6" />}
              title="Keep the page open"
              description="Leave the dementia-friendly view open on the device so your loved one can return to it with a single tap — no searching through apps or menus."
            />
            <TipCard
              icon={<MapPin className="h-6 w-6" />}
              title="One consistent spot"
              description="Place the tablet or phone in the same easy-to-find location every day — like the kitchen table or beside their favourite chair."
            />
            <TipCard
              icon={<BatteryCharging className="h-6 w-6" />}
              title="Stay charged & connected"
              description="Keep the device plugged in or on a charging stand, and make sure it stays connected to Wi-Fi so stories and reminders arrive on time."
            />
            <TipCard
              icon={<Wifi className="h-6 w-6" />}
              title="Check the connection"
              description="A stable internet connection ensures new stories appear and habit reminders play reliably — test it from the same spot where the device lives."
            />
            <TipCard
              icon={<Volume2 className="h-6 w-6" />}
              title="Comfortable volume & brightness"
              description="Set the volume loud enough to hear reminders and story narration, and keep the screen brightness comfortable for reading."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Bring your family closer together
              </h2>
              <p className="mt-4 text-lg text-gray-300 leading-relaxed">
                Start with a free trial. Set up your family group in minutes,
                invite caregivers, and give your loved one a page they'll
                actually enjoy opening.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex flex-col sm:flex-row gap-4 lg:justify-end">
              <Button
                asChild
                size="lg"
                className="rounded-full text-lg bg-sky-500 hover:bg-sky-600"
              >
                <Link href="/sign-up">
                  Start free trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="rounded-full text-lg bg-white text-gray-900 hover:bg-gray-100"
              >
                <Link href="/pricing">See plans & pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StoryPreview() {
  return (
    <div className="relative mx-auto max-w-md lg:max-w-none">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
        <div
          className="relative h-48 bg-cover bg-center"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop")',
          }}
        />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-semibold text-lg">
              M
            </div>
            <div>
              <p className="font-semibold text-gray-900">Maria</p>
              <p className="text-sm text-gray-500">Your daughter</p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed text-lg">
            "Remember when we picked forget-me-nots in grandma's garden every
            spring? You always said the blue ones were your favorite..."
          </p>
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 hidden sm:flex items-center gap-2 rounded-full bg-white border border-gray-200 shadow-lg px-4 py-2">
        <Bell className="h-4 w-4 text-sky-600" />
        <span className="text-sm font-medium text-gray-700">
          Lunch reminder · 12:30
        </span>
      </div>
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-sm">
          {step}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500 text-white">
          {icon}
        </div>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-500 text-white">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function TipCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-sky-100 bg-white p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
