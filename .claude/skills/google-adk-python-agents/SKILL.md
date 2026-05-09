---
name: google-adk-python-agents
description: Use this skill whenever building, modifying, or debugging Google ADK agents in Python in the Platfrmr stack. Trigger on any mention of ADK, Google ADK, Gemini agent, agent pipeline, multi-agent, agent orchestration, or building/editing agent files (orchestrator, writer, researcher, etc.). Also trigger on requests to add new agents or modify agent prompts/tools/schemas. Encodes Platfrmr's multi-agent pipeline patterns with non-negotiable validation guards and structured outputs; do NOT default to LangChain or generic agent patterns — Platfrmr uses Google ADK with Gemini exclusively for agents.
---

# Google ADK Python Agents

Patterns for building production multi-agent pipelines with Google ADK + Gemini. Agents persist state to Postgres, return structured outputs validated by Pydantic, and enforce non-negotiable quality guards before publishing.

## When to use this skill

- Creating a new ADK agent or multi-agent pipeline
- Modifying agent prompts, tools, or output schemas
- Adding validation/guard logic to agent outputs
- Persisting agent state or runs to Postgres
- Debugging agent failures, timeouts, or non-deterministic outputs
- Designing the orchestrator → specialist agent pattern

## Decisions to fill in

- **Gemini model**: [gemini-2.5-pro / gemini-2.5-flash] — default to flash for speed, pro for quality-critical steps
- **Agent state persistence**: Postgres `agent_runs` table (assumed — see `postgres-saas-patterns`)
- **Async runtime**: asyncio (assumed — required for Cloud Run efficiency)
- **Schema validation**: Pydantic v2 (assumed)

## Core architecture: orchestrator + specialists

Every multi-step agent task uses this pattern:

```
Orchestrator (decides what to do)
  ├→ Researcher (gathers context)
  ├→ Writer (produces draft)
  ├→ ImageGen (creates visuals)
  └→ Publisher (validates + ships)
        └→ Non-negotiables guard (refuse if quality bar not met)
```

**Why this pattern:**
- Orchestrator owns control flow; specialists own narrow expertise
- Each specialist has a focused prompt and a Pydantic output schema
- Publisher is the *only* component that ships output — and it has a `validate_non_negotiables()` gate
- Failures at any stage are recoverable (retry the failing step, not the whole pipeline)

See `templates/orchestrator.py` for the canonical implementation.

## The non-negotiables pattern

Every agent that produces user-facing output defines **non-negotiables** — quality requirements that cannot be skipped. The publisher refuses to ship if any are missing.

Example for the LinkedIn post generator:
1. Engaging hook in the first line
2. Complementary image OR rich content (not just text)
3. Engagement CTA at the end

```python
from pydantic import BaseModel, Field

class LinkedInPost(BaseModel):
    hook: str = Field(..., min_length=10, description="First-line hook")
    body: str = Field(..., min_length=100)
    cta: str = Field(..., min_length=10, description="Engagement CTA")
    image_prompt: str | None = None
    image_url: str | None = None

def validate_non_negotiables(post: LinkedInPost) -> list[str]:
    """Return list of failures. Empty list = passes."""
    failures = []
    if not has_engaging_hook(post.hook):
        failures.append("Hook is generic — must include specificity, contrast, or curiosity gap")
    if not (post.image_url or len(post.body) > 500):
        failures.append("Must have either an image OR rich body content (>500 chars)")
    if not has_engagement_cta(post.cta):
        failures.append("CTA must invite a response (question, call to share, etc.)")
    return failures

# Publisher refuses to ship if non-empty
async def publish(post: LinkedInPost) -> PublishResult:
    failures = validate_non_negotiables(post)
    if failures:
        return PublishResult(success=False, errors=failures)
    # ... actually publish
```

## Project layout

```
agents/
├── __init__.py
├── linkedin_post/
│   ├── __init__.py
│   ├── orchestrator.py      # Coordinates the pipeline
│   ├── researcher.py        # Gathers context (web, user history)
│   ├── writer.py            # Drafts the post
│   ├── image_gen.py         # Generates accompanying image
│   ├── publisher.py         # Validates + publishes
│   ├── prompts.py           # System prompts (extracted, not inline)
│   └── schemas.py           # Pydantic models
├── software_factory/
│   └── ...
shared/
├── adk_helpers.py           # Common ADK utilities
├── persistence.py           # agent_runs table read/write
└── llm.py                   # Gemini client config
```

**Rule**: Prompts go in `prompts.py`, never inline in agent code. Makes them diffable, testable, and shareable.

## Structured outputs with Pydantic

Always use Pydantic models for agent outputs. Never parse free-form text.

```python
from pydantic import BaseModel, Field
from google.generativeai import GenerativeModel

class ResearchOutput(BaseModel):
    key_points: list[str] = Field(..., min_length=3, max_length=7)
    sources: list[str]
    confidence: float = Field(..., ge=0, le=1)

async def research(topic: str) -> ResearchOutput:
    model = GenerativeModel("gemini-2.5-flash")
    response = await model.generate_content_async(
        f"Research this topic: {topic}",
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": ResearchOutput,
        },
    )
    return ResearchOutput.model_validate_json(response.text)
```

If validation fails, **retry once with the validation error fed back as additional context** — but only once. Two failures = bubble up to the orchestrator.

## Persisting agent runs to Postgres

Every agent invocation writes to `agent_runs` (see `postgres-saas-patterns/templates/base-schema.sql`). This gives you:

- Audit trail for debugging
- Cost tracking (input/output tokens)
- Replay capability
- Per-tenant usage for billing

See `templates/persistence.py`.

## Tools and function calling

ADK tools are Python functions. Keep them small, single-purpose, and side-effect-free where possible.

```python
from google.adk.tools import FunctionTool

def fetch_user_history(user_id: str, limit: int = 10) -> list[dict]:
    """Fetch the user's most recent posts for style/voice context."""
    # ... query Postgres ...

history_tool = FunctionTool(fetch_user_history)
```

Tool descriptions are read by Gemini to decide when to call them. Write them as if explaining to a smart intern who has never seen your codebase.

## Error handling

Agents will fail. Normal failure modes:

1. **LLM returns invalid JSON** — retry once with error context, then bubble up
2. **Tool call fails** (network, rate limit) — retry with exponential backoff (3 attempts)
3. **Non-negotiable validation fails** — return the failures to the orchestrator, which can re-invoke the writer with the failures as constraints
4. **Timeout** — fail the run, write to `agent_runs` with status=failed, surface to user

Never silently swallow errors. Every failure path writes to `agent_runs.error`.

## Testing strategy

LLM outputs are non-deterministic. Test with:

- **Unit tests** for tools, validators, and pure functions (deterministic)
- **Snapshot tests** for prompt rendering (catch unintentional prompt drift)
- **Property tests** for non-negotiables (e.g., "publisher always rejects empty hook")
- **Eval suites** for end-to-end agent quality (run weekly, track regression)

See `reference/testing-agents.md`.

## Reference files

- `reference/testing-agents.md` — Eval strategies for non-deterministic outputs
- `reference/prompt-patterns.md` — System prompt structure for ADK agents
- `reference/cost-optimization.md` — When to use Flash vs Pro, prompt caching, batching
- `templates/orchestrator.py` — Canonical multi-agent pipeline
- `templates/specialist-agent.py` — Template for a single specialist
- `templates/persistence.py` — agent_runs read/write helpers
- `templates/non-negotiables.py` — Validation guard pattern

## Anti-patterns to avoid

- ❌ Inline prompts (put them in `prompts.py`)
- ❌ Free-text parsing of LLM output (use Pydantic schemas + JSON mode)
- ❌ Single agent doing everything (split into specialists)
- ❌ Publisher without `validate_non_negotiables()` guard
- ❌ Synchronous LLM calls in Cloud Run handlers (use async — connections compound)
- ❌ Retrying invalid LLM outputs forever (cap at 1 retry, then fail)
- ❌ Not persisting agent runs (no audit, no cost tracking, no debugging)
- ❌ Using LangChain or generic agent frameworks (Platfrmr is ADK-native)
- ❌ Hardcoding `gemini-2.5-pro` everywhere (default to Flash, escalate to Pro for quality-critical)
