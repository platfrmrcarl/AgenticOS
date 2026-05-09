// templates/checkout-session.ts
// Server action to create a Stripe Checkout session
// Usage: <form action={createCheckoutSession}><button>Upgrade</button></form>

'use server';

import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function createCheckoutSession(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const lookupKey = formData.get('lookup_key') as string;  // e.g. "pro_monthly"
  const tenantId = formData.get('tenant_id') as string;

  // Verify user is a member of the tenant
  const membership = await db
    .selectFrom('tenant_members')
    .select(['tenant_id', 'role'])
    .where('tenant_id', '=', tenantId)
    .where('user_id', '=', session.user.id)
    .executeTakeFirst();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('Unauthorized');
  }

  // Resolve price by lookup_key (don't hard-code price IDs)
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    expand: ['data.product'],
  });

  if (prices.data.length === 0) {
    throw new Error(`No active price found for lookup_key ${lookupKey}`);
  }

  // Get or create Stripe customer for this tenant
  const tenant = await db
    .selectFrom('tenants')
    .select(['id', 'name', 'stripe_customer_id'])
    .where('id', '=', tenantId)
    .executeTakeFirstOrThrow();

  let customerId = tenant.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email!,
      name: tenant.name,
      metadata: { tenant_id: tenantId },
    });
    customerId = customer.id;
    await db
      .updateTable('tenants')
      .set({ stripe_customer_id: customerId })
      .where('id', '=', tenantId)
      .execute();
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: prices.data[0].id, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    // Critical: metadata flows through to webhook
    metadata: { tenant_id: tenantId },
    subscription_data: {
      metadata: { tenant_id: tenantId },
      // trial_period_days: 14,  // Uncomment to add trial
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  });

  if (!checkoutSession.url) {
    throw new Error('No checkout URL returned');
  }

  redirect(checkoutSession.url);
}
