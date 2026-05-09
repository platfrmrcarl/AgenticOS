# MRR / ARR / Churn SQL Queries

All queries assume the schema from `postgres-saas-patterns/templates/base-schema.sql` (tables: `subscriptions`, `tenants`, `stripe_events`).

## Prerequisite: prices table

You need a way to map `stripe_price_id` → monthly cents. Options:

**Option A** — sync prices from Stripe to Postgres:

```sql
CREATE TABLE prices (
  stripe_price_id TEXT PRIMARY KEY,
  lookup_key TEXT,
  unit_amount_cents INTEGER NOT NULL,  -- per period
  interval TEXT NOT NULL,              -- 'month' or 'year'
  -- normalized monthly amount for MRR math
  monthly_cents INTEGER GENERATED ALWAYS AS (
    CASE interval
      WHEN 'month' THEN unit_amount_cents
      WHEN 'year' THEN unit_amount_cents / 12
    END
  ) STORED
);
```

Sync via Stripe webhook (`price.created`, `price.updated`) or a periodic backfill.

**Option B** — hardcode in SQL (fine for early stage, brittle long term):

```sql
-- Use a CASE expression as shown in the queries below
```

## Current MRR

```sql
SELECT
  COALESCE(SUM(p.monthly_cents), 0) / 100.0 AS mrr_usd,
  COUNT(s.id) AS active_subs
FROM subscriptions s
JOIN prices p ON p.stripe_price_id = s.stripe_price_id
WHERE s.status IN ('active', 'trialing');
```

## ARR

```sql
SELECT
  COALESCE(SUM(p.monthly_cents), 0) * 12 / 100.0 AS arr_usd
FROM subscriptions s
JOIN prices p ON p.stripe_price_id = s.stripe_price_id
WHERE s.status IN ('active', 'trialing');
```

## MRR by plan

```sql
SELECT
  p.lookup_key,
  COUNT(s.id) AS subs,
  SUM(p.monthly_cents) / 100.0 AS mrr_usd
FROM subscriptions s
JOIN prices p ON p.stripe_price_id = s.stripe_price_id
WHERE s.status IN ('active', 'trialing')
GROUP BY p.lookup_key
ORDER BY mrr_usd DESC;
```

## New MRR this month

```sql
SELECT
  COALESCE(SUM(p.monthly_cents), 0) / 100.0 AS new_mrr_usd
FROM subscriptions s
JOIN prices p ON p.stripe_price_id = s.stripe_price_id
WHERE s.status IN ('active', 'trialing')
  AND s.created_at >= date_trunc('month', NOW());
```

## Churned MRR this month

```sql
-- Sum of the monthly_cents of subscriptions that canceled this month
SELECT
  COALESCE(SUM(p.monthly_cents), 0) / 100.0 AS churned_mrr_usd
FROM subscriptions s
JOIN prices p ON p.stripe_price_id = s.stripe_price_id
WHERE s.status = 'canceled'
  AND s.updated_at >= date_trunc('month', NOW());
```

## Net new MRR this month

```sql
WITH new_mrr AS (
  SELECT COALESCE(SUM(p.monthly_cents), 0) AS cents
  FROM subscriptions s
  JOIN prices p ON p.stripe_price_id = s.stripe_price_id
  WHERE s.status IN ('active', 'trialing')
    AND s.created_at >= date_trunc('month', NOW())
),
churned_mrr AS (
  SELECT COALESCE(SUM(p.monthly_cents), 0) AS cents
  FROM subscriptions s
  JOIN prices p ON p.stripe_price_id = s.stripe_price_id
  WHERE s.status = 'canceled'
    AND s.updated_at >= date_trunc('month', NOW())
)
SELECT (new_mrr.cents - churned_mrr.cents) / 100.0 AS net_new_mrr_usd
FROM new_mrr, churned_mrr;
```

## Logo churn rate (last 30 days)

```sql
WITH baseline AS (
  -- Subscriptions that existed and were active at start of window
  SELECT COUNT(*) AS n
  FROM subscriptions
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND (status IN ('active', 'trialing')
         OR (status = 'canceled' AND updated_at >= NOW() - INTERVAL '30 days'))
),
churned AS (
  SELECT COUNT(*) AS n
  FROM subscriptions
  WHERE status = 'canceled'
    AND updated_at >= NOW() - INTERVAL '30 days'
    AND created_at < NOW() - INTERVAL '30 days'
)
SELECT
  baseline.n AS subs_at_start,
  churned.n AS churned_in_window,
  ROUND((churned.n::numeric / NULLIF(baseline.n, 0)) * 100, 2) AS monthly_churn_pct
FROM baseline, churned;
```

## Cohort retention (signups by month → activated → still paying)

```sql
WITH cohorts AS (
  SELECT
    date_trunc('month', t.created_at) AS cohort_month,
    t.id AS tenant_id,
    s.status AS sub_status,
    s.created_at AS sub_started_at
  FROM tenants t
  LEFT JOIN subscriptions s ON s.tenant_id = t.id
)
SELECT
  cohort_month,
  COUNT(*) AS signups,
  COUNT(*) FILTER (WHERE sub_started_at IS NOT NULL) AS converted_to_paid,
  COUNT(*) FILTER (WHERE sub_status IN ('active', 'trialing')) AS still_paying,
  ROUND(
    COUNT(*) FILTER (WHERE sub_status IN ('active', 'trialing'))::numeric
    / NULLIF(COUNT(*) FILTER (WHERE sub_started_at IS NOT NULL), 0) * 100,
    1
  ) AS retention_pct
FROM cohorts
WHERE cohort_month >= NOW() - INTERVAL '12 months'
GROUP BY cohort_month
ORDER BY cohort_month DESC;
```

## Trial → paid conversion

```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'trialing') AS active_trials,
  COUNT(*) FILTER (WHERE status = 'active' AND trial_end IS NOT NULL) AS converted,
  COUNT(*) FILTER (WHERE status = 'canceled' AND trial_end IS NOT NULL AND trial_end >= updated_at) AS canceled_in_trial,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'active' AND trial_end IS NOT NULL)::numeric
    / NULLIF(
      COUNT(*) FILTER (WHERE trial_end IS NOT NULL AND trial_end < NOW()),
      0
    ) * 100,
    1
  ) AS conversion_pct
FROM subscriptions
WHERE created_at >= NOW() - INTERVAL '90 days';
```

## ARPU (Average Revenue Per User)

```sql
SELECT
  COUNT(s.id) AS paying_tenants,
  SUM(p.monthly_cents) / 100.0 AS mrr_usd,
  SUM(p.monthly_cents) / NULLIF(COUNT(s.id), 0) / 100.0 AS arpu_usd
FROM subscriptions s
JOIN prices p ON p.stripe_price_id = s.stripe_price_id
WHERE s.status IN ('active', 'trialing');
```

## Notes

- For **revenue churn** (more useful than logo churn for tiered pricing), weight each canceled subscription by its `monthly_cents`.
- For **net revenue retention (NRR)** including expansion (upgrades) and contraction (downgrades), you need a `subscription_changes` audit table — Stripe webhooks `customer.subscription.updated` should write to it.
- Once MRR > $50k or you need multi-dimensional cohort analysis, graduate from Postgres to BigQuery via Cloud SQL → BigQuery scheduled exports.
