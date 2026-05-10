# AgenticOS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack AgenticOS web app — 5-phase setup wizard, mind map dashboard, and skill runner — backed by Next.js 15, PostgreSQL/Prisma, and a Python FastAPI agents service using the Anthropic SDK.

**Architecture:** Next.js App Router frontend (protected routes, SSE streaming, React Flow mind map, Recharts activity chart) proxies to a Python FastAPI service that runs the Anthropic SDK guide agent. PostgreSQL via Prisma stores users, setup state, domains, skills, runs, and chat sessions. npm workspaces monorepo with `web/` and `agents/` packages.

**Tech Stack:** Next.js 15, React 19, Prisma 7 + PrismaPg + pg, next-auth v5, Python FastAPI, anthropic SDK, sse-starlette, React Flow, Recharts, Tailwind v4, Vitest, pytest

---

## File Structure

**Created:**
- `package.json` — workspace root
- `docker-compose.yml` — postgres
- `.env.example`
- `web/package.json`
- `web/next.config.ts`
- `web/tsconfig.json`
- `web/postcss.config.mjs`
- `web/vitest.config.ts`
- `web/prisma/schema.prisma`
- `web/src/lib/prisma.ts`
- `web/src/lib/utils.ts`
- `web/src/lib/sse.ts`
- `web/src/lib/agents.ts`
- `web/src/auth.config.ts`
- `web/src/auth.ts`
- `web/src/middleware.ts`
- `web/src/types/next-auth.d.ts`
- `web/src/app/layout.tsx`
- `web/src/app/page.tsx`
- `web/src/app/login/page.tsx`
- `web/src/app/(protected)/layout.tsx`
- `web/src/app/(protected)/setup/page.tsx`
- `web/src/app/(protected)/dashboard/page.tsx`
- `web/src/app/(protected)/skills/page.tsx`
- `web/src/app/api/agents/[...path]/route.ts`
- `web/src/app/api/sessions/route.ts`
- `web/src/app/api/sessions/[id]/route.ts`
- `web/src/app/api/sessions/[id]/message/route.ts`
- `web/src/app/api/skills/route.ts`
- `web/src/app/api/skills/[id]/route.ts`
- `web/src/app/api/skills/[id]/run/route.ts`
- `web/src/app/api/runs/route.ts`
- `web/src/components/ui/button.tsx`
- `web/src/components/ui/input.tsx`
- `web/src/components/ui/badge.tsx`
- `web/src/components/ui/card.tsx`
- `web/src/components/ui/scroll-area.tsx`
- `web/src/components/setup/PhaseIndicator.tsx`
- `web/src/components/setup/ChatInterface.tsx`
- `web/src/components/setup/DeliverableRenderer.tsx`
- `web/src/components/mind-map/MindMapCanvas.tsx`
- `web/src/components/mind-map/SkillNode.tsx`
- `web/src/components/mind-map/DomainNode.tsx`
- `web/src/components/observability/ActivityChart.tsx`
- `web/src/components/observability/StatBar.tsx`
- `web/src/components/skills/SkillSelector.tsx`
- `web/src/components/skills/SkillRunner.tsx`
- `web/src/components/skills/RunLog.tsx`
- `web/tests/api/agents-proxy.test.ts`
- `web/tests/api/sessions.test.ts`
- `web/tests/api/skills.test.ts`
- `web/tests/api/runs.test.ts`
- `web/tests/lib/sse.test.ts`
- `agents/pyproject.toml`
- `agents/app/__init__.py`
- `agents/app/main.py`
- `agents/app/agent.py`
- `agents/app/models.py`
- `agents/app/session.py`
- `agents/app/phases/__init__.py`
- `agents/app/phases/brain_dump.py`
- `agents/app/phases/domain_locking.py`
- `agents/app/phases/skill_surfacing.py`
- `agents/app/phases/automation_triage.py`
- `agents/app/phases/deliverable.py`
- `agents/tests/conftest.py`
- `agents/tests/test_agent.py`
- `agents/tests/test_routes.py`

---

### Task 1: Monorepo Root Scaffold

**Files:**
- Create: `package.json`
- Create: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: Write the failing test** (manual verification — no unit test for scaffolding; run `node -e "require('./package.json')"` to verify JSON)

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "agenticos",
  "private": true,
  "workspaces": ["web", "agents"],
  "scripts": {
    "dev:web": "npm run dev --workspace=web",
    "dev:agents": "cd agents && uv run uvicorn app.main:app --reload --port 8000",
    "build": "npm run build --workspace=web",
    "test": "npm run test --workspace=web && cd agents && uv run pytest"
  }
}
```

- [ ] **Step 3: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: agenticos
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

- [ ] **Step 4: Create `.env.example`**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agenticos
NEXTAUTH_SECRET=changeme
NEXTAUTH_URL=http://localhost:3000
AGENTS_SERVICE_URL=http://localhost:8000
AGENTS_REQUIRE_AUTH=false
ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 5: Verify**

```bash
node -e "const p = require('./package.json'); console.assert(p.workspaces.includes('web'), 'missing web workspace')"
```

Expected: no output (assertion passes)

- [ ] **Step 6: Commit**

```bash
git add package.json docker-compose.yml .env.example
git commit -m "feat: monorepo root scaffold with workspaces and docker-compose"
```

---

### Task 2: Next.js App Scaffold + Config

**Files:**
- Create: `web/package.json`
- Create: `web/next.config.ts`
- Create: `web/tsconfig.json`
- Create: `web/postcss.config.mjs`
- Create: `web/vitest.config.ts`
- Create: `web/.env.local` (gitignored)

- [ ] **Step 1: Write the failing test**

Create `web/tests/config.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { resolve } from "path";
import { existsSync } from "fs";

describe("project config", () => {
  it("tsconfig exists", () => {
    expect(existsSync(resolve(__dirname, "../tsconfig.json"))).toBe(true);
  });
  it("vitest config exists", () => {
    expect(existsSync(resolve(__dirname, "../vitest.config.ts"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd web && npx vitest run tests/config.test.ts
```

Expected: FAIL — cannot find `vitest`

- [ ] **Step 3: Create `web/package.json`**

```json
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "^15.3.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^7.8.0",
    "@prisma/adapter-pg": "^7.8.0",
    "pg": "^8.20.0",
    "next-auth": "^5.0.0-beta.31",
    "@auth/prisma-adapter": "^2.11.2",
    "bcryptjs": "^3.0.3",
    "reactflow": "^11.11.4",
    "recharts": "^2.15.3",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-tooltip": "^1.1.8",
    "lucide-react": "^0.511.0",
    "clsx": "^2.1.1",
    "class-variance-authority": "^0.7.1",
    "tailwind-merge": "^3.3.0",
    "tailwindcss": "^4.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.2.4",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/pg": "^8.11.11",
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5",
    "prisma": "^7.8.0",
    "vitest": "^3.1.3",
    "@testing-library/react": "^16.3.0",
    "@vitejs/plugin-react": "^4.4.1",
    "msw": "^2.7.5"
  }
}
```

- [ ] **Step 4: Create `web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create `web/next.config.ts`**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},
};

export default nextConfig;
```

- [ ] **Step 6: Create `web/postcss.config.mjs`**

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

- [ ] **Step 7: Create `web/vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    server: {
      deps: {
        inline: ["next", "next-auth"],
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 8: Install deps and run tests**

```bash
cd web && npm install && npx vitest run tests/config.test.ts
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add web/package.json web/next.config.ts web/tsconfig.json web/postcss.config.mjs web/vitest.config.ts web/tests/config.test.ts
git commit -m "feat: Next.js app scaffold with vitest config"
```

---

### Task 3: Prisma Schema + DB Client

**Files:**
- Create: `web/prisma/schema.prisma`
- Create: `web/src/lib/prisma.ts`
- Create: `web/tests/lib/prisma.test.ts`

- [ ] **Step 1: Write the failing test**

Create `web/tests/lib/prisma.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";

vi.mock("pg", () => ({
  Pool: vi.fn().mockImplementation(() => ({ query: vi.fn() })),
}));
vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: vi.fn().mockImplementation(() => ({})),
}));
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({ $connect: vi.fn() })),
}));

describe("prisma client", () => {
  it("exports prisma singleton", async () => {
    const { prisma } = await import("@/lib/prisma");
    expect(prisma).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd web && npx vitest run tests/lib/prisma.test.ts
```

Expected: FAIL — `@/lib/prisma` not found

- [ ] **Step 3: Create `web/prisma/schema.prisma`**

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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
  phase        Int       @default(1)
  brainDump    Json?
  domains      Json?
  skills       Json?
  triageData   Json?
  deliverables Json?
  completedAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model Domain {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name          String
  successVision String?
  position      Int      @default(0)
  skills        Skill[]
  createdAt     DateTime @default(now())
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
  messages  Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

- [ ] **Step 4: Create `web/src/lib/prisma.ts`**

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
cd web && npx vitest run tests/lib/prisma.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add web/prisma/schema.prisma web/src/lib/prisma.ts web/tests/lib/prisma.test.ts
git commit -m "feat: Prisma schema with all models and PrismaPg singleton"
```

---

### Task 4: Auth Setup

**Files:**
- Create: `web/src/auth.config.ts`
- Create: `web/src/auth.ts`
- Create: `web/src/middleware.ts`
- Create: `web/src/types/next-auth.d.ts`
- Create: `web/tests/auth/auth.test.ts`

- [ ] **Step 1: Write the failing test**

Create `web/tests/auth/auth.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));
vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
  compare: vi.fn(),
}));
vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn().mockReturnValue({}),
}));

describe("auth config", () => {
  it("exports handlers, auth, signIn, signOut", async () => {
    const mod = await import("@/auth");
    expect(mod.handlers).toBeDefined();
    expect(mod.auth).toBeDefined();
    expect(mod.signIn).toBeDefined();
    expect(mod.signOut).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd web && npx vitest run tests/auth/auth.test.ts
```

Expected: FAIL — `@/auth` not found

- [ ] **Step 3: Create `web/src/types/next-auth.d.ts`**

```typescript
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
```

- [ ] **Step 4: Create `web/src/auth.config.ts`**

```typescript
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/setup") ||
        nextUrl.pathname.startsWith("/skills");
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
  },
};
```

- [ ] **Step 5: Create `web/src/auth.ts`**

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) return null;

        return user;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    authorized: () => true,
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
});
```

- [ ] **Step 6: Create `web/src/middleware.ts`**

```typescript
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 7: Run test to confirm it passes**

```bash
cd web && npx vitest run tests/auth/auth.test.ts
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add web/src/auth.config.ts web/src/auth.ts web/src/middleware.ts web/src/types/next-auth.d.ts web/tests/auth/auth.test.ts
git commit -m "feat: next-auth v5 Credentials + JWT + PrismaAdapter"
```

---

### Task 5: Python Agents — Models + Session

**Files:**
- Create: `agents/pyproject.toml`
- Create: `agents/app/__init__.py`
- Create: `agents/app/models.py`
- Create: `agents/app/session.py`
- Create: `agents/tests/__init__.py`
- Create: `agents/tests/conftest.py`
- Create: `agents/tests/test_session.py`

- [ ] **Step 1: Write the failing test**

Create `agents/tests/test_session.py`:

```python
import pytest
from app.session import SessionStore
from app.models import SessionMessage

def test_create_session():
    store = SessionStore()
    session_id = store.create()
    assert session_id is not None
    assert isinstance(session_id, str)

def test_add_and_get_messages():
    store = SessionStore()
    session_id = store.create()
    store.add_message(session_id, {"role": "user", "content": "hello"})
    store.add_message(session_id, {"role": "assistant", "content": "hi"})
    messages = store.get_messages(session_id)
    assert len(messages) == 2
    assert messages[0]["role"] == "user"

def test_get_nonexistent_session_returns_none():
    store = SessionStore()
    result = store.get_messages("nonexistent")
    assert result is None

def test_delete_session():
    store = SessionStore()
    session_id = store.create()
    store.delete(session_id)
    assert store.get_messages(session_id) is None

def test_session_message_model():
    msg = SessionMessage(role="user", content="test")
    assert msg.role == "user"
    assert msg.content == "test"
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd agents && uv run pytest tests/test_session.py -v
```

Expected: FAIL — `app.session` not found

- [ ] **Step 3: Create `agents/pyproject.toml`**

```toml
[project]
name = "agents"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "anthropic>=0.52.0",
    "sse-starlette>=2.2.1",
    "pydantic>=2.11.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.25.0",
    "httpx>=0.28.0",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 4: Create `agents/app/__init__.py`** (empty)

- [ ] **Step 5: Create `agents/app/models.py`**

```python
from pydantic import BaseModel
from typing import Optional

class SessionMessage(BaseModel):
    role: str
    content: str

class RunRequest(BaseModel):
    session_id: str
    message: str

class PhaseCompleteEvent(BaseModel):
    type: str = "phase_complete"
    phase: int
    data: dict
```

- [ ] **Step 6: Create `agents/app/session.py`**

```python
import uuid
from typing import Optional

class SessionStore:
    def __init__(self):
        self._sessions: dict[str, list[dict]] = {}

    def create(self) -> str:
        session_id = str(uuid.uuid4())
        self._sessions[session_id] = []
        return session_id

    def get_messages(self, session_id: str) -> Optional[list[dict]]:
        return self._sessions.get(session_id)

    def add_message(self, session_id: str, message: dict) -> None:
        if session_id not in self._sessions:
            self._sessions[session_id] = []
        self._sessions[session_id].append(message)

    def delete(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)

session_store = SessionStore()
```

- [ ] **Step 7: Create `agents/tests/__init__.py`** (empty)

- [ ] **Step 8: Create `agents/tests/conftest.py`**

```python
import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def client():
    from app.main import app
    return TestClient(app)
```

- [ ] **Step 9: Install deps and run tests**

```bash
cd agents && uv sync --extra dev && uv run pytest tests/test_session.py -v
```

Expected: PASS (5 tests)

- [ ] **Step 10: Commit**

```bash
git add agents/pyproject.toml agents/app/__init__.py agents/app/models.py agents/app/session.py agents/tests/__init__.py agents/tests/conftest.py agents/tests/test_session.py
git commit -m "feat: Python agents models and in-memory session store"
```

---

### Task 6: Python Agents — Phase Builders

**Files:**
- Create: `agents/app/phases/__init__.py`
- Create: `agents/app/phases/brain_dump.py`
- Create: `agents/app/phases/domain_locking.py`
- Create: `agents/app/phases/skill_surfacing.py`
- Create: `agents/app/phases/automation_triage.py`
- Create: `agents/app/phases/deliverable.py`
- Create: `agents/tests/test_phases.py`

- [ ] **Step 1: Write the failing test**

Create `agents/tests/test_phases.py`:

```python
import pytest
from app.phases.brain_dump import build_brain_dump_prompt
from app.phases.domain_locking import build_domain_locking_prompt
from app.phases.skill_surfacing import build_skill_surfacing_prompt
from app.phases.automation_triage import build_triage_prompt
from app.phases.deliverable import build_deliverable_prompt

def test_brain_dump_prompt_contains_instructions():
    prompt = build_brain_dump_prompt()
    assert "brain dump" in prompt.lower()
    assert "20" in prompt

def test_domain_locking_prompt_contains_domain_instruction():
    prompt = build_domain_locking_prompt(brain_dump=["write emails", "review code"])
    assert "domain" in prompt.lower()
    assert "3" in prompt or "five" in prompt.lower() or "5" in prompt

def test_skill_surfacing_prompt_includes_domain():
    prompt = build_skill_surfacing_prompt(domain="client delivery")
    assert "client delivery" in prompt

def test_triage_prompt_includes_skill():
    prompt = build_triage_prompt(skill_name="draft sponsor reply")
    assert "draft sponsor reply" in prompt
    assert "frequency" in prompt.lower() or "often" in prompt.lower()

def test_deliverable_prompt_includes_domains_and_skills():
    domains = [{"name": "content", "successVision": "automated"}]
    skills = [{"domainName": "content", "skills": [{"name": "draft post", "description": "writes post"}]}]
    prompt = build_deliverable_prompt(domains=domains, skills=skills)
    assert "CLAUDE.md" in prompt
    assert "content" in prompt
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd agents && uv run pytest tests/test_phases.py -v
```

Expected: FAIL — modules not found

- [ ] **Step 3: Create `agents/app/phases/__init__.py`** (empty)

- [ ] **Step 4: Create `agents/app/phases/brain_dump.py`**

```python
def build_brain_dump_prompt() -> str:
    return """You are beginning Phase 1: Brain Dump.

Ask the user to brain dump everything they do in a typical week. Tell them to be messy — no structure, no categorization, no filtering. Just a stream of every recurring task, project, communication channel, tool, deliverable, and ritual that fills their time. They should aim for 20-50 items minimum.

Prompt with examples to unstick them if they freeze:
- "What do you do every Monday morning?"
- "What's the first thing you check when you sit down?"
- "What do you wish you didn't have to do?"
- "What do you keep meaning to do but never get to?"

Wait until they say they are done dumping."""
```

- [ ] **Step 5: Create `agents/app/phases/domain_locking.py`**

```python
def build_domain_locking_prompt(brain_dump: list[str]) -> str:
    items = "\n".join(f"- {item}" for item in brain_dump)
    return f"""You are in Phase 2: Domain Locking.

The user has completed their brain dump. Here is what they listed:
{items}

Now ask: "Looking at everything you just listed, what are the 3-5 core business domains that bundle all this work together?"

A domain is a thematic area of work — not a tool, not a task, but a cluster of related outputs. Examples: "client delivery," "hiring," "investor relations," "content creation," "internal ops."

For each domain they name, ask one follow-up:
- "What would success look like in [domain] if it ran on autopilot?"

Lock in 3-5 domains."""
```

- [ ] **Step 6: Create `agents/app/phases/skill_surfacing.py`**

```python
def build_skill_surfacing_prompt(domain: str) -> str:
    return f"""You are in Phase 3: Skill Surfacing for the domain "{domain}".

Ask: "What are the 4-7 repeatable, specific tasks you do in {domain}?"

Each task should be:
- A specific, repeatable task with a clear input and output
- Written as a verb phrase: "draft sponsor reply", "generate weekly client status", "categorize raw transactions"
- Tagged with a one-line description of what it does

Propose 4-7 candidate SKILLS for this domain. Ask the user to confirm, edit, or remove. Lock the skill list for this domain."""
```

- [ ] **Step 7: Create `agents/app/phases/automation_triage.py`**

```python
def build_triage_prompt(skill_name: str) -> str:
    return f"""You are in Phase 4: Automation Triage for skill "{skill_name}".

Ask these three questions:
1. "How often does this need to run?" (on-demand / daily / weekly / monthly / event-triggered)
2. "Does this skill need to touch local files, the filesystem, or local CLIs?" (yes/no)
3. "Does this skill need to keep running while your laptop is closed?" (yes/no)

Apply this decision rule:
- ON-DEMAND — triggered manually
- LOCAL ROUTINE — runs on a local schedule (needs filesystem access OR always on desktop)
- CLOUD ROUTINE — runs remotely on a schedule (web/API only, must run while laptop is closed)

Be honest — if a skill doesn't yet need automation, leave it on-demand."""
```

- [ ] **Step 8: Create `agents/app/phases/deliverable.py`**

```python
def build_deliverable_prompt(domains: list[dict], skills: list[dict]) -> str:
    domain_list = "\n".join(f"- {d['name']}: {d.get('successVision', '')}" for d in domains)
    skill_list = "\n".join(
        f"  {d['domainName']}:\n" + "\n".join(f"    - {s['name']}: {s['description']}" for s in d['skills'])
        for d in skills
    )
    return f"""You are in Phase 5: Deliverable Output.

Produce the starter package. Output four artifacts as code blocks:

1. CLAUDE.md — master prompt for root of Agentic OS folder
   - Define OS persona
   - List folder structure: raw/, wiki/, projects/, .claude/skills/, decisions/, references/
   - Reference these domains:
{domain_list}
   - Reference these skills organized by domain:
{skill_list}
   - Note OS is a living document

2. Skill Folder Structure — directory tree showing .claude/skills/ hierarchy

3. Prioritized First 3 Skills — structured spec for highest-impact skills:
   - Skill Name, Domain, Input, Output, Frequency, Dependencies, Success Criteria

4. 7-Day Implementation Plan — day-by-day breakdown

Output each artifact as a clearly labeled code block."""
```

- [ ] **Step 9: Run tests to confirm they pass**

```bash
cd agents && uv run pytest tests/test_phases.py -v
```

Expected: PASS (5 tests)

- [ ] **Step 10: Commit**

```bash
git add agents/app/phases/ agents/tests/test_phases.py
git commit -m "feat: phase prompt builders for all 5 Agentic OS phases"
```

---

### Task 7: Python Agents — Agent + FastAPI App

**Files:**
- Create: `agents/app/agent.py`
- Create: `agents/app/main.py`
- Create: `agents/tests/test_routes.py`

- [ ] **Step 1: Write the failing test**

Create `agents/tests/test_routes.py`:

```python
import pytest
from unittest.mock import patch, AsyncMock, MagicMock

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_create_session(client):
    response = client.post("/sessions")
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert isinstance(data["session_id"], str)

def test_get_session_messages(client):
    create_resp = client.post("/sessions")
    session_id = create_resp.json()["session_id"]
    response = client.get(f"/sessions/{session_id}")
    assert response.status_code == 200
    assert response.json()["messages"] == []

def test_get_nonexistent_session(client):
    response = client.get("/sessions/nonexistent-id")
    assert response.status_code == 404

def test_delete_session(client):
    create_resp = client.post("/sessions")
    session_id = create_resp.json()["session_id"]
    response = client.delete(f"/sessions/{session_id}")
    assert response.status_code == 200
    get_resp = client.get(f"/sessions/{session_id}")
    assert get_resp.status_code == 404
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd agents && uv run pytest tests/test_routes.py -v
```

Expected: FAIL — `app.main` not found

- [ ] **Step 3: Create `agents/app/agent.py`**

```python
import os
import json
from pathlib import Path
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

DESIGN_MD_PATH = Path(__file__).parent.parent.parent / "design.md"

def _load_system_prompt() -> str:
    if DESIGN_MD_PATH.exists():
        design_content = DESIGN_MD_PATH.read_text()
    else:
        design_content = "Guide the user through building their Agentic OS in 5 phases."
    return f"""You are the AgenticOS guide agent. Your job is to walk users through the 5-phase Agentic OS setup.

Here is the full protocol to follow:

{design_content}

CRITICAL RULES:
- Ask ONE question at a time. Wait for the answer before continuing.
- After each phase, summarize what you heard and confirm before moving on.
- Be a thought partner, not a yes-man. Push back on vague answers.
- When a phase is complete, emit a special marker: __PHASE_COMPLETE__{{phase_number}}
  followed by a JSON object with the phase data on the next line.
- Phase 1 complete when user says they are done dumping. Emit: __PHASE_COMPLETE__1
- Phase 2 complete when 3-5 domains are locked. Emit: __PHASE_COMPLETE__2
- Phase 3 complete when skills are locked for all domains. Emit: __PHASE_COMPLETE__3
- Phase 4 complete when all skills are triaged. Emit: __PHASE_COMPLETE__4
- Phase 5 complete when all 4 artifacts are output. Emit: __PHASE_COMPLETE__5"""

SYSTEM_PROMPT = _load_system_prompt()

async def stream_agent_response(messages: list[dict]):
    """Yield SSE-formatted chunks from the Anthropic API."""
    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=messages,
    ) as stream:
        full_text = ""
        async for text in stream.text_stream:
            full_text += text
            yield f'data: {json.dumps({"type": "text", "content": text})}\n\n'

        # Check for phase completion markers
        for phase in range(1, 6):
            marker = f"__PHASE_COMPLETE__{phase}"
            if marker in full_text:
                idx = full_text.index(marker) + len(marker)
                rest = full_text[idx:].strip()
                try:
                    phase_data = json.loads(rest.split("\n")[0]) if rest else {}
                except json.JSONDecodeError:
                    phase_data = {}
                yield f'data: {json.dumps({"type": "phase_complete", "phase": phase, "data": phase_data})}\n\n'

    yield "data: [DONE]\n\n"
```

- [ ] **Step 4: Create `agents/app/main.py`**

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.models import RunRequest
from app.session import session_store
from app.agent import stream_agent_response

app = FastAPI(title="AgenticOS Agents Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/sessions")
async def create_session():
    session_id = session_store.create()
    return {"session_id": session_id}


@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    messages = session_store.get_messages(session_id)
    if messages is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session_id": session_id, "messages": messages}


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    session_store.delete(session_id)
    return {"deleted": session_id}


@app.post("/run/agentic-os-guide")
async def run_guide(request: RunRequest):
    messages = session_store.get_messages(request.session_id)
    if messages is None:
        raise HTTPException(status_code=404, detail="Session not found")

    session_store.add_message(request.session_id, {"role": "user", "content": request.message})
    all_messages = session_store.get_messages(request.session_id)

    async def generate():
        full_response = ""
        async for chunk in stream_agent_response(all_messages):
            yield chunk
            if chunk.startswith("data: ") and not chunk.strip() == "data: [DONE]":
                import json
                try:
                    data = json.loads(chunk[6:])
                    if data.get("type") == "text":
                        full_response += data.get("content", "")
                except Exception:
                    pass
        if full_response:
            session_store.add_message(request.session_id, {"role": "assistant", "content": full_response})

    return StreamingResponse(generate(), media_type="text/event-stream")
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
cd agents && uv run pytest tests/test_routes.py -v
```

Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add agents/app/agent.py agents/app/main.py agents/tests/test_routes.py
git commit -m "feat: FastAPI agents service with Anthropic SDK streaming"
```

---

### Task 8: SSE Utility + Agents Proxy Route

**Files:**
- Create: `web/src/lib/sse.ts`
- Create: `web/src/lib/agents.ts`
- Create: `web/src/app/api/agents/[...path]/route.ts`
- Create: `web/tests/lib/sse.test.ts`
- Create: `web/tests/api/agents-proxy.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/tests/lib/sse.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { readSSEStream } from "@/lib/sse";

function makeStream(lines: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line + "\n"));
      }
      controller.close();
    },
  });
  return new Response(stream);
}

describe("readSSEStream", () => {
  it("parses text chunks", async () => {
    const chunks: Array<{ type: string; content: string }> = [];
    const response = makeStream([
      'data: {"type":"text","content":"hello"}',
      'data: {"type":"text","content":" world"}',
      "data: [DONE]",
    ]);
    await readSSEStream(response, (chunk) => chunks.push(chunk));
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toEqual({ type: "text", content: "hello" });
  });

  it("stops on [DONE]", async () => {
    const chunks: unknown[] = [];
    const response = makeStream([
      'data: {"type":"text","content":"a"}',
      "data: [DONE]",
      'data: {"type":"text","content":"b"}',
    ]);
    await readSSEStream(response, (chunk) => chunks.push(chunk));
    expect(chunks).toHaveLength(1);
  });

  it("ignores malformed lines", async () => {
    const chunks: unknown[] = [];
    const response = makeStream(["not a data line", 'data: {"type":"text","content":"ok"}', "data: [DONE]"]);
    await readSSEStream(response, (chunk) => chunks.push(chunk));
    expect(chunks).toHaveLength(1);
  });
});
```

Create `web/tests/api/agents-proxy.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
}));

describe("agents proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AGENTS_SERVICE_URL = "http://localhost:8000";
  });

  it("proxies GET to agents service", async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ status: "ok" }), { status: 200 }));
    const { GET } = await import("@/app/api/agents/[...path]/route");
    const req = new Request("http://localhost:3000/api/agents/health");
    const resp = await GET(req, { params: Promise.resolve({ path: ["health"] }) });
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/health",
      expect.objectContaining({ method: "GET" })
    );
    expect(resp.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd web && npx vitest run tests/lib/sse.test.ts tests/api/agents-proxy.test.ts
```

Expected: FAIL — modules not found

- [ ] **Step 3: Create `web/src/lib/sse.ts`**

```typescript
export async function readSSEStream(
  response: Response,
  onChunk: (data: Record<string, unknown>) => void
): Promise<void> {
  const reader = response.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop()!;
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") return;
      try {
        const evt = JSON.parse(payload) as Record<string, unknown>;
        onChunk(evt);
      } catch {
        // ignore malformed chunks
      }
    }
  }
}
```

- [ ] **Step 4: Create `web/src/lib/agents.ts`**

```typescript
const AGENTS_URL = process.env.AGENTS_SERVICE_URL ?? "http://localhost:8000";

export async function agentsPost(path: string, body: unknown, userId?: string): Promise<Response> {
  return fetch(`${AGENTS_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(userId ? { "X-User-ID": userId } : {}),
    },
    body: JSON.stringify(body),
  });
}
```

- [ ] **Step 5: Create `web/src/app/api/agents/[...path]/route.ts`**

```typescript
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const AGENTS_URL = process.env.AGENTS_SERVICE_URL ?? "http://localhost:8000";

async function proxy(req: NextRequest, params: { path: string[] }) {
  const session = await auth();
  const path = "/" + params.path.join("/");
  const url = `${AGENTS_URL}${path}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  if (session?.user?.id) {
    headers.set("X-User-ID", session.user.id);
  }

  const body = req.method !== "GET" && req.method !== "HEAD" ? await req.arrayBuffer() : undefined;

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body,
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
cd web && npx vitest run tests/lib/sse.test.ts tests/api/agents-proxy.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add web/src/lib/sse.ts web/src/lib/agents.ts "web/src/app/api/agents/[...path]/route.ts" web/tests/lib/sse.test.ts web/tests/api/agents-proxy.test.ts
git commit -m "feat: SSE utility and agents proxy route"
```

---

### Task 9: Sessions + Skills + Runs API Routes

**Files:**
- Create: `web/src/app/api/sessions/route.ts`
- Create: `web/src/app/api/sessions/[id]/route.ts`
- Create: `web/src/app/api/sessions/[id]/message/route.ts`
- Create: `web/src/app/api/skills/route.ts`
- Create: `web/src/app/api/skills/[id]/route.ts`
- Create: `web/src/app/api/skills/[id]/run/route.ts`
- Create: `web/src/app/api/runs/route.ts`
- Create: `web/tests/api/sessions.test.ts`
- Create: `web/tests/api/skills.test.ts`
- Create: `web/tests/api/runs.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/tests/api/sessions.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();
const mockFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    chatSession: { create: mockCreate, findUnique: mockFindUnique },
  },
}));
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
}));

describe("POST /api/sessions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a chat session", async () => {
    mockCreate.mockResolvedValueOnce({ id: "sess-1", userId: "user-1", phase: 1, messages: [] });
    const { POST } = await import("@/app/api/sessions/route");
    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      body: JSON.stringify({ phase: 1 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.id).toBe("sess-1");
  });
});
```

Create `web/tests/api/skills.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    skill: { findMany: mockFindMany, create: mockCreate, update: mockUpdate, delete: mockDelete },
  },
}));
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
}));

describe("GET /api/skills", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns user skills with domain", async () => {
    mockFindMany.mockResolvedValueOnce([
      { id: "skill-1", name: "draft post", domain: { name: "content" } },
    ]);
    const { GET } = await import("@/app/api/skills/route");
    const req = new Request("http://localhost/api/skills");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("draft post");
  });
});

describe("POST /api/skills", () => {
  it("creates a skill", async () => {
    mockCreate.mockResolvedValueOnce({ id: "skill-2", name: "send report" });
    const { POST } = await import("@/app/api/skills/route");
    const req = new Request("http://localhost/api/skills", {
      method: "POST",
      body: JSON.stringify({ name: "send report", description: "sends weekly report", domainId: "dom-1" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
```

Create `web/tests/api/runs.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    skillRun: { findMany: mockFindMany },
  },
}));
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
}));

describe("GET /api/runs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns recent runs", async () => {
    mockFindMany.mockResolvedValueOnce([
      { id: "run-1", status: "COMPLETED", startedAt: new Date() },
    ]);
    const { GET } = await import("@/app/api/runs/route");
    const req = new Request("http://localhost/api/runs");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd web && npx vitest run tests/api/sessions.test.ts tests/api/skills.test.ts tests/api/runs.test.ts
```

Expected: FAIL — route modules not found

- [ ] **Step 3: Create `web/src/app/api/sessions/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const chatSession = await prisma.chatSession.create({
    data: {
      userId: session.user.id,
      phase: body.phase ?? 1,
      messages: [],
    },
  });
  return NextResponse.json(chatSession);
}
```

- [ ] **Step 4: Create `web/src/app/api/sessions/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const chatSession = await prisma.chatSession.findUnique({ where: { id, userId: session.user.id } });
  if (!chatSession) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(chatSession);
}
```

- [ ] **Step 5: Create `web/src/app/api/sessions/[id]/message/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { message } = await req.json();

  const chatSession = await prisma.chatSession.findUnique({ where: { id, userId: session.user.id } });
  if (!chatSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = chatSession.messages as Array<{ role: string; content: string }>;
  messages.push({ role: "user", content: message });
  await prisma.chatSession.update({ where: { id }, data: { messages } });

  const agentsUrl = process.env.AGENTS_SERVICE_URL ?? "http://localhost:8000";
  const upstream = await fetch(`${agentsUrl}/run/agentic-os-guide`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-User-ID": session.user.id },
    body: JSON.stringify({ session_id: id, message }),
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
```

- [ ] **Step 6: Create `web/src/app/api/skills/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const skills = await prisma.skill.findMany({
    where: { userId: session.user.id },
    include: { domain: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(skills);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const skill = await prisma.skill.create({
    data: {
      userId: session.user.id,
      domainId: body.domainId,
      name: body.name,
      description: body.description,
      input: body.input,
      output: body.output,
      frequency: body.frequency ?? "ON_DEMAND",
      dependencies: body.dependencies,
      successCriteria: body.successCriteria,
    },
  });
  return NextResponse.json(skill);
}
```

- [ ] **Step 7: Create `web/src/app/api/skills/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const skill = await prisma.skill.update({ where: { id, userId: session.user.id }, data: body });
  return NextResponse.json(skill);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.skill.delete({ where: { id, userId: session.user.id } });
  return NextResponse.json({ deleted: id });
}
```

- [ ] **Step 8: Create `web/src/app/api/skills/[id]/run/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { input } = await req.json();

  const run = await prisma.skillRun.create({
    data: {
      userId: session.user.id,
      skillId: id,
      input,
      status: "RUNNING",
    },
  });

  const agentsUrl = process.env.AGENTS_SERVICE_URL ?? "http://localhost:8000";
  const sessionResp = await fetch(`${agentsUrl}/sessions`, { method: "POST" });
  const { session_id } = await sessionResp.json() as { session_id: string };

  const upstream = await fetch(`${agentsUrl}/run/agentic-os-guide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, message: input }),
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let output = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        output += text;
        controller.enqueue(encoder.encode(text));
      }
      await prisma.skillRun.update({
        where: { id: run.id },
        data: { status: "COMPLETED", output, endedAt: new Date() },
      });
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: { "Content-Type": "text/event-stream", "X-Run-ID": run.id },
  });
}
```

- [ ] **Step 9: Create `web/src/app/api/runs/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const runs = await prisma.skillRun.findMany({
    where: { userId: session.user.id, startedAt: { gte: thirtyDaysAgo } },
    include: { skill: { select: { name: true } } },
    orderBy: { startedAt: "desc" },
    take: 100,
  });
  return NextResponse.json(runs);
}
```

- [ ] **Step 10: Run tests to confirm they pass**

```bash
cd web && npx vitest run tests/api/sessions.test.ts tests/api/skills.test.ts tests/api/runs.test.ts
```

Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add web/src/app/api/ web/tests/api/sessions.test.ts web/tests/api/skills.test.ts web/tests/api/runs.test.ts
git commit -m "feat: sessions, skills, and runs API routes with tests"
```

---

### Task 10: Base UI + App Layout

**Files:**
- Create: `web/src/lib/utils.ts`
- Create: `web/src/components/ui/button.tsx`
- Create: `web/src/components/ui/input.tsx`
- Create: `web/src/components/ui/badge.tsx`
- Create: `web/src/components/ui/card.tsx`
- Create: `web/src/app/globals.css`
- Create: `web/src/app/layout.tsx`
- Create: `web/src/app/page.tsx`
- Create: `web/src/app/login/page.tsx`
- Create: `web/src/app/(protected)/layout.tsx`

- [ ] **Step 1: Create `web/src/lib/utils.ts`**

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create `web/src/components/ui/button.tsx`**

```typescript
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-orange-500 text-white hover:bg-amber-400",
          variant === "ghost" && "hover:bg-gray-800 text-gray-300",
          variant === "outline" && "border border-gray-700 text-gray-300 hover:border-orange-500",
          size === "sm" && "h-8 px-3 text-sm",
          size === "md" && "h-10 px-4 text-sm",
          size === "lg" && "h-12 px-6 text-base",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
```

- [ ] **Step 3: Create `web/src/components/ui/input.tsx`**

```typescript
import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full bg-gray-900 border border-gray-700 text-gray-100 px-3 py-2 text-sm",
        "placeholder:text-gray-500 focus:outline-none focus:border-orange-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
```

- [ ] **Step 4: Create `web/src/components/ui/badge.tsx`**

```typescript
import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "destructive";
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium",
        variant === "default" && "bg-gray-800 text-orange-400 border border-orange-500/30",
        variant === "success" && "bg-green-900/30 text-green-400 border border-green-500/30",
        variant === "warning" && "bg-amber-900/30 text-amber-400 border border-amber-500/30",
        variant === "destructive" && "bg-red-900/30 text-red-400 border border-red-500/30",
        className
      )}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 5: Create `web/src/components/ui/card.tsx`**

```typescript
import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-gray-900/50 border border-gray-800 rounded-lg", className)}
      {...props}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Create `web/src/app/globals.css`**

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: #0a0a0a;
    --foreground: #e5e7eb;
  }

  body {
    background-color: var(--background);
    color: var(--foreground);
    font-family: Inter, sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  ::-webkit-scrollbar {
    width: 4px;
  }

  ::-webkit-scrollbar-track {
    background: #0a0a0a;
  }

  ::-webkit-scrollbar-thumb {
    background: #374151;
  }
}
```

- [ ] **Step 7: Create `web/src/app/layout.tsx`**

```typescript
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "AgenticOS",
  description: "Build Your Agentic OS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Create `web/src/app/page.tsx`**

```typescript
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <div className="text-center max-w-2xl">
        <div className="text-orange-500 font-mono text-sm mb-4 tracking-widest uppercase">
          Claude Code
        </div>
        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
          Build Your Agentic OS
        </h1>
        <p className="text-gray-400 text-xl mb-10 leading-relaxed">
          Turn Claude Code from random prompts into a system you can run, track, and hand off.
        </p>
        <Link
          href="/setup"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-amber-400 text-white font-semibold px-8 py-4 text-lg transition-colors"
        >
          Get Started →
        </Link>
        <div className="mt-8 text-gray-600 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-orange-500 hover:text-amber-400">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 9: Create `web/src/app/login/page.tsx`**

```typescript
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-sm">
        <div className="text-orange-500 font-mono text-xs tracking-widest uppercase mb-6">
          AgenticOS
        </div>
        <h1 className="text-2xl font-bold text-white mb-8">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-400 text-sm font-mono">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in →"}
          </Button>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 10: Create `web/src/app/(protected)/layout.tsx`**

```typescript
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-orange-500 font-mono text-sm font-bold">AgenticOS</span>
          <a href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
            Dashboard
          </a>
          <a href="/setup" className="text-gray-400 hover:text-white text-sm transition-colors">
            Setup
          </a>
          <a href="/skills" className="text-gray-400 hover:text-white text-sm transition-colors">
            Skills
          </a>
        </div>
        <div className="text-gray-500 text-sm font-mono">
          {session.user.email ?? session.user.name}
        </div>
      </nav>
      {children}
    </div>
  );
}
```

- [ ] **Step 11: Commit**

```bash
git add web/src/lib/utils.ts web/src/components/ui/ web/src/app/globals.css web/src/app/layout.tsx web/src/app/page.tsx web/src/app/login/ "web/src/app/(protected)/layout.tsx"
git commit -m "feat: base UI components, app layout, landing, and login pages"
```

---

### Task 11: Setup Wizard Page + Components

**Files:**
- Create: `web/src/components/setup/PhaseIndicator.tsx`
- Create: `web/src/components/setup/ChatInterface.tsx`
- Create: `web/src/components/setup/DeliverableRenderer.tsx`
- Create: `web/src/app/(protected)/setup/page.tsx`

- [ ] **Step 1: Create `web/src/components/setup/PhaseIndicator.tsx`**

```typescript
import { cn } from "@/lib/utils";

const PHASES = [
  { num: 1, label: "Brain Dump" },
  { num: 2, label: "Domain Locking" },
  { num: 3, label: "Skill Surfacing" },
  { num: 4, label: "Automation Triage" },
  { num: 5, label: "Deliverables" },
];

interface PhaseIndicatorProps {
  currentPhase: number;
}

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  return (
    <div className="flex flex-col gap-1 py-8 px-4">
      {PHASES.map((phase) => {
        const isActive = phase.num === currentPhase;
        const isComplete = phase.num < currentPhase;
        return (
          <div
            key={phase.num}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded transition-colors",
              isActive && "bg-orange-500/10 border border-orange-500/30",
              isComplete && "opacity-60",
              !isActive && !isComplete && "opacity-30"
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0",
                isActive && "bg-orange-500 text-white",
                isComplete && "bg-green-500 text-white",
                !isActive && !isComplete && "bg-gray-800 text-gray-500 border border-gray-700"
              )}
            >
              {isComplete ? "✓" : phase.num}
            </div>
            <span className={cn("text-sm font-medium", isActive && "text-white", !isActive && "text-gray-500")}>
              {phase.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create `web/src/components/setup/DeliverableRenderer.tsx`**

```typescript
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DeliverableRendererProps {
  content: string;
}

export function DeliverableRenderer({ content }: DeliverableRendererProps) {
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
  const parts: Array<{ type: "text" | "code"; content: string; lang?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    const langMatch = content.slice(match.index).match(/```([\w]*)\n/);
    parts.push({ type: "code", content: match[1], lang: langMatch?.[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  return (
    <div className="space-y-4">
      {parts.map((part, i) =>
        part.type === "text" ? (
          <p key={i} className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {part.content}
          </p>
        ) : (
          <CodeBlock key={i} code={part.content} lang={part.lang} />
        )
      )}
    </div>
  );
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative group">
      <div className="flex items-center justify-between bg-gray-900 border border-gray-700 px-4 py-2">
        <span className="text-xs font-mono text-gray-500">{lang ?? "text"}</span>
        <Button size="sm" variant="ghost" onClick={copy} className="text-xs opacity-0 group-hover:opacity-100">
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <pre className="bg-gray-950 border border-t-0 border-gray-700 p-4 overflow-x-auto text-sm font-mono text-gray-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}
```

- [ ] **Step 3: Create `web/src/components/setup/ChatInterface.tsx`**

```typescript
"use client";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeliverableRenderer } from "./DeliverableRenderer";
import { readSSEStream } from "@/lib/sse";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  phase: number;
  onPhaseComplete: (phase: number, data: Record<string, unknown>) => void;
}

export function ChatInterface({ sessionId, phase, onPhaseComplete }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);

    let assistantContent = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const resp = await fetch(`/api/sessions/${sessionId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg }),
    });

    await readSSEStream(resp, (chunk) => {
      if (chunk.type === "text") {
        assistantContent += chunk.content as string;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantContent };
          return updated;
        });
      } else if (chunk.type === "phase_complete") {
        onPhaseComplete(chunk.phase as number, chunk.data as Record<string, unknown>);
      }
    });

    setStreaming(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-orange-500/20 border border-orange-500/30 text-gray-200"
                  : "bg-gray-900 border border-gray-800 text-gray-300"
              }`}
            >
              {msg.role === "assistant" && phase === 5 ? (
                <DeliverableRenderer content={msg.content} />
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              )}
              {streaming && i === messages.length - 1 && msg.role === "assistant" && (
                <span className="inline-block w-2 h-4 bg-orange-500 ml-1 animate-pulse" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-gray-800 p-4 flex gap-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type your response..."
          disabled={streaming}
          className="flex-1 font-mono"
        />
        <Button onClick={sendMessage} disabled={streaming || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `web/src/app/(protected)/setup/page.tsx`**

```typescript
"use client";
import { useState, useEffect } from "react";
import { PhaseIndicator } from "@/components/setup/PhaseIndicator";
import { ChatInterface } from "@/components/setup/ChatInterface";

export default function SetupPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    async function initSession() {
      const resp = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: 1 }),
      });
      const data = await resp.json() as { id: string };
      setSessionId(data.id);
    }
    initSession();
  }, []);

  function handlePhaseComplete(completedPhase: number, _data: Record<string, unknown>) {
    if (completedPhase < 5) setPhase(completedPhase + 1);
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-orange-500 font-mono text-sm animate-pulse">Initializing session...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-49px)]">
      <aside className="w-56 border-r border-gray-800 shrink-0">
        <div className="px-4 pt-6 pb-2 text-xs font-mono text-gray-500 uppercase tracking-widest">
          Setup Progress
        </div>
        <PhaseIndicator currentPhase={phase} />
      </aside>
      <main className="flex-1 overflow-hidden">
        <ChatInterface
          sessionId={sessionId}
          phase={phase}
          onPhaseComplete={handlePhaseComplete}
        />
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add web/src/components/setup/ "web/src/app/(protected)/setup/"
git commit -m "feat: setup wizard with phase indicator, chat interface, deliverable renderer"
```

---

### Task 12: Dashboard — Mind Map + Observability

**Files:**
- Create: `web/src/components/mind-map/MindMapCanvas.tsx`
- Create: `web/src/components/mind-map/SkillNode.tsx`
- Create: `web/src/components/mind-map/DomainNode.tsx`
- Create: `web/src/components/observability/ActivityChart.tsx`
- Create: `web/src/components/observability/StatBar.tsx`
- Create: `web/src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Create `web/src/components/mind-map/SkillNode.tsx`**

```typescript
import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Badge } from "@/components/ui/badge";

interface SkillNodeData {
  label: string;
  frequency: "ON_DEMAND" | "LOCAL_ROUTINE" | "CLOUD_ROUTINE";
  description?: string;
}

export const SkillNode = memo(({ data }: { data: SkillNodeData }) => {
  const freqVariant = {
    ON_DEMAND: "default",
    LOCAL_ROUTINE: "warning",
    CLOUD_ROUTINE: "success",
  }[data.frequency] as "default" | "warning" | "success";

  return (
    <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2 min-w-[140px] max-w-[180px] hover:border-orange-500/50 transition-colors cursor-pointer">
      <Handle type="target" position={Position.Left} className="!bg-gray-600 !border-gray-600 !w-2 !h-2" />
      <p className="text-white text-xs font-medium leading-tight mb-1">{data.label}</p>
      {data.description && (
        <p className="text-gray-500 text-xs leading-tight mb-2 line-clamp-2">{data.description}</p>
      )}
      <Badge variant={freqVariant} className="text-[10px]">
        {data.frequency.replace("_", " ")}
      </Badge>
    </div>
  );
});
SkillNode.displayName = "SkillNode";
```

- [ ] **Step 2: Create `web/src/components/mind-map/DomainNode.tsx`**

```typescript
import { memo } from "react";
import { Handle, Position } from "reactflow";

const DOMAIN_COLORS = [
  "border-orange-500/60 text-orange-400",
  "border-blue-500/60 text-blue-400",
  "border-purple-500/60 text-purple-400",
  "border-cyan-500/60 text-cyan-400",
  "border-pink-500/60 text-pink-400",
];

interface DomainNodeData {
  label: string;
  index: number;
  skillCount: number;
}

export const DomainNode = memo(({ data }: { data: DomainNodeData }) => {
  const colorClass = DOMAIN_COLORS[data.index % DOMAIN_COLORS.length];
  return (
    <div className={`bg-gray-900/80 border-2 ${colorClass} rounded-lg px-4 py-3 min-w-[120px] text-center`}>
      <Handle type="target" position={Position.Left} className="!bg-gray-600 !border-gray-600 !w-2 !h-2" />
      <p className="font-semibold text-sm">{data.label}</p>
      <p className="text-gray-500 text-xs mt-1">{data.skillCount} skills</p>
      <Handle type="source" position={Position.Right} className="!bg-gray-600 !border-gray-600 !w-2 !h-2" />
    </div>
  );
});
DomainNode.displayName = "DomainNode";
```

- [ ] **Step 3: Create `web/src/components/mind-map/MindMapCanvas.tsx`**

```typescript
"use client";
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState } from "reactflow";
import "reactflow/dist/style.css";
import { SkillNode } from "./SkillNode";
import { DomainNode } from "./DomainNode";
import type { Skill, Domain } from "@prisma/client";

const nodeTypes = { skill: SkillNode, domain: DomainNode };

interface SkillWithDomain extends Skill {
  domain: Domain;
}

interface MindMapCanvasProps {
  skills: SkillWithDomain[];
  domains: Domain[];
  userName: string;
}

export function MindMapCanvas({ skills, domains, userName }: MindMapCanvasProps) {
  const nodes = buildNodes(skills, domains, userName);
  const edges = buildEdges(skills, domains);

  const [flowNodes, , onNodesChange] = useNodesState(nodes);
  const [flowEdges, , onEdgesChange] = useEdgesState(edges);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background color="#1f2937" gap={20} />
        <Controls className="[&>button]:bg-gray-900 [&>button]:border-gray-700 [&>button]:text-gray-400" />
        <MiniMap
          nodeColor="#374151"
          maskColor="rgba(10,10,10,0.8)"
          className="!bg-gray-950 !border-gray-800"
        />
      </ReactFlow>
    </div>
  );
}

function buildNodes(skills: SkillWithDomain[], domains: Domain[], userName: string) {
  const nodes = [];
  const centerX = 400;
  const centerY = 300;

  // Root node
  nodes.push({
    id: "root",
    type: "default",
    position: { x: centerX - 80, y: centerY - 20 },
    data: { label: userName },
    style: { background: "#111", border: "2px solid #f97316", color: "#fff", borderRadius: "50%", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold" },
  });

  // Claude Code hub
  nodes.push({
    id: "claude-code",
    type: "default",
    position: { x: centerX + 60, y: centerY - 20 },
    data: { label: "CLAUDE CODE" },
    style: { background: "#0a0a0a", border: "2px solid #f97316", color: "#f97316", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: "bold", boxShadow: "0 0 20px rgba(249,115,22,0.3)" },
  });

  // Domain nodes
  domains.forEach((domain, i) => {
    const angle = (i / domains.length) * 2 * Math.PI - Math.PI / 2;
    const radius = 220;
    const x = centerX + 100 + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const domainSkills = skills.filter((s) => s.domainId === domain.id);
    nodes.push({
      id: `domain-${domain.id}`,
      type: "domain",
      position: { x, y },
      data: { label: domain.name, index: i, skillCount: domainSkills.length },
    });

    // Skill nodes
    domainSkills.forEach((skill, j) => {
      const skillAngle = angle + ((j - (domainSkills.length - 1) / 2) * 0.4);
      const skillRadius = 380;
      nodes.push({
        id: `skill-${skill.id}`,
        type: "skill",
        position: { x: centerX + 100 + Math.cos(skillAngle) * skillRadius, y: centerY + Math.sin(skillAngle) * skillRadius },
        data: { label: skill.name, frequency: skill.frequency, description: skill.description },
      });
    });
  });

  return nodes;
}

function buildEdges(skills: SkillWithDomain[], domains: Domain[]) {
  const edges = [];
  edges.push({ id: "root-cc", source: "root", target: "claude-code", style: { stroke: "#f97316", strokeWidth: 2 } });
  domains.forEach((domain) => {
    edges.push({ id: `cc-${domain.id}`, source: "claude-code", target: `domain-${domain.id}`, style: { stroke: "#374151", strokeWidth: 1.5 } });
    skills.filter((s) => s.domainId === domain.id).forEach((skill) => {
      edges.push({ id: `dom-${skill.id}`, source: `domain-${domain.id}`, target: `skill-${skill.id}`, style: { stroke: "#1f2937", strokeWidth: 1 } });
    });
  });
  return edges;
}
```

- [ ] **Step 4: Create `web/src/components/observability/ActivityChart.tsx`**

```typescript
"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface RunPoint {
  date: string;
  runs: number;
}

interface ActivityChartProps {
  data: RunPoint[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="runsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
        <Tooltip
          contentStyle={{ background: "#111", border: "1px solid #374151", borderRadius: 4, fontSize: 12 }}
          labelStyle={{ color: "#9ca3af" }}
          itemStyle={{ color: "#f97316" }}
        />
        <Area type="monotone" dataKey="runs" stroke="#f97316" strokeWidth={2} fill="url(#runsGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 5: Create `web/src/components/observability/StatBar.tsx`**

```typescript
interface Stat {
  label: string;
  value: string | number;
}

interface StatBarProps {
  stats: Stat[];
}

export function StatBar({ stats }: StatBarProps) {
  return (
    <div className="flex items-center gap-8 px-6 py-3 border-b border-gray-800 bg-gray-950/50">
      {stats.map((stat, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-gray-500 text-xs font-mono uppercase tracking-wider">{stat.label}</span>
          <span className="text-orange-400 text-sm font-mono font-bold">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create `web/src/app/(protected)/dashboard/page.tsx`**

```typescript
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MindMapCanvas } from "@/components/mind-map/MindMapCanvas";
import { ActivityChart } from "@/components/observability/ActivityChart";
import { StatBar } from "@/components/observability/StatBar";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [skills, domains, runs] = await Promise.all([
    prisma.skill.findMany({ where: { userId }, include: { domain: true } }),
    prisma.domain.findMany({ where: { userId }, orderBy: { position: "asc" } }),
    prisma.skillRun.findMany({
      where: { userId, startedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      orderBy: { startedAt: "asc" },
    }),
  ]);

  // Build activity chart data (runs per day, last 30 days)
  const runsByDay: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    runsByDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const run of runs) {
    const day = run.startedAt.toISOString().slice(0, 10);
    if (day in runsByDay) runsByDay[day]++;
  }
  const chartData = Object.entries(runsByDay).map(([date, runs]) => ({
    date: date.slice(5),
    runs,
  }));

  const todayRuns = runs.filter(
    (r) => r.startedAt.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10)
  ).length;

  const stats = [
    { label: "Platform", value: "Claude Code" },
    { label: "Runs Today", value: todayRuns },
    { label: "Active Skills", value: skills.length },
    { label: "Total Runs", value: runs.length },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-49px)]">
      <StatBar stats={stats} />
      <div className="flex-1 overflow-hidden">
        {skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500 mb-4">No skills yet. Complete the setup wizard to build your Agentic OS.</p>
            <a href="/setup" className="text-orange-500 hover:text-amber-400 text-sm">
              Start Setup →
            </a>
          </div>
        ) : (
          <MindMapCanvas skills={skills} domains={domains} userName={session!.user!.name ?? "Me"} />
        )}
      </div>
      <div className="border-t border-gray-800 p-4">
        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">
          Activity — Last 30 Days
        </div>
        <ActivityChart data={chartData} />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add web/src/components/mind-map/ web/src/components/observability/ "web/src/app/(protected)/dashboard/"
git commit -m "feat: dashboard with React Flow mind map and Recharts activity chart"
```

---

### Task 13: Skill Runner Page + Components

**Files:**
- Create: `web/src/components/skills/SkillSelector.tsx`
- Create: `web/src/components/skills/SkillRunner.tsx`
- Create: `web/src/components/skills/RunLog.tsx`
- Create: `web/src/app/(protected)/skills/page.tsx`

- [ ] **Step 1: Create `web/src/components/skills/SkillSelector.tsx`**

```typescript
"use client";
import type { Skill, Domain } from "@prisma/client";

interface SkillWithDomain extends Skill {
  domain: Domain;
}

interface SkillSelectorProps {
  skills: SkillWithDomain[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SkillSelector({ skills, selectedId, onSelect }: SkillSelectorProps) {
  const grouped: Record<string, SkillWithDomain[]> = {};
  for (const skill of skills) {
    const domain = skill.domain.name;
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push(skill);
  }

  return (
    <div className="border-b border-gray-800 px-6 py-3">
      <select
        className="bg-gray-900 border border-gray-700 text-gray-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-orange-500 min-w-[300px]"
        value={selectedId ?? ""}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">— Select a skill —</option>
        {Object.entries(grouped).map(([domain, domainSkills]) => (
          <optgroup key={domain} label={domain}>
            {domainSkills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Create `web/src/components/skills/RunLog.tsx`**

```typescript
import type { SkillRun, Skill } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface RunWithSkill extends SkillRun {
  skill: Pick<Skill, "name"> | null;
}

interface RunLogProps {
  runs: RunWithSkill[];
}

export function RunLog({ runs }: RunLogProps) {
  const statusVariant = (status: string) => {
    if (status === "COMPLETED") return "success";
    if (status === "FAILED") return "destructive";
    if (status === "RUNNING") return "warning";
    return "default";
  };

  return (
    <div className="w-64 border-l border-gray-800 overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-800 text-xs font-mono text-gray-500 uppercase tracking-widest">
        Recent Runs
      </div>
      {runs.length === 0 ? (
        <p className="text-gray-600 text-xs px-4 py-3 font-mono">No runs yet</p>
      ) : (
        <div className="divide-y divide-gray-800/50">
          {runs.map((run) => (
            <div key={run.id} className="px-4 py-3">
              <p className="text-white text-xs font-medium mb-1 truncate">{run.skill?.name ?? "Unknown"}</p>
              <div className="flex items-center justify-between">
                <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                <span className="text-gray-600 text-[10px] font-mono">
                  {run.startedAt.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `web/src/components/skills/SkillRunner.tsx`**

```typescript
"use client";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { readSSEStream } from "@/lib/sse";
import type { Skill } from "@prisma/client";

interface SkillRunnerProps {
  skill: Skill | null;
  onRunComplete: () => void;
}

export function SkillRunner({ skill, onRunComplete }: SkillRunnerProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  async function runSkill() {
    if (!skill || !input.trim() || running) return;
    setRunning(true);
    setOutput("");

    const resp = await fetch(`/api/skills/${skill.id}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: input.trim() }),
    });

    await readSSEStream(resp, (chunk) => {
      if (chunk.type === "text") {
        setOutput((prev) => prev + (chunk.content as string));
      }
    });

    setRunning(false);
    onRunComplete();
  }

  return (
    <div className="flex flex-col flex-1 h-full font-mono">
      <div className="px-4 py-2 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-widest flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
        {skill ? skill.name : "No skill selected"}
      </div>

      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-6 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed"
      >
        {!skill && (
          <p className="text-gray-600 text-center mt-20">
            RUN A SKILL TO BEGIN
            <span className="inline-block w-2 h-4 bg-orange-500 ml-2 animate-pulse align-middle" />
          </p>
        )}
        {skill && !output && !running && (
          <p className="text-gray-600">
            Ready to run: <span className="text-orange-400">{skill.name}</span>
          </p>
        )}
        {output}
        {running && (
          <span className="inline-block w-2 h-4 bg-orange-500 ml-1 animate-pulse align-middle" />
        )}
      </div>

      <div className="border-t border-gray-800 p-4 flex gap-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSkill()}
          placeholder={skill ? `Input for ${skill.name}...` : "Select a skill first"}
          disabled={!skill || running}
          className="flex-1"
        />
        <Button onClick={runSkill} disabled={!skill || !input.trim() || running}>
          {running ? "Running..." : "Run →"}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `web/src/app/(protected)/skills/page.tsx`**

```typescript
"use client";
import { useState, useEffect, useCallback } from "react";
import { SkillSelector } from "@/components/skills/SkillSelector";
import { SkillRunner } from "@/components/skills/SkillRunner";
import { RunLog } from "@/components/skills/RunLog";
import type { Skill, Domain, SkillRun } from "@prisma/client";

interface SkillWithDomain extends Skill {
  domain: Domain;
}

interface RunWithSkill extends SkillRun {
  skill: Pick<Skill, "name"> | null;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillWithDomain[]>([]);
  const [runs, setRuns] = useState<RunWithSkill[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [skillsResp, runsResp] = await Promise.all([
      fetch("/api/skills"),
      fetch("/api/runs"),
    ]);
    setSkills(await skillsResp.json() as SkillWithDomain[]);
    setRuns(await runsResp.json() as RunWithSkill[]);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedSkill = skills.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex flex-col h-[calc(100vh-49px)]">
      <SkillSelector skills={skills} selectedId={selectedId} onSelect={setSelectedId} />
      <div className="flex flex-1 overflow-hidden">
        <SkillRunner skill={selectedSkill} onRunComplete={fetchData} />
        <RunLog runs={runs} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add web/src/components/skills/ "web/src/app/(protected)/skills/"
git commit -m "feat: skill runner page with terminal interface and run log"
```

---

### Task 14: Wire Up + Final Integration

**Files:**
- Modify: `web/prisma/schema.prisma` (ensure it generates correctly)
- Create: `.gitignore`
- Verify: `npm run build` passes

- [ ] **Step 1: Create root `.gitignore`**

```
node_modules/
.env.local
.env
.next/
dist/
__pycache__/
*.pyc
.venv/
agents/.venv/
.uv/
```

- [ ] **Step 2: Create `web/.env.local` (not committed)**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agenticos
NEXTAUTH_SECRET=dev-secret-changeme
NEXTAUTH_URL=http://localhost:3000
AGENTS_SERVICE_URL=http://localhost:8000
AGENTS_REQUIRE_AUTH=false
ANTHROPIC_API_KEY=your-key-here
```

- [ ] **Step 3: Run all tests**

```bash
cd web && npx vitest run
```

Expected: all test suites pass

```bash
cd agents && uv run pytest -v
```

Expected: all test suites pass

- [ ] **Step 4: Run type check**

```bash
cd web && npx tsc --noEmit
```

Expected: no type errors

- [ ] **Step 5: Start Postgres and run migrations**

```bash
docker-compose up -d postgres
cd web && npx prisma migrate dev --name init
```

Expected: migration applied, Prisma client generated

- [ ] **Step 6: Verify dev servers start**

```bash
# Terminal 1
cd web && npm run dev

# Terminal 2
cd agents && uv run uvicorn app.main:app --reload --port 8000
```

Expected: Next.js on port 3000, FastAPI on port 8000, no errors

- [ ] **Step 7: Commit final state**

```bash
git add .gitignore web/prisma/
git commit -m "feat: complete AgenticOS web app — wizard, dashboard, skill runner"
```

---

## Verification Checklist

After all tasks complete, verify:

- [ ] `docker-compose up -d postgres` starts Postgres
- [ ] `cd web && npx prisma migrate dev` runs without errors
- [ ] `cd web && npm run dev` starts Next.js at http://localhost:3000
- [ ] `cd agents && uv run uvicorn app.main:app --reload --port 8000` starts FastAPI
- [ ] `/` landing page renders "Build Your Agentic OS"
- [ ] `/login` shows credentials form
- [ ] `/setup` shows phase indicator + chat interface
- [ ] `/dashboard` shows mind map (empty state if no skills)
- [ ] `/skills` shows terminal runner + run log
- [ ] `cd web && npx vitest run` — all tests pass
- [ ] `cd agents && uv run pytest` — all tests pass
- [ ] `cd web && npm run build` — no type errors
