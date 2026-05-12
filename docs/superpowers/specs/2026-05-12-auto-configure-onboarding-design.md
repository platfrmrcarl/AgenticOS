# Auto-Configuration Onboarding — Design

**Status:** approved (2026-05-12)
**Replaces:** the 5-phase chat flow in `/setup` (brain_dump → automation_triage → domain_locking → skill_surfacing → deliverable) and the `/run/agentic-os-guide` Python endpoint.

## Goal (one sentence)

Replace the open-ended 5-phase onboarding chat with a 2-question intake whose answers an Auto-Configuration agent uses to draft a complete set of domains + skills, which the user reviews and enables before landing on the dashboard.

## Why

The current flow asks the user to drive every step (brain-dump 20–50 items, name 3–5 domains, list 4–7 tasks per domain, classify each by frequency, copy-paste artifacts). That is the cognitive load we're charging the user to carry. The Auto-Configuration agent reverses the contract: the user supplies minimum signal, the agent does the bookkeeping, and the user spends their attention on review/edit rather than enumeration.

## The two questions

1. **"What's your role and what does your business do?"** — large textarea, free text
2. **"What would success look like if your business ran on autopilot for a year?"** — large textarea, free text

No multi-select chips, no "tools you use". The agent infers tool context from the role/business answer.

## End-to-end flow

```
/setup           POST role+vision
   │
   ▼
/setup/configuring   (SSE-driven progress UI)
   │
   ▼ (on complete event)
/setup/review        list inferred domains + skills, enable toggles
   │
   ▼ ("Continue to dashboard")
/dashboard
```

## Backend

### New endpoint: `POST /run/auto-configure` (Python agents service)

- Input: `{ user_id, role, vision }`
- Output: SSE stream emitting these event types:
  - `status` — `{ message: string }` — narrative progress ("Identifying domains...", "Drafting skills for Client Delivery...")
  - `domain_drafted` — `{ name, success_vision }` — fired as each domain is produced
  - `skill_drafted` — `{ domain_name, name, description, frequency, input, output, success_criteria }` — fired as each skill is produced
  - `complete` — `{ persisted: true }` — final event after DB writes succeed
  - `error` — `{ message }` — on failure

### Inference structure (genuine progress, not faked)

Two-stage pipeline (still cheap, ~5–10s total):

1. **Stage 1 — Domains.** One LLM call. Input: role+vision. Output: 3 domains, each with `name` and `success_vision`. Emit `domain_drafted` per domain.
2. **Stage 2 — Skills per domain.** Run 3 LLM calls in parallel (one per domain). Each returns 4–7 skills. Emit `skill_drafted` events as each call completes.

Reason for two stages: we want the user to see real progress events tied to real work, not a synthetic typewriter effect.

### Persistence

After both stages complete, write all domains + skills to the DB in a single transaction with `enabled: false`. Emit `complete` only after the transaction commits.

## Frontend

### Page 1: `/setup` (rewritten)

- Two-step form (step 1: role/business, step 2: vision). "Back" + "Continue" controls. Cmd/Ctrl+Enter submits.
- On final submit, navigate to `/setup/configuring` with the answers in sessionStorage (or short-lived cookie).

### Page 2: `/setup/configuring` (new)

- Opens an SSE stream to a Next.js API route that proxies to the Python `/run/auto-configure` endpoint (same pattern as the existing `[id]/message/route.ts`).
- Renders a live log:
  - Status messages in muted text.
  - As `domain_drafted` events arrive, render the domain as a card.
  - As `skill_drafted` events arrive, render skills inside the matching domain card.
- On `complete`, redirect to `/setup/review`.
- On `error`, show retry CTA.

### Page 3: `/setup/review` (new)

- Server-rendered: load all draft skills (`enabled: false`) for the user, grouped by domain.
- Per skill row: name, 1-line description, frequency badge, enable toggle (default on).
- "Continue to dashboard" button. Server action sets `enabled: true` for each toggled skill and redirects to `/dashboard`.

## Schema change

Add to `Skill` model:

```prisma
enabled Boolean @default(false)
```

One migration. No data migration needed.

## Cleanup

To delete:

- `agents/app/phases/*.py` (all 5 phases)
- The `/run/agentic-os-guide` route in `agents/app/main.py`
- `web/src/app/api/sessions/` (entire directory)
- `web/src/components/setup/ChatInterface.tsx`
- `web/src/components/setup/PhaseIndicator.tsx`
- `web/src/components/setup/DeliverableRenderer.tsx`
- `web/src/lib/sse.ts` (if unused outside setup)

To keep:

- `ChatSession` and `OsSetup` Prisma models — leave for now, separate cleanup migration later.

## Trade-offs accepted

- **2 questions sacrifices specificity.** Generic inferences will sometimes result. Mitigated by review/enable step.
- **4 LLM calls per onboarding** (1 for domains, 3 in parallel for skills). Cheaper than the current 5+ chat turns.
- **`enabled` adds a DB column.** Migration unavoidable.

## Testing

- Unit: domain inference returns 3 domains with non-empty `name` + `success_vision` for representative input.
- Unit: skill inference returns 4–7 skills per domain, all with valid `frequency` enum values.
- Integration: POST to `/run/auto-configure` writes expected row counts to `Domain` and `Skill`.
- E2E (manual): submit 2-question form → stream renders → review page lists everything → continuing lands on `/dashboard`.

## Out of scope

- Auto-running any skill on day one (explicitly chosen: "nothing live yet").
- Tool/integration connection UI.
- Editing skill internals from the review page.
