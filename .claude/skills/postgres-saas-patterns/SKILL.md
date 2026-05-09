---
name: postgres-saas-patterns
description: Use this skill whenever working with Postgres, Cloud SQL, database schema, queries, migrations, or connection setup in the Platfrmr stack. Trigger on any mention of Postgres, SQL, Cloud SQL, database, schema, migration, query, ORM, or multi-tenancy. Encodes Platfrmr's Cloud Run + Cloud SQL connection patterns and multi-tenant data model conventions; do NOT default to generic Postgres or ORM quickstart patterns — the Cloud Run cold-start + connection limit problem requires specific handling.
---

# Postgres SaaS Patterns

Conventions for Postgres in the Platfrmr stack: Cloud SQL Postgres, accessed from Cloud Run services (Next.js frontend + Python ADK agents).

## When to use this skill

- Designing or modifying database schema
- Writing SQL queries or ORM queries
- Setting up a new Cloud Run service that connects to Cloud SQL
- Writing or reviewing migrations
- Adding a new tenant-scoped table
- Debugging connection issues, pool exhaustion, or N+1 queries

## Decisions to fill in

Edit these to match your project before relying on the skill:

- **TS ORM**: [Drizzle / Prisma / Kysely / raw SQL] — this skill assumes Drizzle for TS
- **Python ORM**: [SQLAlchemy / asyncpg + raw / SQLModel] — this skill assumes SQLAlchemy 2.0 async
- **Migrations (TS)**: [drizzle-kit / Prisma Migrate / Atlas]
- **Migrations (Python)**: [Alembic — assumed]
- **Multi-tenancy**: [tenant_id column / RLS / schema-per-tenant] — this skill assumes `tenant_id` column with app-enforced filtering
- **Auth tables**: owned by [Auth.js Postgres adapter / your custom schema]

## The Cloud Run + Postgres connection problem

This is the single most important thing to get right. Cloud Run scales to many instances, each with its own connection pool. Postgres has a hard `max_connections` limit. Without care, you will hit "too many connections" in production while everything works fine locally.

**Rules:**

1. **Use Cloud SQL Auth Proxy via Unix socket** for connections from Cloud Run, not TCP. The connection string looks like:
   ```
   postgresql://USER:PASS@/DB?host=/cloudsql/PROJECT:REGION:INSTANCE
   ```
2. **Set tiny per-instance pool sizes.** With Cloud Run scaling to N instances and Postgres allowing M connections, each pool should be `floor(M / max_instances) - safety_margin`. Typically `max_pool_size: 2-5` per instance, not the default 10-20.
3. **Set `min_pool_size: 0`** so idle instances release connections.
4. **Set short connection lifetimes** (`pool_recycle: 1800`) so stale connections from scaled-down instances don't linger.
5. **Configure `max_instances` on Cloud Run** to cap the total connection count: `max_instances * max_pool_size + headroom < postgres_max_connections`.

For high-traffic apps, add **PgBouncer** in front of Cloud SQL (transaction pooling mode). See `reference/connection-pooling.md`.

## Multi-tenancy pattern

Default to **`tenant_id` column with app-enforced filtering** unless you have a specific reason for RLS or schema-per-tenant.

Every tenant-scoped table has:
- `tenant_id UUID NOT NULL REFERENCES tenants(id)`
- Index on `tenant_id` (or composite indexes leading with `tenant_id`)
- A query helper that **enforces** tenant_id is passed — never trust callers to remember

```typescript
// ✅ GOOD — tenant scoping enforced by the query layer
export async function getProjects(tenantId: string) {
  return db.select().from(projects).where(eq(projects.tenantId, tenantId));
}

// ❌ BAD — easy to forget the where clause and leak data across tenants
export async function getProjects() {
  return db.select().from(projects);
}
```

For stronger guarantees, add Postgres RLS as a defense-in-depth. See `reference/multi-tenancy.md`.

## Indexing rules

- Every foreign key gets an index (Postgres doesn't auto-index FKs)
- Every `WHERE` column used in hot queries gets an index
- Composite indexes lead with `tenant_id` for multi-tenant tables
- Use partial indexes for `status = 'active'` style filters
- `EXPLAIN ANALYZE` slow queries before adding indexes — don't guess

## Migration discipline

- **Migrations are forward-only.** No `down` migrations in production.
- **Every migration is reviewable.** Generated migrations get committed and read.
- **Backwards-compatible deploys.** Schema changes ship in a separate deploy from code that depends on them when possible:
  - Deploy 1: Add column (nullable)
  - Deploy 2: Backfill + start writing
  - Deploy 3: Code reads new column
  - Deploy 4: Make NOT NULL / drop old column
- **Never** rename a column in a single migration — add new, dual-write, drop old.

## Standard tables every SaaS needs

See `templates/base-schema.sql` for the canonical schema:
- `tenants` — the org/workspace
- `users` — global user identity
- `tenant_members` — many-to-many users ↔ tenants with role
- `subscriptions` — Stripe subscription state mirror
- `stripe_events` — webhook idempotency
- Audit/timestamp columns (`created_at`, `updated_at`) on everything

## JSONB for flexible agent state

ADK agents need to persist conversation state, intermediate outputs, and tool results. Use JSONB columns rather than over-normalizing:

```sql
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  agent_name TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'running' | 'completed' | 'failed'
  input JSONB NOT NULL,
  output JSONB,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_runs_tenant_status ON agent_runs(tenant_id, status);
CREATE INDEX idx_agent_runs_input_gin ON agent_runs USING GIN (input);
```

Index JSONB with GIN when you query into it; otherwise skip the index.

## Reference files

- `reference/connection-pooling.md` — Full pool sizing math + PgBouncer setup
- `reference/multi-tenancy.md` — tenant_id vs RLS vs schema-per-tenant tradeoffs
- `reference/migration-patterns.md` — Backwards-compatible migration recipes
- `templates/base-schema.sql` — Canonical SaaS base tables
- `templates/db-client-ts.ts` — Drizzle + Cloud SQL Auth Proxy client
- `templates/db-client-py.py` — SQLAlchemy async + Cloud SQL Auth Proxy client
- `templates/tenant-scoped-query.ts` — Multi-tenant query helper

## Anti-patterns to avoid

- ❌ Default ORM connection pool sizes (10-20) on Cloud Run — will exhaust Postgres
- ❌ TCP connections from Cloud Run to Cloud SQL (use Unix socket via Auth Proxy)
- ❌ Forgetting `tenant_id` in `WHERE` clauses — wrap queries in helpers that require it
- ❌ Using `SERIAL`/`BIGSERIAL` IDs for tenant-facing entities (use `UUID` — leaks user counts otherwise)
- ❌ Storing Stripe webhook payloads in your main subscription table without idempotency table
- ❌ Long-running transactions in Cloud Run (request timeout will leak connections)
