import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { SubmitButton } from './submit-button';

export default function PricingPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Suspense fallback={<PricingSkeleton />}>
        <PricingPlans />
      </Suspense>
    </main>
  );
}

function PricingSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-xl mx-auto">
      {[0, 1].map((key) => (
        <div key={key} className="pt-6 space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-100 rounded w-40" />
          <div className="h-10 bg-gray-200 rounded w-32" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-100 rounded" />
          </div>
          <div className="h-10 bg-gray-200 rounded w-full" />
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
    <div className="grid md:grid-cols-2 gap-8 max-w-xl mx-auto">
      <PricingCard
        name={basePlan?.name || 'Base'}
        price={basePrice?.unitAmount || 800}
        interval={basePrice?.interval || 'month'}
        trialDays={basePrice?.trialPeriodDays || 7}
        features={[
          'Unlimited stories & reminders',
          'Up to 5 family members',
          'Email support',
        ]}
        priceId={basePrice?.id}
      />
      <PricingCard
        name={plusPlan?.name || 'Plus'}
        price={plusPrice?.unitAmount || 1200}
        interval={plusPrice?.interval || 'month'}
        trialDays={plusPrice?.trialPeriodDays || 7}
        features={[
          'Everything in Base, and:',
          'Unlimited family members',
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
  features,
  priceId,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
}) {
  return (
    <div className="pt-6">
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
      <p className="text-sm text-gray-600 mb-4">
        with {trialDays} day free trial
      </p>
      <p className="text-4xl font-medium text-gray-900 mb-6">
        ${price / 100}{' '}
        <span className="text-xl font-normal text-gray-600">
          per family / {interval}
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId} />
        <SubmitButton />
      </form>
    </div>
  );
}
