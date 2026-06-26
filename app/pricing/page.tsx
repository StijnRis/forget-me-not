import Link from 'next/link';
import { checkoutAction } from '@/lib/payments/actions';
import { Check, Minus } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { SubmitButton } from './submit-button';
import { GridPattern } from '@/components/marketing/grid-pattern';
import { PublicHeader } from '@/components/marketing/public-header';

export default function PricingPage() {
  return (
    <main className="bg-white">
      <PublicHeader variant="dark" sticky />

      <section className="relative overflow-hidden bg-black pb-20 pt-0 text-white sm:pb-28">
        <GridPattern />

        <div className="relative z-10 mx-auto mt-6 max-w-3xl px-4 sm:mt-10 sm:px-6">
          <div className="relative">
            <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600">
              01. Pricing
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-xl sm:px-10 sm:py-14">
              <h1 className="font-serif text-3xl leading-tight text-gray-900 sm:text-4xl md:text-[2.75rem]">
                Plans to keep{' '}
                <span className="italic text-sky-600">your family connected</span>
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-base text-gray-500 sm:text-lg">
                Simple pricing for caregivers sharing stories and gentle reminders
                with a loved one who has dementia.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <Suspense fallback={<PricingSkeleton />}>
            <PricingPlans />
          </Suspense>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-24">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
          F.A.Q.
        </p>
        <h2 className="mt-3 text-center font-serif text-3xl text-gray-900 sm:text-4xl">
          Frequently asked questions
        </h2>
        <dl className="mt-12 divide-y divide-gray-200 border-t border-gray-200">
          <FaqItem
            question="What's included in the free trial?"
            answer="Both plans include a free trial period so your family can set up stories, invite members, and try the calm story view before you're billed."
          />
          <FaqItem
            question="Can I switch plans later?"
            answer="Yes. You can upgrade or downgrade from your account settings at any time. Changes take effect on your next billing cycle."
          />
          <FaqItem
            question="Who counts as a family member?"
            answer="Caregivers and the person with dementia each have their own profile. Base supports up to 5 members; Plus supports unlimited family members in one group."
          />
          <FaqItem
            question="Do I need a credit card to start?"
            answer="You'll enter payment details when starting a trial, but you won't be charged until the trial ends. Cancel anytime before then."
          />
        </dl>
        <p className="mt-10 text-center text-sm text-gray-500">
          Still have questions?{' '}
          <Link href="/sign-up" className="font-medium text-sky-600 hover:underline">
            Get started for free
          </Link>{' '}
          and explore the caregiver dashboard.
        </p>
      </section>
    </main>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="py-6">
      <dt className="text-base font-semibold text-gray-900">{question}</dt>
      <dd className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">{answer}</dd>
    </div>
  );
}

function PricingSkeleton() {
  return (
    <div className="grid md:grid-cols-2">
      {[0, 1].map((key) => (
        <div
          key={key}
          className={`space-y-5 p-8 sm:p-10 animate-pulse ${key === 0 ? 'md:border-r border-gray-200' : ''}`}
        >
          <div className="h-7 w-20 rounded bg-gray-200" />
          <div className="h-10 w-32 rounded bg-gray-100" />
          <div className="h-4 w-40 rounded bg-gray-100" />
          <div className="h-11 w-full rounded-full bg-gray-200" />
          <div className="space-y-3 pt-4">
            <div className="h-4 rounded bg-gray-100" />
            <div className="h-4 rounded bg-gray-100" />
            <div className="h-4 w-3/4 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function PricingPlans() {
  await connection();

  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const basePlan = products.find((product) => product.name === 'Base');
  const plusPlan = products.find((product) => product.name === 'Plus');

  const basePrice = prices.find((price) => price.productId === basePlan?.id);
  const plusPrice = prices.find((price) => price.productId === plusPlan?.id);

  return (
    <div className="grid md:grid-cols-2">
      <PricingCard
        name={basePlan?.name || 'Base'}
        price={basePrice?.unitAmount || 800}
        interval={basePrice?.interval || 'month'}
        trialDays={basePrice?.trialPeriodDays || 7}
        description="For smaller families getting started"
        features={[
          'Unlimited stories & reminders',
          'Up to 5 family members',
          'Calm story view for your loved one',
          'Email support',
        ]}
        priceId={basePrice?.id}
      />
      <PricingCard
        name={plusPlan?.name || 'Plus'}
        price={plusPrice?.unitAmount || 1200}
        interval={plusPrice?.interval || 'month'}
        trialDays={plusPrice?.trialPeriodDays || 7}
        description="For larger families who need more"
        popular
        features={[
          'Everything in Base, plus:',
          'Unlimited family members',
          'Story watching activity insights',
          'Priority support',
        ]}
        priceId={plusPrice?.id}
      />
    </div>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  description,
  features,
  priceId,
  popular = false,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  description: string;
  features: string[];
  priceId?: string;
  popular?: boolean;
}) {
  const isPlusHeader = features[0]?.includes('Everything in');

  return (
    <div
      className={`relative flex flex-col p-8 sm:p-10 ${
        popular
          ? 'bg-sky-50/40'
          : 'border-b border-gray-200 md:border-b-0 md:border-r'
      }`}
    >
      {popular && (
        <span className="absolute right-8 top-8 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
          Popular
        </span>
      )}

      <h2 className="text-2xl font-semibold text-gray-900">{name}</h2>

      <p className="mt-3 text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl">
        ${price / 100}
        <span className="text-lg font-normal text-gray-500"> /{interval}</span>
      </p>

      <p className="mt-2 text-sm text-gray-500">{description}</p>
      <p className="mt-1 text-sm text-gray-400">
        {trialDays}-day free trial · per family
      </p>

      <form action={checkoutAction} className="mt-6">
        <input type="hidden" name="priceId" value={priceId} />
        <SubmitButton popular={popular} />
      </form>

      <ul className="mt-8 flex-1 space-y-3.5 border-t border-gray-200 pt-8">
        {features.map((feature, index) => {
          const isSectionHeader = index === 0 && isPlusHeader;

          return (
            <li key={index} className="flex items-start gap-3">
              {isSectionHeader ? (
                <Minus className="mt-0.5 h-4 w-4 shrink-0 text-transparent" aria-hidden />
              ) : (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" strokeWidth={2.5} />
              )}
              <span
                className={
                  isSectionHeader
                    ? 'text-sm font-medium text-gray-500'
                    : 'text-sm text-gray-700'
                }
              >
                {feature}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
