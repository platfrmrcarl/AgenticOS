# templates/tool-use-loop.py
# Production-ready Claude tool use loop with iteration cap and error isolation

from __future__ import annotations
import logging
from typing import Any, Awaitable, Callable
from anthropic import AsyncAnthropic
from anthropic.types import Message

logger = logging.getLogger(__name__)

ToolHandler = Callable[..., Awaitable[Any]]


class ToolUseLoopError(Exception):
    """Raised when the loop exceeds max iterations."""


async def run_with_tools(
    client: AsyncAnthropic,
    *,
    model: str = "claude-sonnet-4-6",
    system: str | list[dict],
    user_message: str | list[dict],
    tools: list[dict],
    tool_handlers: dict[str, ToolHandler],
    max_iterations: int = 10,
    max_tokens: int = 4096,
) -> tuple[str, list[dict]]:
    """
    Run a tool use loop until Claude returns a final text response.

    Returns: (final_text, full_message_history)

    Raises:
        ToolUseLoopError if max_iterations exceeded
    """
    messages: list[dict] = [{"role": "user", "content": user_message}]

    for iteration in range(max_iterations):
        response: Message = await client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system,
            tools=tools,
            messages=messages,
        )

        # Append assistant turn
        messages.append({
            "role": "assistant",
            "content": [block.model_dump() for block in response.content],
        })

        if response.stop_reason != "tool_use":
            # Final answer
            final_text = "".join(
                block.text for block in response.content if block.type == "text"
            )
            logger.info(
                f"Loop completed in {iteration + 1} iterations. "
                f"Tokens: in={response.usage.input_tokens}, "
                f"out={response.usage.output_tokens}"
            )
            return final_text, messages

        # Run tool calls — isolate errors per-tool so one bad call doesn't kill the loop
        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue

            handler = tool_handlers.get(block.name)
            if not handler:
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": f"Error: Unknown tool '{block.name}'",
                    "is_error": True,
                })
                continue

            try:
                result = await handler(**block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": str(result) if not isinstance(result, str) else result,
                })
            except Exception as e:
                logger.exception(f"Tool '{block.name}' failed")
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": f"Error: {type(e).__name__}: {e}",
                    "is_error": True,
                })

        messages.append({"role": "user", "content": tool_results})

    raise ToolUseLoopError(
        f"Exceeded max_iterations ({max_iterations}) without final answer"
    )
