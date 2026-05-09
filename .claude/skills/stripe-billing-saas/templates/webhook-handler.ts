// templates/webhook-handler.ts
// Production-ready Stripe webhook handler with idempotency
// Mount at: app/api/webhooks/stripe/route.ts

import { headers } from 'next/headers';
import Stripe from 'stripe';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  // 1. Verify signature
  const body = await req.text();
  const sig = (await headers()).get('stripe-signature');
  if (!sig) return new Response('Missing signature', { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // 2. Idempotency check — atomic INSERT-or-skip
  const inserted = await db
    .insertInto('stripe_events')
    .values({
      id: event.id,
      type: event.type,
      payload: event as any,  // JSONB
    })
    .onConflict((oc) => oc.column('id').doNothing())
    .returning('id')
    .executeTakeFirst();

  if (!inserted) {
    // Already processed — return 200 so Stripe stops retrying
    console.log(`Skipping already-processed event ${event.id}`);
    return new Response('OK (duplicate)', { status: 200 });
  }

  // 3. Dispatch
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpserted(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      default:
        // Unhandled but acknowledged events stay in stripe_events table
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing ${event.type} (${event.id}):`, err);
    // Return 500 — Stripe will retry. Idempotency check above guarantees
    // we won't double-process on retry.
    return new Response('Internal error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}

// =============================================================================
// HANDLERS
// =============================================================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Extract tenant_id from metadata (set when creating the Checkout session)
  const tenantId = session.metadata?.tenant_id;
  if (!tenantId) {
    throw new Error(`No tenant_id in session ${session.id} metadata`);
  }

  // Persist Stripe customer ID to tenant
  if (session.customer) {
    await db
      .updateTable('tenants')
      .set({ stripe_customer_id: session.customer as string })
      .where('id', '=', tenantId)
      .execute();
  }

  // Subscription created event will follow and populate the subscriptions table
}

async function handleSubscriptionUpserted(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;

  const tenant = await db
    .selectFrom('tenants')
    .select('id')
    .where('stripe_customer_id', '=', customerId)
    .executeTakeFirst();

  if (!tenant) {
    throw new Error(`No tenant for stripe_customer_id ${customerId}`);
  }

  await db
    .insertInto('subscriptions')
    .values({
      tenant_id: tenant.id,
      stripe_subscription_id: sub.id,
      stripe_price_id: sub.items.data[0]?.price.id,
      status: sub.status,
      current_period_start: new Date(sub.current_period_start * 1000),
      current_period_end: new Date(sub.current_period_end * 1000),
      cancel_at_period_end: sub.cancel_at_period_end,
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    })
    .onConflict((oc) =>
      oc.column('tenant_id').doUpdateSet({
        stripe_subscription_id: sub.id,
        stripe_price_id: sub.items.data[0]?.price.id,
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000),
        current_period_end: new Date(sub.current_period_end * 1000),
        cancel_at_period_end: sub.cancel_at_period_end,
        trial_end: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      })
    )
    .execute();
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await db
    .updateTable('subscriptions')
    .set({ status: 'canceled' })
    .where('stripe_subscription_id', '=', sub.id)
    .execute();
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // TODO: Send dunning email, log for support team
  console.log(`Payment failed for invoice ${invoice.id}, customer ${invoice.customer}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // TODO: Send receipt email if you don't use Stripe's built-in receipts
  console.log(`Payment succeeded for invoice ${invoice.id}`);
}
