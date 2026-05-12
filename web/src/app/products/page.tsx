import Link from 'next/link';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

async function getPlans() {
  const products = await getStripe().products.list({
    active: true,
    limit: 100,
    expand: ['data.default_price'],
  });

  return products.data
    .filter((p) => p.metadata?.product === 'agentic')
    .sort((a, b) => {
      const aAmt = (a.default_price as Stripe.Price)?.unit_amount ?? 0;
      const bAmt = (b.default_price as Stripe.Price)?.unit_amount ?? 0;
      return aAmt - bAmt;
    })
    .slice(0, 3);
}

async function PlansList() {
  const plans = await getPlans();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {plans.map((plan, i) => {
        const price = plan.default_price as Stripe.Price;
        const amount = price?.unit_amount ?? 0;
        const priceId = price?.id ?? '';
        const featured = i === 1;

        return (
          <div
            key={plan.id}
            className={`relative p-8 rounded-3xl bg-card border-2 transition-all ${
              featured ? 'border-primary shadow-2xl scale-105 z-10' : 'border-border shadow-sm'
            }`}
          >
            {featured && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded-full">
                Most Popular
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 uppercase tracking-wider">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black">${Math.round(amount / 100)}</span>
                <span className="text-muted-foreground font-medium">/month</span>
              </div>
              <p className="mt-4 text-muted-foreground text-sm">{plan.description}</p>
            </div>

            <ul className="space-y-4 mb-8">
              {plan.marketing_features.map((f) => (
                <li key={f.name} className="flex items-center gap-3 text-sm font-medium">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary flex-shrink-0">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f.name}
                </li>
              ))}
            </ul>

            <Link href={`/checkout?priceId=${priceId}`} className="block">
              <Button
                variant={featured ? 'default' : 'outline'}
                className="w-full h-12 rounded-xl text-md font-bold"
              >
                Select Plan
              </Button>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <main className="min-h-screen pt-28 pb-16 px-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <Badge variant="default" className="uppercase tracking-widest text-xs px-4 py-1">
            Pricing Plans
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Select the perfect plan for your SaaS journey. All plans include access to our agentic founding team.
          </p>
        </div>

        <PlansList />

        <p className="text-center text-sm text-muted-foreground">
          Payments processed securely by Stripe. Cancel any time from your account settings.
        </p>
      </div>
    </main>
  );
}
