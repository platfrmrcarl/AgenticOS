# AgenticOS Landing Page & Stripe Subscription Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace orange dark landing page with full platfrmr-style blue/white landing page + animated hero + Stripe subscription checkout and management.

**Architecture:** Next.js 15 App Router in `web/`, monorepo. OKLch color system from platfrmr globals.css. Stripe embedded checkout. Prisma schema migration for subscription fields. Cloud Build handles deployment.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, Stripe Node SDK, @stripe/react-stripe-js, Prisma 7, Vitest, GCP Secret Manager

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `web/src/app/globals.css` | Replace | OKLch blue/white theme |
| `web/src/app/layout.tsx` | Modify | Geist font, bg-background |
| `web/src/app/page.tsx` | Replace | Full landing page + SwarmVisual |
| `web/src/lib/stripe.ts` | Create | Stripe singleton |
| `web/src/lib/actions.ts` | Create | Server actions for Stripe |
| `web/src/app/checkout/page.tsx` | Create | Checkout page with auth guard |
| `web/src/app/checkout/CheckoutForm.tsx` | Create | EmbeddedCheckout component |
| `web/src/app/checkout/return/page.tsx` | Create | Post-checkout confirmation |
| `web/src/app/api/webhooks/stripe/route.ts` | Create | Stripe webhook handler |
| `web/prisma/schema.prisma` | Modify | Add Stripe fields + ProcessedWebhookEvent |
| `web/prisma/migrations/...` | Create | Prisma migration SQL |
| `web/Dockerfile` | Modify | ARG/ENV for NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY |
| `cloudbuild.yaml` | Modify | Stripe secrets + build-arg |
| `web/src/app/globals.test.ts` | Create | Theme CSS variable smoke test |
| `web/src/lib/stripe.test.ts` | Create | Singleton tests |
| `web/src/lib/actions.test.ts` | Create | Server action tests |
| `web/src/app/api/webhooks/stripe/route.test.ts` | Create | Webhook handler tests |
| `web/src/app/page.test.tsx` | Create | Landing page render tests |

---

### Task 1: Replace globals.css with OKLch blue/white theme

**Files:**
- Replace: `web/src/app/globals.css`
- Test: `web/src/app/globals.test.ts`

- [ ] **Step 1: Write the failing test**

Create `web/src/app/globals.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('globals.css theme', () => {
  const css = readFileSync(resolve(__dirname, 'globals.css'), 'utf-8');

  it('uses OKLch primary blue color', () => {
    expect(css).toContain('oklch(62.31%');
  });

  it('uses white background', () => {
    expect(css).toContain('oklch(1 0 0)');
  });

  it('does not use dark background hex', () => {
    expect(css).not.toContain('--background: #0a0a0a');
  });

  it('has @theme inline block for Tailwind v4', () => {
    expect(css).toContain('@theme inline');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/app/globals.test.ts
```
Expected: FAIL — "does not use dark background hex" passes, others fail

- [ ] **Step 3: Replace globals.css**

Write `web/src/app/globals.css`:

```css
@import "tailwindcss";
@import url("https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap");

@layer base {
  :root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.145 0 0);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.145 0 0);
    --primary: oklch(62.31% 0.188 259.81);
    --primary-foreground: oklch(0.985 0 0);
    --secondary: oklch(0.97 0 0);
    --secondary-foreground: oklch(0.205 0 0);
    --muted: oklch(0.97 0 0);
    --muted-foreground: oklch(0.556 0 0);
    --accent: oklch(0.97 0 0);
    --accent-foreground: oklch(0.205 0 0);
    --destructive: oklch(0.577 0.245 27.325);
    --destructive-foreground: oklch(0.985 0 0);
    --border: oklch(0.922 0 0);
    --input: oklch(0.922 0 0);
    --ring: oklch(62.31% 0.188 259.81);
    --radius: 0.5rem;
    --chart-1: oklch(0.646 0.222 41.116);
    --chart-2: oklch(0.6 0.118 184.704);
    --chart-3: oklch(0.398 0.07 227.392);
    --chart-4: oklch(0.828 0.189 84.429);
    --chart-5: oklch(0.769 0.188 70.08);
  }

  .dark {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.205 0 0);
    --card-foreground: oklch(0.985 0 0);
    --popover: oklch(0.205 0 0);
    --popover-foreground: oklch(0.985 0 0);
    --primary: oklch(62.31% 0.188 259.81);
    --primary-foreground: oklch(0.985 0 0);
    --secondary: oklch(0.269 0 0);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);
    --accent: oklch(0.269 0 0);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.704 0.191 22.216);
    --destructive-foreground: oklch(0.985 0 0);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(62.31% 0.188 259.81);
  }
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --font-sans: "Geist", sans-serif;
  --font-mono: "Geist Mono", monospace;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
  }
}

@keyframes sw-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.97); }
}
@keyframes sw-flow {
  0% { stroke-dashoffset: 20; opacity: 0.3; }
  50% { opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 0.3; }
}
@keyframes sw-core {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 0.6; }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd web && npx vitest run src/app/globals.test.ts
```
Expected: PASS all 4 tests

- [ ] **Step 5: Commit**

```bash
git add web/src/app/globals.css web/src/app/globals.test.ts
git commit -m "feat: replace dark orange theme with platfrmr OKLch blue/white design system"
```

---

### Task 2: Update layout.tsx with Geist font and white theme

**Files:**
- Modify: `web/src/app/layout.tsx`

- [ ] **Step 1: Replace layout.tsx**

Write `web/src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgenticOS",
  description: "Automate your business. Stop running in the past.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/layout.tsx
git commit -m "feat: update layout to use OKLch theme and remove hardcoded dark background"
```

---

### Task 3: Create Stripe singleton lib

**Files:**
- Create: `web/src/lib/stripe.ts`
- Create: `web/src/lib/stripe.test.ts`

- [ ] **Step 1: Write the failing test**

Create `web/src/lib/stripe.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('stripe', () => {
  const Stripe = vi.fn().mockImplementation(() => ({
    subscriptions: {},
    checkout: { sessions: {} },
  }));
  return { default: Stripe };
});

describe('stripe singleton', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  });

  it('creates a Stripe instance with the API key', async () => {
    const { getStripe } = await import('./stripe');
    const stripe = getStripe();
    expect(stripe).toBeDefined();
  });

  it('returns the same instance on subsequent calls', async () => {
    const { getStripe } = await import('./stripe');
    const a = getStripe();
    const b = getStripe();
    expect(a).toBe(b);
  });

  it('throws if STRIPE_SECRET_KEY is missing', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    vi.resetModules();
    const { getStripe } = await import('./stripe');
    expect(() => getStripe()).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/lib/stripe.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create stripe.ts**

Create `web/src/lib/stripe.ts`:

```typescript
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2025-04-30.basil" });
  }
  return _stripe;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd web && npx vitest run src/lib/stripe.test.ts
```
Expected: PASS (note: "throws if missing" test — reset _stripe between tests via vi.resetModules)

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/stripe.ts web/src/lib/stripe.test.ts
git commit -m "feat: add Stripe singleton lib"
```

---

### Task 4: Add Stripe fields to Prisma schema and create migration

**Files:**
- Modify: `web/prisma/schema.prisma`

- [ ] **Step 1: Add Stripe fields to User model and add ProcessedWebhookEvent**

In `web/prisma/schema.prisma`, add to the User model:

```prisma
model User {
  id                   String    @id @default(cuid())
  email                String?   @unique
  password             String?
  name                 String?
  emailVerified        DateTime?
  image                String?
  accounts             Account[]
  sessions             Session[]
  osSetup              OsSetup?
  domains              Domain[]
  skills               Skill[]
  skillRuns            SkillRun[]
  chatSessions         ChatSession[]
  isSubscribed         Boolean   @default(false)
  subscriptionPlan     String?
  stripeSubscriptionId String?
  stripeCustomerId     String?
  createdAt            DateTime  @default(now())
}
```

Add at the end of the file:

```prisma
model ProcessedWebhookEvent {
  id          String   @id
  processedAt DateTime @default(now())
}
```

- [ ] **Step 2: Generate and run migration**

```bash
cd web && DATABASE_URL="$(cat /tmp/db_url 2>/dev/null || echo $DATABASE_URL)" npx prisma migrate dev --name add_stripe_fields --create-only 2>/dev/null || true
```

Note: The migration will be deployed during Cloud Build's `migrate-db` step. For local dev, manually create the migration SQL file at `web/prisma/migrations/$(date +%Y%m%d%H%M%S)_add_stripe_fields/migration.sql`:

```sql
-- AlterTable
ALTER TABLE "User" ADD COLUMN "isSubscribed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "subscriptionPlan" TEXT;
ALTER TABLE "User" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;

-- CreateTable
CREATE TABLE "ProcessedWebhookEvent" (
    "id" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessedWebhookEvent_pkey" PRIMARY KEY ("id")
);
```

- [ ] **Step 3: Commit**

```bash
git add web/prisma/schema.prisma web/prisma/migrations/
git commit -m "feat: add Stripe subscription fields to User and ProcessedWebhookEvent model"
```

---

### Task 5: Create server actions for Stripe checkout and cancellation

**Files:**
- Create: `web/src/lib/actions.ts`
- Create: `web/src/lib/actions.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/actions.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./stripe', () => ({
  getStripe: vi.fn(() => ({
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ client_secret: 'cs_test_secret' }),
      },
    },
    subscriptions: {
      cancel: vi.fn().mockResolvedValue({ id: 'sub_123', status: 'canceled' }),
    },
  })),
}));

vi.mock('./prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('next-auth', () => ({
  auth: vi.fn(),
}));

describe('createEmbeddedCheckoutSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a clientSecret', async () => {
    const { auth } = await import('next-auth');
    vi.mocked(auth).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
    const { createEmbeddedCheckoutSession } = await import('./actions');
    const result = await createEmbeddedCheckoutSession('price_123');
    expect(result.clientSecret).toBe('cs_test_secret');
  });

  it('throws if not authenticated', async () => {
    const { auth } = await import('next-auth');
    vi.mocked(auth).mockResolvedValue(null);
    const { createEmbeddedCheckoutSession } = await import('./actions');
    await expect(createEmbeddedCheckoutSession('price_123')).rejects.toThrow();
  });
});

describe('cancelSubscription', () => {
  it('cancels the stripe subscription and updates user', async () => {
    const { auth } = await import('next-auth');
    const prisma = (await import('./prisma')).default;
    vi.mocked(auth).mockResolvedValue({ user: { email: 'test@example.com' } } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      stripeSubscriptionId: 'sub_123',
    } as any);
    const { cancelSubscription } = await import('./actions');
    await cancelSubscription();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isSubscribed: false }),
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/lib/actions.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create actions.ts**

Create `web/src/lib/actions.ts`:

```typescript
"use server";

import { auth } from "next-auth";
import { getStripe } from "./stripe";
import prisma from "./prisma";

export async function createEmbeddedCheckoutSession(
  priceId: string
): Promise<{ clientSecret: string }> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Not authenticated");

  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    return_url: `${process.env.AUTH_URL}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    customer_email: session.user.email,
  });

  if (!checkoutSession.client_secret)
    throw new Error("No client secret returned from Stripe");

  return { clientSecret: checkoutSession.client_secret };
}

export async function cancelSubscription(): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { stripeSubscriptionId: true },
  });

  if (!user?.stripeSubscriptionId) throw new Error("No active subscription");

  const stripe = getStripe();
  await stripe.subscriptions.cancel(user.stripeSubscriptionId);

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      isSubscribed: false,
      stripeSubscriptionId: null,
      subscriptionPlan: null,
    },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd web && npx vitest run src/lib/actions.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/actions.ts web/src/lib/actions.test.ts
git commit -m "feat: add Stripe server actions for checkout session and subscription cancellation"
```

---

### Task 6: Create Stripe webhook handler

**Files:**
- Create: `web/src/app/api/webhooks/stripe/route.ts`
- Create: `web/src/app/api/webhooks/stripe/route.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/src/app/api/webhooks/stripe/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => ({
    webhooks: {
      constructEvent: vi.fn(),
    },
  })),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    processedWebhookEvent: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
    user: {
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

const makeRequest = (body: string, sig: string) =>
  new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': sig },
    body,
  });

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  it('returns 400 if signature verification fails', async () => {
    const { getStripe } = await import('@/lib/stripe');
    vi.mocked(getStripe)().webhooks.constructEvent = vi.fn().mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    const { POST } = await import('./route');
    const res = await POST(makeRequest('{}', 'bad_sig'));
    expect(res.status).toBe(400);
  });

  it('returns 200 for checkout.session.completed and updates user', async () => {
    const { getStripe } = await import('@/lib/stripe');
    const prisma = (await import('@/lib/prisma')).default;
    const mockEvent = {
      id: 'evt_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          customer_email: 'user@example.com',
          subscription: 'sub_abc',
          metadata: { plan: 'pro' },
        },
      },
    };
    vi.mocked(getStripe)().webhooks.constructEvent = vi.fn().mockReturnValue(mockEvent);
    const { POST } = await import('./route');
    const res = await POST(makeRequest(JSON.stringify(mockEvent), 'sig'));
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isSubscribed: true }),
      })
    );
  });

  it('returns 200 but skips duplicate events', async () => {
    const { getStripe } = await import('@/lib/stripe');
    const prisma = (await import('@/lib/prisma')).default;
    const mockEvent = {
      id: 'evt_dup',
      type: 'checkout.session.completed',
      data: { object: {} },
    };
    vi.mocked(getStripe)().webhooks.constructEvent = vi.fn().mockReturnValue(mockEvent);
    vi.mocked(prisma.processedWebhookEvent.findUnique).mockResolvedValue({ id: 'evt_dup', processedAt: new Date() } as any);
    const { POST } = await import('./route');
    const res = await POST(makeRequest('{}', 'sig'));
    expect(res.status).toBe(200);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/app/api/webhooks/stripe/route.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create webhook route**

Create `web/src/app/api/webhooks/stripe/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const existing = await prisma.processedWebhookEvent.findUnique({
    where: { id: event.id },
  });
  if (existing) return NextResponse.json({ received: true, duplicate: true });

  await prisma.processedWebhookEvent.create({ data: { id: event.id } });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      customer_email?: string;
      subscription?: string;
      customer?: string;
      metadata?: Record<string, string>;
    };
    const email = session.customer_email;
    if (email) {
      await prisma.user.update({
        where: { email },
        data: {
          isSubscribed: true,
          stripeSubscriptionId: session.subscription ?? null,
          stripeCustomerId: session.customer ?? null,
          subscriptionPlan: session.metadata?.plan ?? "pro",
        },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as { customer: string };
    await prisma.user.updateMany({
      where: { stripeCustomerId: sub.customer },
      data: { isSubscribed: false, stripeSubscriptionId: null, subscriptionPlan: null },
    });
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd web && npx vitest run src/app/api/webhooks/stripe/route.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/app/api/webhooks/stripe/route.ts web/src/app/api/webhooks/stripe/route.test.ts
git commit -m "feat: add Stripe webhook handler with idempotency and subscription lifecycle events"
```

---

### Task 7: Create checkout pages (checkout + return)

**Files:**
- Create: `web/src/app/checkout/page.tsx`
- Create: `web/src/app/checkout/CheckoutForm.tsx`
- Create: `web/src/app/checkout/return/page.tsx`

- [ ] **Step 1: Create CheckoutForm.tsx**

Create `web/src/app/checkout/CheckoutForm.tsx`:

```tsx
"use client";

import { useCallback, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { createEmbeddedCheckoutSession } from "@/lib/actions";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function CheckoutForm({ priceId }: { priceId: string }) {
  const fetchClientSecret = useCallback(async () => {
    const { clientSecret } = await createEmbeddedCheckoutSession(priceId);
    return clientSecret;
  }, [priceId]);

  const options = useMemo(
    () => ({ fetchClientSecret }),
    [fetchClientSecret]
  );

  return (
    <div id="checkout" className="min-h-screen bg-background">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
```

- [ ] **Step 2: Create checkout/page.tsx**

Create `web/src/app/checkout/page.tsx`:

```tsx
import { auth } from "next-auth";
import { redirect } from "next/navigation";
import CheckoutForm from "./CheckoutForm";

interface Props {
  searchParams: Promise<{ priceId?: string }>;
}

export default async function CheckoutPage({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");

  const { priceId } = await searchParams;
  if (!priceId) redirect("/");

  return (
    <main className="min-h-screen bg-background">
      <CheckoutForm priceId={priceId} />
    </main>
  );
}
```

- [ ] **Step 3: Create checkout/return/page.tsx**

Create `web/src/app/checkout/return/page.tsx`:

```tsx
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function CheckoutReturnPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md text-center px-4">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          You&apos;re all set!
        </h1>
        <p className="text-muted-foreground mb-8">
          Your subscription is active. Welcome to AgenticOS — your business
          automation starts now.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add web/src/app/checkout/
git commit -m "feat: add embedded Stripe checkout and return confirmation pages"
```

---

### Task 8: Create full landing page with AnimatedSwarm hero

**Files:**
- Replace: `web/src/app/page.tsx`
- Create: `web/src/app/page.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `web/src/app/page.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('./page', async () => {
  const actual = await vi.importActual('./page');
  return actual;
});

// Mock getPlans since it calls Stripe
vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => ({
    products: { list: vi.fn().mockResolvedValue({ data: [] }) },
    prices: { list: vi.fn().mockResolvedValue({ data: [] }) },
  })),
}));

describe('Landing page', () => {
  it('renders hero headline', async () => {
    // Dynamic import after mocks are set
    const { default: Page } = await import('./page');
    const { container } = render(await Page());
    expect(container.textContent).toContain('living in the past');
  });

  it('renders How It Works section', async () => {
    const { default: Page } = await import('./page');
    const { container } = render(await Page());
    expect(container.textContent).toContain('How It Works');
  });

  it('renders automation examples section', async () => {
    const { default: Page } = await import('./page');
    const { container } = render(await Page());
    expect(container.textContent).toContain('automate');
  });
});
```

Note: Because this is a server component that fetches Stripe data, tests mock the Stripe SDK. Run with:

```bash
cd web && npx vitest run src/app/page.test.tsx
```

- [ ] **Step 2: Create the full landing page**

Write `web/src/app/page.tsx`. This is a large file — write it in full:

```tsx
import Link from "next/link";
import { getStripe } from "@/lib/stripe";

// ── AnimatedSwarm SVG ─────────────────────────────────────────────────────────
function AnimatedSwarm() {
  const nodes = [
    { label: "AUTOMATE", angle: 0 },
    { label: "ANALYZE", angle: 60 },
    { label: "SCHEDULE", angle: 120 },
    { label: "OPTIMIZE", angle: 180 },
    { label: "REPORT", angle: 240 },
    { label: "MONITOR", angle: 300 },
  ];
  const cx = 250;
  const cy = 250;
  const r = 140;
  const nodeR = 44;

  return (
    <svg
      viewBox="0 0 500 500"
      width="480"
      height="480"
      aria-hidden="true"
      className="w-full max-w-[480px]"
    >
      <defs>
        <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="hexClip0">
          <polygon points="44,0 44,0 22,38 -22,38 -44,0 -22,-38 22,-38" />
        </clipPath>
      </defs>

      {/* Outer glow ring */}
      <circle cx={cx} cy={cy} r={r + 30} fill="url(#coreGrad)" />

      {/* Connection lines from center to each node */}
      {nodes.map((node, i) => {
        const rad = (node.angle * Math.PI) / 180;
        const nx = cx + r * Math.cos(rad);
        const ny = cy + r * Math.sin(rad);
        return (
          <line
            key={`line-${i}`}
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke="var(--color-primary)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            opacity="0.5"
            style={{
              animation: `sw-flow 2s ease-in-out ${i * 0.33}s infinite`,
            }}
          />
        );
      })}

      {/* Orbit ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="1"
        opacity="0.15"
      />

      {/* Agent nodes */}
      {nodes.map((node, i) => {
        const rad = (node.angle * Math.PI) / 180;
        const nx = cx + r * Math.cos(rad);
        const ny = cy + r * Math.sin(rad);
        const hexPts = [0, 60, 120, 180, 240, 300]
          .map((a) => {
            const ar = (a * Math.PI) / 180;
            return `${nx + nodeR * Math.cos(ar)},${ny + nodeR * Math.sin(ar)}`;
          })
          .join(" ");
        return (
          <g
            key={`node-${i}`}
            style={{
              animation: `sw-pulse 3s ease-in-out ${i * 0.5}s infinite`,
            }}
          >
            <polygon
              points={hexPts}
              fill="var(--color-primary)"
              opacity="0.1"
              stroke="var(--color-primary)"
              strokeWidth="1.5"
              filter="url(#glow)"
            />
            <text
              x={nx}
              y={ny}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7"
              fontWeight="700"
              fill="var(--color-primary)"
              letterSpacing="0.5"
            >
              {node.label}
            </text>
          </g>
        );
      })}

      {/* Center core */}
      <g style={{ animation: "sw-core 4s ease-in-out infinite" }}>
        <circle
          cx={cx}
          cy={cy}
          r={52}
          fill="var(--color-primary)"
          opacity="0.08"
          stroke="var(--color-primary)"
          strokeWidth="2"
        />
        <circle
          cx={cx}
          cy={cy}
          r={38}
          fill="var(--color-primary)"
          opacity="0.12"
        />
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fontSize="8"
          fontWeight="800"
          fill="var(--color-primary)"
          letterSpacing="1.5"
        >
          AGENT
        </text>
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fontSize="8"
          fontWeight="800"
          fill="var(--color-primary)"
          letterSpacing="1.5"
        >
          CORE
        </text>
      </g>
    </svg>
  );
}

// ── Pricing helpers ───────────────────────────────────────────────────────────
interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  currency: string;
  priceId: string;
  features: string[];
}

async function getPlans(): Promise<Plan[]> {
  try {
    const stripe = getStripe();
    const products = await stripe.products.list({
      active: true,
      expand: ["data.default_price"],
    });
    const agenticosProducts = products.data.filter(
      (p) => p.metadata?.product === "agenticos"
    );
    if (agenticosProducts.length === 0) return getStaticPlans();

    return agenticosProducts.map((product) => {
      const price = product.default_price as {
        id: string;
        unit_amount: number;
        currency: string;
        recurring?: { interval: string };
      };
      return {
        id: product.id,
        name: product.name,
        description: product.description ?? "",
        price: (price?.unit_amount ?? 0) / 100,
        interval: price?.recurring?.interval ?? "month",
        currency: price?.currency ?? "usd",
        priceId: price?.id ?? "",
        features: (product.metadata?.features ?? "").split(",").filter(Boolean),
      };
    });
  } catch {
    return getStaticPlans();
  }
}

function getStaticPlans(): Plan[] {
  return [
    {
      id: "starter",
      name: "Starter",
      description: "Perfect for small businesses automating their first workflows",
      price: 49,
      interval: "month",
      currency: "usd",
      priceId: "",
      features: [
        "5 automated workflows",
        "Email & calendar automation",
        "Basic reporting",
        "Chat support",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      description: "For growing businesses that need full automation coverage",
      price: 149,
      interval: "month",
      currency: "usd",
      priceId: "",
      features: [
        "Unlimited workflows",
        "CRM & lead automation",
        "Advanced analytics",
        "Invoicing & scheduling",
        "Priority support",
      ],
    },
    {
      id: "scale",
      name: "Scale",
      description: "For teams and enterprises running complex agentic operations",
      price: 399,
      interval: "month",
      currency: "usd",
      priceId: "",
      features: [
        "Everything in Pro",
        "Multi-agent orchestration",
        "Custom integrations",
        "SLA guarantee",
        "Dedicated success manager",
      ],
    },
  ];
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default async function LandingPage() {
  const plans = await getPlans();

  const automationExamples = [
    {
      category: "Small Business",
      emoji: "🏪",
      examples: [
        "Auto-send invoices and follow up on overdue payments",
        "Book appointments and send reminders automatically",
        "Respond to customer inquiries 24/7 with AI",
        "Generate weekly sales reports without lifting a finger",
      ],
    },
    {
      category: "Medium Business",
      emoji: "🏢",
      examples: [
        "Score and route leads to the right sales rep instantly",
        "Sync CRM, ERP, and accounting data in real time",
        "Auto-generate board reports and KPI dashboards",
        "Onboard new customers with zero manual effort",
      ],
    },
    {
      category: "Startups",
      emoji: "🚀",
      examples: [
        "Monitor competitors and get daily briefings",
        "Auto-publish content across all channels",
        "Track burn rate and forecast runway automatically",
        "Schedule team standups and capture action items",
      ],
    },
  ];

  const features = [
    { icon: "📄", title: "Invoice Automation", desc: "Generate, send, and follow up on invoices automatically" },
    { icon: "🎙️", title: "Meeting Summaries", desc: "AI joins calls and delivers structured action items" },
    { icon: "🎯", title: "Lead Follow-up", desc: "Nurture leads with personalized sequences on autopilot" },
    { icon: "📊", title: "Reporting", desc: "Weekly business reports delivered to your inbox" },
    { icon: "📅", title: "Scheduling", desc: "Coordinate calendars and book meetings without back-and-forth" },
    { icon: "💬", title: "Customer Support", desc: "AI handles Tier-1 support 24/7 across all channels" },
    { icon: "🔄", title: "Data Sync", desc: "Keep your tools in sync with zero manual data entry" },
    { icon: "💰", title: "Financial Reports", desc: "P&L, cash flow, and forecasts generated automatically" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-foreground">AgenticOS</span>
          <div className="flex items-center gap-4">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link
              href="/api/auth/signin"
              className="text-sm font-semibold px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              AI-Powered Business Automation
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
              Running a business without full automation is{" "}
              <span className="text-primary">living in the past</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              AgenticOS deploys AI agents that handle your repetitive work —
              invoicing, scheduling, reporting, customer support, and more.
              Your team focuses on what actually matters.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={plans[1]?.priceId ? `/checkout?priceId=${plans[1].priceId}` : "/api/auth/signin"}
                className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                Start Automating
              </Link>
              <Link
                href="#how-it-works"
                className="px-8 py-4 border border-border text-foreground rounded-xl font-semibold text-lg hover:bg-muted transition-colors"
              >
                See How It Works
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <AnimatedSwarm />
          </div>
        </div>
      </section>

      {/* Automation Examples */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              What can you automate?
            </h2>
            <p className="text-muted-foreground text-lg">
              AgenticOS builds workflows for businesses of every size
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {automationExamples.map((ex) => (
              <div key={ex.category} className="bg-card border border-border rounded-2xl p-6">
                <div className="text-3xl mb-3">{ex.emoji}</div>
                <h3 className="text-lg font-bold text-foreground mb-4">{ex.category}</h3>
                <ul className="space-y-3">
                  {ex.examples.map((e) => (
                    <li key={e} className="flex items-start gap-2 text-muted-foreground text-sm">
                      <span className="text-primary mt-0.5">✓</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Three steps to a fully automated business</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Describe", desc: "Tell AgenticOS what you want automated in plain English. No code, no technical knowledge required." },
              { step: "02", title: "Connect", desc: "Connect your tools — Gmail, Slack, CRM, accounting software, calendar. AgenticOS integrates with everything." },
              { step: "03", title: "Automate", desc: "Agents run 24/7 in the background, handling tasks exactly as you described. You review, they execute." },
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="text-6xl font-black text-primary/10 mb-4">{s.step}</div>
                <h3 className="text-xl font-bold text-foreground mb-3">{s.title}</h3>
                <p className="text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Built-in Automations</h2>
            <p className="text-muted-foreground text-lg">Ready-to-deploy agents for every part of your business</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-colors">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Simple Pricing</h2>
            <p className="text-muted-foreground text-lg">One price. All automations. No surprises.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, i) => (
              <div
                key={plan.id}
                className={`relative bg-card border rounded-2xl p-8 ${
                  i === 1
                    ? "border-primary shadow-xl shadow-primary/10 scale-105"
                    : "border-border"
                }`}
              >
                {i === 1 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.interval}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.priceId ? `/checkout?priceId=${plan.priceId}` : "/api/auth/signin"}
                  className={`block text-center py-3 rounded-xl font-semibold transition-opacity ${
                    i === 1
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "border border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4 bg-primary/5 border-y border-primary/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-foreground mb-4">
            Stop running your business manually.
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Every hour spent on repetitive tasks is an hour not spent growing.
            AgenticOS handles the work so you don&apos;t have to.
          </p>
          <Link
            href="/api/auth/signin"
            className="inline-flex px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
          >
            Start for Free Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold text-foreground">AgenticOS</span>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AgenticOS. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
cd web && npx vitest run src/app/page.test.tsx
```
Expected: PASS (tests mock Stripe, check rendered text)

- [ ] **Step 4: Commit**

```bash
git add web/src/app/page.tsx web/src/app/page.test.tsx
git commit -m "feat: add full AgenticOS landing page with animated SwarmVisual hero, automation examples, and pricing"
```

---

### Task 9: Update Dockerfile for NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

**Files:**
- Modify: `web/Dockerfile`

- [ ] **Step 1: Add ARG and ENV to builder stage**

In `web/Dockerfile`, modify the builder stage to accept the publishable key:

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN DATABASE_URL="postgresql://x:x@localhost:5432/x" npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

- [ ] **Step 2: Commit**

```bash
git add web/Dockerfile
git commit -m "feat: add ARG/ENV for NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in Docker builder stage"
```

---

### Task 10: Update cloudbuild.yaml for Stripe secrets and build-arg

**Files:**
- Modify: `cloudbuild.yaml`

- [ ] **Step 1: Update cloudbuild.yaml**

Make these changes to `cloudbuild.yaml`:

1. Add `_STRIPE_PUBLISHABLE_KEY` to the `substitutions` block
2. Add `--build-arg=NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$_STRIPE_PUBLISHABLE_KEY` to the `build-web` step
3. Add `STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest` to the web deploy `--set-secrets`

The full updated file:

```yaml
steps:
  # ── 0. Fetch git history for diff ──────────────────────────────────────────
  - name: gcr.io/cloud-builders/git
    id: git-history
    entrypoint: bash
    args:
      - -c
      - git fetch --unshallow 2>/dev/null || git fetch --depth=50 2>/dev/null || true

  # ── 1. Detect which services changed ───────────────────────────────────────
  - name: gcr.io/cloud-builders/git
    id: detect-changes
    waitFor: [git-history]
    entrypoint: bash
    args:
      - -c
      - |
        git diff --name-only HEAD~1 HEAD 2>/dev/null > /workspace/changed.txt \
          || git ls-files > /workspace/changed.txt
        if [ ! -s /workspace/changed.txt ]; then
          printf 'agents/placeholder\nweb/placeholder\n' > /workspace/changed.txt
        fi
        echo "=== Changed files ==="
        cat /workspace/changed.txt

  # ── 2. Restore Next.js build cache from GCS ────────────────────────────────
  - name: gcr.io/google.com/cloudsdktool/cloud-sdk
    id: restore-web-cache
    waitFor: [detect-changes]
    entrypoint: bash
    args:
      - -c
      - |
        grep -q '^web/' /workspace/changed.txt \
          || { echo "web/ unchanged, skipping cache restore"; exit 0; }
        gsutil -m rsync -r gs://$_CACHE_BUCKET/next-cache /workspace/web/.next/cache 2>/dev/null || true

  # ── 2b. Create buildx builder ──────────────────────────────────────────────
  - name: gcr.io/cloud-builders/docker
    id: setup-buildx
    waitFor: [detect-changes]
    entrypoint: bash
    args:
      - -c
      - docker buildx create --use --name agenticos-builder

  # ── agents service ─────────────────────────────────────────────────────────

  - name: gcr.io/cloud-builders/docker
    id: build-agents
    waitFor: [setup-buildx]
    entrypoint: bash
    args:
      - -c
      - |
        grep -q '^agents/' /workspace/changed.txt \
          || { echo "agents/ unchanged, skipping build"; exit 0; }
        docker buildx build \
          -t $_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/agenticos-agents:$BUILD_ID \
          -t $_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/agenticos-agents:latest \
          --cache-from type=registry,ref=$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/agenticos-agents:buildcache \
          --cache-to type=registry,ref=$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/agenticos-agents:buildcache,mode=max \
          --push \
          agents/

  - name: gcr.io/google.com/cloudsdktool/cloud-sdk
    id: deploy-agents
    waitFor: [build-agents]
    entrypoint: bash
    args:
      - -c
      - |
        grep -q '^agents/' /workspace/changed.txt \
          || { echo "agents/ unchanged, skipping deploy"; exit 0; }
        gcloud run deploy agenticos-agents \
          --image=$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/agenticos-agents:$BUILD_ID \
          --region=$_REGION \
          --platform=managed \
          --port=8000 \
          --add-cloudsql-instances=$_SQL_INSTANCE \
          --set-secrets=DATABASE_URL=database-url-agents:latest,ANTHROPIC_API_KEY=anthropic-api-key:latest \
          --set-env-vars=GOOGLE_CLOUD_PROJECT=$PROJECT_ID \
          --memory=1Gi \
          --cpu=1 \
          --min-instances=1 \
          --max-instances=3 \
          --concurrency=80 \
          --cpu-boost \
          --startup-probe=httpGet.path=/health,initialDelaySeconds=5,periodSeconds=5,failureThreshold=3,timeoutSeconds=5 \
          --liveness-probe=httpGet.path=/health,periodSeconds=30,failureThreshold=3,timeoutSeconds=5 \
          --service-account=agenticos-agents-runtime@$PROJECT_ID.iam.gserviceaccount.com \
          --ingress=internal-and-cloud-load-balancing \
          --no-allow-unauthenticated
        gcloud run services update-traffic agenticos-agents \
          --to-latest \
          --region=$_REGION

  # ── web service ────────────────────────────────────────────────────────────

  - name: node:20-alpine
    id: migrate-db
    waitFor: [detect-changes]
    secretEnv: ['DATABASE_URL']
    entrypoint: sh
    args:
      - -c
      - |
        grep -q '^web/' /workspace/changed.txt \
          || { echo "web/ unchanged, skipping migration"; exit 0; }
        apk add --no-cache wget
        wget -q "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.1/cloud-sql-proxy.linux.amd64" \
             -O /usr/local/bin/cloud-sql-proxy \
          && chmod +x /usr/local/bin/cloud-sql-proxy
        mkdir -p /cloudsql
        cloud-sql-proxy --unix-socket=/cloudsql $_SQL_INSTANCE &
        sleep 3
        cd /workspace/web && npm install --no-save prisma && npx prisma migrate deploy

  - name: gcr.io/cloud-builders/docker
    id: build-web
    waitFor: [setup-buildx, restore-web-cache]
    entrypoint: bash
    args:
      - -c
      - |
        grep -q '^web/' /workspace/changed.txt \
          || { echo "web/ unchanged, skipping build"; exit 0; }
        docker buildx build \
          -t $_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/agenticos:$BUILD_ID \
          -t $_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/agenticos:latest \
          --cache-from type=registry,ref=$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/agenticos:buildcache \
          --cache-to type=registry,ref=$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/agenticos:buildcache,mode=max \
          --build-arg=AUTH_URL=$_AUTH_URL \
          --build-arg=NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$_STRIPE_PUBLISHABLE_KEY \
          --target runner \
          --push \
          web/

  - name: gcr.io/cloud-builders/docker
    id: save-web-cache-extract
    waitFor: [build-web]
    entrypoint: bash
    args:
      - -c
      - |
        grep -q '^web/' /workspace/changed.txt \
          || { echo "web/ unchanged, skipping cache save"; exit 0; }
        docker buildx build \
          --target cache-export \
          --output type=local,dest=/workspace/next-cache-out \
          --cache-from type=registry,ref=$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/agenticos:buildcache \
          --build-arg=AUTH_URL=$_AUTH_URL \
          --build-arg=NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$_STRIPE_PUBLISHABLE_KEY \
          web/ || true

  - name: gcr.io/google.com/cloudsdktool/cloud-sdk
    id: save-web-cache-upload
    waitFor: [save-web-cache-extract]
    entrypoint: bash
    args:
      - -c
      - |
        grep -q '^web/' /workspace/changed.txt \
          || { echo "web/ unchanged, skipping cache upload"; exit 0; }
        [ -d /workspace/next-cache-out ] \
          && gsutil -m rsync -r /workspace/next-cache-out gs://$_CACHE_BUCKET/next-cache \
          || true

  - name: gcr.io/google.com/cloudsdktool/cloud-sdk
    id: deploy-web
    waitFor: [build-web, migrate-db]
    entrypoint: bash
    args:
      - -c
      - |
        grep -q '^web/' /workspace/changed.txt \
          || { echo "web/ unchanged, skipping deploy"; exit 0; }
        gcloud run deploy agenticos-web \
          --image=$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/agenticos:$BUILD_ID \
          --region=$_REGION \
          --platform=managed \
          --add-cloudsql-instances=$_SQL_INSTANCE \
          --set-secrets=DATABASE_URL=database-url-web:latest,AUTH_GOOGLE_SECRET=auth-google-secret:latest,AUTH_SECRET=auth-secret:latest,STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest \
          --set-env-vars=AUTH_GOOGLE_ID=$_AUTH_GOOGLE_ID,AUTH_URL=$_AUTH_URL,AUTH_TRUST_HOST=true,AGENTS_SERVICE_URL=$_AGENTS_SERVICE_URL,AGENTS_AUDIENCE=$_AGENTS_AUDIENCE \
          --memory=1Gi \
          --cpu=1 \
          --min-instances=1 \
          --max-instances=3 \
          --startup-probe=httpGet.path=/api/health,initialDelaySeconds=5,periodSeconds=5,failureThreshold=10,timeoutSeconds=3 \
          --liveness-probe=httpGet.path=/api/health,periodSeconds=30,failureThreshold=3,timeoutSeconds=5 \
          --service-account=agenticos-web@$PROJECT_ID.iam.gserviceaccount.com \
          --ingress=all \
          --allow-unauthenticated
        gcloud run services update-traffic agenticos-web \
          --to-latest \
          --region=$_REGION


substitutions:
  _REGION: us-east1
  _REPO: cloud-run-source-deploy
  _SQL_INSTANCE: "agenticos-platfrmr:us-east1:agenticos-db"
  _CACHE_BUCKET: "agenticos-platfrmr_cloudbuild"
  _AUTH_GOOGLE_ID: "949345136730-9bp0fhm1ko5a3vlh17mgd4ft8tkk6nsv.apps.googleusercontent.com"
  _AUTH_URL: https://agenticos.platfrmr.com
  _AGENTS_SERVICE_URL: "https://agenticos-agents-rpwpeh4sqa-ue.a.run.app"
  _AGENTS_AUDIENCE: "https://agenticos-agents-rpwpeh4sqa-ue.a.run.app"
  _STRIPE_PUBLISHABLE_KEY: "pk_test_51NzWucH8CSujFGCpjcQzisUnaVYBOltGISVroVi0yvUQEucmJLSOIAyE5XYJ7HgXGDO3dshVVADaTU0R3F81HQRE00JyFFTasq"

availableSecrets:
  secretManager:
  - versionName: projects/$PROJECT_ID/secrets/database-url-web/versions/latest
    env: DATABASE_URL

options:
  logging: CLOUD_LOGGING_ONLY
```

- [ ] **Step 2: Commit**

```bash
git add cloudbuild.yaml
git commit -m "feat: add Stripe secrets and publishable key build-arg to Cloud Build pipeline"
```

---

### Task 11: Push to Cloud Build and deploy

- [ ] **Step 1: Verify tests pass**

```bash
cd web && npx vitest run
```
Expected: All tests pass

- [ ] **Step 2: Push to main to trigger Cloud Build**

```bash
git push origin main
```

- [ ] **Step 3: Monitor build**

```bash
gcloud builds list --project=agenticos-platfrmr --limit=1 --format="value(id,status)"
```

Expected: Build runs and deploys both services successfully.
