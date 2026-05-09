---
name: stripe-billing-saas
description: Use this skill whenever working with Stripe, billing, subscriptions, payments, checkout, or revenue features in the Platfrmr stack. Trigger on any mention of Stripe, Checkout, Customer Portal, webhook, subscription, billing, MRR, pricing, trial, proration, or paywall. Encodes Platfrmr's webhook idempotency, subscription gating, and success URL patterns; do NOT default to generic Stripe quickstart code which lacks idempotency and proper error handling for production SaaS.
---

# Stripe Billing for SaaS

Patterns for Stripe Checkout + Customer Portal + Subscription webhooks in the Platfrmr stack. Subscriptions are **per tenant** (workspace), not per user.

## When to use this skill

- Setting up Stripe Checkout for a new pricing tier
- Implementing or debugging Stripe webhooks
- Adding subscription gating to features
- Configuring the Customer Portal
- Calculating MRR or handling proration
- Setting up trials or coupons
- Debugging "why isn't my subscription updating after checkout?"

## Decisions to fill in

- **Pricing model**: [flat tier / per-seat / usage-based / hybrid]
- **Trial length**: [7 / 14 / 30 days / no trial]
- **Subscription owner**: tenant (recommended) vs user
- **Free tier**: [yes — feature-limited / no — paywall everything]

## Architecture

```
User clicks "Upgrade"
  → POST /api/checkout (server)
  → Stripe.checkout.sessions.create({...})
  → Redirect to Stripe Checkout
  → User pays
  → Stripe redirects to /billing?session_id=cs_...  (success URL)
  → Stripe sends webhook → /api/webhooks/stripe
  → Webhook updates `subscriptions` table
  → Next request from user reflects new status
```

**Critical**: The success URL is *not* what activates the subscription. The **webhook** is the source of truth. Treat the success URL purely as a UX redirect — show a "thanks!" page that polls or refreshes until the webhook lands.

## The success URL gotcha

Race condition: User lands on `/billing?session_id=...` *before* the webhook has fired. If your success page reads from your DB, it'll show "no subscription" briefly.

**Fix**: On the success page, either:
1. Poll the subscription status every 1s for ~10s before showing the dashboard, OR
2. Verify the session directly from Stripe on the success page (read `stripe.checkout.sessions.retrieve(session_id)` server-side — this is real-time)

See `templates/checkout-success-page.tsx`.

## Webhook idempotency (non-negotiable)

Stripe will deliver the same event multiple times. Without idempotency, you'll double-process subscription changes.

**Pattern**:
1. On webhook receipt, verify signature
2. `INSERT INTO stripe_events (id, type, payload) ON CONFLICT (id) DO NOTHING RETURNING id`
3. If the INSERT returned nothing, the event was already processed — return 200 immediately
4. Otherwise, process the event in the same transaction as updating `subscriptions`

See `templates/webhook-handler.ts`.

## Events you must handle

Minimum viable webhook set:

- `checkout.session.completed` — new subscription started (initial source of truth for `stripe_customer_id` ↔ `tenant_id` mapping)
- `customer.subscription.created`
- `customer.subscription.updated` — status changes, plan changes, cancellations scheduled
- `customer.subscription.deleted` — actual cancellation
- `invoice.payment_failed` — for dunning emails
- `invoice.payment_succeeded` — for receipts and renewal confirmations

For metered/usage billing, also: `invoice.created`, `invoice.finalized`.

## Subscription gating in middleware

Carry `subscriptionStatus` in the JWT/session so middleware can check without a DB query. Refresh the JWT when the webhook updates the subscription (force re-auth or use a session version field).

```typescript
// In middleware.ts (see nextjs-saas-scaffold skill)
const isActive = ['active', 'trialing'].includes(token.subscriptionStatus);
if (!isActive && !FREE_ROUTES.includes(pathname)) {
  return NextResponse.redirect('/billing');
}
```

Treat `past_due` carefully — typically allow read access for a grace period, block writes/expensive operations.

## Customer Portal config

Use Stripe's hosted Customer Portal for payment method updates, invoice history, plan changes, and cancellations. Don't build this yourself.

```typescript
const session = await stripe.billingPortal.sessions.create({
  customer: tenant.stripeCustomerId,
  return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
});
return Response.redirect(session.url);
```

Configure allowed actions in the Stripe Dashboard → Settings → Customer portal.

## Pricing in the codebase

Don't hard-code prices in cents. Pull from Stripe by `lookup_key` so you can rotate prices without code changes:

```typescript
const prices = await stripe.prices.list({
  lookup_keys: ['starter_monthly', 'starter_yearly', 'pro_monthly', 'pro_yearly'],
  active: true,
});
```

Set `lookup_key` when creating prices in Stripe so this works.

## Trials

- Set `trial_period_days` on the Checkout session OR on the price itself
- Status during trial is `trialing` — gate features the same as `active`
- Trial-ending webhooks: `customer.subscription.trial_will_end` fires 3 days before — send a reminder email

## Reference files

- `reference/webhook-events.md` — Full event handling reference with payload examples
- `reference/proration.md` — How Stripe handles plan changes mid-cycle
- `reference/usage-based-billing.md` — Metered billing patterns
- `templates/webhook-handler.ts` — Production-ready webhook handler with idempotency
- `templates/checkout-session.ts` — Server action to create a Checkout session
- `templates/checkout-success-page.tsx` — Success page that handles the race condition
- `templates/customer-portal.ts` — Customer Portal redirect

## Anti-patterns to avoid

- ❌ Reading subscription status from the success URL params (use webhooks)
- ❌ Webhook handler without idempotency (will double-process)
- ❌ Hard-coded price IDs in code (use `lookup_key`)
- ❌ Building your own payment method update form (use Customer Portal)
- ❌ Storing card details (PCI scope — Stripe handles this)
- ❌ Subscription on user instead of tenant (breaks for team accounts)
- ❌ Returning 500 from webhook on retryable errors without proper retry logic (Stripe will keep retrying)
- ❌ Logging the full webhook payload without redaction (contains PII)
