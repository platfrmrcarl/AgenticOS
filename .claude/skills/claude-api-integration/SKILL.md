---
name: claude-api-integration
description: Use this skill whenever integrating the Anthropic Claude API into Platfrmr or user-facing applications. Trigger on any mention of Claude API, Anthropic API, anthropic SDK, tool use, prompt caching, batch API, MCP, or building features that call Claude (distinct from Google ADK agents which are Gemini-based). Encodes Platfrmr's Claude integration patterns including tool use loops, caching, cost optimization, and error handling; do NOT default to bare-quickstart code which lacks production error handling.
---

# Claude API Integration

Patterns for calling the Anthropic Claude API in production. **This is for when your apps call Claude** — distinct from `google-adk-python-agents` which uses Gemini for ADK agent pipelines.

Platfrmr uses Claude specifically for code generation (the "Claude Code orchestrator" inside the Software Factory Agent) and for high-quality content generation where Gemini falls short.

## When to use this skill

- Adding a Claude-powered feature to a Next.js or Python service
- Implementing tool use / function calling with Claude
- Setting up prompt caching to reduce costs
- Using the Batch API for bulk operations
- MCP server integration with Claude
- Streaming responses to a UI
- Debugging tool use loops or token usage

## Decisions to fill in

- **Primary model**: [claude-opus-4-7 / claude-sonnet-4-6 / claude-haiku-4-5] — default to Sonnet for most things, Opus for code generation, Haiku for cheap classification
- **SDK**: `@anthropic-ai/sdk` (TS) and `anthropic` (Python)
- **Streaming**: yes, for any user-facing latency-sensitive features

## Model selection

A rough heuristic:

| Use case | Model |
|---|---|
| Code generation, complex reasoning | Opus |
| General agentic tasks, long context | Sonnet |
| Classification, extraction, simple transforms | Haiku |
| Bulk processing where latency doesn't matter | Any model + Batch API (50% off) |

Start with Sonnet. Move to Haiku when you measure that the task tolerates it. Move to Opus when you measure that Sonnet doesn't.

## Prompt caching (use it)

Cache anything that's >1024 tokens and reused across requests. Common candidates:

- System prompts with extensive instructions
- Long context documents (codebase, knowledge base)
- Tool definitions
- Few-shot examples

Cached content is **90% cheaper** on cache hits and reads at much higher throughput. Critical for cost control.

```typescript
const message = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: [
    {
      type: 'text',
      text: LONG_SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' },  // Cache this block
    },
  ],
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: LARGE_CONTEXT_DOCUMENT,
          cache_control: { type: 'ephemeral' },  // Cache this too
        },
        { type: 'text', text: userQuery },  // Not cached — varies per request
      ],
    },
  ],
});
```

Cache lifetime is 5 minutes by default. Structure prompts so cacheable content comes first.

## Tool use loop pattern

The standard pattern: call Claude → if it requests tools, run them → feed results back → repeat until Claude returns a final answer.

```python
async def run_with_tools(client, system_prompt, user_message, tools, tool_handlers):
    messages = [{"role": "user", "content": user_message}]

    while True:
        response = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=system_prompt,
            tools=tools,
            messages=messages,
        )

        # Append assistant turn to history
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":
            # Final answer — return text content
            return next(
                (b.text for b in response.content if b.type == "text"),
                "",
            )

        # Handle each tool_use block
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                try:
                    result = await tool_handlers[block.name](**block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": str(result),
                    })
                except Exception as e:
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": f"Error: {e}",
                        "is_error": True,
                    })

        messages.append({"role": "user", "content": tool_results})
```

**Always cap loop iterations** (e.g., max 10) to prevent infinite loops on edge cases.

## Batch API for bulk operations

For non-realtime work — content generation, classification at scale, evals — use the Batch API. **50% cheaper, 24-hour SLA.**

Use cases:
- Generating embeddings/summaries for an entire content library
- Bulk classification of leads, tickets, content
- Running eval suites
- Pre-generating personalized email variants

See `reference/batch-api.md`.

## Streaming to the UI

For chat-like UIs, stream responses. In Next.js, use a route handler that returns a `ReadableStream`:

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages,
  });

  // Convert Anthropic stream to web ReadableStream
  return new Response(stream.toReadableStream(), {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

On the client, use the SDK's streaming helpers or `EventSource`.

## Error handling and retries

Errors to handle:

| Error | What to do |
|---|---|
| `rate_limit_error` (429) | Exponential backoff, respect `retry-after` header |
| `overloaded_error` (529) | Retry with backoff |
| `api_error` (500) | Retry with backoff (3 attempts) |
| `invalid_request_error` (400) | Don't retry — fix the request |
| `authentication_error` (401) | Don't retry — bad API key |
| `permission_error` (403) | Don't retry — usually billing/access issue |

The official SDKs include automatic retries with reasonable defaults. For Python:

```python
client = AsyncAnthropic(max_retries=3)
```

## Token budgeting

Track tokens per tenant for billing/limits:

```python
response = await client.messages.create(...)
# Persist to agent_runs or a usage_events table
await record_usage(
    tenant_id=tenant_id,
    model=response.model,
    input_tokens=response.usage.input_tokens,
    output_tokens=response.usage.output_tokens,
    cache_creation_input_tokens=response.usage.cache_creation_input_tokens,
    cache_read_input_tokens=response.usage.cache_read_input_tokens,
)
```

Cache reads bill at ~10% the cost of regular input tokens — track them separately.

## MCP server integration

If your Platfrmr-built apps need to give Claude access to external tools (Linear, Slack, Asana, etc.), use MCP servers via the Messages API `mcp_servers` parameter. This avoids hand-coding tool integrations for every connector.

See `reference/mcp-servers.md`.

## Reference files

- `reference/batch-api.md` — Batch API workflow
- `reference/mcp-servers.md` — MCP server integration
- `reference/cost-optimization.md` — Caching, model selection, batching strategy
- `templates/tool-use-loop.py` — Tool use loop with retries and limits
- `templates/streaming-route.ts` — Next.js streaming chat route handler
- `templates/usage-tracking.ts` — Track tokens per tenant

## Anti-patterns to avoid

- ❌ No prompt caching on long system prompts (leaving 90% cost reduction on the table)
- ❌ Tool use loop without iteration cap (can spin forever)
- ❌ Using Opus for everything (often overkill — start with Sonnet)
- ❌ Synchronous bulk operations instead of Batch API (paying full price unnecessarily)
- ❌ Logging full prompts/responses in production (PII, cost)
- ❌ Not tracking per-tenant token usage (blocks usage-based pricing later)
- ❌ Hardcoding model strings everywhere (centralize in a config module)
- ❌ Using Claude for things ADK/Gemini handles fine (cost, consistency)
