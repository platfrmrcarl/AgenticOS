---
name: analytics-and-mrr-tracking
description: Use this skill whenever working on product analytics, event tracking, MRR/churn calculations, activation metrics, funnel analysis, or revenue dashboards. Trigger on any mention of analytics, PostHog, Plausible, GA4, Mixpanel, MRR, ARR, churn, retention, activation, funnel, North Star metric, event tracking, or "what should I measure". Encodes Platfrmr's instrumentation conventions and SQL patterns for Stripe → Postgres MRR queries; do NOT default to generic event-tracking that's noisy and hard to query — disciplined event taxonomy is the difference between actionable analytics and a dashboard graveyard.
---

# Analytics and MRR Tracking

Instrumentation patterns for getting from zero to $10k MRR with measurable progress. Pairs with `stripe-billing-saas` (which mirrors Stripe to Postgres) and `postgres-saas-patterns`.

## When to use this skill

- Setting up product analytics in a new app
- Defining event names and properties (event taxonomy)
- Writing MRR/ARR/churn SQL queries
- Building an activation funnel
- Choosing a North Star metric
- Wiring up dashboards
- Auditing existing tracking for noise/gaps

## Decisions to fill in

- **Product analytics**: [PostHog / Mixpanel / Amplitude / custom] — PostHog assumed (open source, self-hostable on GCP)
- **Web analytics**: [Plausible / Fathom / GA4] — Plausible recommended (privacy-friendly, simple)
- **Warehouse**: Postgres (used as warehouse for now — graduate to BigQuery/Snowflake when MRR > $50k)
- **North Star metric**: [pick one — see below]

## Pick a North Star metric (just one)

A North Star is the single metric that best predicts long-term value. **Just one.** Examples:

| Product | Possible North Star |
|---|---|
| LinkedIn post generator | Posts published per active user per week |
| Software factory | Apps deployed and surviving > 7 days |
| General SaaS | Weekly Active Tenants performing key action |

Avoid vanity metrics (signups, page views) as North Stars — they don't reflect value delivered.

## The activation funnel

For early-stage SaaS, the funnel that matters most is **signup → activation → retention**:

```
Signup           (created account)
  ↓
Onboarded        (completed required setup)
  ↓
First Value      (performed the core action successfully — this is "activated")
  ↓
Habit            (came back and did it again within 7 days)
  ↓
Paying           (converted to paid)
  ↓
Retained        (paying after 90 days)
```

Define each step **specifically** — "First Value" for Platfrmr might be "Successfully deployed first agent." Not "logged in." Not "viewed dashboard."

## Event taxonomy

Discipline here pays off forever. Loose event names = unanalyzable data.

**Naming convention**: `noun_verbed` in past tense.

```
✅ agent_created
✅ agent_deployed
✅ checkout_session_started
✅ subscription_activated
✅ post_published

❌ create_agent           (wrong tense)
❌ Agent Created          (mixed case, spaces)
❌ user_clicked_button    (which button? noun first)
❌ track_signup           (don't prefix with "track_")
```

**Properties** (keep them lean — every property you track is a property you have to maintain):

```typescript
posthog.capture('agent_deployed', {
  // Always include these
  tenant_id: tenant.id,
  user_id: user.id,
  // Event-specific properties
  agent_type: 'linkedin_post',
  agent_id: agent.id,
  deploy_target: 'cloud_run',
  // Useful for cohorting
  tenant_plan: subscription.plan,
  tenant_age_days: daysSince(tenant.createdAt),
});
```

See `templates/event-taxonomy.md` for the canonical Platfrmr event list.

## MRR / ARR SQL queries

Since `subscriptions` mirrors Stripe state in Postgres (see `stripe-billing-saas`), MRR is queryable directly:

```sql
-- Current MRR (active + trialing subscriptions)
WITH active_subs AS (
  SELECT
    s.tenant_id,
    s.stripe_price_id,
    s.status,
    -- Get the unit_amount and interval from a prices table you sync from Stripe,
    -- or hardcode the lookup_key → cents map for now
    CASE s.stripe_price_id
      WHEN 'price_starter_monthly' THEN 4900
      WHEN 'price_starter_yearly' THEN 49000 / 12
      WHEN 'price_pro_monthly' THEN 14900
      WHEN 'price_pro_yearly' THEN 149000 / 12
    END AS monthly_cents
  FROM subscriptions s
  WHERE s.status IN ('active', 'trialing')
)
SELECT
  COUNT(*) AS active_subs,
  SUM(monthly_cents) / 100.0 AS mrr_usd,
  SUM(monthly_cents) * 12 / 100.0 AS arr_usd
FROM active_subs;
```

## Churn calculation

```sql
-- Logo churn (% of customers who canceled in last 30 days)
WITH baseline AS (
  SELECT COUNT(*) AS n
  FROM subscriptions
  WHERE status IN ('active', 'trialing')
    AND created_at < NOW() - INTERVAL '30 days'
),
churned AS (
  SELECT COUNT(*) AS n
  FROM subscriptions
  WHERE status = 'canceled'
    AND updated_at >= NOW() - INTERVAL '30 days'
    AND created_at < NOW() - INTERVAL '30 days'  -- Only count subs that existed at start of window
)
SELECT
  (churned.n::float / NULLIF(baseline.n, 0)) * 100 AS monthly_churn_pct
FROM baseline, churned;
```

For revenue churn (more important for usage-based / multi-tier), see `reference/mrr-queries.md`.

## What to track at $0 → $10k MRR

You don't need 100 events. You need ~10 well-instrumented ones:

1. `signup_completed`
2. `onboarding_completed`
3. `first_value` (your activation event — define specifically)
4. `key_action_performed` (your North Star event)
5. `checkout_session_started`
6. `subscription_activated`
7. `subscription_canceled`
8. `feature_used` with `feature_name` property (for usage breadth)
9. `error_encountered` with `error_type` (catch friction)
10. `support_ticket_opened` (catch confusion)

Add more events only when you have a question that requires them.

## Dashboards that matter

Three dashboards. No more.

**1. Daily revenue dashboard**
- New MRR today, this week, this month
- Churned MRR
- Net new MRR
- Active trials, trial conversions

**2. Activation funnel dashboard**
- Signups → Onboarded → Activated → Habit (with conversion rates)
- Filter by signup source (organic / outbound / referral)

**3. North Star dashboard**
- Your one North Star metric, daily/weekly/monthly
- Cohort retention curves

Anything beyond these three is usually noise that nobody looks at.

## Web analytics (Plausible)

For marketing pages, Plausible-style simple analytics is enough:

- Pageviews by page
- Top sources / referrers
- Conversion: visitor → signup (set as a goal)
- 404s (catch broken links)

Don't connect web analytics to product analytics on the user level — keep marketing top-of-funnel separate from product behavior. Connect them via UTM → signup attribution stored on the user record.

## Reference files

- `reference/event-taxonomy.md` — Canonical Platfrmr event list with properties
- `reference/mrr-queries.md` — Full MRR/ARR/churn/cohort SQL queries
- `reference/posthog-setup.md` — Self-host PostHog on GCP, server-side tracking patterns
- `reference/utm-attribution.md` — Tying marketing sources to revenue
- `templates/posthog-server.ts` — Server-side PostHog client wrapper
- `templates/track-revenue-events.ts` — Hook into Stripe webhooks to fire revenue events
- `templates/cohort-retention.sql` — Cohort retention query

## Anti-patterns to avoid

- ❌ Tracking everything "just in case" (creates a graveyard)
- ❌ Inconsistent event names (`agent_created`, `Agent created`, `create-agent`)
- ❌ Mixing client-side and server-side tracking for the same event (double-counting)
- ❌ Tracking PII in event properties (compliance + tooling cost)
- ❌ Multiple "North Star" metrics (defeats the purpose)
- ❌ Vanity metrics on dashboards (pageviews, total signups — celebrate, don't optimize)
- ❌ Calculating MRR from raw Stripe API on every dashboard load (slow + rate-limited — query Postgres mirror)
- ❌ Forgetting to track `tenant_id` on events (impossible to do per-account analysis later)
- ❌ Building dashboards no one reviews weekly (delete them)
