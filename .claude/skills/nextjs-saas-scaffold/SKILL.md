---
name: nextjs-saas-scaffold
description: Use this skill whenever working with Next.js 15 App Router code in the Platfrmr stack — creating pages, layouts, server/client components, route groups, middleware, server actions, or API routes. Trigger on any mention of Next.js, App Router, server components, RSC, route groups, or page/layout creation. Encodes Platfrmr-specific Next.js conventions; do NOT default to generic Next.js quickstart patterns or older Pages Router patterns.
---

# Next.js SaaS Scaffold

Conventions for building Next.js 15 App Router apps in the Platfrmr stack. Frontend is TypeScript + Tailwind, deployed to Cloud Run.

## When to use this skill

- Creating new pages, layouts, or routes
- Deciding server component vs client component
- Setting up middleware (auth, subscription gating, redirects)
- Writing server actions or API route handlers
- Structuring a new feature folder
- Configuring metadata, OG tags, or sitemaps

## Decisions to fill in

Edit these to match your project before relying on the skill:

- **Auth provider**: [Auth.js / Clerk / Supabase / custom JWT] — currently this skill assumes Auth.js
- **Styling**: Tailwind + shadcn/ui (assumed)
- **Forms**: react-hook-form + zod (assumed)
- **Data fetching**: server components by default, TanStack Query for client-side mutations
- **Package manager**: [pnpm / npm / bun] — affects Dockerfile templates

## Folder structure

Use route groups to separate concerns visually without affecting URLs:

```
src/
├── app/
│   ├── (marketing)/          # Public pages: /, /pricing, /blog
│   │   ├── layout.tsx        # Marketing layout (header + footer)
│   │   ├── page.tsx          # Landing page
│   │   └── pricing/
│   ├── (app)/                # Authenticated app
│   │   ├── layout.tsx        # App shell (sidebar + topbar)
│   │   ├── dashboard/
│   │   └── settings/
│   ├── (auth)/               # Auth flows
│   │   ├── login/
│   │   └── signup/
│   ├── api/                  # API route handlers
│   │   ├── webhooks/
│   │   │   └── stripe/route.ts
│   │   └── ...
│   └── layout.tsx            # Root layout (providers, fonts)
├── components/
│   ├── ui/                   # shadcn primitives
│   └── features/             # Feature-specific components
├── lib/
│   ├── db/                   # Postgres client + queries
│   ├── auth/                 # Auth helpers
│   ├── stripe/               # Stripe client + webhook handlers
│   └── utils.ts
└── middleware.ts             # Auth + subscription gating
```

## Server component vs client component

**Default to server components.** Only mark `"use client"` when you need:

- Browser APIs (`window`, `localStorage`, `navigator`)
- Event handlers (`onClick`, `onChange`, etc.)
- React hooks (`useState`, `useEffect`, `useReducer`)
- Third-party libraries that depend on the above (most chart libraries, etc.)

Push the `"use client"` boundary as **deep** as possible. A page should usually be a server component that imports a small client component for the interactive bits, not the other way around.

```tsx
// ✅ GOOD — server component fetches data, passes to small client component
export default async function DashboardPage() {
  const data = await db.query.metrics.findMany({ where: ... });
  return (
    <div>
      <h1>Dashboard</h1>
      <MetricsChart data={data} />  {/* client component */}
    </div>
  );
}

// ❌ BAD — entire page is client component, can't fetch on server
"use client";
export default function DashboardPage() {
  const [data, setData] = useState([]);
  useEffect(() => { fetch('/api/metrics').then(...) }, []);
  // ...
}
```

## Middleware patterns

`middleware.ts` runs on every matched request. Use it for auth gating and subscription checks. Keep it lean — middleware runs in the Edge runtime, which has limits.

See `templates/middleware.ts` for the standard auth + subscription gate pattern.

## Server actions

Prefer server actions over API routes for form submissions and mutations from the same app. Reserve API routes for:

- Webhooks (Stripe, third-party callbacks)
- Public APIs consumed by other clients
- Endpoints called from non-Next.js code

See `templates/server-action.ts` for the standard pattern with zod validation and error handling.

## Metadata and SEO

Every page should export `metadata` (or `generateMetadata` for dynamic routes). The marketing layout should set sensible defaults; pages override.

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | Platfrmr',
  description: 'Simple, transparent pricing for...',
  openGraph: { /* ... */ },
};
```

For programmatic SEO pages, see the `seo-content-engine` skill.

## Loading and error states

Every route segment that fetches data should have a `loading.tsx` and `error.tsx`. Use Suspense boundaries for granular loading inside a page.

## Reference files

- `reference/server-actions.md` — Form patterns with zod + react-hook-form
- `reference/auth-patterns.md` — Auth.js setup with Postgres adapter
- `reference/data-fetching.md` — When to use server components vs TanStack Query
- `templates/middleware.ts` — Auth + subscription gating middleware
- `templates/server-action.ts` — Server action with validation
- `templates/route-handler.ts` — API route handler template
- `templates/page-with-suspense.tsx` — Server component page with Suspense

## Anti-patterns to avoid

- ❌ `"use client"` at the top of `page.tsx` files (push it deeper)
- ❌ `useEffect` to fetch data that could be fetched on the server
- ❌ API routes for mutations from the same app (use server actions)
- ❌ Pages Router patterns (`getServerSideProps`, `_app.tsx`, `_document.tsx`)
- ❌ Mixing route groups and parallel routes without a clear reason
- ❌ Heavy logic in middleware (it runs on every request)
