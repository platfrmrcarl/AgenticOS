---
name: AgenticOS Landing Page & Stripe Subscription
description: Full landing page with animated hero, platfrmr OKLch blue/white theme, and Stripe subscription checkout + management
type: project
---

# AgenticOS Landing Page & Stripe Subscription Design

## Goal

Replace the minimal orange dark-mode landing page with a full marketing page using platfrmr's blue/white OKLch design system. Add Stripe subscription checkout and management. Deploy to production.

## Architecture

**Monorepo:** `web/` (Next.js 15 App Router) + `agents/` (FastAPI, unchanged)

**New/modified files in `web/`:**
- `src/app/globals.css` — OKLch blue/white theme (replace dark orange)
- `src/app/layout.tsx` — Geist font, `bg-background` body class
- `src/app/page.tsx` — Full landing page with SwarmVisual hero
- `src/lib/stripe.ts` — Stripe singleton
- `src/lib/actions.ts` — Server actions: `createEmbeddedCheckoutSession`, `cancelSubscription`
- `src/app/checkout/page.tsx` + `CheckoutForm.tsx` — Embedded checkout
- `src/app/checkout/return/page.tsx` — Post-checkout confirmation
- `src/app/api/webhooks/stripe/route.ts` — Webhook handler
- `prisma/schema.prisma` — Add Stripe fields to User + ProcessedWebhookEvent model
- `Dockerfile` — ARG/ENV for `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `../cloudbuild.yaml` — Stripe secrets + build-arg

## Design System

Exact copy of platfrmr's OKLch color system:
- Primary blue: `oklch(62.31% 0.188 259.81)` 
- Background: `oklch(1 0 0)` (white)
- Foreground: `oklch(0.145 0 0)` (near-black)
- Dark mode via `.dark` class
- `@theme inline` block for Tailwind v4 color mapping
- Geist font (replacing Inter + JetBrains Mono)

## Landing Page Sections

1. **Hero** — AnimatedSwarm SVG graphic (AUTOMATE, ANALYZE, SCHEDULE, OPTIMIZE, REPORT, MONITOR nodes), headline: "Running a business without full automation is living in the past", CTA buttons
2. **Automation Examples** — Cards showing what small biz, medium biz, startups can automate
3. **How It Works** — 3 steps: Describe → Connect → Automate
4. **Features** — 8 cards (Invoice automation, Meeting summaries, Lead follow-up, Reporting, Scheduling, Customer support, Data sync, Financial reports)
5. **Pricing** — Fetched from Stripe, filtered by `metadata.product === 'agenticos'`; fallback static plan if none configured
6. **CTA Banner** — "Start automating today"
7. **Footer**

## SwarmVisual Component

Adapted from platfrmr's hive mind SVG:
- Inner ring (6 nodes): AUTOMATE, ANALYZE, SCHEDULE, OPTIMIZE, REPORT, MONITOR
- Each node: hexagonal clip, animated pulse
- Center: "AGENT CORE" with sw-core animation
- Animated connection lines with sw-flow keyframes
- Colors: `var(--color-primary)` for all accents

## Stripe Integration

**Client-side:** `@stripe/stripe-js` + `@stripe/react-stripe-js` (EmbeddedCheckout)
**Server-side:** Stripe Node SDK singleton at `src/lib/stripe.ts`

**Checkout flow:**
1. Landing page "Get Started" → `/checkout?priceId=xxx`
2. `/checkout` renders `CheckoutForm` → calls `createEmbeddedCheckoutSession` server action
3. EmbeddedCheckout renders in-page
4. On success → redirect to `/checkout/return?session_id=xxx`
5. Return page verifies session, shows confirmation

**Webhook handler** (`/api/webhooks/stripe`):
- Validates Stripe signature
- Deduplicates via `ProcessedWebhookEvent` table
- On `checkout.session.completed`: updates user `isSubscribed=true`, `subscriptionPlan`, `stripeSubscriptionId`
- On `customer.subscription.deleted`: sets `isSubscribed=false`
- Does NOT enqueue GCP provisioning (platfrmr-specific)

**Subscription management:**
- Dashboard shows subscription status
- `cancelSubscription()` server action → Stripe cancel + DB update

## Data Model Changes

```prisma
model User {
  // ... existing fields ...
  isSubscribed        Boolean  @default(false)
  subscriptionPlan    String?
  stripeSubscriptionId String?
  stripeCustomerId    String?
}

model ProcessedWebhookEvent {
  id          String   @id
  processedAt DateTime @default(now())
}
```

## Secret Management

| Secret | Location | Injection |
|--------|----------|-----------|
| `STRIPE_SECRET_KEY` | GCP Secret Manager: `stripe-secret-key` | Cloud Run `--set-secrets` |
| `STRIPE_WEBHOOK_SECRET` | GCP Secret Manager: `stripe-webhook-secret` | Cloud Run `--set-secrets` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | cloudbuild.yaml substitution `_STRIPE_PUBLISHABLE_KEY` | Docker `--build-arg` → `ARG`/`ENV` in builder stage |

## Deployment

Cloud Build triggers on push to `main`. Change detection (`grep -q '^web/'`) ensures only web service rebuilds when only web files change.
