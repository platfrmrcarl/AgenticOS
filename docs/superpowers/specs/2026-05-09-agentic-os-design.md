# AgenticOS Web App — Design Spec

**Date:** 2026-05-09  
**Stack:** Next.js 15 (App Router) · PostgreSQL · Prisma · Python FastAPI (Anthropic SDK) · Tailwind · Vitest  
**Monorepo pattern:** mirrors `platfrmr` — `web/` + `agents/` workspaces

---

## 1. What This Is

A web app that guides a user through the 5-phase "Agentic OS" setup from `design.md`, then surfaces their completed skill architecture as an interactive mind map with an observability dashboard. Users can run skills from the app and track activity over time.

---

## 2. Monorepo Structure

```
AgenticOS/
  web/                          # Next.js 15 App Router
    src/
      app/
        (protected)/
          dashboard/            # Mind map + observability
          setup/                # 5-phase wizard
          skills/               # Skill runner
        api/
          agents/[...path]/     # Proxy to agents service (streaming)
          skills/               # Skill CRUD API
          sessions/             # Chat session API
        login/
        page.tsx                # Landing
        layout.tsx
      components/
        ui/                     # Radix-based primitives
        mind-map/               # React Flow canvas
        setup/                  # Wizard step components
        observability/          # Charts + stats
      lib/
        db.ts                   # Prisma client singleton
        auth.ts                 # next-auth config
        agents.ts               # Agents service client
      types/
    prisma/
      schema.prisma
    vitest.config.ts
    package.json
  agents/                       # Python FastAPI — Claude agent
    app/
      main.py                   # FastAPI app + CORS
      agent.py                  # AgenticOS guide agent (Anthropic SDK)
      phases/
        __init__.py
        brain_dump.py
        domain_locking.py
        skill_surfacing.py
        automation_triage.py
        deliverable.py
      models.py                 # Pydantic request/response models
      session.py                # In-memory + DB session management
    tests/
    pyproject.toml
  package.json                  # Workspace root (npm workspaces)
  docker-compose.yml            # Postgres + agents service for local dev
```

---

## 3. Database Schema (Prisma / PostgreSQL)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  password      String?
  name          String?
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  osSetup       OsSetup?
  domains       Domain[]
  skills        Skill[]
  skillRuns     SkillRun[]
  chatSessions  ChatSession[]
  createdAt     DateTime  @default(now())
}

model OsSetup {
  id           String    @id @default(cuid())
  userId       String    @unique
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  phase        Int       @default(1)   // 1–5; 5 = complete
  brainDump    Json?     // string[]
  domains      Json?     // {name, successVision}[]
  skills       Json?     // {domainName, skills: {name, description}[]}[]
  triageData   Json?     // {skillId, frequency, needsFilesystem, needsRemote}[]
  deliverables Json?     // {claudeMd, folderStructure, skillSpecs[], sevenDayPlan}
  completedAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model Domain {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name           String
  successVision  String?
  position       Int      @default(0)
  skills         Skill[]
  createdAt      DateTime @default(now())
}

model Skill {
  id              String         @id @default(cuid())
  userId          String
  domainId        String
  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  domain          Domain         @relation(fields: [domainId], references: [id], onDelete: Cascade)
  name            String
  description     String
  input           String?
  output          String?
  frequency       SkillFrequency @default(ON_DEMAND)
  dependencies    String?
  successCriteria String?
  runs            SkillRun[]
  createdAt       DateTime       @default(now())
}

enum SkillFrequency {
  ON_DEMAND
  LOCAL_ROUTINE
  CLOUD_ROUTINE
}

model SkillRun {
  id        String    @id @default(cuid())
  userId    String
  skillId   String?
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  skill     Skill?    @relation(fields: [skillId], references: [id])
  input     String?
  output    String?
  status    RunStatus @default(PENDING)
  costUsd   Float?
  startedAt DateTime  @default(now())
  endedAt   DateTime?
}

enum RunStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}

model ChatSession {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  phase     Int
  messages  Json     // {role: "user"|"assistant", content: string}[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// next-auth required models
model Account { ... }
model Session { ... }
model VerificationToken { ... }
```

---

## 4. UI Design

### Visual Language (from reference screenshots)
- **Background:** `#0a0a0a` near-black
- **Primary accent:** orange `#f97316` (Tailwind `orange-500`)
- **Secondary accent:** amber `#fbbf24` for hover/active states
- **Success/active:** neon green `#22c55e`
- **Text:** `#e5e7eb` primary, `#9ca3af` muted
- **Borders:** `#1f2937` / `#374151`
- **Font:** Inter (body), JetBrains Mono (terminal/code elements)
- **Charts:** orange area fill with 20% opacity, solid orange stroke

### Pages

#### `/` — Landing
- Full-screen dark hero: "Build Your Agentic OS"
- Subtext: "Turn Claude Code from random prompts into a system you can run, track, and hand off."
- Single CTA: "Get Started →"
- Links to login/signup

#### `/(protected)/setup` — 5-Phase Wizard
- Left rail: phase progress indicator (1–5 with labels)
- Right main: chat interface with streaming responses
- Each phase uses the exact prompts from `design.md`
- Phase 5 renders deliverables as formatted code blocks with copy buttons
- Progress auto-saves to `OsSetup` after each phase completion

#### `/(protected)/dashboard` — Main OS View
- **Top stats bar:** "Claude Code" | skill runs today | active skills | total sessions | approx cost
- **Mind map canvas** (React Flow): hierarchy layout
  - Root node: "Me / [UserName]"
  - Level 2: "CLAUDE CODE" (orange glow node)
  - Level 3: domain nodes (colored by domain)
  - Level 4: skill leaf nodes (cards with frequency badge)
  - Clicking a skill opens a slide-over with skill details + "Run" button
- **Bottom panel** (toggleable): activity chart — area chart of skill runs over 30 days

#### `/(protected)/skills` — Skill Runner
- Top: active skill selector (all user skills, grouped by domain)
- Center: terminal-style interface
  - "RUN A SKILL TO BEGIN" prompt when idle
  - Input box at bottom with orange cursor
  - Output streams in above
- Right sidebar: recent runs log with status badges

---

## 5. Agents Service (Python FastAPI)

### Single Agent: `agentic-os-guide`

Uses Anthropic SDK (claude-sonnet-4-6). Implements the `design.md` protocol exactly.

**System prompt:** The full `design.md` content as context, plus instructions to follow the one-question-at-a-time rule and produce structured JSON at phase boundaries.

**Phase boundary detection:** After each assistant turn, the agent checks if the phase transition criteria are met and emits a special `__phase_complete__` event with structured data for DB persistence.

**Endpoints:**
```
POST /run/agentic-os-guide       — stream SSE, advances conversation
GET  /sessions/{session_id}      — get session messages
POST /sessions                   — create new session
DELETE /sessions/{session_id}    — clear session
GET  /health                     — health check
```

**Local dev:** Runs on `localhost:8000`. The Next.js proxy at `/api/agents/[...path]` forwards without OIDC (env `AGENTS_REQUIRE_AUTH=false`).

**Streaming:** SSE (`text/event-stream`). Each chunk: `data: {"type":"text","content":"..."}`. Phase completion: `data: {"type":"phase_complete","phase":1,"data":{...}}`.

---

## 6. API Routes (Next.js)

```
POST /api/sessions              — create ChatSession, return id
GET  /api/sessions/[id]         — get session messages
POST /api/sessions/[id]/message — append user message, proxy stream to agents

POST /api/skills                — create skill
GET  /api/skills                — list user skills (with domain)
PUT  /api/skills/[id]           — update skill
DELETE /api/skills/[id]         — delete skill

POST /api/skills/[id]/run       — create SkillRun, stream to agents
GET  /api/runs                  — list recent SkillRuns (for activity chart)

GET  /api/agents/[...path]      — proxy to agents service (existing pattern)
```

---

## 7. Testing Strategy (TDD)

**Unit tests (Vitest):**
- All API route handlers — mock Prisma, assert response shape/status
- Agent proxy — mock fetch, assert header forwarding
- Phase state machine — assert correct phase transitions
- Skill CRUD — assert DB operations

**Integration tests (Vitest + test DB):**
- Setup wizard: full 5-phase flow with mocked agent responses
- Skill runner: create run, update status, assert activity chart data

**Python tests (pytest):**
- Each phase prompt builder — assert prompt structure
- Phase boundary detection — assert JSON emission on correct conditions
- Anthropic SDK mock — assert correct model/params called

**Test coverage target:** 80% lines on all non-UI files.

---

## 8. Key Dependencies

**web/**
- `next@15`, `react@19`, `typescript`
- `@prisma/client`, `prisma`
- `next-auth@5` (Auth.js v5)
- `@radix-ui/react-*` (dialog, popover, tooltip, scroll-area)
- `reactflow` (mind map canvas)
- `recharts` (activity chart)
- `tailwindcss@4`
- `lucide-react`
- `clsx`, `class-variance-authority`
- `vitest`, `@testing-library/react`, `msw` (test deps)

**agents/**
- `fastapi`, `uvicorn`
- `anthropic` (Anthropic SDK)
- `sse-starlette` (SSE streaming)
- `pydantic`
- `asyncpg` or `psycopg2-binary` (for session persistence)
- `pytest`, `pytest-asyncio`, `httpx` (test deps)

---

## 9. Local Dev Setup

```bash
# 1. Start Postgres
docker-compose up -d postgres

# 2. Run DB migrations
cd web && npx prisma migrate dev

# 3. Start agents service
cd agents && uv run uvicorn app.main:app --reload --port 8000

# 4. Start Next.js
cd web && npm run dev
```

**Required `.env.local`:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agenticos
NEXTAUTH_SECRET=<random>
NEXTAUTH_URL=http://localhost:3000
AGENTS_SERVICE_URL=http://localhost:8000
ANTHROPIC_API_KEY=<key>
```

---

## 10. Success Criteria

- User can complete all 5 setup phases via the chat interface
- Deliverables render correctly as copy-able code blocks
- Mind map displays all domains and skills after setup completion
- Skill runner accepts input and streams agent output
- Activity chart shows real run data
- All Vitest + pytest tests pass
- `npm run build` succeeds with no type errors
